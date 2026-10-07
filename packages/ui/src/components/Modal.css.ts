// Modal 静态样式（vanilla-extract）；随 props 变化的宽度留在 tsx 内联
import { style } from '@vanilla-extract/css'

import { C, FONT, SHADOW } from '../tokens'

export const overlay = style({
  position: 'absolute', inset: 0, background: 'rgba(0,0,0,.4)', zIndex: 40,
  display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
})

export const panel = style({
  maxHeight: '86vh', overflowY: 'auto',
  background: C.white, borderRadius: 26, padding: 24,
  boxShadow: SHADOW.panel, fontFamily: FONT.family,
})
