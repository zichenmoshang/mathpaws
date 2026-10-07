// ---------- ConfirmDialog ----------
import type { ReactNode } from 'react'

import { C, edge } from '../tokens'
import { btn } from '../styles.css'
import * as s from './ConfirmDialog.css'

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
      className={s.overlay}
    >
      <div
        onClick={e => e.stopPropagation()}
        className={s.panel}
      >
        {title && (
          <div className={s.title}>
            {title}
          </div>
        )}
        <div className={s.message}>
          {message}
        </div>
        <div className={s.actions}>
          <button
            className={`${btn} ${s.cancel}`}
            onClick={onCancel}
          >
            {cancelText}
          </button>
          <button
            className={`${btn} ${s.confirm}`}
            onClick={onConfirm}
            style={{
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
