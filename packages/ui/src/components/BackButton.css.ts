// BackButton 静态样式（vanilla-extract）；位图背景（webp 资产）与 size 留在 tsx 内联
import { style } from '@vanilla-extract/css'

export const root = style({
  padding: 0,
  cursor: 'pointer',
  borderRadius: '50%',
  // 白色分离环（2026-10-11）：v2 去金圈后蓝钮在 quiz 蓝渐变背景上撞色，
  // 分离职责按 tile"薄边/色差"语言移交白圈（与头像白边、标题白描边同源）
  border: '3px solid rgba(255, 255, 255, .95)',
})
