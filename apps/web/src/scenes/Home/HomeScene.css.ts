// HomeScene 样式（P4 首页，1024×768 逻辑舞台；vanilla-extract）
// 全部几何值为原稿 2048×1536 × K(0.5) 折算后的逻辑像素，与迁移前 CSS Modules 数值一致。
// 动画 keyframes 统一引用 styles/motion.css.ts 共享定义（mpDollBob / mpFloat）。
import { FONT } from '@mathpaws/ui'
import { style, styleVariants } from '@vanilla-extract/css'

import { mpDollBob, mpFloat } from '../../styles/motion.css'

/* 场景根：全视口容器，承载 SceneShell（出血背景 + LogicalStage） */
export const scene = style({
  position: 'absolute',
  inset: 0,
  overflow: 'hidden',
  fontFamily: '"Baloo 2", "Comic Sans MS", "Microsoft YaHei", system-ui, sans-serif',
})

/* 1024×768 逻辑舞台根（LogicalStage 负责居中与等比缩放） */
export const stage = style({
  position: 'relative',
  width: '1024px',
  height: '768px',
})

/* z0 舞台内背景：铺满舞台，随舞台等比缩放不变形 */
export const stageBg = style({
  position: 'absolute',
  inset: 0,
  width: '100%',
  height: '100%',
})

/* 顶栏毛玻璃底板（z1；原 bbox [80,70,1968,261]） */
export const glassTopBar = style({
  position: 'absolute',
  left: '40px',
  top: '35px',
  width: '944px',
  height: '95.5px',
  borderRadius: '999px',
  background: 'linear-gradient(180deg, rgba(255, 255, 255, .72), rgba(232, 246, 255, .55))',
  border: '3px solid rgba(255, 255, 255, .75)',
  boxShadow: '0 8px 20px rgba(50, 110, 170, .18), inset 0 2px 6px rgba(255, 255, 255, .7)',
  backdropFilter: 'blur(4px)',
  pointerEvents: 'none',
})

/* 头像圆形容器（z2；原 bbox [113,98,247,232]） */
export const avatar = style({
  position: 'absolute',
  left: '56.5px',
  top: '49px',
  width: '67px',
  height: '67px',
  borderRadius: '50%',
  overflow: 'hidden',
  background: '#eaf6ff',
  border: '3px solid #fff',
  boxShadow: '0 3px 8px rgba(60, 120, 180, .25)',
  pointerEvents: 'none',
})

/* 头像内裁出纸娃娃头肩 */
export const avatarDoll = style({
  position: 'relative',
  width: '300%',
  aspectRatio: '1 / 1',
  top: '-48%',
  left: '-100%',
})

/* 用户名（z3 位） */
export const heroName = style({
  position: 'absolute',
  left: '136.5px',
  top: '69.5px',
  fontWeight: 900,
  color: '#3d3833',
  fontSize: FONT.title,
  lineHeight: 1.2,
  maxWidth: '200px',
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
})

/* 连学 / 累计胶囊（z4/z5） */
export const topPill = style({
  position: 'absolute',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: '999px',
  background: 'rgba(255, 255, 255, .92)',
  color: '#4a5a6a',
  fontWeight: 800,
  fontSize: FONT.h2,
  boxShadow: '0 2px 6px rgba(60, 110, 160, .12)',
})

/* 连学胶囊几何（原 bbox [1236,123,1474,210]） */
export const topPillStreak = style({
  left: '618px',
  top: '61.5px',
  width: '119px',
  height: '43.5px',
})

/* 累计胶囊几何（原 bbox [1516,123,1770,210]） */
export const topPillTotal = style({
  left: '758px',
  top: '61.5px',
  width: '127px',
  height: '43.5px',
})

/* 齿轮按钮（z6；原 bbox [1828,119,1918,212]） */
export const gearBtn = style({
  position: 'absolute',
  left: '914px',
  top: '59.5px',
  width: '45px',
  height: '46.5px',
  border: 'none',
  background: 'transparent',
  padding: 0,
  cursor: 'pointer',
})

export const gearIcon = style({
  width: '100%',
  height: '100%',
  objectFit: 'contain',
})

/* 圆台（旧资产 p16-platform） */
export const platform = style({
  position: 'absolute',
  left: '164.25px',
  top: '518px',
  width: '238px',
  height: 'auto',
  zIndex: 1,
  pointerEvents: 'none',
})

/* PaperDoll 主角容器（覆盖原 z7 bbox 居中正方形） */
export const dollWrap = style({
  position: 'absolute',
  left: '78.25px',
  top: '168px',
  width: '410px',
  height: '410px',
  zIndex: 2,
  pointerEvents: 'none',
  animation: `${mpDollBob} 3.4s ease-in-out infinite`,
})

/* 趴兔（z8；原 bbox [127,863,410,1173]） */
export const rabbit = style({
  position: 'absolute',
  left: '63.5px',
  top: '431.5px',
  width: '141.5px',
  height: '155px',
  zIndex: 3,
  pointerEvents: 'none',
  animation: `${mpFloat} 3.8s ease-in-out infinite`,
})

/* 益智乐园位图与透明按钮（z9；原 bbox [178,1163,941,1393]） */
export const plazaBtn = style({
  position: 'absolute',
  left: '89px',
  top: '581.5px',
  width: '381.5px',
  height: '115px',
  zIndex: 5,
  border: 'none',
  background: 'transparent',
  padding: 0,
  cursor: 'pointer',
})

/* 轮播视窗（对齐白卡 z11 + 蓝底 z10 并集，右缘留 peek） */
export const carousel = style({
  position: 'absolute',
  left: '553.5px',
  top: '166px',
  width: '417.5px',
  height: '592px',
  overflow: 'hidden',
  touchAction: 'pan-y',
  userSelect: 'none',
  cursor: 'grab',
})

/* 单卡滑轨帧：transform / opacity / zIndex / visibility / transition 为运行时动态值，留内联 */
export const cardFrame = style({
  position: 'absolute',
  left: 0,
  top: '16px',
  width: '368.5px',
  height: '504.5px',
  transformOrigin: 'left center',
})

/* 圆点指示器（z16 位） */
export const dots = style({
  position: 'absolute',
  left: '688px',
  top: '712px',
  width: '91.5px',
  display: 'flex',
  gap: '12px',
  justifyContent: 'center',
})

export const dot = style({
  width: '12px',
  height: '12px',
  borderRadius: '999px',
  border: 'none',
  cursor: 'pointer',
  padding: 0,
  background: 'rgba(255, 255, 255, .85)',
  boxShadow: 'inset 0 0 0 2px rgba(180, 210, 235, .6)',
})

export const dotActive = style({
  width: '24px',
  background: 'linear-gradient(180deg, #86db6c, #46ac33)',
  boxShadow: '0 2px 5px rgba(60, 140, 50, .4)',
})

/* 学习卡毛玻璃（z11 形态：白色磨砂 + 白边高光） */
export const card = style({
  position: 'absolute',
  left: 0,
  top: 0,
  width: '368.5px',
  height: '504.5px',
  boxSizing: 'border-box',
  borderRadius: '30px',
  background: 'linear-gradient(180deg, rgba(255, 255, 255, .82), rgba(240, 249, 255, .66))',
  border: '4px solid rgba(255, 255, 255, .85)',
  boxShadow: '0 18px 36px rgba(50, 100, 160, .22), inset 0 2px 10px rgba(255, 255, 255, .8)',
  backdropFilter: 'blur(3px)',
})

/* 仅连学卡可点 */
export const cardClickable = style({
  cursor: 'pointer',
})

/* 顶部外凸标签（z12 位） */
export const tag = style({
  position: 'absolute',
  top: '-10.5px',
  left: '50%',
  transform: 'translateX(-50%)',
  padding: '7px 24px',
  borderRadius: '999px',
  whiteSpace: 'nowrap',
  fontWeight: 900,
  fontSize: FONT.h2,
  color: '#7a5410',
  boxShadow: '0 4px 8px rgba(150, 110, 20, .25), inset 0 2px 3px rgba(255, 255, 255, .7)',
})

/* 标签色调枚举（grass / sky / orange） */
export const tagTone = styleVariants({
  grass: { background: 'linear-gradient(180deg, #ffe9a8, #ffd35e 60%, #f0b23a)' },
  sky: { background: 'linear-gradient(180deg, #bfe8ff, #7cc4f2 60%, #4ea9e8)' },
  orange: { background: 'linear-gradient(180deg, #ffd8a6, #ffa84d 60%, #f08a1e)' },
})

/* CTA 渐变钮（z15 位，3 卡文案不同） */
export const cta = style({
  position: 'absolute',
  left: '106px',
  top: '405.5px',
  width: '154px',
  height: '62px',
  border: 'none',
  borderRadius: '999px',
  cursor: 'pointer',
  fontFamily: '"Baloo 2", "Comic Sans MS", "Microsoft YaHei", system-ui, sans-serif',
  fontWeight: 900,
  fontSize: FONT.h2,
  color: '#fff',
  textShadow: '0 1px 2px rgba(0, 0, 0, .2)',
  padding: 0,
})

/* CTA 色调枚举（grass / sky / orange） */
export const ctaTone = styleVariants({
  grass: {
    background: 'linear-gradient(180deg, #9be37c 0%, #70cc52 42%, #4cb838 72%, #3ba02c 100%)',
    boxShadow: '0 7px 16px rgba(45, 130, 35, .34), inset 0 3px 6px rgba(255, 255, 255, .65), inset 0 -6px 10px rgba(30, 110, 20, .26)',
  },
  sky: {
    background: 'linear-gradient(180deg, #8ed7fb 0%, #5cb6ee 42%, #40a2e4 72%, #3190d2 100%)',
    boxShadow: '0 7px 16px rgba(40, 120, 180, .34), inset 0 3px 6px rgba(255, 255, 255, .65), inset 0 -6px 10px rgba(20, 85, 140, .26)',
  },
  orange: {
    background: 'linear-gradient(180deg, #ffc890 0%, #ff9f55 42%, #fb8328 72%, #ec7017 100%)',
    boxShadow: '0 7px 16px rgba(200, 110, 25, .34), inset 0 3px 6px rgba(255, 255, 255, .65), inset 0 -6px 10px rgba(150, 70, 10, .26)',
  },
})

/* 卡内插画区（页内 top 66） */
export const cardArt = style({
  position: 'absolute',
  left: 0,
  top: '66px',
  width: '368.5px',
  height: '220px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
})

/* 卡内位图插画（宝箱 / 错题本） */
export const artImg = style({
  height: '200px',
  objectFit: 'contain',
})

/* 宝箱浮动动画 */
export const artImgFloat = style({
  animation: `${mpFloat} 3s ease-in-out infinite`,
})

/* 卡内文本块定位（top 300，已打卡文案与 CardText 共用） */
export const textBlock = style({
  position: 'absolute',
  top: '300px',
  left: 0,
  width: '368.5px',
  textAlign: 'center',
})

/* 已打卡标题 / 副文 */
export const doneTitle = style({
  fontWeight: 900,
  fontSize: FONT.h2,
  color: '#5a4a3a',
})

export const doneDesc = style({
  fontSize: FONT.small,
  color: '#8a98a5',
  marginTop: '6px',
})

/* 通用卡标题 / 描述（真题 / 错题本） */
export const cardTitle = style({
  fontWeight: 900,
  fontSize: FONT.h2,
  color: '#3d4a57',
  marginBottom: '6px',
})

export const cardDesc = style({
  fontSize: FONT.small,
  color: '#7c8b99',
})

/* 闹钟+书插画（z13；页内 left 71.5 top 66.5 231×220；opacity 由学习状态驱动，留内联） */
export const alarmArt = style({
  position: 'absolute',
  left: '71.5px',
  top: '66.5px',
  width: '231px',
  height: '220px',
  objectFit: 'contain',
  pointerEvents: 'none',
})

/* 连学主文案 */
export const streakText = style({
  position: 'absolute',
  top: '315px',
  left: 0,
  width: '368.5px',
  textAlign: 'center',
  fontWeight: 900,
  fontSize: FONT.h2,
  color: '#5a4a3a',
})

/* 五星行 */
export const starsRow = style({
  position: 'absolute',
  top: '352px',
  left: 0,
  width: '368.5px',
  display: 'flex',
  gap: '6px',
  justifyContent: 'center',
})

/* 真题卡 ABC 试卷插画 */
export const quizArt = style({
  position: 'relative',
  width: '168px',
  height: '112px',
  background: '#fff',
  borderRadius: '18px',
  boxShadow: '0 10px 20px rgba(80, 120, 170, .22), inset 0 0 0 3px #e8f1f8',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '8px',
  transform: 'rotate(-3deg)',
})

export const quizLetter = style({
  width: '42px',
  height: '42px',
  borderRadius: '50%',
  color: '#fff',
  fontWeight: 900,
  fontSize: FONT.h2,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  boxShadow: '0 3px 6px rgba(0, 0, 0, .15)',
  selectors: {
    '&:nth-child(1)': { background: '#7cc96a' },
    '&:nth-child(2)': { background: '#59b2ec' },
    '&:nth-child(3)': { background: '#ff9d4d' },
  },
})
