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
  // eslint-disable-next-line no-restricted-syntax -- 装饰性 emoji 尺寸，非排版字号
  fontSize: 84,
})

export const title = style({
  fontSize: FONT.h2,
  fontWeight: 900,
  color: C.ink,
})

export const hint = style({
  fontSize: FONT.small,
  color: C.inkSoft,
})
