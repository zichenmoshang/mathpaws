// 连学宝箱数值单测：streak → 宝箱等级各档边界
import * as fc from 'fast-check'
import { describe, it, expect } from 'vitest'

import { CHEST_LEVELS, chestLevelForStreak } from '../streak'

describe('chestLevelForStreak', () => {
  it('各档边界：1 / 2 / 3 / 5 / 7 天', () => {
    expect(chestLevelForStreak(1).level).toBe(1)
    expect(chestLevelForStreak(2).level).toBe(2)
    expect(chestLevelForStreak(3).level).toBe(3)
    expect(chestLevelForStreak(4).level).toBe(3) // 未到 5 天档
    expect(chestLevelForStreak(5).level).toBe(4)
    expect(chestLevelForStreak(6).level).toBe(4) // 未到 7 天档
    expect(chestLevelForStreak(7).level).toBe(5)
  })

  it('streak 0（当天未打卡）回落 Lv.1', () => {
    expect(chestLevelForStreak(0)).toEqual({ level: 1, streakDays: 1, shells: 10, food: 2 })
  })

  it('超过 7 天保持 Lv.5（不断签保持）', () => {
    expect(chestLevelForStreak(8).level).toBe(5)
    expect(chestLevelForStreak(365).level).toBe(5)
  })

  it('返回值即奖励表条目（含贝壳 / 食物数量）', () => {
    for (const lv of CHEST_LEVELS) {
      expect(chestLevelForStreak(lv.streakDays)).toBe(lv)
    }
  })

  it('奖励表自洽：天数 / 贝壳 / 食物逐档严格递增', () => {
    for (let i = 1; i < CHEST_LEVELS.length; i++) {
      expect(CHEST_LEVELS[i].streakDays).toBeGreaterThan(CHEST_LEVELS[i - 1].streakDays)
      expect(CHEST_LEVELS[i].shells).toBeGreaterThan(CHEST_LEVELS[i - 1].shells)
      expect(CHEST_LEVELS[i].food).toBeGreaterThan(CHEST_LEVELS[i - 1].food)
    }
  })

  it('属性：streak 有序 ⇒ 宝箱等级有序（单调不减）', () => {
    fc.assert(
      fc.property(fc.nat(365), fc.nat(365), (a, b) => {
        const [lo, hi] = a <= b ? [a, b] : [b, a]
        expect(chestLevelForStreak(lo).level).toBeLessThanOrEqual(chestLevelForStreak(hi).level)
      }),
    )
  })
})
