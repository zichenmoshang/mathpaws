// WritingBoard 静态样式（自 WritingBoard.module.css 迁移至 vanilla-extract，数值不变）
import { style } from '@vanilla-extract/css'

export const wrap = style({
  position: 'absolute',
  inset: 0,
})

// 小数点圆点；left 按分区位置由 tsx 内联给出
export const dot = style({
  position: 'absolute',
  top: '50%',
  transform: 'translate(-50%, -50%)',
  width: '12px',
  height: '12px',
  borderRadius: '50%',
  background: 'rgba(96, 125, 139, .5)',
  pointerEvents: 'none',
})

// 位间竖虚线；left 按分区位置由 tsx 内联给出
export const sep = style({
  position: 'absolute',
  top: '5%',
  bottom: '5%',
  borderLeft: '2px dashed rgba(96, 125, 139, .45)',
  pointerEvents: 'none',
})

export const board = style({
  width: '100%',
  height: '100%',
  touchAction: 'none',
  display: 'block',
})
