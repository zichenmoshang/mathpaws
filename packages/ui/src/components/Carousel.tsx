// 【暂未使用 · 2026-10-06 CR】业务页零引用（hifi 位图路线替代 CSS 绘制组件）；业务代码 CR 后评估删留，暂保留。
// ---------- Carousel（手动，不自动） ----------
import type { ReactNode } from 'react'

import { C } from '../tokens'
import * as s from './Carousel.css'

export function Carousel({
  children, index, onIndex, count,
}: {
  children: ReactNode
  index: number
  onIndex: (i: number) => void
  count: number
}) {
  return (
    <div className={s.root}>
      <div className={s.viewport}>
        <div
          className={s.track}
          style={{
            width: `${count * 100}%`,
            transform: `translateX(-${(index * 100) / count}%)`,
          }}
        >
          {/* children 中每项应自带 width: ${100/count}% */}
          {children}
        </div>
      </div>
      <div className={s.dots}>
        {Array.from({ length: count }).map((_, i) => (
          <button
            key={i}
            aria-label={`第 ${i + 1} 张`}
            onClick={() => onIndex(i)}
            className={s.dot}
            style={{
              width: i === index ? 18 : 10,
              background: i === index ? C.sky : '#cfd8dc',
            }}
          />
        ))}
      </div>
    </div>
  )
}
