// Tabs 静态样式（vanilla-extract）；选中态配色与阴影留在 tsx 内联
import { style } from '@vanilla-extract/css'

import { FONT, R } from '../tokens'

export const root = style({ display: 'inline-flex', gap: 6, flexWrap: 'wrap' })

export const tab = style({
  height: 40, padding: '0 20px', borderRadius: R.pill,
  border: 'none', cursor: 'pointer', fontFamily: FONT.family,
  fontWeight: 900, fontSize: 17,
})
