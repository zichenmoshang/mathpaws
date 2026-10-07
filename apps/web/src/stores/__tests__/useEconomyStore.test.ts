// economy store 集成测试：答题结算（全额轮上限 / 跨日重置）与落库往返。
// 每用例独立空库 + 全新模块图；store 与 db 一律动态 import。
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

import { DAILY_PAID_ROUNDS, FLOAT, REWARD } from '../../config/economy'
import type { EconomyRecord } from '../../db/types'
import { MAIN_KEY } from '../../db/types'
import { freshIsolatedEnv, waitForPersist } from '../../test/idb'
import { dayKey } from '../../utils/id'

beforeEach(() => {
  freshIsolatedEnv()
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('useEconomyStore 答题结算', () => {
  it('每日前 DAILY_PAID_ROUNDS 轮全额发奖，超额轮 registerRound 返回 false 不发奖', async () => {
    const { useEconomyStore } = await import('../useEconomyStore')
    const s = () => useEconomyStore.getState()

    // 模拟一轮 20 题口算全对的调用方结算口径：单题奖励 ×20 + 轮次食物
    const roundShells = REWARD.oralPerQuestion * 20
    const settleRound = () => {
      if (!s().registerRound()) return false
      s().addShells(roundShells)
      s().addPetFood(REWARD.foodPerRound)
      return true
    }

    expect(s().canPayRound()).toBe(true)
    for (let i = 0; i < DAILY_PAID_ROUNDS; i++) {
      expect(settleRound()).toBe(true)
    }
    expect(s().paidRounds).toBe(DAILY_PAID_ROUNDS)
    expect(s().shells).toBe(roundShells * DAILY_PAID_ROUNDS)
    expect(s().petFood).toBe(REWARD.foodPerRound * DAILY_PAID_ROUNDS)

    // 超额轮：预判 false、登记 false，不再发奖
    expect(s().canPayRound()).toBe(false)
    expect(settleRound()).toBe(false)
    expect(s().shells).toBe(roundShells * DAILY_PAID_ROUNDS)
    expect(s().paidRounds).toBe(DAILY_PAID_ROUNDS)
  })

  it('registerRound 跨日自重置：旧 dateKey 即使计数已满也按新日重新计', async () => {
    const { useEconomyStore } = await import('../useEconomyStore')
    const s = () => useEconomyStore.getState()

    // 存档停留在过去某天且当日已满额
    useEconomyStore.setState({ dateKey: '2000-01-01', paidRounds: DAILY_PAID_ROUNDS })
    expect(s().registerRound()).toBe(true)
    expect(s().dateKey).toBe(dayKey())
    expect(s().paidRounds).toBe(1)
  })

  it('rolloverIfNewDay 两组计数（轮次 / 浮题）各自独立重置', async () => {
    const { useEconomyStore } = await import('../useEconomyStore')
    const s = () => useEconomyStore.getState()
    const today = dayKey()

    // 两组都过期 → 都重置
    useEconomyStore.setState({
      dateKey: '2000-01-01', paidRounds: 2, floatDate: '2000-01-01', floatCount: 9,
    })
    s().rolloverIfNewDay()
    expect(s().dateKey).toBe(today)
    expect(s().paidRounds).toBe(0)
    expect(s().floatDate).toBe(today)
    expect(s().floatCount).toBe(0)

    // 仅浮题组过期 → 只重置浮题组，轮次组不动
    useEconomyStore.setState({ dateKey: today, paidRounds: 1, floatDate: '2000-01-01', floatCount: 5 })
    s().rolloverIfNewDay()
    expect(s().paidRounds).toBe(1)
    expect(s().floatDate).toBe(today)
    expect(s().floatCount).toBe(0)
  })

  it('registerFloat 达 FLOAT.dailyLimit 后拒绝；跨日自重置', async () => {
    const { useEconomyStore } = await import('../useEconomyStore')
    const s = () => useEconomyStore.getState()

    useEconomyStore.setState({ floatDate: dayKey(), floatCount: FLOAT.dailyLimit })
    expect(s().registerFloat()).toBe(false)
    expect(s().floatCount).toBe(FLOAT.dailyLimit)

    // 跨日：旧日期重置后可继续作答
    useEconomyStore.setState({ floatDate: '2000-01-01', floatCount: FLOAT.dailyLimit })
    expect(s().registerFloat()).toBe(true)
    expect(s().floatDate).toBe(dayKey())
    expect(s().floatCount).toBe(1)
  })

  it('货币增减保护：加负下限为 0；余额不足 spend 返回 false 且不扣减', async () => {
    const { useEconomyStore } = await import('../useEconomyStore')
    const s = () => useEconomyStore.getState()

    s().addShells(-100)
    expect(s().shells).toBe(0)
    expect(s().spendShells(1)).toBe(false)
    expect(s().shells).toBe(0)

    s().addShells(100)
    expect(s().spendShells(30)).toBe(true)
    expect(s().shells).toBe(70)
    s().addFlowerCoins(5)
    expect(s().spendFlowerCoins(6)).toBe(false)
    expect(s().flowerCoins).toBe(5)
  })
})

describe('useEconomyStore 落库往返', () => {
  it('bindPersist 防抖落库；重新装载后状态一致（且不含 action 函数字段）', async () => {
    const { useEconomyStore } = await import('../useEconomyStore')
    const { bindPersist } = await import('../persist')
    const { readTable } = await import('../../db')

    bindPersist(useEconomyStore, 'economy')
    useEconomyStore.getState().addShells(120)
    useEconomyStore.getState().addPetFood(7)
    useEconomyStore.getState().registerRound()
    await waitForPersist()

    const rec = await readTable<EconomyRecord>('economy', MAIN_KEY)
    expect(rec?.shells).toBe(120)
    expect(rec?.petFood).toBe(7)
    expect(rec?.paidRounds).toBe(1)
    expect(rec?.dateKey).toBe(dayKey())
    // stripActions：落库行不携带 store action
    expect(Object.keys(rec ?? {})).not.toContain('addShells')
    expect(Object.keys(rec ?? {})).not.toContain('registerRound')

    // 往返：只重置模块图、保留同一库，新 store 实例装载后恢复
    vi.resetModules()
    const m2 = await import('../useEconomyStore')
    expect(m2.useEconomyStore.getState().shells).toBe(0)
    await m2.loadEconomy()
    expect(m2.useEconomyStore.getState().shells).toBe(120)
    expect(m2.useEconomyStore.getState().petFood).toBe(7)
    expect(m2.useEconomyStore.getState().paidRounds).toBe(1)
  })
})
