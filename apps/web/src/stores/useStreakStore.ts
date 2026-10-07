// 域 store：连学 / 累计 / 宝箱（PRD §13.9）
import { create } from 'zustand'

import { getDB } from '../db'
import { defaultStreak } from '../db/migration'
import type { StreakRecord } from '../db/types'
import { MAIN_KEY } from '../db/types'
import { dayKey } from '../utils/id'

interface StreakState extends StreakRecord {
  /**
   * 记录当日学习达成（完成 ≥1 轮正式答题）：
   * 同一天重复调用不重复累加；与 lastStudyDate 不同日时：
   *   - 恰好昨天 → streak +1
   *   - 更早（断签）→ streak 重置为 1
   * totalDays 始终 +1。
   */
  markStudyDone: () => void
  /** 标记今日宝箱已领取（日期由 store 内部自取，无需调用方传参） */
  markChestOpened: () => void
}

function yesterdayOf(d: Date): string {
  const y = new Date(d)
  y.setDate(y.getDate() - 1)
  return dayKey(y)
}

export const useStreakStore = create<StreakState>((set, get) => ({
  ...defaultStreak(),

  markStudyDone: () => {
    const today = dayKey()
    const s = get()
    if (s.lastStudyDate === today) return

    let nextStreak: number
    if (s.lastStudyDate === yesterdayOf(new Date())) {
      nextStreak = s.streak + 1
    } else {
      // 首次或断签：从头计数
      nextStreak = 1
    }
    set({
      lastStudyDate: today,
      streak: nextStreak,
      totalDays: s.totalDays + 1,
    })
  },

  markChestOpened: () => set({ chestLastOpened: dayKey() }),
}))

export async function loadStreak(): Promise<void> {
  const d = await getDB()
  const rec = await d.get('streak', MAIN_KEY)
  if (rec) useStreakStore.setState(rec)
}
