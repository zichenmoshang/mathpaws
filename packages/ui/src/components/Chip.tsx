// 【暂未使用 · 2026-10-06 CR】业务页零引用（hifi 位图路线替代 CSS 绘制组件）；业务代码 CR 后评估删留，暂保留。
// ---------- 资源胶囊（顶栏） ----------
import type { CSSProperties, ReactNode } from 'react'

import { C, FONT, R } from '../tokens'

type ChipTone = 'shell' | 'flower' | 'food'
const CHIP_TONE: Record<ChipTone, { bg: string; fg: string }> = {
  shell: { bg: 'linear-gradient(180deg,#ffffff,#eef3f8)', fg: C.ink },
  flower: { bg: 'linear-gradient(180deg,#fff8e1,#ffecb3)', fg: '#ad6800' },
  food: { bg: 'linear-gradient(180deg,#efebe9,#d7ccc8)', fg: '#5d4037' },
}
export function Chip({ icon, value, tone = 'shell', suffix }: {
  icon: ReactNode
  value: ReactNode
  tone?: ChipTone
  suffix?: string
}) {
  const t = CHIP_TONE[tone]
  return (
    <div style={{ ...s.root, background: t.bg, color: t.fg }}>
      <span style={s.icon}>{icon}</span>
      <span>{value}</span>
      {suffix && <span style={s.suffix}>{suffix}</span>}
    </div>
  )
}

// ---------- 样式表（静态部分；随 props/状态变化的值留在 JSX 内联） ----------
const s: Record<string, CSSProperties> = {
  root: {
    height: 38, display: 'flex', alignItems: 'center', gap: 6, padding: '0 14px',
    borderRadius: R.pill, fontWeight: 900, fontSize: 18,
    fontFamily: FONT.family, boxShadow: '0 2px 0 rgba(0,0,0,.12)', whiteSpace: 'nowrap',
  },
  icon: { fontSize: 21, lineHeight: 1 },
  suffix: { fontSize: 14, opacity: 0.8 },
}
