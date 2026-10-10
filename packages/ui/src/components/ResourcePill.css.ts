// ResourcePill 静态样式（vanilla-extract）；tone 决定的底色/字色/描边留在 tsx 内联
import { style } from '@vanilla-extract/css'

import { FONT, R } from '../tokens'

export const root = style({
  display: 'inline-flex', alignItems: 'center', gap: 6,
  height: 38, padding: '0 14px', borderRadius: R.pill,
  fontFamily: FONT.family, fontWeight: 900, fontSize: FONT.body, whiteSpace: 'nowrap',
})

export const icon = style({ fontSize: FONT.h2 })

// ---------- asset 位图底模式（2026-10-10 B2） ----------
export const assetRoot = style({
  position: 'relative',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
})

export const assetImg = style({
  display: 'block',
  width: '100%',
  height: '100%',
  objectFit: 'contain',
  pointerEvents: 'none',
  userSelect: 'none',
})

export const assetValue = style({
  position: 'absolute',
  inset: 0,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontFamily: FONT.family,
  fontWeight: 900,
  pointerEvents: 'none',
  userSelect: 'none',
})
