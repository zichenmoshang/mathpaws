// 【暂未使用 · 2026-10-06 CR】业务页零引用（hifi 位图路线替代 CSS 绘制组件）；业务代码 CR 后评估删留，暂保留。
// ---------- 圆形图标按钮（右下功能键） ----------
import type { ReactNode } from 'react'

import { btn } from '../styles.css'
import { edge } from '../tokens'
import * as s from './RoundBtn.css'

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
      className={`${btn} ${s.root}`}
      onClick={onClick}
      disabled={disabled}
      style={{
        // 动态值：尺寸/配色/立体底边/禁用态随 props 变化，保留内联
        width: size, height: size,
        background: `radial-gradient(circle at 38% 30%,rgba(255,255,.5),rgba(255,255,255,0) 55%), ${bg}`,
        color: fg, boxShadow: edge(deep, 5), cursor: disabled ? 'not-allowed' : 'pointer',
      }}
    >
      <span style={{ fontSize: size * 0.42 }}>{icon}</span>
      {label && <span className={s.label}>{label}</span>}
    </button>
  )
}
