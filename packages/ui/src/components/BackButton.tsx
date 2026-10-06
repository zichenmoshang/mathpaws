// 位图标准控件（M0-UI）
// 返回钮 / 底部主按钮 / Tab：背景为 AI 生成的透明位图，文字由前端叠加。
// 按钮与 Tab 用 border-image 做 9-slice 拉伸，圆角与厚度保持不变。
import type { CSSProperties } from 'react'

import backButton from '../assets/ui-back-button.webp'

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
        ...s.root,
        width: size, height: size,
        ...style,
      }}
    />
  )
}

// ---------- 样式表（静态部分；随 props/状态变化的值留在 JSX 内联） ----------
const s: Record<string, CSSProperties> = {
  root: {
    padding: 0, border: 'none',
    background: `url(${backButton}) center / 100% 100% no-repeat`,
    cursor: 'pointer',
  },
}
