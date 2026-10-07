// P1 Splash（自 SplashScene.module.css 迁移至 vanilla-extract，数值不变）。
// 场景根铺满 1024×768 LogicalStage，随舞台等比缩放。
import { style } from '@vanilla-extract/css'

export const scene = style({
  position: 'absolute',
  inset: 0,
  overflow: 'hidden',
})

// z0 重绘背景：铺满舞台随缩放（object-fit 缺省值即 fill，不再显式声明）
export const bg = style({
  position: 'absolute',
  inset: 0,
  width: '100%',
  height: '100%',
})

// 拆层位图 / 进度条容器（left/top/width/height 由 bbox×K 运行时给出，保留内联）
export const layer = style({
  position: 'absolute',
})

// 空轨道：白底外框（进度未满时露出）
export const barTrack = style({
  position: 'absolute',
  inset: 0,
  borderRadius: '999px',
  background: '#ffffff',
  overflow: 'hidden',
})

// 浅蓝内槽
export const barSlot = style({
  position: 'absolute',
  top: '8px',
  right: '8px',
  bottom: '8px',
  left: '8px',
  borderRadius: '999px',
  background: 'linear-gradient(180deg, #dcecfa, #c7e1f7)',
})

// 满格位图（clipPath 按进度运行时裁剪，保留内联）
export const barFill = style({
  position: 'absolute',
  inset: 0,
  width: '100%',
  height: '100%',
})
