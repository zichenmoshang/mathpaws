// 位图标准控件（M0-UI）
// 返回钮 / 底部主按钮 / Tab：背景为 AI 生成的透明位图，文字由前端叠加。
// 按钮与 Tab 用 border-image 做 9-slice 拉伸，圆角与厚度保持不变。
import type { ButtonHTMLAttributes, CSSProperties, ReactNode } from 'react'

import backButton from './assets/ui-back-button.webp'
import primaryButton from './assets/ui-primary-button.webp'
import tabActive from './assets/ui-tab-active.webp'
import tabInactive from './assets/ui-tab-inactive.webp'
import { FONT } from './tokens'

// ---------- 标准返回按钮 ----------
export function BackButton({
  onClick, size = 56, label, style,
}: {
  onClick?: () => void
  size?: number
  label?: string
  style?: CSSProperties
}) {
  return (
    <button
      type="button"
      aria-label={label ?? '返回'}
      onClick={onClick}
      className="mp-btn"
      style={{
        width: size, height: size, padding: 0, border: 'none',
        background: `url(${backButton}) center / 100% 100% no-repeat`,
        cursor: 'pointer', ...style,
      }}
    />
  )
}

// ---------- 标准底部主按钮 ----------
interface PrimaryButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  height?: number
}
export function PrimaryButton({
  height = 64, disabled, children, style, ...rest
}: PrimaryButtonProps) {
  const radius = height / 2
  // 源图 1885×667：真 9-slice。左右端半圆≈330；上下保留区取 150（顶部高光、
  // 底部暖橙厚度），中间水平金色带纵向拉伸，高度变化时高光/厚度不夸张变形。
  const end = radius
  const cap = Math.round((150 / 667) * height)
  return (
    <button
      type="button"
      disabled={disabled}
      className="mp-btn"
      {...rest}
      style={{
        position: 'relative',
        height, padding: 0,
        border: 'solid transparent',
        borderWidth: `${cap}px ${end}px`,
        borderImage: `url(${primaryButton}) 150 330 fill / ${cap}px ${end}px / 0 stretch`,
        background: 'transparent',
        color: '#8a5410',
        fontFamily: FONT.family, fontWeight: 900, fontSize: height * 0.4,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.55 : 1,
        whiteSpace: 'nowrap', boxSizing: 'border-box',
        ...style,
      }}
    >
      <span style={centerLayer}>{children}</span>
    </button>
  )
}

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
    <div style={{ display: 'inline-flex', gap: 8, flexWrap: 'wrap' }}>
      {tabs.map(t => {
        const on = t.id === active
        return (
          <button
            key={t.id}
            type="button"
            onClick={() => onChange(t.id)}
            className="mp-btn"
            style={{
              position: 'relative',
              height, padding: 0,
              minWidth: height * 1.8,
              border: 'solid transparent',
              borderWidth: `${vert}px ${side}px`,
              borderImage: `url(${on ? tabActive : tabInactive}) 120 110 fill / ${vert}px ${side}px / 0 stretch`,
              background: 'transparent',
              color: on ? '#7a4a12' : '#7a8794',
              fontFamily: FONT.family, fontWeight: 900, fontSize: height * 0.36,
              cursor: 'pointer', whiteSpace: 'nowrap', boxSizing: 'border-box',
            }}
          >
            <span style={centerLayer}>{t.label}</span>
          </button>
        )
      })}
    </div>
  )
}

// 文字层：绝对定位铺满整个控件（含 border 区）做水平+垂直居中，
// 不受 border-image 的 border-width 挤压。
const centerLayer: CSSProperties = {
  position: 'absolute', inset: 0,
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  lineHeight: 1, pointerEvents: 'none',
}
