// ---------- ConfirmDialog ----------
import type { CSSProperties, ReactNode } from 'react'

import { C, FONT, R, edge } from '../tokens'

export function ConfirmDialog({
  title, message, confirmText = '确定', cancelText = '取消',
  onConfirm, onCancel, danger,
}: {
  title?: string
  message: ReactNode
  confirmText?: string
  cancelText?: string
  onConfirm: () => void
  onCancel: () => void
  danger?: boolean
}) {
  return (
    <div
      onClick={onCancel}
      style={s.overlay}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={s.panel}
      >
        {title && (
          <div style={s.title}>
            {title}
          </div>
        )}
        <div style={s.message}>
          {message}
        </div>
        <div style={s.actions}>
          <button
            className="mp-btn"
            onClick={onCancel}
            style={s.cancel}
          >
            {cancelText}
          </button>
          <button
            className="mp-btn"
            onClick={onConfirm}
            style={{
              ...s.confirm,
              background: danger ? C.red : C.grass,
              boxShadow: edge(danger ? C.redDeep : C.grassDeep, 4),
            }}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  )
}

// ---------- 样式表（静态部分；随 props/状态变化的值留在 JSX 内联） ----------
const s: Record<string, CSSProperties> = {
  overlay: {
    position: 'absolute', inset: 0, background: 'rgba(0,0,0,.42)',
    zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  panel: {
    width: 'min(90vw,440px)', background: '#fff', borderRadius: R.lg,
    padding: 26, boxShadow: '0 12px 36px rgba(0,0,0,.25)',
    fontFamily: FONT.family, textAlign: 'center',
  },
  title: { fontSize: 24, fontWeight: 900, color: C.ink, marginBottom: 12 },
  message: { fontSize: 18, color: '#455a64', marginBottom: 22, lineHeight: 1.5 },
  actions: { display: 'flex', gap: 12, justifyContent: 'center' },
  cancel: {
    height: 48, padding: '0 26px', borderRadius: R.md, border: 'none',
    background: '#eceff1', color: '#546e7a', fontWeight: 900,
    fontFamily: FONT.family, cursor: 'pointer',
  },
  confirm: {
    height: 48, padding: '0 26px', borderRadius: R.md, border: 'none',
    color: '#fff', fontWeight: 900,
    fontFamily: FONT.family, cursor: 'pointer',
  },
}
