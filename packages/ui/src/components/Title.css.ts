// Title 静态样式（vanilla-extract）；字号、描边、对齐随 props 留在 tsx 内联
import { style } from '@vanilla-extract/css'

import { FONT } from '../tokens'

export const root = style({
  fontWeight: 900, fontFamily: FONT.family,
})
