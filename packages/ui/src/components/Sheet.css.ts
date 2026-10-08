// Sheet 静态样式（vanilla-extract），本组件全部样式均为静态
import { style } from '@vanilla-extract/css'

import { FONT } from '../tokens'

export const overlay = style({
  position: 'absolute', inset: 0, background: 'rgba(0,0,0,.42)', zIndex: 30,
  display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
})

export const panel = style({
  width: '100%', maxWidth: 760, maxHeight: '82%', overflowY: 'auto',
  background: 'linear-gradient(180deg,#fff8e1,#ffecb3)',
  borderRadius: '26px 26px 0 0', padding: 20,
  boxShadow: '0 -8px 28px rgba(0,0,0,.25)', fontFamily: FONT.family,
})

export const titleRow = style({
  display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14,
})

export const title = style({ fontSize: FONT.h2, fontWeight: 900, color: '#5d4037' })

export const close = style({
  border: 'none', borderRadius: '50%', width: 34, height: 34,
  background: '#bcaaa4', color: '#fff', fontWeight: 900, cursor: 'pointer',
})
