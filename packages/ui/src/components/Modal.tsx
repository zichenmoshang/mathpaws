// ---------- 居中弹窗 ----------
import type { ReactNode } from 'react'

import * as s from './Modal.css'

export function Modal({ children, onClose, width = 480 }: {
  children: ReactNode
  onClose?: () => void
  width?: number
}) {
  return (
    <div onClick={onClose} className={s.overlay}>
      <div onClick={(e) => e.stopPropagation()} className={s.panel} style={{
        // 动态值：宽度随 props 变化，保留内联
        width: 'min(92vw,' + width + 'px)',
      }}>{children}</div>
    </div>
  )
}
