// 【暂未使用 · 2026-10-06 CR】业务页零引用（hifi 位图路线替代 CSS 绘制组件）；业务代码 CR 后评估删留，暂保留。
// ---------- RewardBadge / RewardRow ----------
import type { ReactNode } from 'react'

import { C } from '../tokens'
import * as s from './RewardBadge.css'

export function RewardBadge({
  icon, value, tone = 'shell',
}: {
  icon: ReactNode
  value: ReactNode
  tone?: 'shell' | 'flower' | 'food'
}) {
  const colors = {
    shell: { bg: '#fff3cd', fg: '#8a6d1d' },
    flower: { bg: '#fde4ec', fg: C.pinkDeep },
    food: { bg: '#efebe9', fg: '#5d4037' },
  }[tone]
  return (
    <div
      className={s.badge}
      style={{
        // 动态值：底色/字色随 tone 变化，保留内联
        background: colors.bg, color: colors.fg,
      }}
    >
      <span className={s.icon}>{icon}</span>
      {value}
    </div>
  )
}

export function RewardRow({ children }: { children: ReactNode }) {
  return (
    <div className={s.row}>
      {children}
    </div>
  )
}
