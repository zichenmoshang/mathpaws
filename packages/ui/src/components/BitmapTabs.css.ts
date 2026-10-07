// BitmapTabs 静态样式（vanilla-extract）；尺寸、border-image（webp 资产）与选中态颜色留在 tsx 内联
import { style } from '@vanilla-extract/css'

import { FONT } from '../tokens'

export const root = style({
  display: 'inline-flex',
  gap: 8,
  flexWrap: 'wrap',
})

export const tab = style({
  position: 'relative',
  padding: 0,
  border: 'solid transparent',
  background: 'transparent',
  fontFamily: FONT.family,
  fontWeight: 900,
  cursor: 'pointer',
  whiteSpace: 'nowrap',
  boxSizing: 'border-box',
})

// 文字层：绝对定位铺满整个控件（含 border 区）做水平+垂直居中，
// 不受 border-image 的 border-width 挤压。
export const centerLayer = style({
  position: 'absolute',
  inset: 0,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  lineHeight: 1,
  pointerEvents: 'none',
})
