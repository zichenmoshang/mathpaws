// 【仅 dev 场景使用 · 2026-10-06 CR】生产页面未引用；待业务代码 CR 后评估。
// ---------- 卡片 ----------
import type { CSSProperties, ReactNode } from 'react'

import { C, FONT, R, SHADOW } from '../tokens'

export function Card({ children, style, padding = 18 }: {
  children: ReactNode
  style?: CSSProperties
  padding?: number
}) {
  return (
    <div style={{
      ...s.root, padding, ...style,
    }}>{children}</div>
  )
}

// ---------- 样式表（静态部分；随 props/状态变化的值留在 JSX 内联） ----------
const s: Record<string, CSSProperties> = {
  root: {
    background: C.white, borderRadius: R.lg,
    boxShadow: SHADOW.card, fontFamily: FONT.family,
  },
}
