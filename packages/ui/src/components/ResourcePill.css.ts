// ResourcePill 静态样式（vanilla-extract）；tone 决定的底色/字色/描边留在 tsx 内联
import { style } from '@vanilla-extract/css'

import { FONT, R } from '../tokens'

export const root = style({
  display: 'inline-flex', alignItems: 'center', gap: 6,
  height: 38, padding: '0 14px', borderRadius: R.pill,
  fontFamily: FONT.family, fontWeight: 900, fontSize: 18, whiteSpace: 'nowrap',
})

export const icon = style({ fontSize: 20 })
