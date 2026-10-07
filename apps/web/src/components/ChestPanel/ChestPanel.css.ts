// ChestPanel 局部样式（自 ChestPanel.module.css 迁移至 vanilla-extract，数值不变；
// cqw 相对 frame 容器查询）。动画引用 styles/motion.css 的共享 keyframes，不重复定义。
import { style } from '@vanilla-extract/css'

import { mpPopIn } from '../../styles/motion.css'

// 字体栈取自 @mathpaws/ui 的 FONT.family token，token 变更时需同步
const FONT_FAMILY = '"Baloo 2", "Comic Sans MS", "Microsoft YaHei", system-ui, sans-serif'

export const backdrop = style({
  position: 'fixed',
  inset: 0,
  zIndex: 100,
  background: 'rgba(30, 50, 80, .5)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontFamily: FONT_FAMILY,
  animation: `${mpPopIn} .22s ease-out`,
})

export const frame = style({
  position: 'relative',
  width: 'min(760px, 92vw)',
  aspectRatio: '2364 / 1773',
  borderRadius: '24px',
  overflow: 'hidden',
  containerType: 'inline-size',
  boxShadow: '0 24px 60px rgba(20, 40, 80, .45)',
})

export const fill = style({
  position: 'absolute',
  inset: 0,
  width: '100%',
  height: '100%',
  objectFit: 'fill',
})

// 拆层回贴（left/top/width/height 按 bbox 动态计算，保留内联）
export const layer = style({
  position: 'absolute',
  objectFit: 'fill',
  pointerEvents: 'none',
})

// 已擦净区域上的真实文案（位置 / 颜色 / 字号由 props 动态给，保留内联）
export const textZone = style({
  position: 'absolute',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  whiteSpace: 'nowrap',
  pointerEvents: 'none',
})

export const closeBtn = style({
  position: 'absolute',
  top: '2.2%',
  right: '2.4%',
  width: '5.2%',
  aspectRatio: '1',
  borderRadius: '50%',
  border: 'none',
  cursor: 'pointer',
  zIndex: 20,
  background: 'rgba(255, 255, 255, .92)',
  boxShadow: '0 3px 8px rgba(20, 40, 80, .25)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 0,
})

export const claimBtn = style({
  position: 'absolute',
  // 几何取自原稿 bbox [809,1532,1556,1720]，calc 让浏览器按原算式求值，与原 JS 模板计算逐位一致
  left: 'calc(809 / 2364 * 100%)',
  top: 'calc(1532 / 1773 * 100%)',
  width: 'calc((1556 - 809) / 2364 * 100%)',
  height: 'calc((1720 - 1532) / 1773 * 100%)',
  border: 'none',
  padding: 0,
  cursor: 'pointer',
  background: 'transparent',
  zIndex: 15,
})

export const btnHint = style({
  position: 'absolute',
  inset: 0,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: 'rgba(60, 70, 90, .55)',
  color: '#fff',
  fontWeight: 900,
  fontSize: '3cqw',
  borderRadius: '999px',
})

export const claimedOverlay = style({
  position: 'absolute',
  inset: 0,
  zIndex: 18,
  background: 'rgba(40, 50, 75, .55)',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
})

export const claimedText = style({
  color: '#fff',
  fontWeight: 900,
  fontSize: '8cqw',
  textShadow: '0 3px 8px rgba(0, 0, 0, .4)',
})
