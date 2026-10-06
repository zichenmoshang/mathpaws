// 【暂未使用 · 2026-10-06 CR】业务页零引用（hifi 位图路线替代 CSS 绘制组件）；业务代码 CR 后评估删留，暂保留。
// ---------- 顶栏容器 ----------
import type { CSSProperties, ReactNode } from 'react'

import { R } from '../tokens'

export function TopBar({ children, tone = 'sky' }: { children: ReactNode; tone?: 'sky' | 'none' }) {
  return (
    <div style={{
      ...s.root,
      ...(tone === 'sky' ? {
        background: 'linear-gradient(180deg,#64b5f6,#1e88e5)',
        borderRadius: R.lg, padding: '8px 12px',
        boxShadow: '0 4px 0 #1565c0, 0 8px 16px rgba(21,101,192,.25)',
      } : {}),
    }}>
      {children}
    </div>
  )
}

// ---------- 样式表（静态部分；随 props/状态变化的值留在 JSX 内联） ----------
const s: Record<string, CSSProperties> = {
  root: {
    position: 'absolute', top: 12, left: 12, right: 12, minHeight: 56,
    display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8,
    zIndex: 10,
  },
}
