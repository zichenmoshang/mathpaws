// BackpackScene 样式（vanilla-extract）
// 共享动画引自 styles/motion.css；云朵/星星等装饰的位置与延迟均为静态值。
// font-family 取值与 @mathpaws/ui 的 FONT.family 一致。
import { style } from '@vanilla-extract/css'

import { mpDollBob, mpFloat, mpTwinkle } from '../../styles/motion.css'

/* ---- 场景骨架 ---- */
export const root = style({
  position: 'absolute',
  inset: 0,
  background: 'linear-gradient(180deg, #67bcf2 0%, #4ea9e8 55%, #3d97dd 100%)',
  fontFamily: '"Baloo 2", "Comic Sans MS", "Microsoft YaHei", system-ui, sans-serif',
  overflow: 'hidden',
})

/* 右上「去学盒」金色入口 */
export const gachaEntry = style({
  position: 'absolute',
  top: '16px',
  right: '18px',
  zIndex: 10,
  height: '46px',
  padding: '0 18px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '8px',
  border: 'none',
  borderRadius: '999px',
  cursor: 'pointer',
  fontFamily: '"Baloo 2", "Comic Sans MS", "Microsoft YaHei", system-ui, sans-serif',
  fontWeight: 900,
  fontSize: '20px',
  color: '#8a5a08',
  background: 'linear-gradient(180deg, #FFF3B0 0%, #FFD25A 42%, #E69A24 78%, #C47E16 100%)',
  boxShadow: '0 4px 8px rgba(0, 0, 0, .28), inset 0 2px 3px rgba(255, 255, 255, .85), inset 0 -3px 5px rgba(120, 70, 0, .5)',
})

export const gachaEntryIcon = style({
  position: 'relative',
  top: '-2px',
  fontSize: '20px',
  lineHeight: 1,
})

/* 顶部「换装书房」位图艺术字 */
export const title = style({
  position: 'absolute',
  top: '14px',
  left: '50%',
  transform: 'translateX(-50%)',
  height: 'clamp(48px, 9vh, 78px)',
  zIndex: 9,
})

export const layout = style({
  position: 'absolute',
  inset: 0,
  display: 'flex',
  alignItems: 'center',
  padding: '86px 28px 96px',
  gap: '12px',
})

/* 左：立绘舞台（人物垂直居中） */
export const stage = style({
  flex: 1,
  alignSelf: 'stretch',
  minWidth: 0,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
})

export const dollWrap = style({
  position: 'relative',
  width: 'clamp(240px, 40vh, 400px)',
})

/* 脚下平台位图：横向椭圆，居中略压在立绘脚底 */
export const platform = style({
  position: 'absolute',
  left: '50%',
  bottom: '-8%',
  transform: 'translateX(-50%)',
  width: '118%',
  height: 'auto',
  pointerEvents: 'none',
})

export const doll = style({
  position: 'relative',
  animation: `${mpDollBob} 3.2s ease-in-out infinite`,
})

/* 右：槽位 + 库存（整列垂直居中；面板固定高度，切 Tab 不抖动） */
export const sideCol = style({
  width: 'clamp(380px, 46vw, 600px)',
  flexShrink: 0,
  alignSelf: 'stretch',
  minHeight: 0,
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
})

export const tabsWrap = style({
  position: 'relative',
  zIndex: 2,
  display: 'flex',
  justifyContent: 'center',
  marginBottom: '8px',
  flexShrink: 0,
})

/* 磨砂面板：固定较短高度，内容从顶部开始排列 */
export const panel = style({
  position: 'relative',
  zIndex: 1,
  height: 'clamp(230px, 42vh, 320px)',
  borderRadius: '34px',
  padding: '22px 24px',
  background: 'linear-gradient(180deg, rgba(180, 226, 250, .55), rgba(140, 205, 242, .45))',
  border: '5px solid rgba(255, 255, 255, .65)',
  boxShadow: '0 14px 30px rgba(20, 80, 140, .25), inset 0 2px 8px rgba(255, 255, 255, .5)',
  backdropFilter: 'blur(3px)',
  overflow: 'hidden',
  boxSizing: 'border-box',
})

export const grid = style({
  display: 'grid',
  gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
  gap: 'clamp(10px, 2.2vmin, 18px)',
})

export const bottomBar = style({
  position: 'absolute',
  bottom: '20px',
  left: 0,
  right: 0,
  display: 'flex',
  justifyContent: 'center',
})

/* ---- 背景：柔白云朵 ---- */
export const cloudsWrap = style({
  position: 'absolute',
  inset: 0,
})

export const cloud = style({
  position: 'absolute',
  borderRadius: '50%',
  background: 'radial-gradient(ellipse at center, rgba(255, 255, 255, .55), rgba(255, 255, 255, 0) 72%)',
})

export const cloud1 = style({ width: '220px', height: '90px', top: '40px', left: '4%' })
export const cloud2 = style({ width: '160px', height: '66px', top: '120px', left: '30%' })
export const cloud3 = style({ width: '260px', height: '100px', bottom: '90px', left: '2%' })
export const cloud4 = style({ width: '300px', height: '110px', bottom: '-30px', right: '-3%' })
export const cloud5 = style({ width: '150px', height: '60px', top: '8%', right: '12%' })

/* ---- 背景：星星 / 爱心 / 小方块等装饰（各自固定的位置与动画延迟） ---- */
export const decoWrap = style({
  position: 'absolute',
  inset: 0,
})

export const decoStar1 = style({ position: 'absolute', top: '34%', left: '6%', animation: `${mpFloat} 3.6s ease-in-out infinite` })
export const decoStar2 = style({ position: 'absolute', top: '64%', left: '9%', animation: `${mpFloat} 4.2s ease-in-out .5s infinite` })
export const decoStar3 = style({ position: 'absolute', bottom: '16%', left: '24%', animation: `${mpFloat} 3.9s ease-in-out 1s infinite` })
export const decoStar4 = style({ position: 'absolute', top: '52%', left: '28%', animation: `${mpTwinkle} 3s ease-in-out infinite` })
export const decoStar5 = style({ position: 'absolute', bottom: '14%', right: '30%', animation: `${mpTwinkle} 3s ease-in-out .3s infinite` })

export const decoHeart1 = style({ position: 'absolute', top: '58%', left: '7%', fontSize: '22px', animation: `${mpFloat} 4s ease-in-out .8s infinite` })
export const decoHeart2 = style({ position: 'absolute', top: '44%', left: '30%', fontSize: '18px', animation: `${mpFloat} 4.4s ease-in-out .2s infinite` })

/* 旋转小方块：静态 rotate 与 mp-float 的 translateY 同写 transform，动画覆盖静态值（与原内联行为一致） */
export const decoBlock = style({
  position: 'absolute',
  top: '60%',
  left: '19%',
  width: '18px',
  height: '18px',
  borderRadius: '5px',
  background: 'linear-gradient(135deg, #7ed0ff, #3d97dd)',
  transform: 'rotate(25deg)',
  animation: `${mpFloat} 3.8s ease-in-out 1.2s infinite`,
})

/* 闪烁小圆点：静态 opacity 会被 mp-twinkle 的 opacity 关键帧覆盖（与原内联行为一致） */
export const decoDot1 = style({
  position: 'absolute',
  top: '30%',
  left: '16%',
  width: '8px',
  height: '8px',
  borderRadius: '50%',
  background: '#FFD24A',
  opacity: 0.8,
  animation: `${mpTwinkle} 2.6s ease-in-out infinite`,
})

export const decoDot2 = style({
  position: 'absolute',
  top: '40%',
  left: '24%',
  width: '6px',
  height: '6px',
  borderRadius: '50%',
  background: '#fff',
  opacity: 0.8,
  animation: `${mpTwinkle} 3.4s ease-in-out .6s infinite`,
})

/* ---- 圆形物品格 ---- */
export const cell = style({
  position: 'relative',
  aspectRatio: '1 / 1',
  borderRadius: '50%',
  border: 'none',
  cursor: 'pointer',
  background: 'radial-gradient(circle at 50% 38%, #ffffff 0%, #f2f8fd 100%)',
  boxShadow: '0 4px 10px rgba(30, 90, 160, .22), inset 0 0 0 2px rgba(255, 255, 255, .9)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 0,
})

export const cellLocked = style({
  opacity: 0.62,
})

export const cellImg = style({
  width: '72%',
  height: '72%',
  objectFit: 'contain',
})

export const cellNone = style({
  fontSize: '30px',
  opacity: 0.5,
})

/* ---- 格角徽章（badge 基类 + 金/灰变体组合，对应原 badgeBase → badgeCheck → badgePlusLocked 继承） ---- */
export const badge = style({
  position: 'absolute',
  width: '26px',
  height: '26px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontWeight: 900,
  fontSize: '16px',
  color: '#fff',
  lineHeight: 1,
  borderRadius: '50%',
})

/* 已选✓与可选购+共用同一金色徽章 */
export const badgeGold = style({
  top: '-3px',
  right: '-3px',
  background: 'radial-gradient(circle at 38% 30%, #FFE27A, #FFC531 60%, #F0A31B)',
  border: '2px solid #fff',
  boxShadow: '0 2px 4px rgba(150, 90, 0, .35)',
})

/* 未拥有灰+：位置/白边同金徽章，仅换灰色底与投影 */
export const badgeLocked = style({
  top: '-3px',
  right: '-3px',
  background: 'radial-gradient(circle at 38% 30%, #eef3f7, #c3d0da 70%, #a8b8c4)',
  border: '2px solid #fff',
  boxShadow: '0 2px 4px rgba(80, 100, 120, .3)',
})
