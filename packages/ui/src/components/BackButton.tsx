// 位图标准控件（M0-UI）
// 返回钮 / 底部主按钮 / Tab：背景为 AI 生成的透明位图，文字由前端叠加。
// 按钮与 Tab 用 border-image 做 9-slice 拉伸，圆角与厚度保持不变。
import type { CSSProperties } from 'react'

import backButton from '../assets/ui-back-button.webp'
import { btn } from '../styles.css'
import * as s from './BackButton.css'

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
      className={`${btn} ${s.root}`}
      style={{
        // 位图资产不进 css.ts，背景与尺寸留在内联
        background: `url(${backButton}) center / 100% 100% no-repeat`,
        width: size, height: size,
        ...style,
      }}
    />
  )
}
