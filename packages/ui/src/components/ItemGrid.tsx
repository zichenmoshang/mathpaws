// 【暂未使用 · 2026-10-06 CR】业务页零引用（hifi 位图路线替代 CSS 绘制组件）；业务代码 CR 后评估删留，暂保留。
// ---------- ItemGrid / ItemCell ----------
import type { CSSProperties, ReactNode } from 'react'

import { C } from '../tokens'
import * as s from './ItemGrid.css'

export function ItemGrid({
  children, columns = 4, gap = 12,
}: {
  children: ReactNode
  columns?: number
  gap?: number
}) {
  return (
    <div
      className={s.grid}
      style={{
        gridTemplateColumns: `repeat(${columns}, minmax(0,1fr))`,
        gap,
      }}
    >
      {children}
    </div>
  )
}

export function ItemCell({
  children, selected, locked, onClick, style,
}: {
  children: ReactNode
  selected?: boolean
  locked?: boolean
  onClick?: () => void
  style?: CSSProperties
}) {
  return (
    <button
      onClick={locked ? undefined : onClick}
      className={s.cell}
      style={{
        cursor: locked ? 'not-allowed' : 'pointer',
        background: locked ? '#f5f5f5' : '#fff',
        border: `3px solid ${selected ? C.orange : '#e0e0e0'}`,
        boxShadow: selected ? `0 0 0 3px ${C.orange}33` : 'none',
        opacity: locked ? 0.6 : 1, ...style,
      }}
    >
      {children}
      {locked && (
        <span className={s.lock}>🔒</span>
      )}
    </button>
  )
}
