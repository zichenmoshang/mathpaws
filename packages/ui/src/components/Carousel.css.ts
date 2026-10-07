// Carousel 静态样式（vanilla-extract）；轨道位移/宽度与圆点选中态留在 tsx 内联
import { style } from '@vanilla-extract/css'

import { R } from '../tokens'

export const root = style({
  position: 'relative',
  width: '100%',
})

export const viewport = style({
  overflow: 'hidden',
  borderRadius: R.lg,
})

export const track = style({
  display: 'flex',
  transition: 'transform .3s',
})

export const dots = style({
  display: 'flex',
  gap: 8,
  justifyContent: 'center',
  marginTop: 10,
})

export const dot = style({
  height: 10,
  borderRadius: R.pill,
  border: 'none',
  cursor: 'pointer',
  padding: 0,
})
