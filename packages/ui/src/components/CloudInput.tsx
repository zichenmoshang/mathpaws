// ---------- CloudInput（云形输入） ----------
import type { CSSProperties } from 'react'

import * as s from './CloudInput.css'

export function CloudInput({
  value, onChange, placeholder, maxLength, onSubmit, style,
}: {
  value: string
  onChange: (v: string) => void
  placeholder?: string
  maxLength?: number
  onSubmit?: () => void
  style?: CSSProperties
}) {
  return (
    <input
      value={value}
      maxLength={maxLength}
      placeholder={placeholder}
      onChange={e => onChange(e.target.value)}
      onKeyDown={e => {
        if (e.key === 'Enter' && onSubmit) onSubmit()
      }}
      className={s.input}
      style={style}
    />
  )
}
