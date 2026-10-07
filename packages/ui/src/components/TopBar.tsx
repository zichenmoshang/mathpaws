// 【暂未使用 · 2026-10-06 CR】业务页零引用（hifi 位图路线替代 CSS 绘制组件）；业务代码 CR 后评估删留，暂保留。
// ---------- 顶栏容器 ----------
import type { ReactNode } from 'react'

import { R } from '../tokens'
import * as s from './TopBar.css'

export function TopBar({ children, tone = 'sky' }: { children: ReactNode; tone?: 'sky' | 'none' }) {
  return (
    <div className={s.root} style={
      // 动态值：sky 皮肤样式随 tone 变化，保留内联
      tone === 'sky' ? {
        background: 'linear-gradient(180deg,#64b5f6,#1e88e5)',
        borderRadius: R.lg, padding: '8px 12px',
        boxShadow: '0 4px 0 #1565c0, 0 8px 16px rgba(21,101,192,.25)',
      } : undefined
    }>
      {children}
    </div>
  )
}
