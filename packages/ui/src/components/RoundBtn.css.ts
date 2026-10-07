// RoundBtn 静态样式（vanilla-extract）；尺寸、配色、立体底边、禁用态留在 tsx 内联
import { style } from '@vanilla-extract/css'

import { FONT } from '../tokens'

export const root = style({
  borderRadius: '50%', border: 'none',
  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
  fontFamily: FONT.family, userSelect: 'none', lineHeight: 1.1,
})

export const label = style({ fontSize: 13, fontWeight: 900 })
