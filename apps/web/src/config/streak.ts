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
 */
export function chestLevelForStreak(streak: number): ChestLevel {
  let picked: ChestLevel = CHEST_LEVELS[0]
  for (const lv of CHEST_LEVELS) if (streak >= lv.streakDays) picked = lv
  return picked
}

/** 打卡所需当日完成正式答题轮数（PRD §13.9） */
export const CHECKIN_REQUIRED_ROUNDS = 1

/**
 * 断签规则（PRD §13.9）：
 * 某天未完成 → 连续中断（streak 重置为 0）、宝箱等级降一级；
 * 累计学习天数不清零。
 */
export const STREAK_RESET_ON_MISS = true
