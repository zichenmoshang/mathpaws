// Modal 静态样式（vanilla-extract）；随 props 变化的宽度留在 tsx 内联
import { style } from '@vanilla-extract/css'

import { C, FONT, SHADOW } from '../tokens'

export const overlay = style({
  position: 'absolute', inset: 0, background: 'rgba(0,0,0,.4)', zIndex: 40,
  display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
})

export const panel = style({
  maxHeight: '86vh', overflowY: 'auto',
  background: C.white, borderRadius: 26,
  // 内边距随舞台缩放（弹层自适应规范，2026-10-11；宽度由 tsx 内联同步换算）
  padding: 'calc(24px * var(--stage-scale, 1))',
  boxShadow: SHADOW.panel, fontFamily: FONT.family,
})
