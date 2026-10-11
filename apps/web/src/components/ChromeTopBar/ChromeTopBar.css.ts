// ChromeTopBar 静态样式（vanilla-extract）——规范说明见 tsx 头注
import { style } from '@vanilla-extract/css'

/* 视口 chrome 层：贴视口左右边缘 + safe-area 内缩；
   顶部 24px / 两侧 28px 呼吸位（2026-10-11 走查校准：对齐 vh 时代渲染间距） */
export const bar = style({
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: '16px',
  padding: 'calc(24px + var(--sat, 0px)) calc(28px + var(--sar, 0px)) 0 calc(28px + var(--sal, 0px))',
  boxSizing: 'border-box',
  zIndex: 20,
  pointerEvents: 'none',
})

/* 左右槽：内容行；pointerEvents 恢复（bar 层穿透，避免遮挡舞台点击） */
export const side = style({
  display: 'flex',
  alignItems: 'center',
  gap: '16px',
  pointerEvents: 'auto',
})

/* 居中槽：绝对居中（bar 已 padding，故相对视口宽居中） */
export const center = style({
  position: 'absolute',
  left: '50%',
  transform: 'translateX(-50%)',
})
