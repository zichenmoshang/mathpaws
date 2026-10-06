// 【暂未使用 · 2026-10-06 CR】业务页零引用（hifi 位图路线替代 CSS 绘制组件）；业务代码 CR 后评估删留，暂保留。
// ---------- 卡通描边标题 ----------
import type { CSSProperties, ReactNode } from 'react'

import { C, FONT, strokeText } from '../tokens'

export function Title({ children, fill = '#fff', stroke = C.skyDeep, px = 2, size = FONT.title, center }: {
  children: ReactNode
  fill?: string
  stroke?: string
  px?: number
  size?: number
  center?: boolean
}) {
  return (
    <div style={{
      ...s.root,
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

// ---------- 样式表（静态部分；随 props/状态变化的值留在 JSX 内联） ----------
const s: Record<string, CSSProperties> = {
  root: {
    fontWeight: 900, fontFamily: FONT.family,
  },
}
