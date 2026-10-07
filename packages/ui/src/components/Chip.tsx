// 【暂未使用 · 2026-10-06 CR】业务页零引用（hifi 位图路线替代 CSS 绘制组件）；业务代码 CR 后评估删留，暂保留。
// ---------- 资源胶囊（顶栏） ----------
import type { ReactNode } from 'react'

import { C } from '../tokens'
import * as s from './Chip.css'

type ChipTone = 'shell' | 'flower' | 'food'
const CHIP_TONE: Record<ChipTone, { bg: string; fg: string }> = {
  shell: { bg: 'linear-gradient(180deg,#ffffff,#eef3f8)', fg: C.ink },
  flower: { bg: 'linear-gradient(180deg,#fff8e1,#ffecb3)', fg: '#ad6800' },
  food: { bg: 'linear-gradient(180deg,#efebe9,#d7ccc8)', fg: '#5d4037' },
}
export function Chip({ icon, value, tone = 'shell', suffix }: {
  icon: ReactNode
  value: ReactNode
  tone?: ChipTone
  suffix?: string
}) {
  const t = CHIP_TONE[tone]
  return (
    <div className={s.root} style={{ background: t.bg, color: t.fg }}>
      <span className={s.icon}>{icon}</span>
      <span>{value}</span>
      {suffix && <span className={s.suffix}>{suffix}</span>}
    </div>
  )
}
