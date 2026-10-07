// 经济数值配置：仅常量，断言关键数值关系与自洽性（PRD §13）
import { describe, it, expect } from 'vitest'

import {
  INITIAL_CURRENCY,
  REWARD,
  DAILY_PAID_ROUNDS,
  FOOD_EXP_RATE,
  FLOAT,
  COLD_START,
} from '../economy'
import { CROP_MAP } from '../farm'

describe('初始货币', () => {
  it('贝壳 / 花朵币 / 宠物食物三字段存在且非负', () => {
    expect(Object.keys(INITIAL_CURRENCY).sort()).toEqual(['flowerCoins', 'petFood', 'shells'])
    for (const v of Object.values(INITIAL_CURRENCY)) {
      expect(v).toBeGreaterThanOrEqual(0)
    }
  })
})

describe('答题奖励', () => {
  it('单题奖励为正，真题不低于口算', () => {
    expect(REWARD.oralPerQuestion).toBeGreaterThan(0)
    expect(REWARD.realPerQuestion).toBeGreaterThanOrEqual(REWARD.oralPerQuestion)
    expect(REWARD.foodPerRound).toBeGreaterThan(0)
  })

  it('轮次保底已取消（并入口径）但字段保留为 0', () => {
    expect(REWARD.roundBonus).toBe(0)
  })

  it('每日付费轮次上限为正整数', () => {
    expect(Number.isInteger(DAILY_PAID_ROUNDS)).toBe(true)
    expect(DAILY_PAID_ROUNDS).toBeGreaterThan(0)
  })

  it('1 食物兑换经验比率为正', () => {
    expect(FOOD_EXP_RATE).toBeGreaterThan(0)
  })
})

describe('浮题规则', () => {
  it('在场数量 / 补充间隔 / 倒计时 / 每日上限均为正', () => {
    expect(FLOAT.simultaneous).toBeGreaterThan(0)
    expect(FLOAT.respawnSeconds).toBeGreaterThan(0)
    expect(FLOAT.countdownSeconds).toBeGreaterThan(0)
    expect(FLOAT.dailyLimit).toBeGreaterThan(0)
  })

  it('奖励概率合计为 1（每次作答必出食物或贝壳）', () => {
    expect(FLOAT.foodRate).toBeGreaterThan(0)
    expect(FLOAT.shellRate).toBeGreaterThan(0)
    expect(FLOAT.foodRate + FLOAT.shellRate).toBeCloseTo(1, 10)
  })

  it('单次奖励数量为正', () => {
    expect(FLOAT.foodAmount).toBeGreaterThan(0)
    expect(FLOAT.shellAmount).toBeGreaterThan(0)
  })
})

describe('冷启动', () => {
  it('赠送玉米种子，且玉米为 Lv.1 可种的真实作物', () => {
    expect(COLD_START.cornSeeds).toBeGreaterThan(0)
    expect(CROP_MAP.corn.unlockLevel).toBe(1)
    expect(CROP_MAP.corn.seedPrice).toBeGreaterThan(0)
  })
})
