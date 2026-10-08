// OptionButton 静态样式（vanilla-extract）；选中/对错态的边框、底色、阴影留在 tsx 内联
import { style } from '@vanilla-extract/css'

import { FONT, R } from '../tokens'

export const root = style({
  minWidth: 120, minHeight: 72, padding: '10px 22px',
  borderRadius: R.md, fontSize: FONT.title, fontWeight: 900,
  fontFamily: FONT.family, cursor: 'pointer', lineHeight: 1.2,
})
