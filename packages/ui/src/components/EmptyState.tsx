// 【暂未使用 · 2026-10-06 CR】业务页零引用（hifi 位图路线替代 CSS 绘制组件）；业务代码 CR 后评估删留，暂保留。
// ---------- EmptyState ----------
import type { ReactNode } from 'react'

import * as s from './EmptyState.css'

export function EmptyState({
  icon, title, hint, action,
}: {
  icon?: ReactNode
  title: string
  hint?: string
  action?: ReactNode
}) {
  return (
    <div className={s.root}>
      {icon && <span className={s.icon}>{icon}</span>}
      <div className={s.title}>{title}</div>
      {hint && <div className={s.hint}>{hint}</div>}
      {action}
    </div>
  )
}
