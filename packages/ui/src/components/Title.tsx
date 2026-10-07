// 【暂未使用 · 2026-10-06 CR】业务页零引用（hifi 位图路线替代 CSS 绘制组件）；业务代码 CR 后评估删留，暂保留。
// ---------- 卡通描边标题 ----------
import type { ReactNode } from 'react'

import { C, FONT, strokeText } from '../tokens'
import * as s from './Title.css'

export function Title({ children, fill = '#fff', stroke = C.skyDeep, px = 2, size = FONT.title, center }: {
  children: ReactNode
  fill?: string
  stroke?: string
  px?: number
  size?: number
  center?: boolean
}) {
  return (
    <div className={s.root} style={{
      // 动态值：字号、描边（fill/stroke/px）、对齐随 props 变化，保留内联
      fontSize: size,
      ...Object.fromEntries(
        strokeText(fill, stroke, px).split(';').filter(Boolean).map((kv) => {
          const i = kv.indexOf(':')
          return [kv.slice(0, i).trim(), kv.slice(i + 1).trim()]
        }),
      ),
      textAlign: center ? 'center' : 'left',
    }}>{children}</div>
  )
}
