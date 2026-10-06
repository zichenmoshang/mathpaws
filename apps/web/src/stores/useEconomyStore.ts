// 域 store：经济（贝壳 / 花朵币 / 食物；每日轮次与浮题计数）
// 一期不做体力与水滴。
import { create } from 'zustand'

import { DAILY_PAID_ROUNDS } from '../config/economy'
import { getDB } from '../db'
import { defaultEconomy } from '../db/migration'
import type { EconomyRecord } from '../db/types'
import { MAIN_KEY } from '../db/types'
import { dayKey } from '../utils/id'

interface EconomyState extends EconomyRecord {
  addShells: (n: number) => void
  addFlowerCoins: (n: number) => void
  addPetFood: (n: number) => void
  spendShells: (n: number) => boolean
  spendFlowerCoins: (n: number) => boolean
  /** 跨日重置计数（进入应用/答题前调用） */
  rolloverIfNewDay: () => void
  /**
   * 完成一轮正式答题：
   * 当日未满 DAILY_PAID_ROUNDS → 该轮计数 +1（奖励由调用方按"全额"发放）；
   * 已满 → 返回 false（调用方不发贝壳/食物）。
   */
  registerRound: () => boolean
  /**
   * 预判本轮是否仍为全额奖励轮（不增加计数）：
   * 当日已完成的付费轮 < DAILY_PAID_ROUNDS → true。
   * 轮次开始时调用，用于整轮奖励发放口径（练习轮不发任何奖励）。
   */
  canPayRound: () => boolean
  /**
   * 浮题作答计数：当日未满 dailyLimit → +1 且返回 true；
   * 已满返回 false（不发放奖励）。
   */
  registerFloat: (limit: number) => boolean
}

export const useEconomyStore = create<EconomyState>((set, get) => ({
  ...defaultEconomy(),

  addShells: (n) => set(s => ({ shells: Math.max(0, s.shells + n) })),
  addFlowerCoins: (n) => set(s => ({ flowerCoins: Math.max(0, s.flowerCoins + n) })),
  addPetFood: (n) => set(s => ({ petFood: Math.max(0, s.petFood + n) })),

  spendShells: (n) => {
    const s = get()
    if (s.shells < n) return false
    set({ shells: s.shells - n })
    return true
  },
  spendFlowerCoins: (n) => {
    const s = get()
    if (s.flowerCoins < n) return false
    set({ flowerCoins: s.flowerCoins - n })
    return true
  },

  rolloverIfNewDay: () => {
    const today = dayKey()
    const s = get()
    if (s.dateKey !== today || s.floatDate !== today) {
      set({
        dateKey: today,
        paidRounds: 0,
        floatDate: today,
        floatCount: 0,
      })
    }
  },

  registerRound: () => {
    const today = dayKey()
    const s = get()
    if (s.dateKey !== today) {
      set({ dateKey: today, paidRounds: 0 })
    }
    if (get().paidRounds >= DAILY_PAID_ROUNDS) return false
    set({ paidRounds: get().paidRounds + 1 })
    return true
  },

  canPayRound: () => {
    const today = dayKey()
    const s = get()
    if (s.dateKey !== today) return true
    return s.paidRounds < DAILY_PAID_ROUNDS
  },

  registerFloat: (limit) => {
    const today = dayKey()
    const s = get()
    if (s.floatDate !== today) {
      set({ floatDate: today, floatCount: 0 })
    }
    if (get().floatCount >= limit) return false
    set({ floatCount: get().floatCount + 1 })
    return true
  },
}))

export async function loadEconomy(): Promise<void> {
  const d = await getDB()
  const rec = await d.get('economy', MAIN_KEY)
  if (rec) useEconomyStore.setState(rec)
}
