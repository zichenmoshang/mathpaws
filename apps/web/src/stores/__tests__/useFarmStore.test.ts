// farm store 集成测试：购种 / 播种约束 / 时间推进生长 / 收获入账与升级 + 落库往返。
// 时间推进：farm 以 Date.now() 与 plantedAt 派生阶段，用 vi.spyOn(Date,'now') 控制。
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

import { COLD_START } from '../../config/economy'
import { CROP_MAP, FARM_LEVELS, PLOT_COUNT, getPlotStage } from '../../config/farm'
import type { FarmRecord } from '../../db/types'
import { MAIN_KEY } from '../../db/types'
import { freshIsolatedEnv, waitForPersist } from '../../test/idb'

const T0 = 1_700_000_000_000

beforeEach(() => {
  freshIsolatedEnv()
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('useFarmStore 购种与播种', () => {
  it('buySeeds：按单价×份数向 pay 扣款；支付失败不入库，成功累加库存', async () => {
    const { useFarmStore } = await import('../useFarmStore')
    const s = () => useFarmStore.getState()
    const corn = CROP_MAP.corn

    // 冷启动赠种
    expect(s().seedCount('corn')).toBe(COLD_START.cornSeeds)

    // 支付失败：不发货
    expect(s().buySeeds('corn', 2, () => false)).toBe(false)
    expect(s().seedCount('corn')).toBe(COLD_START.cornSeeds)

    // 支付成功：pay 收到 单价×份数，库存累加
    const paid: number[] = []
    expect(s().buySeeds('corn', 2, n => { paid.push(n); return true })).toBe(true)
    expect(paid).toEqual([corn.seedPrice * 2])
    expect(s().seedCount('corn')).toBe(COLD_START.cornSeeds + 2)
  })

  it('plant：空地块 + 已解锁 + 有种子方可播种；种子耗尽即从库存移除', async () => {
    vi.spyOn(Date, 'now').mockReturnValue(T0)
    const { useFarmStore } = await import('../useFarmStore')
    const s = () => useFarmStore.getState()

    // 冷启动 2 份玉米，连播两块后耗尽
    expect(s().plant(0, 'corn')).toBe(true)
    expect(s().plots[0]).toEqual({ seedId: 'corn', plantedAt: T0 })
    expect(s().seedCount('corn')).toBe(1)
    expect(s().plant(1, 'corn')).toBe(true)
    // 归零删除 key（而非留 0）
    expect('corn' in s().seedInventory).toBe(false)
    expect(s().plant(2, 'corn')).toBe(false)

    // 非空地块拒绝
    expect(s().plant(0, 'corn')).toBe(false)
    // 未解锁作物拒绝（pumpkin 需农场 Lv.2，当前 Lv.1）
    expect(s().farmLevel()).toBe(1)
    expect(s().plant(3, 'pumpkin')).toBe(false)
  })
})

describe('useFarmStore 生长与收获', () => {
  it('播种 → 分钟级生长推进 → 成熟收获：果实入库、XP 入账、地块清空', async () => {
    const spy = vi.spyOn(Date, 'now').mockReturnValue(T0)
    const { useFarmStore } = await import('../useFarmStore')
    const s = () => useFarmStore.getState()
    const corn = CROP_MAP.corn

    expect(s().plant(0, 'corn')).toBe(true)

    // 生长中：过半未到点
    const growing = getPlotStage(s().plots[0], T0 + 30_000)
    expect(growing.stage).toBe('growing')
    expect(growing.remainSeconds).toBe(30)
    // 到点成熟
    expect(getPlotStage(s().plots[0], T0 + corn.growMinutes * 60_000).stage).toBe('ready')

    // 推进时间后收获
    spy.mockReturnValue(T0 + corn.growMinutes * 60_000 + 1_000)
    const results = s().harvest()
    expect(results).toEqual([{ crop: 'corn', gained: corn.yield, leveled: false }])
    expect(s().cropCount('corn')).toBe(corn.yield)
    expect(s().farmExp).toBe(corn.xp)
    expect(s().plots[0]).toEqual({ seedId: null, plantedAt: 0 })

    // 未成熟地块收获为空结果、状态不动
    expect(s().plant(1, 'corn')).toBe(true)
    spy.mockReturnValue(T0 + corn.growMinutes * 60_000 + 2_000)
    expect(s().harvest(1)).toEqual([])
    expect(s().plots[1]?.seedId).toBe('corn')
  })

  it('收获经验触达下一级：leveled 标记且 farmLevel 提升（一期地块恒 4 块）', async () => {
    const spy = vi.spyOn(Date, 'now').mockReturnValue(T0)
    const { useFarmStore } = await import('../useFarmStore')
    const s = () => useFarmStore.getState()
    const corn = CROP_MAP.corn

    // 距 Lv.2 恰好差一份玉米经验
    const lv2Xp = FARM_LEVELS.find(l => l.level === 2)?.xp ?? 0
    useFarmStore.setState({ farmExp: lv2Xp - corn.xp })
    expect(s().farmLevel()).toBe(1)

    expect(s().plant(0, 'corn')).toBe(true)
    spy.mockReturnValue(T0 + corn.growMinutes * 60_000)
    const [r] = s().harvest()
    expect(r?.leveled).toBe(true)
    expect(s().farmExp).toBe(lv2Xp)
    expect(s().farmLevel()).toBe(2)
    // 一期口径：plotCountForLevel 恒 4，升级不扩地（PRD 扩地转二期）
    expect(s().plots).toHaveLength(PLOT_COUNT)
  })
})

describe('useFarmStore 落库往返', () => {
  it('bindPersist 防抖落库；重新装载后 farm 行与内存一致', async () => {
    const spy = vi.spyOn(Date, 'now').mockReturnValue(T0)
    const { useFarmStore } = await import('../useFarmStore')
    const { bindPersist } = await import('../persist')
    const { readTable } = await import('../../db')
    const corn = CROP_MAP.corn
    const s = () => useFarmStore.getState()

    bindPersist(useFarmStore, 'farm')
    expect(s().buySeeds('corn', 1, () => true)).toBe(true)
    expect(s().plant(0, 'corn')).toBe(true)
    spy.mockReturnValue(T0 + corn.growMinutes * 60_000)
    s().harvest()
    await waitForPersist()

    const rec = await readTable<FarmRecord>('farm', MAIN_KEY)
    expect(rec?.farmExp).toBe(corn.xp)
    expect(rec?.cropInventory).toEqual({ corn: corn.yield })
    // 冷启动 2 + 买 1 - 播种 1 = 2
    expect(rec?.seedInventory).toEqual({ corn: COLD_START.cornSeeds })
    expect(rec?.plots).toHaveLength(PLOT_COUNT)
    expect(Object.keys(rec ?? {})).not.toContain('harvest')

    // 往返：重置模块图、保留同一库，loadFarm 后恢复
    vi.resetModules()
    const m2 = await import('../useFarmStore')
    expect(m2.useFarmStore.getState().farmExp).toBe(0)
    await m2.loadFarm()
    expect(m2.useFarmStore.getState().farmExp).toBe(corn.xp)
    expect(m2.useFarmStore.getState().cropInventory).toEqual({ corn: corn.yield })
    expect(m2.useFarmStore.getState().seedInventory).toEqual({ corn: COLD_START.cornSeeds })
  })
})
