// 【暂未使用 · 2026-10-06 CR】业务页零引用（hifi 位图路线替代 CSS 绘制组件）；业务代码 CR 后评估删留，暂保留。
// ---------- ResourcePill（顶部货币） ----------
import type { ReactNode } from 'react'

import { C } from '../tokens'
import * as s from './ResourcePill.css'

export function ResourcePill({
  icon, value, tone = 'shell',
}: {
  icon: ReactNode
  value: ReactNode
  tone?: 'shell' | 'flower'
}) {
  const map = {
    shell: { bg: '#ffffff', fg: C.ink, border: '#e0e0e0' },
    flower: { bg: '#fff8e1', fg: '#ad6800', border: '#ffe082' },
  }[tone]
  return (
    <div
      className={s.root}
      style={{
        // 动态值：底色/字色/描边随 tone 变化，保留内联
        background: map.bg, color: map.fg, border: `2px solid ${map.border}`,
      }}
    >
      <span className={s.icon}>{icon}</span>
      {value}
    </div>
  )
}
