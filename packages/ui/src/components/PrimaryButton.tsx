// 位图标准控件（M0-UI）
// 返回钮 / 底部主按钮 / Tab：背景为 AI 生成的透明位图，文字由前端叠加。
// 按钮与 Tab 用 border-image 做 9-slice 拉伸，圆角与厚度保持不变。
import type { ButtonHTMLAttributes } from 'react'

import primaryButton from '../assets/ui-primary-button.webp'
import { btn } from '../styles.css'
import * as s from './PrimaryButton.css'

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
      className={`${btn} ${s.root}`}
      {...rest}
      style={{
        // 动态值：高度、9-slice 切图参数、字号、禁用态随 props 变化，保留内联
        height,
        borderWidth: `${cap}px ${end}px`,
        borderImage: `url(${primaryButton}) 150 330 fill / ${cap}px ${end}px / 0 stretch`,
        fontSize: height * 0.4,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.55 : 1,
        ...style,
      }}
    >
      <span className={s.centerLayer}>{children}</span>
    </button>
  )
}
