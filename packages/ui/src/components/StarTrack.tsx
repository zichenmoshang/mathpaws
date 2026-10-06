// 【暂未使用 · 2026-10-06 CR】业务页零引用（hifi 位图路线替代 CSS 绘制组件）；业务代码 CR 后评估删留，暂保留。
// ---------- StarTrack（进化/连学轨道） ----------
import type { CSSProperties, ReactNode } from 'react'

import { C, FONT } from '../tokens'

export function StarTrack({
  steps, current,
}: {
  steps: Array<{ label: ReactNode; reached: boolean }>
  current: number
}) {
  return (
    <div style={st.root}>
      {steps.map((s, i) => (
        <div key={i} style={st.row}>
          <div
            style={{
              ...st.node,
              background: s.reached ? C.sun : '#e0e0e0',
              color: s.reached ? '#8a6d1d' : '#9e9e9e',
              outline: i === current ? `3px solid ${C.orange}66` : 'none',
            }}
          >
            {s.label}
          </div>
          {i < steps.length - 1 && (
            <span style={st.link} />
          )}
        </div>
      ))}
    </div>
  )
}

// ---------- 样式表（静态部分；随 props/状态变化的值留在 JSX 内联） ----------
const st: Record<string, CSSProperties> = {
  root: { display: 'flex', alignItems: 'center', gap: 6 },
  row: { display: 'flex', alignItems: 'center', gap: 6 },
  node: {
    width: 40, height: 40, borderRadius: '50%',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontWeight: 900, fontFamily: FONT.family,
  },
  link: { width: 22, height: 4, background: '#cfd8dc', borderRadius: 2 },
}
