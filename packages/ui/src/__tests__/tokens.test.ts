import { describe, it, expect } from 'vitest'

import {
  C,
  SUBJECT,
  FONT,
  R,
  SPACE,
  SHADOW,
  VARIANT,
  edge,
  strokeText,
  type Variant,
} from '../tokens'

const HEX = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/

describe('设计 tokens 导出完整性', () => {
  it('主色板关键 token 存在且为合法 hex 色值', () => {
    const keys = [
      'sky', 'skyDeep', 'sun', 'sunDeep', 'orange', 'orangeDeep',
      'grass', 'grassDeep', 'red', 'redDeep', 'purple', 'purpleDeep',
      'pink', 'pinkDeep', 'white', 'ink', 'inkSoft', 'skyBg', 'ground',
    ] as const
    for (const k of keys) {
      expect(C, `缺少颜色 token: ${k}`).toHaveProperty(k)
      expect(C[k], `${k} 应为 hex 色值`).toMatch(HEX)
    }
  })

  it('学科颜色编码覆盖三个学科且引用主色板', () => {
    expect(Object.keys(SUBJECT).sort()).toEqual(['olympiad', 'oral', 'real'])
    expect(SUBJECT.oral).toEqual({ base: C.sky, deep: C.skyDeep })
    expect(SUBJECT.real).toEqual({ base: C.orange, deep: C.orangeDeep })
    expect(SUBJECT.olympiad).toEqual({ base: C.purple, deep: C.purpleDeep })
  })

  it('VARIANT 覆盖全部变体且 bg/deep/fg 字段齐全', () => {
    const all: Variant[] = ['sun', 'sky', 'grass', 'red', 'purple', 'pink', 'ghost']
    expect(Object.keys(VARIANT).sort()).toEqual([...all].sort())
    for (const v of all) {
      const { bg, deep, fg } = VARIANT[v]
      expect(bg, `${v}.bg`).toBeTruthy()
      expect(deep, `${v}.deep`).toBeTruthy()
      expect(fg, `${v}.fg`).toBeTruthy()
      if (v !== 'ghost') {
        expect(bg, `${v}.bg 应为 hex`).toMatch(HEX)
        expect(deep, `${v}.deep 应为 hex`).toMatch(HEX)
      }
    }
  })

  it('字号/圆角/间距阶梯单调且为正', () => {
    const sizes = [
      FONT.micro, FONT.aux, FONT.small, FONT.body, FONT.h2,
      FONT.title, FONT.display, FONT.hero, FONT.question,
    ]
    for (let i = 1; i < sizes.length; i++) {
      expect(sizes[i]).toBeGreaterThan(sizes[i - 1])
    }
    expect(FONT.family).toContain('sans-serif')

    expect(R.sm).toBeLessThan(R.md)
    expect(R.md).toBeLessThan(R.lg)
    expect(R.lg).toBeLessThan(R.pill)

    const spaces = [SPACE.xs, SPACE.sm, SPACE.md, SPACE.lg, SPACE.xl]
    for (let i = 1; i < spaces.length; i++) {
      expect(spaces[i]).toBeGreaterThan(spaces[i - 1])
    }
    for (const s of Object.values(SHADOW)) {
      expect(s).toMatch(/^0 \d+px \d+px /)
    }
  })

  it('edge / strokeText 生成合法的糖果立体底边与描边样式', () => {
    expect(edge('#000')).toBe('0 5px 0 #000')
    expect(edge('#000', 8)).toBe('0 8px 0 #000')

    const css = strokeText('#fff', '#1565C0', 2)
    expect(css).toContain('color:#fff')
    // 4 个方向的描边 shadow + 1 层底部投影（注意 rgba() 内含逗号，不能按逗号切）
    expect(css).toContain('-2px -2px 0 #1565C0')
    expect(css).toContain('2px -2px 0 #1565C0')
    expect(css).toContain('-2px 2px 0 #1565C0')
    expect(css).toContain('2px 2px 0 #1565C0')
    expect(css).toContain('0 4px 0 rgba(0,0,0,.18)')
    expect(css.match(/#1565C0/g)).toHaveLength(4)
  })

  // 色卡图（design/asset-prompts/anchors/palette.png）由 gen_palette.py 内嵌色值生成；
  // 此处断言脚本色值与 C 完全一致——改 C 时必须同步脚本并重跑生成（风格锚 A1）。
  it('色卡脚本色值与 C 色板一致（anchors/gen_palette.py 同步守护）', () => {
    const PALETTE_SCRIPT: Record<string, string> = {
      sky: '#4FC3F7', skyDeep: '#1565C0',
      sun: '#FFD54F', sunDeep: '#F57F17',
      orange: '#FF8F00', orangeDeep: '#EF6C00',
      grass: '#66BB6A', grassDeep: '#43A047',
      red: '#EF5350', redDeep: '#E53935',
      purple: '#B39DDB', purpleDeep: '#7E57C2',
      pink: '#F48FB1', pinkDeep: '#D81B60',
      white: '#FFFFFF', ink: '#263238', inkSoft: '#78909C',
      skyBg: '#BFE3F5', ground: '#9CCC8A',
    }
    for (const [k, v] of Object.entries(PALETTE_SCRIPT)) {
      expect(C[k as keyof typeof C], `色卡脚本与 tokens 不一致: ${k}`).toBe(v)
    }
  })
})
