// ---------- Tag ----------
import type { ReactNode } from 'react'

import { C } from '../tokens'
import * as s from './Tag.css'

export function Tag({
  children, tone = 'blue',
}: {
  children: ReactNode
  tone?: 'blue' | 'orange' | 'green' | 'purple' | 'gray'
}) {
  const map = {
    blue: { bg: '#e3f2fd', fg: C.skyDeep },
    orange: { bg: '#fff3e0', fg: C.orangeDeep },
    green: { bg: '#e8f5e9', fg: C.grassDeep },
    purple: { bg: '#f3e5f5', fg: '#7b1fa2' },
    gray: { bg: '#eceff1', fg: '#546e7a' },
  }[tone]
  return (
    <span
      className={s.tag}
      style={{
        // 动态值：底色/字色随 tone 变化，保留内联
        background: map.bg, color: map.fg,
      }}
    >
      {children}
    </span>
  )
}
