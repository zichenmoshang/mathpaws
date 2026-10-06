// ---------- 居中弹窗 ----------
import type { CSSProperties, ReactNode } from 'react'

import { C, FONT, SHADOW } from '../tokens'

export function Modal({ children, onClose, width = 480 }: {
  children: ReactNode
  onClose?: () => void
  width?: number
}) {
  return (
    <div onClick={onClose} style={s.overlay}>
      <div onClick={(e) => e.stopPropagation()} style={{
        ...s.panel,
        width: 'min(92vw,' + width + 'px)',
      }}>{children}</div>
    </div>
  )
}

// ---------- 样式表（静态部分；随 props/状态变化的值留在 JSX 内联） ----------
const s: Record<string, CSSProperties> = {
  overlay: {
    position: 'absolute', inset: 0, background: 'rgba(0,0,0,.4)', zIndex: 40,
    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
  },
  panel: {
    maxHeight: '86vh', overflowY: 'auto',
    background: C.white, borderRadius: 26, padding: 24,
    boxShadow: SHADOW.panel, fontFamily: FONT.family,
  },
}
