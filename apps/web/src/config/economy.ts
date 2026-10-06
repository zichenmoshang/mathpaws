// 经济数值配置（PRD §13.1–13.5）
// 一期货币：贝壳 shells / 花朵币 flowerCoins / 宠物食物 petFood
// 一期不做体力（stamina）与水滴（waterDrop），相关字段不得出现在任何配置/状态中。

/** 新用户初始资源（PRD §13.1） */
export const INITIAL_CURRENCY = {
  shells: 0,
  flowerCoins: 0,
  petFood: 0,
} as const

/** 单题 / 单轮奖励（PRD §7.1、§7.5、§13.5） */
// 2026-10-05 经济平衡（QA-02 模拟：原日产 520-630 贝壳、首日即十连、传说保底第 9 天兑现，过快）：
// 单题 10→5、取消轮次保底（并入口径）、宝箱贝壳同步减半 → 日产 210-260，
// 首次十连第 3 天、传说保底约第 23 天；食物不动（进化约一周已达标）。
export const REWARD = {
  /** 练口算：每答对 1 题 */
  oralPerQuestion: 5,
  /** 真题大挑战：每答对 1 题 */
  realPerQuestion: 20,
  /** 完成一轮保底贝壳（已取消：全部并入单题，保留字段供结算页展示） */
  roundBonus: 0,
  /** 完成一轮宠物食物 */
  foodPerRound: 5,
  /** 错题本重做正确：口算单题 */
  wrongRedoOral: 10,
  /** 错题本重做正确：真题单题 */
  wrongRedoReal: 20,
} as const

/**
 * 每日奖励轮次上限（PRD §7.5、§13.3）：
 * 每日前 N 轮（口算 + 真题合计）全额发放（含保底 + 食物），
 * 之后仍可无限练习但不再发贝壳 / 食物。N 可配置。
 */
export const DAILY_PAID_ROUNDS = 2

/** 1 食物 = 10 经验（PRD §8.2、§13.6） */
export const FOOD_EXP_RATE = 10

/**
 * 广场浮题规则（PRD §6.5、§13.4）
 * 与正式答题轮次独立计数；错题/超时不进错题本。
 */
export const FLOAT = {
  /** 场上同时存在的气泡数 */
  simultaneous: 5,
  /** 被答掉 / 消失后补充 1 个的间隔（秒） */
  respawnSeconds: 60,
  /** 单题倒计时（秒） */
  countdownSeconds: 5,
  /** 每日可作答上限（次） */
  dailyLimit: 25,
  /** 奖励概率 */
  foodRate: 0.7,
  shellRate: 0.3,
  /** 单次奖励数量 */
  foodAmount: 1,
  shellAmount: 5,
} as const

/** 新用户冷启动（PRD §10.1、§13.1）：赠 2 份玉米种子，不送花朵币 */
export const COLD_START = {
  cornSeeds: 2,
  flowerCoins: 0,
} as const
