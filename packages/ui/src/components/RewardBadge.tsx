// 【暂未使用 · 2026-10-06 CR】业务页零引用（hifi 位图路线替代 CSS 绘制组件）；业务代码 CR 后评估删留，暂保留。
// ---------- RewardBadge / RewardRow ----------
import type { CSSProperties, ReactNode } from 'react'

import { C, FONT, R } from '../tokens'

export function RewardBadge({
  icon, value, tone = 'shell',
}: {
  icon: ReactNode
  value: ReactNode
  tone?: 'shell' | 'flower' | 'food'
}) {
  const colors = {
    shell: { bg: '#fff3cd', fg: '#8a6d1d' },
    flower: { bg: '#fde4ec', fg: C.pinkDeep },
    food: { bg: '#efebe9', fg: '#5d4037' },
  }[tone]
  return (
    <div
      style={{
        ...s.badge,
        background: colors.bg, color: colors.fg,
      }}
    >
      <span style={s.icon}>{icon}</span>
      {value}
    </div>
  )
}

export function RewardRow({ children }: { children: ReactNode }) {
  return (
    <div style={s.row}>
      {children}
    </div>
  )
}

// ---------- 样式表（静态部分；随 props/状态变化的值留在 JSX 内联） ----------
const s: Record<string, CSSProperties> = {
  badge: {
    display: 'inline-flex', alignItems: 'center', gap: 8,
    padding: '8px 18px', borderRadius: R.pill,
    fontFamily: FONT.family, fontWeight: 900, fontSize: 20,
  },
  icon: { fontSize: 24 },
  row: { display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' },
}
