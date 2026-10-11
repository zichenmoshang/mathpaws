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

// 弹层尺寸 = token 逻辑值 × var(--stage-scale)（2026-10-11 弹层自适应规范：
// 遮罩盖视口，内容与舞台同比例缩放；FONT 各档本即逻辑基准值）
export const panel = style({
  width: 'min(90vw, calc(440px * var(--stage-scale, 1)))',
  background: '#fff',
  borderRadius: R.lg,
  padding: 'calc(26px * var(--stage-scale, 1))',
  boxShadow: '0 12px 36px rgba(0,0,0,.25)',
  fontFamily: FONT.family,
  textAlign: 'center',
})

export const title = style({
  fontSize: `calc(${FONT.h2}px * var(--stage-scale, 1))`,
  fontWeight: 900,
  color: C.ink,
  marginBottom: 'calc(12px * var(--stage-scale, 1))',
})

export const message = style({
  fontSize: `calc(${FONT.body}px * var(--stage-scale, 1))`,
  color: '#455a64',
  marginBottom: 'calc(22px * var(--stage-scale, 1))',
  lineHeight: 1.5,
})

export const actions = style({
  display: 'flex',
  gap: 'calc(12px * var(--stage-scale, 1))',
  justifyContent: 'center',
})

export const cancel = style({
  height: 'calc(48px * var(--stage-scale, 1))',
  padding: '0 calc(26px * var(--stage-scale, 1))',
  borderRadius: R.md,
  border: 'none',
  background: '#eceff1',
  color: '#546e7a',
  fontSize: `calc(${FONT.body}px * var(--stage-scale, 1))`,
  fontWeight: 900,
  fontFamily: FONT.family,
  cursor: 'pointer',
})

export const confirm = style({
  height: 'calc(48px * var(--stage-scale, 1))',
  padding: '0 calc(26px * var(--stage-scale, 1))',
  borderRadius: R.md,
  border: 'none',
  color: '#fff',
  fontSize: `calc(${FONT.body}px * var(--stage-scale, 1))`,
  fontWeight: 900,
  fontFamily: FONT.family,
  cursor: 'pointer',
})
