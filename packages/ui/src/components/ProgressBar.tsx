// ---------- 进度条 ----------
import type { CSSProperties } from 'react'

import { C, R } from '../tokens'

export function ProgressBar({ ratio, base = C.grass, deep = C.grassDeep, height = 14 }: {
  ratio: number
  base?: string
  deep?: string
  height?: number
}) {
  return (
    <div style={{ ...s.track, height }}>
      <div style={{
        ...s.fill,
        width: `${Math.round(Math.min(1, Math.max(0, ratio)) * 100)}%`,
        background: `linear-gradient(180deg,rgba(255,255,255,.4),rgba(255,255,255,0)), ${base}`,
        boxShadow: `0 0 8px ${deep}`,
      }} />
    </div>
  )
}

// ---------- 样式表（静态部分；随 props/状态变化的值留在 JSX 内联） ----------
const s: Record<string, CSSProperties> = {
  track: { flex: 1, background: 'rgba(255,255,255,.6)', borderRadius: R.pill, overflow: 'hidden' },
  fill: {
    height: '100%',
    transition: 'width .4s',
  },
}
