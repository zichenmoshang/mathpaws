// Switch 静态样式（vanilla-extract）；轨道底色与滑块位置随 checked 留在 tsx 内联
import { style } from '@vanilla-extract/css'

import { C, FONT, R } from '../tokens'

export const root = style({
  display: 'inline-flex', alignItems: 'center', gap: 10,
  border: 'none', background: 'transparent', cursor: 'pointer',
  fontFamily: FONT.family, fontWeight: 800, color: C.ink,
})

export const track = style({
  width: 56, height: 30, borderRadius: R.pill, position: 'relative',
  transition: 'background .2s',
  boxShadow: 'inset 0 2px 4px rgba(0,0,0,.18)',
})

export const knob = style({
  position: 'absolute', top: 3,
  width: 24, height: 24, borderRadius: '50%', background: '#fff',
  transition: 'left .2s', boxShadow: '0 2px 4px rgba(0,0,0,.25)',
})
