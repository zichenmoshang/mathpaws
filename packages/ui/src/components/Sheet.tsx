// 【暂未使用 · 2026-10-06 CR】业务页零引用（hifi 位图路线替代 CSS 绘制组件）；业务代码 CR 后评估删留，暂保留。
// ---------- 底部弹层 ----------
import type { ReactNode } from 'react'

import * as s from './Sheet.css'

export function Sheet({ children, title, onClose }: {
  children: ReactNode
  title?: string
  onClose: () => void
}) {
  return (
    <div onClick={onClose} className={s.overlay}>
      <div onClick={(e) => e.stopPropagation()} className={s.panel}>
        {title && (
          <div className={s.titleRow}>
            <span className={s.title}>{title}</span>
            <button onClick={onClose} className={s.close}>✕</button>
          </div>
        )}
        {children}
      </div>
    </div>
  )
}
