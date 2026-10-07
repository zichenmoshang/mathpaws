// 农场数值层单测：等级推导 / 地块 / 生长阶段
import * as fc from 'fast-check'
import { describe, it, expect } from 'vitest'

import {
  CROPS,
  CROP_MAP,
  FARM_LEVELS,
  MAX_FARM_LEVEL,
  MAX_PLOT_COUNT,
  PLOT_COUNT,
  farmLevelFromExp,
  nextFarmLevelXp,
  plotCountForLevel,
  emptyPlots,
  getPlotStage,
  type PlotState,
} from '../farm'

describe('farmLevelFromExp', () => {
  it('按表取档：达到阈值即升，差 1 点不升', () => {
    for (let i = 0; i < FARM_LEVELS.length; i++) {
      const lv = FARM_LEVELS[i]
      expect(farmLevelFromExp(lv.xp)).toBe(lv.level)
      if (lv.xp > 0) {
        expect(farmLevelFromExp(lv.xp - 1)).toBe(FARM_LEVELS[i - 1].level)
      }
    }
  })

  it('负经验与超额经验的兜底', () => {
    expect(farmLevelFromExp(-1)).toBe(1)
    expect(farmLevelFromExp(999_999)).toBe(MAX_FARM_LEVEL)
  })

  it('属性：exp 有序 ⇒ level 有序（单调不减）', () => {
    fc.assert(
      fc.property(fc.nat(100_000), fc.nat(100_000), (a, b) => {
        const [lo, hi] = a <= b ? [a, b] : [b, a]
        expect(farmLevelFromExp(lo)).toBeLessThanOrEqual(farmLevelFromExp(hi))
      }),
    )
  })

  it('属性：等级恰好落在对应阈值区间', () => {
    fc.assert(
      fc.property(fc.nat(100_000), exp => {
        const lv = farmLevelFromExp(exp)
        expect(FARM_LEVELS[lv - 1].xp).toBeLessThanOrEqual(exp)
        if (lv < MAX_FARM_LEVEL) expect(FARM_LEVELS[lv].xp).toBeGreaterThan(exp)
      }),
    )
  })
})

describe('nextFarmLevelXp', () => {
  it('返回下一级的累计 XP 阈值', () => {
    for (let lv = 1; lv < MAX_FARM_LEVEL; lv++) {
      expect(nextFarmLevelXp(lv)).toBe(FARM_LEVELS[lv].xp)
    }
  })

  it('满级（及超范围）返回 null', () => {
    expect(nextFarmLevelXp(MAX_FARM_LEVEL)).toBeNull()
    expect(nextFarmLevelXp(MAX_FARM_LEVEL + 1)).toBeNull()
  })

  it('升级阈值严格递增', () => {
    for (let lv = 1; lv < MAX_FARM_LEVEL; lv++) {
      const next = nextFarmLevelXp(lv)
      expect(next).not.toBeNull()
      expect(next as number).toBeGreaterThan(FARM_LEVELS[lv - 1].xp)
    }
  })
})

describe('plotCountForLevel', () => {
  it('一期固定 4 块（任意等级），扩地转二期', () => {
    for (const lv of [1, 2, 5, MAX_FARM_LEVEL, 0, 999]) {
      expect(plotCountForLevel(lv)).toBe(4)
    }
    expect(MAX_PLOT_COUNT).toBe(4)
    expect(PLOT_COUNT).toBe(4)
  })
})

describe('emptyPlots', () => {
  it('默认生成 PLOT_COUNT 块空地', () => {
    const plots = emptyPlots()
    expect(plots).toHaveLength(PLOT_COUNT)
    for (const p of plots) expect(p).toEqual({ seedId: null, plantedAt: 0 })
  })

  it('支持自定义数量（含 0）', () => {
    expect(emptyPlots(0)).toHaveLength(0)
    expect(emptyPlots(2)).toHaveLength(2)
  })

  it('每次调用及各块均为独立对象，互不串扰', () => {
    const a = emptyPlots()
    a[0].seedId = 'corn'
    a[0].plantedAt = 1
    expect(emptyPlots()[0]).toEqual({ seedId: null, plantedAt: 0 })
    expect(a[0]).not.toBe(a[1])
  })
})

describe('getPlotStage', () => {
  const t0 = 1_000_000
  const cornMs = CROP_MAP.corn.growMinutes * 60_000 // 1 分钟

  it('空地与 plantedAt=0 均视为 empty', () => {
    expect(getPlotStage({ seedId: null, plantedAt: t0 }, t0 + cornMs)).toEqual({
      stage: 'empty',
      remainSeconds: 0,
    })
    expect(getPlotStage({ seedId: 'corn', plantedAt: 0 }, t0)).toEqual({
      stage: 'empty',
      remainSeconds: 0,
    })
  })

  it('未知作物 id 按空地处理（脏数据防护，不抛错）', () => {
    const dirty = { seedId: 'durian', plantedAt: t0 } as unknown as PlotState
    expect(getPlotStage(dirty, t0 + cornMs)).toEqual({ stage: 'empty', remainSeconds: 0 })
  })

  it('生长中：剩余秒数向上取整，含临熟前 1ms', () => {
    expect(getPlotStage({ seedId: 'corn', plantedAt: t0 }, t0)).toEqual({
      stage: 'growing',
      remainSeconds: 60,
    })
    expect(getPlotStage({ seedId: 'corn', plantedAt: t0 }, t0 + 30_000)).toEqual({
      stage: 'growing',
      remainSeconds: 30,
    })
    expect(getPlotStage({ seedId: 'corn', plantedAt: t0 }, t0 + cornMs - 1)).toEqual({
      stage: 'growing',
      remainSeconds: 1,
    })
  })

  it('到达 / 超过生长周期即 ready', () => {
    expect(getPlotStage({ seedId: 'corn', plantedAt: t0 }, t0 + cornMs)).toEqual({
      stage: 'ready',
      remainSeconds: 0,
    })
    expect(getPlotStage({ seedId: 'corn', plantedAt: t0 }, t0 + cornMs * 2).stage).toBe('ready')
  })

  it('长周期作物（草莓 15 分钟）边界一致', () => {
    const sMs = CROP_MAP.strawberry.growMinutes * 60_000
    expect(getPlotStage({ seedId: 'strawberry', plantedAt: t0 }, t0 + sMs - 1000)).toEqual({
      stage: 'growing',
      remainSeconds: 1,
    })
    expect(getPlotStage({ seedId: 'strawberry', plantedAt: t0 }, t0 + sMs).stage).toBe('ready')
  })

  it('时间回拨仍按生长中处理（一期接受改设备时间）', () => {
    // now < plantedAt 时 elapsed 为负，remainSeconds 会大于完整周期；记录当前行为
    const r = getPlotStage({ seedId: 'corn', plantedAt: t0 }, t0 - 5000)
    expect(r.stage).toBe('growing')
    expect(r.remainSeconds).toBe(65)
  })
})

describe('CROPS 数值自洽', () => {
  it('每种作物 售价×产量 > 种子价（种植不亏本）', () => {
    for (const c of CROPS) expect(c.sellPrice * c.yield).toBeGreaterThan(c.seedPrice)
  })

  it('CROP_MAP 与 CROPS 一一对应', () => {
    expect(Object.keys(CROP_MAP)).toHaveLength(CROPS.length)
    for (const c of CROPS) expect(CROP_MAP[c.id]).toBe(c)
  })
})
