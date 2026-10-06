// 【暂未使用 · 2026-10-06 CR】业务页零引用（hifi 位图路线替代 CSS 绘制组件）；业务代码 CR 后评估删留，暂保留。
// ---------- ResourcePill（顶部货币） ----------
import type { CSSProperties, ReactNode } from 'react'

import { C, FONT, R } from '../tokens'

export function ResourcePill({
  icon, value, tone = 'shell',
}: {
  icon: ReactNode
  value: ReactNode
  tone?: 'shell' | 'flower'
}) {
  const map = {
    shell: { bg: '#ffffff', fg: C.ink, border: '#e0e0e0' },
    flower: { bg: '#fff8e1', fg: '#ad6800', border: '#ffe082' },
  }[tone]
  return (
    <div
      style={{
        ...s.root,
        background: map.bg, color: map.fg, border: `2px solid ${map.border}`,
      }}
    >
      <span style={s.icon}>{icon}</span>
      {value}
    </div>
  )
}

// ---------- 样式表（静态部分；随 props/状态变化的值留在 JSX 内联） ----------
const s: Record<string, CSSProperties> = {
  root: {
    display: 'inline-flex', alignItems: 'center', gap: 6,
    height: 38, padding: '0 14px', borderRadius: R.pill,
    fontFamily: FONT.family, fontWeight: 900, fontSize: 18, whiteSpace: 'nowrap',
  },
  icon: { fontSize: 20 },
}
