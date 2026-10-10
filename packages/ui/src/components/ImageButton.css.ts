// ImageButton 静态样式（vanilla-extract）；cursor 随 disabled 变化留在 tsx 内联
import { style } from '@vanilla-extract/css'

export const root = style({
  position: 'relative',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 0,
  border: 'none',
  background: 'none',
  selectors: {
    // 位图按钮的禁用态：灰化 + 降透明（比纯 opacity 对彩色位图更有效）
    '&:disabled': {
      filter: 'grayscale(0.6)',
      opacity: 0.55,
    },
  },
})

export const img = style({
  display: 'block',
  width: '100%',
  height: '100%',
  objectFit: 'contain',
  pointerEvents: 'none', // 点击/拖动穿透到 button
  userSelect: 'none',
})

export const label = style({
  position: 'absolute',
  inset: 0,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  pointerEvents: 'none',
  userSelect: 'none',
})
