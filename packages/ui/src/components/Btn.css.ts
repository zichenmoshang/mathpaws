// Btn 静态样式（vanilla-extract）；variant/size/disabled 相关的动态值留在 tsx 内联
import { style } from '@vanilla-extract/css'

import { FONT } from '../tokens'

export const base = style({
  border: 'none',
  fontWeight: 900,
  fontFamily: FONT.family,
  userSelect: 'none',
})
