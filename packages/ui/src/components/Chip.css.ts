// Chip 静态样式（vanilla-extract）；tone 对应的背景/文字色留在 tsx 内联
import { style } from '@vanilla-extract/css'

import { FONT, R } from '../tokens'

export const root = style({
  height: 38,
  display: 'flex',
  alignItems: 'center',
  gap: 6,
  padding: '0 14px',
  borderRadius: R.pill,
  fontWeight: 900,
  fontSize: FONT.body,
  fontFamily: FONT.family,
  boxShadow: '0 2px 0 rgba(0,0,0,.12)',
  whiteSpace: 'nowrap',
})

export const icon = style({
  fontSize: FONT.h2,
  lineHeight: 1,
})

export const suffix = style({
  fontSize: FONT.aux,
  opacity: 0.8,
})
