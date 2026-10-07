// 【暂未使用 · 2026-10-06 CR】业务页零引用（hifi 位图路线替代 CSS 绘制组件）；业务代码 CR 后评估删留，暂保留。
// ---------- OptionButton（真题 ABC / 三选一） ----------
import type { ButtonHTMLAttributes } from 'react'

import { btn } from '../styles.css'
import { C, VARIANT, edge } from '../tokens'
import * as s from './OptionButton.css'

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
      className={`${btn} ${s.root}`}
      {...rest}
      style={{
        // 动态值：边框/底色/字色/立体底边随 active 与对错态变化，保留内联
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
