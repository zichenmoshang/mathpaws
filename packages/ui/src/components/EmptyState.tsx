// 【暂未使用 · 2026-10-06 CR】业务页零引用（hifi 位图路线替代 CSS 绘制组件）；业务代码 CR 后评估删留，暂保留。
// ---------- EmptyState ----------
import type { CSSProperties, ReactNode } from 'react'

import { C, FONT } from '../tokens'

export function EmptyState({
  icon, title, hint, action,
}: {
  icon?: ReactNode
  title: string
  hint?: string
  action?: ReactNode
}) {
  return (
    <div
      style={s.root}
    >
      {icon && <span style={s.icon}>{icon}</span>}
      <div style={s.title}>{title}</div>
      {hint && <div style={s.hint}>{hint}</div>}
      {action}
    </div>
  )
}

// ---------- 样式表（静态部分；随 props/状态变化的值留在 JSX 内联） ----------
const s: Record<string, CSSProperties> = {
  root: {
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    gap: 10, padding: '40px 20px', fontFamily: FONT.family,
  },
  icon: { fontSize: 84 },
  title: { fontSize: 22, fontWeight: 900, color: C.ink },
  hint: { fontSize: 16, color: C.inkSoft },
}
