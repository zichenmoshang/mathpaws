// ItemGrid / ItemCell 静态样式（vanilla-extract）；列数/间距与选中/锁定态留在 tsx 内联
import { style } from '@vanilla-extract/css'

import { FONT, R } from '../tokens'

export const grid = style({
  display: 'grid',
})

export const cell = style({
  aspectRatio: '1 / 1',
  borderRadius: R.md,
  padding: 8,
  position: 'relative',
  fontFamily: FONT.family,
})

export const lock = style({
  position: 'absolute',
  top: 6,
  right: 8,
  fontSize: FONT.body,
})
