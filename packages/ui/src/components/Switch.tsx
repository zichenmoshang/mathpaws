// ---------- Switch ----------
import type { CSSProperties } from 'react'

import { C, FONT, R } from '../tokens'

export function Switch({
  checked, onChange, label,
}: {
  checked: boolean
  onChange: (v: boolean) => void
  label?: string
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      style={s.root}
    >
      <span
        style={{
          ...s.track,
          background: checked ? C.grass : '#b0bec5',
        }}
      >
        <span
          style={{
            ...s.knob,
            left: checked ? 29 : 3,
          }}
        />
      </span>
      {label}
    </button>
  )
}

// ---------- 样式表（静态部分；随 props/状态变化的值留在 JSX 内联） ----------
const s: Record<string, CSSProperties> = {
  root: {
    display: 'inline-flex', alignItems: 'center', gap: 10,
    border: 'none', background: 'transparent', cursor: 'pointer',
    fontFamily: FONT.family, fontWeight: 800, color: C.ink,
  },
  track: {
    width: 56, height: 30, borderRadius: R.pill, position: 'relative',
    transition: 'background .2s',
    boxShadow: 'inset 0 2px 4px rgba(0,0,0,.18)',
  },
  knob: {
    position: 'absolute', top: 3,
    width: 24, height: 24, borderRadius: '50%', background: '#fff',
    transition: 'left .2s', boxShadow: '0 2px 4px rgba(0,0,0,.25)',
  },
}
