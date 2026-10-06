// ---------- CloudInput（云形输入） ----------
import type { CSSProperties } from 'react'

import { C, FONT, R } from '../tokens'

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
      style={{
        ...s.input,
        ...style,
      }}
    />
  )
}

// ---------- 样式表（静态部分；随 props/状态变化的值留在 JSX 内联） ----------
const s: Record<string, CSSProperties> = {
  input: {
    height: 58, padding: '0 28px',
    borderRadius: R.pill,
    border: `4px solid ${C.sky}`,
    background: '#fff',
    color: C.ink,
    fontSize: 22,
    fontWeight: 800,
    fontFamily: FONT.family,
    outline: 'none',
    boxShadow: '0 6px 0 rgba(21,101,192,.18)',
  },
}
