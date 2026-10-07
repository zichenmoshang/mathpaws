// 装扮配置：基线判定纯函数 + 品质概率 / 槽位元数据自洽
import { describe, it, expect } from 'vitest'

import {
  BASELINE_COSMETICS,
  COSMETIC_SLOTS,
  COSMETIC_SLOT_LABEL,
  RARITY_RATE,
  RARITY_META,
  isBaselineCosmetic,
  type Rarity,
} from '../cosmetics'

describe('isBaselineCosmetic', () => {
  it('基线装扮（默认套装 / 默认鞋）判定为 true', () => {
    expect(BASELINE_COSMETICS.length).toBeGreaterThan(0)
    for (const b of BASELINE_COSMETICS) expect(isBaselineCosmetic(b.id)).toBe(true)
  })

  it('卡池装扮与空串判定为 false', () => {
    expect(isBaselineCosmetic('wizard-hat')).toBe(false)
    expect(isBaselineCosmetic('')).toBe(false)
  })

  it('基线条目 id 带槽后缀（与抽卡 id 同构）', () => {
    for (const b of BASELINE_COSMETICS) expect(b.id.endsWith(b.slot)).toBe(true)
  })
})

describe('品质概率', () => {
  it('普通 / 稀有 / 传说三档均在 (0,1) 且合计为 1', () => {
    const rates = Object.values(RARITY_RATE)
    expect(rates).toHaveLength(3)
    for (const r of rates) {
      expect(r).toBeGreaterThan(0)
      expect(r).toBeLessThan(1)
    }
    expect(rates.reduce((a, b) => a + b, 0)).toBeCloseTo(1, 10)
  })

  it('每档品质都有完整展示元数据', () => {
    const rarities: Rarity[] = ['normal', 'rare', 'legendary']
    for (const r of rarities) {
      expect(RARITY_META[r].label).not.toBe('')
      expect(RARITY_META[r].color).not.toBe('')
      expect(RARITY_META[r].bg).not.toBe('')
      expect(RARITY_META[r].border).not.toBe('')
    }
  })
})

describe('槽位', () => {
  it('三个可换槽均有中文标签', () => {
    expect(COSMETIC_SLOTS).toEqual(['outfit', 'hat', 'shoe'])
    for (const s of COSMETIC_SLOTS) expect(COSMETIC_SLOT_LABEL[s]).not.toBe('')
  })
})
