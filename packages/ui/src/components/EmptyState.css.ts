// EmptyState 静态样式（vanilla-extract）
import { style } from '@vanilla-extract/css'

import { C, FONT } from '../tokens'

export const root = style({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: 10,
  padding: '40px 20px',
  fontFamily: FONT.family,
})

export const icon = style({
  fontSize: 84,
})

export const title = style({
  fontSize: 22,
  fontWeight: 900,
  color: C.ink,
})

export const hint = style({
  fontSize: 16,
  color: C.inkSoft,
})
