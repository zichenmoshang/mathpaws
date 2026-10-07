// ProgressBar 静态样式（vanilla-extract）；进度宽度、配色、高度留在 tsx 内联
import { style } from '@vanilla-extract/css'

import { R } from '../tokens'

export const track = style({
  flex: 1, background: 'rgba(255,255,255,.6)', borderRadius: R.pill, overflow: 'hidden',
})

export const fill = style({
  height: '100%',
  transition: 'width .4s',
})
