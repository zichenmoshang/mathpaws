// 【暂未使用 · 2026-10-06 CR】业务页零引用（hifi 位图路线替代 CSS 绘制组件）；业务代码 CR 后评估删留，暂保留。
// ---------- OptionButton（真题 ABC / 三选一） ----------
import type { ButtonHTMLAttributes, CSSProperties } from 'react'

import { C, FONT, R, VARIANT, edge } from '../tokens'

interface OptionButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  active?: boolean
  state?: 'idle' | 'correct' | 'wrong'
}
export function OptionButton({
  active, state = 'idle', children, style, ...rest
}: OptionButtonProps) {
  const bg =
    state === 'correct' ? C.grass
    : state === 'wrong' ? C.red
    : active ? VARIANT.sky.bg
    : '#f4f8fc'
  const fg = state === 'idle' && !active ? C.ink : '#fff'
  return (
    <button
      className="mp-btn"
      {...rest}
      style={{
        ...s.root,
        border: `3px solid ${active || state !== 'idle' ? bg : C.sky}`,
        background: bg, color: fg,
        boxShadow: active || state !== 'idle' ? edge(C.skyDeep, 4) : 'none',
        ...style,
      }}
    >
      {children}
    </button>
  )
}

// ---------- 样式表（静态部分；随 props/状态变化的值留在 JSX 内联） ----------
const s: Record<string, CSSProperties> = {
  root: {
    minWidth: 120, minHeight: 72, padding: '10px 22px',
    borderRadius: R.md, fontSize: 28, fontWeight: 900,
    fontFamily: FONT.family, cursor: 'pointer', lineHeight: 1.2,
  },
}
