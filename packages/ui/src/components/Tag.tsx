// ---------- Tag / LockTag ----------
import type { CSSProperties, ReactNode } from 'react'

import { C, FONT, R } from '../tokens'

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
      style={{
        ...s.tag,
        background: map.bg, color: map.fg,
      }}
    >
      {children}
    </span>
  )
}

// 【暂未使用】LockTag 业务页零引用，待评估。
export function LockTag({ label = '即将开放' }: { label?: string }) {
  return (
    <span
      style={s.lockTag}
    >
      🔒 {label}
    </span>
  )
}

// ---------- 样式表（静态部分；随 props/状态变化的值留在 JSX 内联） ----------
const s: Record<string, CSSProperties> = {
  tag: {
    display: 'inline-flex', alignItems: 'center',
    padding: '3px 12px', borderRadius: R.pill,
    fontFamily: FONT.family, fontWeight: 800, fontSize: 14, whiteSpace: 'nowrap',
  },
  lockTag: {
    display: 'inline-flex', alignItems: 'center', gap: 4,
    padding: '3px 12px', borderRadius: R.pill,
    background: '#eceff1', color: '#546e7a',
    fontFamily: FONT.family, fontWeight: 800, fontSize: 14,
  },
}
