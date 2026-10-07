// 【仅 dev 场景使用 · 2026-10-06 CR】生产页面未引用；待业务代码 CR 后评估。
// ---------- 卡片 ----------
import type { CSSProperties, ReactNode } from 'react'

import * as s from './Card.css'

export function Card({ children, style, padding = 18 }: {
  children: ReactNode
  style?: CSSProperties
  padding?: number
}) {
  return (
    <div className={s.root} style={{ padding, ...style }}>{children}</div>
  )
}
