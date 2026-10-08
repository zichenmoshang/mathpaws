// mathpaws 设计 Token —— 从 docs/design-system.md 落地的唯一权威样式来源
// 所有 UI 组件统一引用这里，不要在业务代码里散落硬编码色值/阴影。

export const C = {
  // 主色板（design-system）
  sky: '#4FC3F7',
  skyDeep: '#1565C0',
  sun: '#FFD54F',
  sunDeep: '#F57F17',
  orange: '#FF8F00',
  orangeDeep: '#EF6C00',
  grass: '#66BB6A',
  grassDeep: '#43A047',
  red: '#EF5350',
  redDeep: '#E53935',
  purple: '#B39DDB',
  purpleDeep: '#7E57C2',
  pink: '#F48FB1',
  pinkDeep: '#D81B60',

  white: '#FFFFFF',
  ink: '#263238',
  inkSoft: '#78909C',

  // 场景
  skyBg: '#bfe3f5',
  ground: '#9ccc8a',
} as const

// 学科颜色编码
export const SUBJECT = {
  oral: { base: C.sky, deep: C.skyDeep },
  real: { base: C.orange, deep: C.orangeDeep },
  olympiad: { base: C.purple, deep: C.purpleDeep },
} as const

export const FONT = {
  // 英文/数字用 Baloo 2（可商用），中文回退雅黑；后续美术提供站酷快乐体文件再替换
  family: '"Baloo 2","Comic Sans MS","Microsoft YaHei",system-ui,sans-serif',
  // 字号 9 档（逻辑基准 1024×768，单位 px；2026-10-08 由 5 档收敛扩展，design-system §4.2）：
  // 固定像素场景（LogicalStage 内）一律引用，禁止散值字面量；流式场景与舞台外 UI 不适用
  micro: 12,
  aux: 14,
  small: 16,
  body: 18,
  h2: 22,
  title: 28,
  display: 36,
  hero: 48,
  question: 64,
} as const

export const R = {
  sm: 10,
  md: 16,
  lg: 22,
  pill: 999,
} as const

export const SPACE = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24 } as const

// 卡通"糖果"立体底边：按钮/卡片靠底部一条深色制造厚度
export const edge = (deep: string, px = 5) => `0 ${px}px 0 ${deep}`

export const SHADOW = {
  card: '0 6px 16px rgba(21,101,192,.16)',
  panel: '0 10px 30px rgba(0,0,0,.20)',
} as const

// 卡通描边标题：多层 text-shadow 模拟描边
export const strokeText = (fill: string, stroke: string, px = 2) =>
  `color:${fill};text-shadow:` +
  [`-${px}px -${px}px 0 ${stroke}`, `${px}px -${px}px 0 ${stroke}`,
   `-${px}px ${px}px 0 ${stroke}`, `${px}px ${px}px 0 ${stroke}`,
   `0 ${px + 2}px 0 rgba(0,0,0,.18)`].join(',')

export type Variant = 'sun' | 'sky' | 'grass' | 'red' | 'purple' | 'pink' | 'ghost'

export const VARIANT: Record<Variant, { bg: string; deep: string; fg: string }> = {
  sun: { bg: C.sun, deep: C.sunDeep, fg: '#6d4c41' },
  sky: { bg: C.sky, deep: C.skyDeep, fg: '#fff' },
  grass: { bg: C.grass, deep: C.grassDeep, fg: '#fff' },
  red: { bg: C.red, deep: C.redDeep, fg: '#fff' },
  purple: { bg: C.purple, deep: C.purpleDeep, fg: '#fff' },
  pink: { bg: C.pink, deep: C.pinkDeep, fg: '#fff' },
  ghost: { bg: 'rgba(255,255,255,.28)', deep: 'rgba(0,0,0,.12)', fg: '#fff' },
}
