// ConfirmDialog 静态样式（vanilla-extract）；danger 对应的确认钮配色留在 tsx 内联
import { style } from '@vanilla-extract/css'

import { C, FONT, R } from '../tokens'

export const overlay = style({
  position: 'absolute',
  inset: 0,
  background: 'rgba(0,0,0,.42)',
  zIndex: 50,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
})

export const panel = style({
  width: 'min(90vw,440px)',
  background: '#fff',
  borderRadius: R.lg,
  padding: 26,
  boxShadow: '0 12px 36px rgba(0,0,0,.25)',
  fontFamily: FONT.family,
  textAlign: 'center',
})

export const title = style({
  fontSize: FONT.h2,
  fontWeight: 900,
  color: C.ink,
  marginBottom: 12,
})

export const message = style({
  fontSize: FONT.body,
  color: '#455a64',
  marginBottom: 22,
  lineHeight: 1.5,
})

export const actions = style({
  display: 'flex',
  gap: 12,
  justifyContent: 'center',
})

export const cancel = style({
  height: 48,
  padding: '0 26px',
  borderRadius: R.md,
  border: 'none',
  background: '#eceff1',
  color: '#546e7a',
  fontWeight: 900,
  fontFamily: FONT.family,
  cursor: 'pointer',
})

export const confirm = style({
  height: 48,
  padding: '0 26px',
  borderRadius: R.md,
  border: 'none',
  color: '#fff',
  fontWeight: 900,
  fontFamily: FONT.family,
  cursor: 'pointer',
})
