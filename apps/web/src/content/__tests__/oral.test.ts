import fc from 'fast-check'
import { describe, it, expect } from 'vitest'

import { KNOWLEDGE_PATH } from '../knowledgePath'
import { pickLevel, generateOral, generateOralRound } from '../oral'
import type { DifficultyLevel } from '../types'

// 有口算生成器的知识点（shapes / date 为 kind=real，无口算生成器）
const ORAL_IDS = ['mixed-ops', 'big-add-subtract', 'multiply-divide-apply', 'decimal'] as const
const LEVELS: DifficultyLevel[] = [1, 2, 3]

/** 安全求值口算算式（× ÷ 转 JS 运算符；仅允许数字与运算符字符） */
function evalExpr(expr: string): number {
  if (!/^[\d\s+\-×÷().]+$/.test(expr)) throw new Error(`非法算式字符: ${expr}`)
  const js = expr.replace(/×/g, '*').replace(/÷/g, '/')
  // 输入来自受测生成器且已过白名单校验
  return Function(`"use strict"; return (${js})`)() as number
}

describe('pickLevel', () => {
  it('返回等级始终在节点允许的 levels 内', () => {
    fc.assert(
      fc.property(fc.constantFrom(...KNOWLEDGE_PATH.map(n => n.id)), id => {
        const node = KNOWLEDGE_PATH.find(n => n.id === id)!
        for (let i = 0; i < 20; i++) {
          expect(node.levels).toContain(pickLevel(id))
        }
      }),
    )
  })

  it('未知知识点按 [1,2,3] 兜底', () => {
    for (let i = 0; i < 50; i++) {
      expect(LEVELS).toContain(pickLevel('not-exist'))
    }
  })
})

describe('generateOral 固定行为', () => {
  it('未知知识点抛错', () => {
    expect(() => generateOral('nope')).toThrow(/unknown knowledge id/)
  })

  it('kind=real 的节点无口算生成器，抛错', () => {
    expect(() => generateOral('shapes')).toThrow(/no oral generator/)
    expect(() => generateOral('date')).toThrow(/no oral generator/)
  })

  it('题面元数据固定：kind=oral、source=generated、options=null、unit 与节点一致', () => {
    for (const id of ORAL_IDS) {
      const q = generateOral(id, 2)
      const node = KNOWLEDGE_PATH.find(n => n.id === id)!
      expect(q.kind).toBe('oral')
      expect(q.source).toBe('generated')
      expect(q.options).toBeNull()
      expect(q.unit).toBe(node.unit)
      expect(q.knowledgeId).toBe(id)
      expect(q.steps.length).toBeGreaterThan(0)
      expect(q.id.length).toBeGreaterThan(0)
    }
  })

  it('forcedLevel 时题目标记难度与之一致', () => {
    for (const id of ORAL_IDS) {
      for (const lv of LEVELS) {
        expect(generateOral(id, lv).level).toBe(lv)
      }
    }
  })

  it('L1 乘法：乘数均在 2~9 口诀表内', () => {
    fc.assert(
      fc.property(fc.integer({ min: 1, max: 1 }), () => {
        const q = generateOral('mixed-ops', 1)
        if (!q.prompt.includes('×')) return // 除法形态另行覆盖
        const [a, b] = q.prompt.split(' × ').map(Number)
        expect(a).toBeGreaterThanOrEqual(2)
        expect(a).toBeLessThanOrEqual(9)
        expect(b).toBeGreaterThanOrEqual(2)
        expect(b).toBeLessThanOrEqual(9)
      }),
      { numRuns: 50 },
    )
  })

  it('整十数×一位数（multiply-divide-apply L1）：积不超过 100', () => {
    for (let i = 0; i < 50; i++) {
      const q = generateOral('multiply-divide-apply', 1)
      const [a, b] = q.prompt.split(' × ').map(Number)
      expect(a % 10).toBe(0)
      expect(b).toBeGreaterThanOrEqual(2)
      expect(b).toBeLessThanOrEqual(9)
      expect(Number(q.answer)).toBeLessThanOrEqual(100)
    }
  })

  it('小数题答案保留一位小数格式', () => {
    for (const lv of LEVELS) {
      for (let i = 0; i < 20; i++) {
        expect(generateOral('decimal', lv).answer).toMatch(/^\d+\.\d$/)
      }
    }
  })
})

describe('generateOral 属性测试', () => {
  const idArb = fc.constantFrom(...ORAL_IDS)
  const levelArb = fc.constantFrom<DifficultyLevel>(1, 2, 3)

  it('任意知识点与难度：answer 恒等于按算式求值的结果', () => {
    fc.assert(
      fc.property(idArb, levelArb, (id, lv) => {
        const q = generateOral(id, lv)
        expect(Number(q.answer)).toBeCloseTo(evalExpr(q.prompt), 9)
      }),
      { numRuns: 300 },
    )
  })

  it('整数答案（非小数题）恒在 0~99', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('mixed-ops', 'big-add-subtract', 'multiply-divide-apply'),
        levelArb,
        (id, lv) => {
          const q = generateOral(id, lv)
          expect(q.answer).not.toContain('.')
          const n = Number(q.answer)
          expect(Number.isInteger(n)).toBe(true)
          expect(n).toBeGreaterThanOrEqual(0)
          expect(n).toBeLessThanOrEqual(99)
        },
      ),
      { numRuns: 300 },
    )
  })

  it('含 ÷ 的算式整除：除数非零且商为整数（小数单元不出除法）', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('mixed-ops', 'multiply-divide-apply'),
        levelArb,
        (id, lv) => {
          const q = generateOral(id, lv)
          if (!q.prompt.includes('÷')) return
          // 每个 ÷ 右操作数非零
          for (const m of q.prompt.matchAll(/÷\s*\(?\s*(\d+(?:\.\d+)?)/g)) {
            expect(Number(m[1])).not.toBe(0)
          }
          const v = evalExpr(q.prompt)
          expect(Number.isInteger(v)).toBe(true)
        },
      ),
      { numRuns: 300 },
    )
  })

  it('未指定难度时题目标记难度仍在节点允许范围内', () => {
    fc.assert(
      fc.property(idArb, id => {
        const node = KNOWLEDGE_PATH.find(n => n.id === id)!
        expect(node.levels).toContain(generateOral(id).level as DifficultyLevel)
      }),
      { numRuns: 100 },
    )
  })
})

describe('generateOralRound', () => {
  it('空知识点集合抛错', () => {
    expect(() => generateOralRound(5, [])).toThrow(/empty/)
  })

  it('一轮题数正确，index 连续，knowledgeId 按序轮转', () => {
    const ids = ['mixed-ops', 'decimal']
    const round = generateOralRound(5, ids)
    expect(round).toHaveLength(5)
    round.forEach((q, i) => {
      expect(q.index).toBe(i)
      expect(q.knowledgeId).toBe(ids[i % ids.length])
    })
  })

  it('任意题数与知识点子集：长度、index、归属恒成立', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 40 }),
        fc.subarray([...ORAL_IDS], { minLength: 1 }),
        (count, ids) => {
          const round = generateOralRound(count, ids)
          expect(round).toHaveLength(count)
          round.forEach((q, i) => {
            expect(q.index).toBe(i)
            expect(ids).toContain(q.knowledgeId)
          })
        },
      ),
      { numRuns: 50 },
    )
  })
})
