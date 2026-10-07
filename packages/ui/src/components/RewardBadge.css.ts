// RewardBadge / RewardRow 静态样式（vanilla-extract）；tone 决定的底色/字色留在 tsx 内联
import { style } from '@vanilla-extract/css'

import { FONT, R } from '../tokens'

export const badge = style({
  display: 'inline-flex', alignItems: 'center', gap: 8,
  padding: '8px 18px', borderRadius: R.pill,
  fontFamily: FONT.family, fontWeight: 900, fontSize: 20,
})

export const icon = style({ fontSize: 24 })

export const row = style({
  display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap',
})
