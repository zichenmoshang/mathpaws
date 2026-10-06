// 【暂未使用 · 2026-10-06 CR】业务页零引用（hifi 位图路线替代 CSS 绘制组件）；业务代码 CR 后评估删留，暂保留。
// ---------- 底部弹层 ----------
import type { CSSProperties, ReactNode } from 'react'

import { FONT } from '../tokens'

export function Sheet({ children, title, onClose }: {
  children: ReactNode
  title?: string
  onClose: () => void
}) {
  return (
    <div onClick={onClose} style={s.overlay}>
      <div onClick={(e) => e.stopPropagation()} style={s.panel}>
        {title && (
          <div style={s.titleRow}>
            <span style={s.title}>{title}</span>
            <button onClick={onClose} style={s.close}>✕</button>
          </div>
        )}
        {children}
      </div>
    </div>
  )
}

// ---------- 样式表（静态部分；随 props/状态变化的值留在 JSX 内联） ----------
const s: Record<string, CSSProperties> = {
  overlay: {
    position: 'absolute', inset: 0, background: 'rgba(0,0,0,.42)', zIndex: 30,
    display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
  },
  panel: {
    width: '100%', maxWidth: 760, maxHeight: '82%', overflowY: 'auto',
    background: 'linear-gradient(180deg,#fff8e1,#ffecb3)',
    borderRadius: '26px 26px 0 0', padding: 20,
    boxShadow: '0 -8px 28px rgba(0,0,0,.25)', fontFamily: FONT.family,
  },
  titleRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  title: { fontSize: 24, fontWeight: 900, color: '#5d4037' },
  close: { border: 'none', borderRadius: '50%', width: 34, height: 34, background: '#bcaaa4', color: '#fff', fontWeight: 900, cursor: 'pointer' },
}
