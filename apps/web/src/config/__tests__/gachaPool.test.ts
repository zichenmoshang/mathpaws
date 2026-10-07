// 抽卡数值单测：品质分桶 / 保底 / 物品抽取（注入 rng 保证确定性）
import * as fc from 'fast-check'
import { describe, it, expect } from 'vitest'

import { RARITY_RATE, type Rarity } from '../cosmetics'
import {
  GACHA_POOL,
  GACHA_ITEM_MAP,
  SINGLE_COST,
  TEN_COST,
  RARE_PITY,
  LEGEND_PITY,
  itemsByRarity,
  rollRarity,
  rollItem,
} from '../gachaPool'

const RARITIES: Rarity[] = ['normal', 'rare', 'legendary']
const isRarity = (v: string): v is Rarity => (RARITIES as string[]).includes(v)

describe('卡池结构', () => {
  it('10 件、id 唯一、图标解析为字符串（.webp 走 Vite 资产管线）', () => {
    expect(GACHA_POOL).toHaveLength(10)
    expect(new Set(GACHA_POOL.map(i => i.id)).size).toBe(GACHA_POOL.length)
    for (const i of GACHA_POOL) expect(typeof i.icon).toBe('string')
  })

  it('品质分布：普通 4 / 稀有 4 / 传说 2', () => {
    expect(itemsByRarity('normal')).toHaveLength(4)
    expect(itemsByRarity('rare')).toHaveLength(4)
    expect(itemsByRarity('legendary')).toHaveLength(2)
  })

  it('GACHA_ITEM_MAP 与卡池一一对应', () => {
    for (const i of GACHA_POOL) expect(GACHA_ITEM_MAP[i.id]).toBe(i)
  })

  it('价格口径：单抽 50 / 十连 450，十连低于十次单抽', () => {
    expect(SINGLE_COST).toBe(50)
    expect(TEN_COST).toBe(450)
    expect(TEN_COST).toBeLessThan(SINGLE_COST * 10)
  })
})

describe('rollRarity 无保底分桶', () => {
  const LEGEND_EDGE = RARITY_RATE.legendary // 0.05
  const RARE_EDGE = RARITY_RATE.legendary + RARITY_RATE.rare // 0.25

  it('rng 取 0 / 临界 / 近 1 时的品质映射', () => {
    expect(rollRarity(0, 0, () => 0)).toBe('legendary')
    expect(rollRarity(0, 0, () => 0.049999)).toBe('legendary')
    expect(rollRarity(0, 0, () => LEGEND_EDGE)).toBe('rare') // 恰到上沿落入下一桶
    expect(rollRarity(0, 0, () => 0.249999)).toBe('rare')
    expect(rollRarity(0, 0, () => RARE_EDGE)).toBe('normal')
    expect(rollRarity(0, 0, () => 0.999999999)).toBe('normal')
  })

  it('保底计数未达阈值时不触发保底', () => {
    // 第 9 抽（pityRare=8）且第 99 抽（pityLegend=98）均未达保底
    expect(rollRarity(RARE_PITY - 2, LEGEND_PITY - 2, () => 0.5)).toBe('normal')
  })
})

describe('rollRarity 保底', () => {
  it('稀有保底：第 10 抽必出稀有及以上，按相对概率分传说', () => {
    // pityRare=9 ⇒ 本次为第 10 抽；pLegend = 0.05 / 0.25 = 0.2
    expect(rollRarity(RARE_PITY - 1, 0, () => 0)).toBe('legendary')
    expect(rollRarity(RARE_PITY - 1, 0, () => 0.19)).toBe('legendary')
    expect(rollRarity(RARE_PITY - 1, 0, () => 0.2)).toBe('rare')
    expect(rollRarity(RARE_PITY - 1, 0, () => 0.999999)).toBe('rare')
  })

  it('传说保底：第 100 抽必出传说，且不再消耗 rng', () => {
    const boom = () => {
      throw new Error('传说保底命中时不应调用 rng')
    }
    expect(rollRarity(0, LEGEND_PITY - 1, boom)).toBe('legendary')
    // 传说保底优先于稀有保底
    expect(rollRarity(RARE_PITY - 1, LEGEND_PITY - 1, boom)).toBe('legendary')
  })

  it('属性：任意 pity / rng∈[0,1] 输出恒为合法稀有度', () => {
    fc.assert(
      fc.property(
        fc.nat(300),
        fc.nat(300),
        fc.double({ min: 0, max: 1, noNaN: true }),
        (pr, pl, r) => {
          expect(isRarity(rollRarity(pr, pl, () => r))).toBe(true)
        },
      ),
    )
  })

  it('属性：稀有保底已触发且传说保底未触发时，绝不产出普通', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: RARE_PITY - 1, max: 500 }),
        fc.integer({ min: 0, max: LEGEND_PITY - 2 }),
        fc.double({ min: 0, max: 1, noNaN: true }),
        (pr, pl, r) => {
          expect(rollRarity(pr, pl, () => r)).not.toBe('normal')
        },
      ),
    )
  })
})

describe('rollItem', () => {
  it('rng 边界确定性映射到池内物品', () => {
    const normals = itemsByRarity('normal')
    expect(rollItem('normal', () => 0)).toBe(normals[0])
    expect(rollItem('normal', () => 0.999999)).toBe(normals[normals.length - 1])
    const legends = itemsByRarity('legendary')
    expect(rollItem('legendary', () => 0.49)).toBe(legends[0])
    expect(rollItem('legendary', () => 0.5)).toBe(legends[1])
  })

  it('属性：任意 rng∈[0,1) 必返回指定 rarity 的池内物品', () => {
    fc.assert(
      fc.property(
        fc.constantFrom<Rarity>('normal', 'rare', 'legendary'),
        fc.double({ min: 0, max: 1 - Number.EPSILON, noNaN: true }),
        (rarity, r) => {
          const item = rollItem(rarity, () => r)
          expect(item.rarity).toBe(rarity)
          expect(GACHA_ITEM_MAP[item.id]).toBe(item)
        },
      ),
    )
  })
})
