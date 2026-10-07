// gacha store 集成测试：保底计数 / 背包 / 货币联动 + 经 bootstrapStores 落库往返。
// 确定性：rollRarity/rollItem 默认 rng 为 Math.random，用 vi.spyOn 恒返 0.99
// （无保底时 0.99 ≥ 0.25 → normal；稀有保底触发时 0.99 ≥ pLegend(0.2) → rare）。
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

import type { CosmeticsRecord, EconomyRecord } from '../../db/types'
import { MAIN_KEY } from '../../db/types'
import { freshIsolatedEnv, waitForPersist } from '../../test/idb'
import type { DrawOutcome } from '../useGachaStore'

beforeEach(() => {
  freshIsolatedEnv()
})

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

describe('useGachaStore 抽卡与保底', () => {
  it('稀有保底：第 RARE_PITY 抽必出稀有+并重置 pityRare；重复仅 isNew=false 不返货', async () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.99)
    const { useGachaStore } = await import('../useGachaStore')
    const { RARE_PITY } = await import('../../config/gachaPool')
    const s = () => useGachaStore.getState()

    const outcomes: DrawOutcome[] = []
    for (let i = 0; i < RARE_PITY; i++) outcomes.push(...s().draw(1))

    // 前 RARE_PITY-1 抽全 normal；rng 恒定 → 同一件，第 2 抽起重复
    expect(outcomes.slice(0, -1).every(o => o.item.rarity === 'normal')).toBe(true)
    expect(outcomes[0]?.isNew).toBe(true)
    expect(outcomes[1]?.isNew).toBe(false)
    // 重复不返还：owned 不重复计数
    const normalId = outcomes[0]?.item.id
    expect(s().owned.filter(id => id === normalId)).toHaveLength(1)

    // 第 RARE_PITY 抽触发稀有保底：出货重置 pityRare、pityLegend 继续累进
    const pityHit = outcomes[RARE_PITY - 1]
    expect(pityHit?.item.rarity).toBe('rare')
    expect(pityHit?.isNew).toBe(true)
    expect(s().pityRare).toBe(0)
    expect(s().pityLegend).toBe(RARE_PITY)
    expect(s().owned).toEqual([normalId, pityHit?.item.id])
  })

  it('传说保底：pityLegend 达 LEGEND_PITY 必出传说，双 pity 重置', async () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.99)
    const { useGachaStore } = await import('../useGachaStore')
    const { LEGEND_PITY } = await import('../../config/gachaPool')

    useGachaStore.setState({ pityRare: 3, pityLegend: LEGEND_PITY - 1, owned: [] })
    const [outcome] = useGachaStore.getState().draw(1)

    expect(outcome?.item.rarity).toBe('legendary')
    const s = useGachaStore.getState()
    expect(s.pityLegend).toBe(0)
    expect(s.pityRare).toBe(0)
  })

  it('performDraw 货币联动：足额扣减、余额不足返回 null 不发货', async () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.99)
    const { useEconomyStore } = await import('../useEconomyStore')
    const { useGachaStore, performDraw } = await import('../useGachaStore')
    const { SINGLE_COST, TEN_COST } = await import('../../config/gachaPool')

    useEconomyStore.getState().addShells(TEN_COST + SINGLE_COST)

    const ten = performDraw(10)
    expect(ten).toHaveLength(10)
    expect(useEconomyStore.getState().shells).toBe(SINGLE_COST)

    const one = performDraw(1)
    expect(one).toHaveLength(1)
    expect(useEconomyStore.getState().shells).toBe(0)

    // 余额不足：null，背包与保底计数均不动
    const ownedBefore = useGachaStore.getState().owned
    const pityLegendBefore = useGachaStore.getState().pityLegend
    expect(performDraw(1)).toBeNull()
    expect(useGachaStore.getState().owned).toEqual(ownedBefore)
    expect(useGachaStore.getState().pityLegend).toBe(pityLegendBefore)
    expect(useEconomyStore.getState().shells).toBe(0)
  })
})

describe('gacha 经 bootstrapStores 落库往返', () => {
  it('抽卡后 cosmetics / economy 表落库一致；重启装载后状态恢复', async () => {
    // bootstrapStores 第 5 步注册关页监听需要 window（node 环境打桩）
    vi.stubGlobal('window', { addEventListener: () => {}, removeEventListener: () => {} })
    vi.spyOn(Math, 'random').mockReturnValue(0.99)

    const { bootstrapStores } = await import('../index')
    const { useEconomyStore } = await import('../useEconomyStore')
    const { useGachaStore, performDraw } = await import('../useGachaStore')
    const { SINGLE_COST } = await import('../../config/gachaPool')
    const { readTable } = await import('../../db')

    await bootstrapStores()
    useEconomyStore.getState().addShells(SINGLE_COST * 2)
    const outcomes = performDraw(1)
    expect(outcomes).toHaveLength(1)
    await waitForPersist()

    // cosmetics 同步器合并行：owned/pity（gacha）+ equipped（equipped store）
    const drawnId = useGachaStore.getState().owned[0]
    const cos = await readTable<CosmeticsRecord>('cosmetics', MAIN_KEY)
    expect(cos?.owned).toEqual([drawnId])
    expect(cos?.pityRare).toBe(1)
    expect(cos?.pityLegend).toBe(1)
    expect(cos?.equipped).toEqual({})
    const eco = await readTable<EconomyRecord>('economy', MAIN_KEY)
    expect(eco?.shells).toBe(SINGLE_COST)

    // 往返：只重置模块图、保留同一库，重启 bootstrap 后状态恢复
    vi.resetModules()
    const m2 = await import('../index')
    await m2.bootstrapStores()
    const gacha2 = (await import('../useGachaStore')).useGachaStore.getState()
    expect(gacha2.owned).toEqual([drawnId])
    expect(gacha2.pityRare).toBe(1)
    expect(gacha2.pityLegend).toBe(1)
    const eco2 = (await import('../useEconomyStore')).useEconomyStore.getState()
    expect(eco2.shells).toBe(SINGLE_COST)
  })
})
