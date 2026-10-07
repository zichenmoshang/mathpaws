// TopBar 静态样式（vanilla-extract）；sky 色调的皮肤样式随 tone 留在 tsx 内联
import { style } from '@vanilla-extract/css'

export const root = style({
  position: 'absolute', top: 12, left: 12, right: 12, minHeight: 56,
  display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8,
  zIndex: 10,
})
