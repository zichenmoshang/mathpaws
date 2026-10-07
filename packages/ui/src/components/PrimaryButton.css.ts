// PrimaryButton 静态样式（vanilla-extract）
// 高度、9-slice border-image（引用位图资产）、字号、禁用态留在 tsx 内联
import { style } from '@vanilla-extract/css'

import { FONT } from '../tokens'

export const root = style({
  position: 'relative',
  padding: 0,
  border: 'solid transparent',
  background: 'transparent',
  color: '#8a5410',
  fontFamily: FONT.family, fontWeight: 900,
  whiteSpace: 'nowrap', boxSizing: 'border-box',
})

// 文字层：绝对定位铺满整个控件（含 border 区）做水平+垂直居中，
// 不受 border-image 的 border-width 挤压。
export const centerLayer = style({
  position: 'absolute', inset: 0,
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  lineHeight: 1, pointerEvents: 'none',
})
