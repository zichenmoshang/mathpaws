// 【暂未使用 · 2026-10-06 CR】业务页零引用（hifi 位图路线替代 CSS 绘制组件）；业务代码 CR 后评估删留，暂保留。
// ---------- StarTrack（进化/连学轨道） ----------
import type { ReactNode } from 'react'

import { C } from '../tokens'
import * as st from './StarTrack.css'

export function StarTrack({
  steps, current,
}: {
  steps: Array<{ label: ReactNode; reached: boolean }>
  current: number
}) {
  return (
    <div className={st.root}>
      {steps.map((s, i) => (
        <div key={i} className={st.row}>
          <div
            className={st.node}
            style={{
              // 动态值：达成态配色与当前节点描边随 steps/current 变化，保留内联
              background: s.reached ? C.sun : '#e0e0e0',
              color: s.reached ? '#8a6d1d' : '#9e9e9e',
              outline: i === current ? `3px solid ${C.orange}66` : 'none',
            }}
          >
            {s.label}
          </div>
          {i < steps.length - 1 && (
            <span className={st.link} />
          )}
        </div>
      ))}
    </div>
  )
}
