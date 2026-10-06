// ---------- 糖果立体按钮 ----------
import type { CSSProperties, ButtonHTMLAttributes } from 'react'

import { FONT, R, VARIANT, edge, type Variant } from '../tokens'

type Size = 'sm' | 'md' | 'lg'
interface BtnProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  fullWidth?: boolean
}
export function Btn({ variant = 'sun', size = 'md', fullWidth, style, children, ...rest }: BtnProps) {
  const v = VARIANT[variant]
  const h = size === 'lg' ? 62 : size === 'sm' ? 40 : 52
  const fs = size === 'lg' ? 24 : size === 'sm' ? 16 : 20
  const radius = size === 'sm' ? R.sm : R.md
  return (
    <button
      className="mp-btn"
      {...rest}
      style={{
        ...s.base,
        height: h,
        padding: `0 ${size === 'sm' ? 16 : 28}px`,
        borderRadius: radius,
        background: `linear-gradient(180deg,rgba(255,255,255,.42),rgba(255,255,255,0) 46%), ${v.bg}`,
        color: v.fg,
        fontSize: fs,
        cursor: rest.disabled ? 'not-allowed' : 'pointer',
        opacity: rest.disabled ? 0.55 : 1,
        boxShadow: edge(v.deep, size === 'lg' ? 6 : 5),
        width: fullWidth ? '100%' : undefined,
        ...style,
      }}
    >
      {children}
    </button>
  )
}

// ---------- 样式表（静态部分；随 props/状态变化的值留在 JSX 内联） ----------
const s: Record<string, CSSProperties> = {
  base: {
    border: 'none',
    fontWeight: 900,
    fontFamily: FONT.family,
    userSelect: 'none',
  },
}
