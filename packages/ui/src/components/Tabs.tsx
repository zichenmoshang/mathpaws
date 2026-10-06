// ---------- Tabs / Segmented ----------
import type { CSSProperties, ReactNode } from 'react'

import { FONT, R, VARIANT, edge } from '../tokens'

export function Tabs<T extends string>({
  tabs, active, onChange,
}: {
  tabs: Array<{ id: T; label: ReactNode }>
  active: T
  onChange: (id: T) => void
}) {
  return (
    <div style={s.root}>
      {tabs.map(t => {
        const on = t.id === active
        return (
          <button
            key={t.id}
            className={on ? '' : 'mp-btn'}
            onClick={() => onChange(t.id)}
            style={{
              ...s.tab,
              background: on
                ? `linear-gradient(180deg,rgba(255,255,255,.4),rgba(255,255,255,0) 45%), ${VARIANT.sky.bg}`
                : '#eceff1',
              color: on ? '#fff' : '#546e7a',
              boxShadow: on ? edge(VARIANT.sky.deep, 4) : 'none',
            }}
          >
            {t.label}
          </button>
        )
      })}
    </div>
  )
}

// ---------- 样式表（静态部分；随 props/状态变化的值留在 JSX 内联） ----------
const s: Record<string, CSSProperties> = {
  root: { display: 'inline-flex', gap: 6, flexWrap: 'wrap' },
  tab: {
    height: 40, padding: '0 20px', borderRadius: R.pill,
    border: 'none', cursor: 'pointer', fontFamily: FONT.family,
    fontWeight: 900, fontSize: 17,
  },
}
