// StarTrack 静态样式（vanilla-extract）；节点达成态配色与当前节点描边留在 tsx 内联
import { style } from '@vanilla-extract/css'

import { FONT } from '../tokens'

export const root = style({ display: 'flex', alignItems: 'center', gap: 6 })

export const row = style({ display: 'flex', alignItems: 'center', gap: 6 })

export const node = style({
  width: 40, height: 40, borderRadius: '50%',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  fontWeight: 900, fontFamily: FONT.family,
})

export const link = style({ width: 22, height: 4, background: '#cfd8dc', borderRadius: 2 })
