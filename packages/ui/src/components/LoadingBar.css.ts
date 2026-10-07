// LoadingBar 静态样式（vanilla-extract）；高度与进度宽度留在 tsx 内联
import { style } from '@vanilla-extract/css'

import { C, R } from '../tokens'

export const track = style({
  width: '100%',
  background: 'rgba(255,255,255,.5)',
  borderRadius: R.pill,
  overflow: 'hidden',
})

export const fill = style({
  height: '100%',
  background: `linear-gradient(90deg,${C.sky},${C.skyDeep})`,
  transition: 'width .3s',
})
