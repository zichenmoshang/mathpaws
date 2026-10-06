// 【暂未使用 · 2026-10-06 CR】业务页零引用（hifi 位图路线替代 CSS 绘制组件）；业务代码 CR 后评估删留，暂保留。
// ---------- 圆形图标按钮（右下功能键） ----------
import type { CSSProperties, ReactNode } from 'react'

import { FONT, edge } from '../tokens'

export function RoundBtn({
  icon, label, bg, deep, fg = '#fff', size = 78, onClick, disabled,
}: {
  icon: ReactNode
  label?: string
  bg: string
  deep: string
  fg?: string
  size?: number
  onClick?: () => void
  disabled?: boolean
}) {
  return (
    <button
      className="mp-btn"
      onClick={onClick}
      disabled={disabled}
      style={{
        ...s.root,
        width: size, height: size,
        background: `radial-gradient(circle at 38% 30%,rgba(255,255,.5),rgba(255,255,255,0) 55%), ${bg}`,
        color: fg, boxShadow: edge(deep, 5), cursor: disabled ? 'not-allowed' : 'pointer',
      }}
    >
      <span style={{ fontSize: size * 0.42 }}>{icon}</span>
      {label && <span style={s.label}>{label}</span>}
    </button>
  )
}

// ---------- 样式表（静态部分；随 props/状态变化的值留在 JSX 内联） ----------
const s: Record<string, CSSProperties> = {
  root: {
    borderRadius: '50%', border: 'none',
    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
    fontFamily: FONT.family, userSelect: 'none', lineHeight: 1.1,
  },
  label: { fontSize: 13, fontWeight: 900 },
}
