// CloudInput 静态样式（vanilla-extract）；对外 style 逃生舱留在 tsx 内联
import { style } from '@vanilla-extract/css'

import { C, FONT, R } from '../tokens'

export const input = style({
  height: 58,
  padding: '0 28px',
  borderRadius: R.pill,
  border: `4px solid ${C.sky}`,
  background: '#fff',
  color: C.ink,
  fontSize: 22,
  fontWeight: 800,
  fontFamily: FONT.family,
  outline: 'none',
  boxShadow: '0 6px 0 rgba(21,101,192,.18)',
})
