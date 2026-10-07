// 宠物成长数值单测：等级推导阈值与单调性
import * as fc from 'fast-check'
import { describe, it, expect } from 'vitest'

import { PET_STAGES, PET_RENAME_MAX, PET_SPECIES, petLevelFromExp } from '../pets'

describe('petLevelFromExp', () => {
  it('阈值 0 / 50 / 1000 边界', () => {
    expect(petLevelFromExp(0)).toBe(1)
    expect(petLevelFromExp(49)).toBe(1)
    expect(petLevelFromExp(50)).toBe(2)
    expect(petLevelFromExp(999)).toBe(2)
    expect(petLevelFromExp(1000)).toBe(3)
    expect(petLevelFromExp(100_000)).toBe(3)
  })

  it('负经验兜底为 1 级', () => {
    expect(petLevelFromExp(-1)).toBe(1)
  })

  it('属性：exp 有序 ⇒ level 有序（单调不减）', () => {
    fc.assert(
      fc.property(fc.nat(100_000), fc.nat(100_000), (a, b) => {
        const [lo, hi] = a <= b ? [a, b] : [b, a]
        expect(petLevelFromExp(lo)).toBeLessThanOrEqual(petLevelFromExp(hi))
      }),
    )
  })

  it('属性：等级恰好落在对应阈值区间', () => {
    fc.assert(
      fc.property(fc.nat(100_000), exp => {
        const lv = petLevelFromExp(exp)
        expect(PET_STAGES[lv - 1].needExp).toBeLessThanOrEqual(exp)
        if (lv < 3) expect(PET_STAGES[lv].needExp).toBeGreaterThan(exp)
      }),
    )
  })
})

describe('宠物台账结构', () => {
  it('阶段阈值严格递增', () => {
    for (let i = 1; i < PET_STAGES.length; i++) {
      expect(PET_STAGES[i].needExp).toBeGreaterThan(PET_STAGES[i - 1].needExp)
    }
  })

  it('一期仅雪球兔可领养，犬 / 猫锁定', () => {
    expect(PET_SPECIES.rabbit.available).toBe(true)
    expect(PET_SPECIES.dog.available).toBe(false)
    expect(PET_SPECIES.cat.available).toBe(false)
  })

  it('改名长度上限为正整数', () => {
    expect(Number.isInteger(PET_RENAME_MAX)).toBe(true)
    expect(PET_RENAME_MAX).toBeGreaterThan(0)
  })
})
