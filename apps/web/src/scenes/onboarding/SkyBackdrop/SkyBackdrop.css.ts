// 启动动线（P1–P3）共享天空背景（自 SkyBackdrop.module.css 迁移至 vanilla-extract，数值不变）。
// 根节点铺满 1024×768 LogicalStage；天空渐变本身保留在 tsx 的 SKY_GRADIENT 常量，
// 供舞台根与 BackgroundBleed 出血层共用同一来源。
import { style } from '@vanilla-extract/css'

export const root = style({
  position: 'absolute',
  inset: 0,
  overflow: 'hidden',
})

// 云朵外层定位（left/top/宽高由 s 运行时计算，保留内联）
export const cloud = style({
  position: 'absolute',
})

// 云朵圆 puff 公共造型（宽高/left/bottom 由 s 运行时计算，保留内联）
export const puff = style({
  position: 'absolute',
  borderRadius: '50%',
  background: 'rgba(255, 255, 255, .92)',
  boxShadow: '0 8px 14px rgba(80, 150, 210, .10)',
})

// 云底部平垫（把三圆底边连成平地）；与 puff 同特异度，靠后定义覆盖其圆角
export const puffBase = style({
  borderRadius: '999px',
})

// 星点（left/top/fontSize 逐颗内联）
export const star = style({
  position: 'absolute',
  color: 'rgba(255, 225, 120, .9)',
  lineHeight: 1,
  userSelect: 'none',
})

// 底部细彩虹弧
export const rainbow = style({
  position: 'absolute',
  left: 0,
  right: 0,
  bottom: '-14px',
  height: '90px',
  background:
    'linear-gradient(90deg,'
    + ' rgba(255, 107, 107, 0) 0%,'
    + ' rgba(255, 107, 107, .28) 16%,'
    + ' rgba(255, 179, 71, .28) 34%,'
    + ' rgba(255, 235, 59, .28) 50%,'
    + ' rgba(126, 217, 87, .28) 66%,'
    + ' rgba(79, 195, 247, .28) 84%,'
    + ' rgba(79, 195, 247, 0) 100%)',
  pointerEvents: 'none',
})
