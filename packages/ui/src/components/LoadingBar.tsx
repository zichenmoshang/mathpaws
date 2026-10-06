// 【暂未使用 · 2026-10-06 CR】业务页零引用（hifi 位图路线替代 CSS 绘制组件）；业务代码 CR 后评估删留，暂保留。
// ---------- LoadingBar ----------
import type { CSSProperties } from 'react'

import { C, R } from '../tokens'

export function LoadingBar({
  progress, height = 12,
}: {
  progress: number
  height?: number
}) {
  return (
    <div
      style={{
        ...s.track,
        height,
      }}
    >
      <div
        style={{
          ...s.fill,
          width: `${Math.round(Math.min(1, Math.max(0, progress)) * 100)}%`,
        }}
      />
    </div>
  )
}

// ---------- 样式表（静态部分；随 props/状态变化的值留在 JSX 内联） ----------
const s: Record<string, CSSProperties> = {
  track: {
    width: '100%', background: 'rgba(255,255,255,.5)',
    borderRadius: R.pill, overflow: 'hidden',
  },
  fill: {
    height: '100%', background: `linear-gradient(90deg,${C.sky},${C.skyDeep})`,
    transition: 'width .3s',
  },
}
