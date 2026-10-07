// 位图标准控件（M0-UI）
// 返回钮 / 底部主按钮 / Tab：背景为 AI 生成的透明位图，文字由前端叠加。
// 按钮与 Tab 用 border-image 做 9-slice 拉伸，圆角与厚度保持不变。
import type { ReactNode } from 'react'

import tabActive from '../assets/ui-tab-active.webp'
import tabInactive from '../assets/ui-tab-inactive.webp'
import { btn } from '../styles.css'
import * as s from './BitmapTabs.css'

// ---------- 位图 Tab（选中 / 未选中） ----------
export function BitmapTabs<T extends string>({
  tabs, active, onChange, height = 48,
}: {
  tabs: Array<{ id: T; label: ReactNode }>
  active: T
  onChange: (id: T) => void
  height?: number
}) {
  // 源图圆角半径≈110px；上下保留区取 120（高光/厚度），中间纵向拉伸。
  const side = Math.round((110 / 701) * height)
  const vert = Math.round((120 / 701) * height)
  return (
    <div className={s.root}>
      {tabs.map(t => {
        const on = t.id === active
        return (
          <button
            key={t.id}
            type="button"
            onClick={() => onChange(t.id)}
            className={`${btn} ${s.tab}`}
            style={{
              height,
              minWidth: height * 1.8,
              borderWidth: `${vert}px ${side}px`,
              borderImage: `url(${on ? tabActive : tabInactive}) 120 110 fill / ${vert}px ${side}px / 0 stretch`,
              color: on ? '#7a4a12' : '#7a8794',
              fontSize: height * 0.36,
            }}
          >
            <span className={s.centerLayer}>{t.label}</span>
          </button>
        )
      })}
    </div>
  )
}
