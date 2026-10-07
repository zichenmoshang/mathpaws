// Tag / LockTag 静态样式（vanilla-extract）；Tag 的 tone 配色留在 tsx 内联
import { style } from '@vanilla-extract/css'

import { FONT, R } from '../tokens'

export const tag = style({
  display: 'inline-flex', alignItems: 'center',
  padding: '3px 12px', borderRadius: R.pill,
  fontFamily: FONT.family, fontWeight: 800, fontSize: 14, whiteSpace: 'nowrap',
})

export const lockTag = style({
  display: 'inline-flex', alignItems: 'center', gap: 4,
  padding: '3px 12px', borderRadius: R.pill,
  background: '#eceff1', color: '#546e7a',
  fontFamily: FONT.family, fontWeight: 800, fontSize: 14,
})
