// 连学打卡与每日宝箱配置（PRD §13.8、§13.9）
// 打卡条件：当天完成 ≥1 轮正式答题（口算或真题 20 题，浮题不计）。

/** 宝箱等级（连学）奖励表：贝壳 + 宠物食物（无水滴） */
export interface ChestLevel {
  level: 1 | 2 | 3 | 4 | 5
  /** 达到该等级所需连续学习天数 */
  streakDays: number
  shells: number
  food: number
}

export const CHEST_LEVELS: ChestLevel[] = [
  { level: 1, streakDays: 1, shells: 10, food: 2 },
  { level: 2, streakDays: 2, shells: 15, food: 4 },
  { level: 3, streakDays: 3, shells: 25, food: 8 },
  { level: 4, streakDays: 5, shells: 40, food: 14 },
  { level: 5, streakDays: 7, shells: 60, food: 24 },
]

/**
 * 由连续学习天数推导宝箱等级：
 * 第 1 天 Lv.1；连 2 天 Lv.2；连 3 天 Lv.3；连 5 天 Lv.4；连 7 天及以上 Lv.5（不断签保持）。
 * 断签后 streak 重置为 1（见 useStreakStore.markStudyDone），宝箱等级始终由当前
 * streak 直接推导、无独立降级规则；累计学习天数（totalDays）不清零。
 */
export function chestLevelForStreak(streak: number): ChestLevel {
  let picked: ChestLevel = CHEST_LEVELS[0]
  for (const lv of CHEST_LEVELS) if (streak >= lv.streakDays) picked = lv
  return picked
}
