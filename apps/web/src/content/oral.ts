// 口算题生成器（M3-P6-01）
// 按 Gate G2 定稿的知识点 oralParams + 真题校准规则，实时程序生成口算题。
// 题目纯内存、不落库；答案代码校验；难度 L1/L2/L3 按权重 3:5:2 抽取。
import { KNOWLEDGE_PATH, DIFFICULTY_WEIGHT } from './knowledgePath'
import type { QuizQuestion } from './types'
import type { DifficultyLevel } from './types'

const rnd = (min: number, max: number): number =>
  Math.floor(Math.random() * (max - min + 1)) + min

/** 按节点允许的 levels 与全局权重随机抽一个难度 */
export function pickLevel(knowledgeId: string): DifficultyLevel {
  const node = KNOWLEDGE_PATH.find(n => n.id === knowledgeId)
  const levels = node?.levels ?? [1, 2, 3]
  const pool = levels.map(lv => ({ lv, w: DIFFICULTY_WEIGHT[lv] }))
  const total = pool.reduce((s, p) => s + p.w, 0)
  let r = Math.random() * total
  for (const p of pool) {
    r -= p.w
    if (r <= 0) return p.lv
  }
  return pool[0].lv
}

function uid(): string {
  return `o${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`
}

/** 构造一道口算题（kind=oral，source=generated） */
function make(
  knowledgeId: string,
  unit: string,
  prompt: string,
  answer: string,
  steps: string[],
  level: number,
): QuizQuestion {
  return {
    id: uid(), kind: 'oral', knowledgeId, index: 0, unit,
    prompt, answer, options: null, steps, level, source: 'generated',
  }
}

/* ---------------- 各知识点生成器 ---------------- */

/** 第一单元 混合运算：乘加/乘减/除加/除减/小括号 */
function genMixedOps(level: DifficultyLevel, unit: string): QuizQuestion {
  if (level === 1) {
    // 单步口诀表内乘除
    const a = rnd(2, 9), b = rnd(2, 9)
    const isMul = Math.random() < 0.5
    if (isMul) {
      return make('mixed-ops', unit, `${a} × ${b}`, String(a * b),
        [`${a} 乘 ${b}，直接用乘法口诀，得 ${a * b}`], level)
    }
    const product = a * b
    return make('mixed-ops', unit, `${product} ÷ ${a}`, String(b),
        [`${a} 乘 ${b} 等于 ${product}，所以 ${product} ÷ ${a} = ${b}`], level)
  }
  if (level === 2) {
    // 两步：乘加/乘减/除加/除减（无括号，先乘除后加减）；结果限 100 以内
    const shape = rnd(0, 3)
    const a = rnd(2, 9), b = rnd(2, 9)
    const product = a * b
    if (shape === 0) {
      const c = rnd(2, Math.min(30, 99 - product))
      const v = product + c
      return make('mixed-ops', unit, `${a} × ${b} + ${c}`, String(v),
        [`先算乘法 ${a} × ${b} = ${product}`, `再算加法 ${product} + ${c} = ${v}`], level)
    }
    if (shape === 1) {
      const v = rnd(1, 20)
      const base = product + v
      return make('mixed-ops', unit, `${base} - ${a} × ${b}`, String(v),
        [`先算乘法 ${a} × ${b} = ${product}`, `再算减法 ${base} - ${product} = ${v}`], level)
    }
    if (shape === 2) {
      const c = rnd(2, Math.min(30, 99 - b))
      const div = product
      const v = b + c
      return make('mixed-ops', unit, `${div} ÷ ${a} + ${c}`, String(v),
        [`先算除法 ${div} ÷ ${a} = ${b}`, `再算加法 ${b} + ${c} = ${v}`], level)
    }
    const c = rnd(2, Math.min(30, 99 - product + b))
    const base = product + c
    const v = base - b
    return make('mixed-ops', unit, `${base} - ${product} ÷ ${a}`, String(v),
      [`先算除法 ${product} ÷ ${a} = ${b}`, `再算减法 ${base} - ${b} = ${v}`], level)
  }
  // L3：带小括号（先算括号内加减，再乘除）；结果限 100 以内
  const useMul = Math.random() < 0.5
  const x = rnd(2, 9)
  if (useMul) {
    const innerMax = Math.max(4, Math.floor(99 / x))
    const inner = rnd(4, Math.min(20, innerMax))
    const p1 = rnd(2, inner - 2)
    const p2 = inner - p1
    const v = inner * x
    return make('mixed-ops', unit, `(${p1} + ${p2}) × ${x}`, String(v),
      [`先算括号里 ${p1} + ${p2} = ${inner}`, `再算乘法 ${inner} × ${x} = ${v}`], level)
  }
  // 括号内两数相减，差取 x 的整数倍，保证 (A-B)÷x 整除；商为个位数。
  // 被减数 a ≤ 99 且 b = a - diff ≥ 20，故 diff 须 ≤ 79；据此约束 v 上限，
  // 避免 diff+20 > 99 时 rnd 下限大于上限退化出三位数。
  const vMax = Math.min(9, Math.floor(79 / x))
  const v = rnd(2, vMax)
  const diff = v * x
  const a = rnd(diff + 20, 99)
  const b = a - diff
  return make('mixed-ops', unit, `(${a} - ${b}) ÷ ${x}`, String(v),
    [`先算括号里 ${a} - ${b} = ${diff}`, `再算除法 ${diff} ÷ ${x} = ${v}`], level)
}

/** 第三单元 大数加与减（二）：口算口径全部为 100 以内两位数加减（结果不出现三位数；
 *  三位数竖式笔算属书面练习，不入口算） */
function genBigAddSubtract(level: DifficultyLevel, unit: string): QuizQuestion {
  if (level === 1) {
    // 整十数加减
    const a = rnd(2, 8) * 10, b = rnd(1, 9 - Math.floor(a / 10)) * 10
    const isAdd = Math.random() < 0.6
    if (isAdd) {
      return make('big-add-subtract', unit, `${a} + ${b}`, String(a + b),
        [`${a / 10} 个十加 ${b / 10} 个十，共 ${(a + b) / 10} 个十`], level)
    }
    const hi = Math.max(a, b), lo = Math.min(a, b)
    return make('big-add-subtract', unit, `${hi} - ${lo}`, String(hi - lo),
      [`${hi / 10} 个十减 ${lo / 10} 个十，得 ${(hi - lo) / 10} 个十`], level)
  }
  if (level === 2) {
    // 两位数加减两位数（含进退位），结果 100 以内
    const isAdd = Math.random() < 0.5
    const a = rnd(25, 80)
    if (isAdd) {
      const b = rnd(15, 99 - a)
      return make('big-add-subtract', unit, `${a} + ${b}`, String(a + b),
        ['相同数位对齐，从个位加起', `${a} + ${b} = ${a + b}`], level)
    }
    const b = rnd(11, a - 1)
    return make('big-add-subtract', unit, `${a} - ${b}`, String(a - b),
      ['相同数位对齐，从个位减起，不够减就退位', `${a} - ${b} = ${a - b}`], level)
  }
  // L3：100 以内连加 / 连减 / 加减混合
  const shape = rnd(0, 2)
  if (shape === 0) {
    const a = rnd(15, 40)
    const b = rnd(15, Math.min(50, 79 - a))
    const c = rnd(10, 99 - a - b)
    return make('big-add-subtract', unit, `${a} + ${b} + ${c}`, String(a + b + c),
      [`先算 ${a} + ${b} = ${a + b}`, `再算 ${a + b} + ${c} = ${a + b + c}`], level)
  }
  if (shape === 1) {
    const total = rnd(60, 99), b = rnd(15, 40), c = rnd(10, total - b - 10)
    return make('big-add-subtract', unit, `${total} - ${b} - ${c}`, String(total - b - c),
      [`先算 ${total} - ${b} = ${total - b}`, `再算 ${total - b} - ${c} = ${total - b - c}`], level)
  }
  const a = rnd(40, 80), b = rnd(15, 40), c = rnd(10, 99 - (a - b))
  const v = a - b + c
  return make('big-add-subtract', unit, `${a} - ${b} + ${c}`, String(v),
    [`先算 ${a} - ${b} = ${a - b}`, `再算 ${a - b} + ${c} = ${v}`], level)
}

/** 第六单元 乘除法的应用（二）：整十数×一位数、两位数÷一位数（结果限 100 以内） */
function genMultiplyDivideApply(level: DifficultyLevel, unit: string): QuizQuestion {
  if (level === 1) {
    // 整十数 × 一位数（积不超过 100，如 20×3=60；整百乘法属书面练习不入口算）
    const tens = rnd(2, 4)
    const f = rnd(2, Math.floor(9 / tens))
    const base = tens * 10
    return make('multiply-divide-apply', unit, `${base} × ${f}`, String(base * f),
      [`先算 ${tens} × ${f}，再添上一个 0`,
        `${base} × ${f} = ${base * f}`], level)
  }
  if (level === 2) {
    // 两位数 ÷ 一位数（整除）：被除数与商都不超过 99
    const f = rnd(2, 9)
    const q = rnd(11, Math.floor(99 / f))
    const dividend = f * q
    return make('multiply-divide-apply', unit, `${dividend} ÷ ${f}`, String(q),
      [`想 ${f} 乘几等于 ${dividend}`, `${f} × ${q} = ${dividend}，所以商是 ${q}`], level)
  }
  // L3：连乘除 / 带括号两步，均先定整数结果再反推，保证整除
  const useParen = Math.random() < 0.5
  if (useParen) {
    // (k×f ÷ f) × x：括号里先乘后除回到 k
    const f = rnd(2, 9), k = rnd(2, 9), x = rnd(2, 9)
    const inner = k * f
    const v = k * x
    return make('multiply-divide-apply', unit, `(${inner} ÷ ${f}) × ${x}`, String(v),
      [`先算括号里 ${inner} ÷ ${f} = ${k}`,
        `再算 ${k} × ${x} = ${v}`], level)
  }
  // 整十数 a × b ÷ g：选 g 整除 a*b，且结果不超过 99（b 自身一定满足，兜底安全）
  const a = rnd(2, 9) * 10
  const b = rnd(2, 9)
  const product = a * b
  const divisors = [2, 3, 4, 5, 6, 7, 8, 9].filter(
    g => product % g === 0 && product / g <= 99,
  )
  const g = divisors[rnd(0, divisors.length - 1)]
  const v = product / g
  return make('multiply-divide-apply', unit, `${a} × ${b} ÷ ${g}`, String(v),
    [`先算 ${a} × ${b} = ${product}`, `再算 ${product} ÷ ${g} = ${v}`], level)
}

/** 第七单元 认识小数：一位小数加减 */
function genDecimal(level: DifficultyLevel, unit: string): QuizQuestion {
  // 以整数"角"为单位运算，避免浮点误差，再格式化为一位小数
  const fmt = (tenths: number): string => `${Math.floor(tenths / 10)}.${tenths % 10}`
  if (level === 1) {
    const a = rnd(1, 90), b = rnd(1, 90)
    const isAdd = Math.random() < 0.6
    if (isAdd) {
      return make('decimal', unit, `${fmt(a)} + ${fmt(b)}`, fmt(a + b),
        [`小数点对齐，相同数位相加`, `${fmt(a)} + ${fmt(b)} = ${fmt(a + b)}`], level)
    }
    const hi = Math.max(a, b) + 10, lo = Math.min(a, b)
    return make('decimal', unit, `${fmt(hi)} - ${fmt(lo)}`, fmt(hi - lo),
      [`小数点对齐，相同数位相减`, `${fmt(hi)} - ${fmt(lo)} = ${fmt(hi - lo)}`], level)
  }
  if (level === 2) {
    // 含进退位
    const a = rnd(15, 120), b = rnd(15, 90)
    const isAdd = Math.random() < 0.5
    if (isAdd) {
      return make('decimal', unit, `${fmt(a)} + ${fmt(b)}`, fmt(a + b),
        [`十分位相加满十，向个位进 1`, `${fmt(a)} + ${fmt(b)} = ${fmt(a + b)}`], level)
    }
    const hi = a + 30
    return make('decimal', unit, `${fmt(hi)} - ${fmt(a)}`, fmt(hi - a),
      [`十分位不够减，从个位退 1`, `${fmt(hi)} - ${fmt(a)} = ${fmt(hi - a)}`], level)
  }
  // L3：整数减小数 / 两个一位小数混合
  const integerMinus = Math.random() < 0.5
  if (integerMinus) {
    const n = rnd(2, 15) * 10
    const b = rnd(1, n - 1)
    return make('decimal', unit, `${fmt(n)} - ${fmt(b)}`, fmt(n - b),
      [`把整数 ${fmt(n)} 的十分位看作 0，退位再减`,
        `${fmt(n)} - ${fmt(b)} = ${fmt(n - b)}`], level)
  }
  const a = rnd(20, 120), b = rnd(10, 80), c = rnd(5, a + b)
  const v = a + b - c
  return make('decimal', unit, `${fmt(a)} + ${fmt(b)} - ${fmt(c)}`, fmt(v),
    [`先算 ${fmt(a)} + ${fmt(b)} = ${fmt(a + b)}`,
      `再算 ${fmt(a + b)} - ${fmt(c)} = ${fmt(v)}`], level)
}

/* ---------------- 对外入口 ---------------- */

const GENERATORS: Record<string, (lv: DifficultyLevel, unit: string) => QuizQuestion> = {
  'mixed-ops': genMixedOps,
  'big-add-subtract': genBigAddSubtract,
  'multiply-divide-apply': genMultiplyDivideApply,
  decimal: genDecimal,
}

/** 为指定知识点生成一道口算题；难度随机或可指定。
 *  口算口径：数值结果一律不超过 99（小数题除外），超限自动重生成兜底。 */
export function generateOral(knowledgeId: string, forcedLevel?: DifficultyLevel): QuizQuestion {
  const node = KNOWLEDGE_PATH.find(n => n.id === knowledgeId)
  if (!node) throw new Error(`unknown knowledge id: ${knowledgeId}`)
  const gen = GENERATORS[knowledgeId]
  if (!gen) throw new Error(`no oral generator for: ${knowledgeId}`)
  for (let i = 0; i < 20; i++) {
    const level = forcedLevel ?? pickLevel(knowledgeId)
    const q = gen(level, node.unit)
    if (q.answer.includes('.')) return q
    const n = Number(q.answer)
    if (Number.isFinite(n) && n >= 0 && n <= 99) return q
  }
  // 兜底：表内乘法，答案必在 81 以内
  return genMixedOps(1, node.unit)
}

/** 生成一轮口算题（默认 20 道，可指定知识点集合） */
export function generateOralRound(
  count: number,
  knowledgeIds: string[],
): QuizQuestion[] {
  if (knowledgeIds.length === 0) throw new Error('knowledgeIds is empty')
  return Array.from({ length: count }, (_, i) => {
    const id = knowledgeIds[i % knowledgeIds.length]
    const q = generateOral(id)
    return { ...q, index: i }
  })
}
