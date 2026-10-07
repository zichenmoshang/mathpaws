// 答题节奏配置（PRD §7.2、§7.5、§7.7）

/** 每轮题数；做完即结算（与正确率无关） */
export const QUESTIONS_PER_ROUND = 20

/** 正式答题模式（一期） */
export type QuizMode = 'oral' | 'real'

/**
 * 出题节奏：按顺序推进、不可中途切换
 * 练口算一轮做完 → 提示"是否进入真题大挑战？"（可进可退）；真题也可从首页独立入口进。
 */
export const QUIZ_ORDER: QuizMode[] = ['oral', 'real']

export const QUIZ_MODE_LABEL: Record<QuizMode, string> = {
  oral: '练口算',
  real: '真题大挑战',
}

// 注意：正式答题不设超时（仅广场浮题有倒计时），禁止在正式答题流程引入倒计时。

/** 错题本容量上限：满员时淘汰最久未错的条目（PRD §11；错题本页面二期开放） */
export const WRONGBOOK_CAPACITY = 100

/** 开学小测（PRD §7.7）：首次正式答题前、5–10 题覆盖前置、可跳过 */
export const PLACEMENT_TEST = {
  minQuestions: 5,
  maxQuestions: 10,
  /** 可跳过；跳过则从第 1 单元起步、靠掌握度快速追赶 */
  skippable: true,
} as const
