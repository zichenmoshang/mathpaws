// 答题节奏配置：常量间自洽性（无纯函数，不逐字断言常量值）
import { describe, it, expect } from 'vitest'

import {
  QUESTIONS_PER_ROUND,
  QUIZ_ORDER,
  QUIZ_MODE_LABEL,
  WRONGBOOK_CAPACITY,
  PLACEMENT_TEST,
} from '../quiz'

describe('答题配置', () => {
  it('每轮题数为正整数', () => {
    expect(Number.isInteger(QUESTIONS_PER_ROUND)).toBe(true)
    expect(QUESTIONS_PER_ROUND).toBeGreaterThan(0)
  })

  it('出题顺序覆盖两种正式模式、无重复且均有标签', () => {
    expect(new Set(QUIZ_ORDER).size).toBe(QUIZ_ORDER.length)
    expect(QUIZ_ORDER).toContain('oral')
    expect(QUIZ_ORDER).toContain('real')
    for (const m of QUIZ_ORDER) expect(QUIZ_MODE_LABEL[m]).not.toBe('')
  })

  it('错题本容量为正整数', () => {
    expect(Number.isInteger(WRONGBOOK_CAPACITY)).toBe(true)
    expect(WRONGBOOK_CAPACITY).toBeGreaterThan(0)
  })

  it('开学小测题量区间自洽且可跳过', () => {
    expect(PLACEMENT_TEST.minQuestions).toBeGreaterThan(0)
    expect(PLACEMENT_TEST.minQuestions).toBeLessThanOrEqual(PLACEMENT_TEST.maxQuestions)
    expect(PLACEMENT_TEST.skippable).toBe(true)
  })
})
