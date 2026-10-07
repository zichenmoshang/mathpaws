// BackBtn 静态样式（vanilla-extract）；tone 相关的背景/文字色/阴影留在 tsx 内联
import { style } from '@vanilla-extract/css'

import { FONT, R } from '../tokens'

export const root = style({
  width: 42,
  height: 42,
  borderRadius: R.sm,
  border: 'none',
  cursor: 'pointer',
  fontSize: 22,
  fontWeight: 900,
  fontFamily: FONT.family,
})
