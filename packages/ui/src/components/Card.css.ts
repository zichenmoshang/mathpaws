// Card 静态样式（vanilla-extract）；padding 与对外 style 逃生舱留在 tsx 内联
import { style } from '@vanilla-extract/css'

import { C, FONT, R, SHADOW } from '../tokens'

export const root = style({
  background: C.white,
  borderRadius: R.lg,
  boxShadow: SHADOW.card,
  fontFamily: FONT.family,
})
