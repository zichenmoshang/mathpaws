// ---------- Tabs / Segmented ----------
import type { ReactNode } from 'react'

import { btn } from '../styles.css'
import { VARIANT, edge } from '../tokens'
import * as s from './Tabs.css'

export function Tabs<T extends string>({
  tabs, active, onChange,
}: {
  tabs: Array<{ id: T; label: ReactNode }>
  active: T
  onChange: (id: T) => void
}) {
  return (
    <div className={s.root}>
      {tabs.map(t => {
        const on = t.id === active
        return (
          <button
            key={t.id}
            className={on ? s.tab : `${btn} ${s.tab}`}
            onClick={() => onChange(t.id)}
            style={{
              // 动态值：选中态配色与立体底边随 active 变化，保留内联
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
