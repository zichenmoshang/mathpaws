// 题目 schema（M0-CTN-02）PRD §7.6
// 一期两类题：口算（程序生成，MNIST 手写）、真题（一期仅选择题，点 ABC）。

/** 题型 */
export type QuizKind = 'oral' | 'real'

export interface QuizQuestion {
  id: string
  kind: QuizKind
  /** 所属知识点 id（对应 knowledgePath 节点） */
  knowledgeId: string
  /** 序号 */
  index: number
  /** 单元 */
  unit: string
  /** 题干（口算为算式字符串，如 "23 + 45"） */
  prompt: string
  /** 正确答案（字符串，口算按数位手写） */
  answer: string
  /** 真题选项（一期选择题恰好 3 项，点选 ABC）；口算为 null */
  options: [string, string, string] | null
  /** 分步解题思路（错题卡默认展示） */
  steps: string[]
  /** 难度 */
  level: number
  /** 来源：generated（程序生成）/ template（有限模板） */
  source: 'generated' | 'template'
}

/** 难度等级（Gate G2 三级，真实试卷分层） */
export type DifficultyLevel = 1 | 2 | 3

/** 口算生成器的知识点出题参数（随 Gate G2 审核定稿） */
export interface OralGenParams {
  /** 允许的运算类型 */
  ops: Array<'+' | '-' | '×' | '÷' | 'mix'>
  /** 数字范围 */
  min: number
  max: number
  /** 是否含进退位 / 括号 / 多步 */
  carry: boolean
  parentheses: boolean
  multiStep: boolean
  /** 操作数须为该数的倍数（整十=10、整百=100；不限制为 1） */
  multiplesOf?: number
  /** 第二操作数范围（如乘一位数 2–9；仅乘法结构性约束） */
  factorRange?: { min: number; max: number }
  /** 小数位数（>0 表示按小数生成，如一位小数） */
  decimalPlaces?: number
}
