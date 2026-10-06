// 【暂未使用 · 2026-10-06 CR】业务页零引用（hifi 位图路线替代 CSS 绘制组件）；业务代码 CR 后评估删留，暂保留。
// ---------- Carousel（手动，不自动） ----------
import type { CSSProperties, ReactNode } from 'react'

import { C, R } from '../tokens'

export function Carousel({
  children, index, onIndex, count,
}: {
  children: ReactNode
  index: number
  onIndex: (i: number) => void
  count: number
}) {
  return (
    <div style={s.root}>
      <div
        style={s.viewport}
      >
        <div
          style={{
            ...s.track,
            width: `${count * 100}%`,
            transform: `translateX(-${(index * 100) / count}%)`,
          }}
        >
          {/* children 中每项应自带 width: ${100/count}% */}
          {children}
        </div>
      </div>
      <div style={s.dots}>
        {Array.from({ length: count }).map((_, i) => (
          <button
            key={i}
            aria-label={`第 ${i + 1} 张`}
            onClick={() => onIndex(i)}
            style={{
              ...s.dot,
              width: i === index ? 18 : 10,
              background: i === index ? C.sky : '#cfd8dc',
            }}
          />
        ))}
      </div>
    </div>
  )
}

// ---------- 样式表（静态部分；随 props/状态变化的值留在 JSX 内联） ----------
const s: Record<string, CSSProperties> = {
  root: { position: 'relative', width: '100%' },
  viewport: { overflow: 'hidden', borderRadius: R.lg },
  track: {
    display: 'flex',
    transition: 'transform .3s',
  },
  dots: { display: 'flex', gap: 8, justifyContent: 'center', marginTop: 10 },
  dot: {
    height: 10, borderRadius: R.pill,
    border: 'none',
    cursor: 'pointer', padding: 0,
  },
}
