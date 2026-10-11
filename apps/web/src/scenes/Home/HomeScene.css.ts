// HomeScene 样式（P18 首页，1024×768 逻辑舞台；vanilla-extract）
// 几何值为 P18 原稿 2338×1536 安全框映射：逻辑坐标 = ((x−145)×0.5, y×0.5)
// （原稿中央 2048×1536 为 4:3 安全框 x∈[145,2193]，见 HomeScene.tsx 头注）。
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

/* 顶栏毛玻璃底板（z8；原稿 bbox [112,72,2229,264]——两端伸入出血带，4:3 屏贴边通栏） */
export const glassTopBar = style({
  position: 'absolute',
  left: '-16.5px',
  top: '36px',
  width: '1057px',
  height: '96px',
  borderRadius: '999px',
  background: 'linear-gradient(180deg, rgba(255, 255, 255, .72), rgba(232, 246, 255, .55))',
  border: '3px solid rgba(255, 255, 255, .75)',
  boxShadow: '0 8px 20px rgba(50, 110, 170, .18), inset 0 2px 6px rgba(255, 255, 255, .7)',
  backdropFilter: 'blur(4px)',
  pointerEvents: 'none',
})

/* 头像圆形容器（z12；原稿 bbox [156,107,289,229]，取正圆微调） */
export const avatar = style({
  position: 'absolute',
  left: '5.5px',
  top: '52px',
  width: '66px',
  height: '66px',
  borderRadius: '50%',
  overflow: 'hidden',
  background: '#eaf6ff',
  border: '3px solid #fff',
  boxShadow: '0 3px 8px rgba(60, 120, 180, .25)',
  pointerEvents: 'none',
})

/* 头像内裁出纸娃娃头肩（240%：锚图头顶 y≈8%、肩 y≈50%，42%×240%≈容器高） */
export const avatarDoll = style({
  position: 'relative',
  width: '240%',
  aspectRatio: '1 / 1',
  top: '-19%',
  left: '-70%',
})

/* 用户名（z13 位；原稿 bbox [327,140,529,198]） */
export const heroName = style({
  position: 'absolute',
  left: '91px',
  top: '70px',
  fontWeight: 900,
  color: '#3d3833',
  fontSize: FONT.title,
  lineHeight: 1.2,
  maxWidth: '200px',
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
})

/* 连学 / 累计胶囊（z14/z15）——顶栏同语言毛玻璃 + 底部浅薄边（无投影） */
export const topPill = style({
  position: 'absolute',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: '999px',
  background: 'rgba(255, 255, 255, .55)',
  border: '2px solid rgba(255, 255, 255, .75)',
  backdropFilter: 'blur(4px)',
  color: '#4a5a6a',
  fontWeight: 800,
  fontSize: FONT.h2,
  boxShadow: 'inset 0 -3px 0 rgba(70, 140, 200, .15)',
})

/* 连学胶囊几何（z14；原稿 bbox [1406,124,1676,215]） */
export const topPillStreak = style({
  left: '630.5px',
  top: '62px',
  width: '135px',
  height: '45.5px',
})

/* 累计胶囊几何（z15；原稿 bbox [1721,124,2007,215]） */
export const topPillTotal = style({
  left: '788px',
  top: '62px',
  width: '143px',
  height: '45.5px',
})

/* 齿轮按钮（z16；原稿 bbox [2072,120,2172,216]） */
export const gearBtn = style({
  position: 'absolute',
  left: '963.5px',
  top: '60px',
  width: '50px',
  height: '48px',
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

/* 圆台（z4；原稿 bbox [423,1059,920,1182]） */
export const platform = style({
  position: 'absolute',
  left: '139px',
  top: '529.5px',
  width: '248.5px',
  height: '61.5px',
  zIndex: 1,
  pointerEvents: 'none',
})

/* PaperDoll 主角容器（z6 bbox [432,346,859,1088] 中心/底对齐居中正方形；
   top +10 走查微调：脚底贴近圆台顶面中心） */
export const dollWrap = style({
  position: 'absolute',
  left: '64.75px',
  top: '183px',
  width: '371px',
  height: '371px',
  zIndex: 2,
  pointerEvents: 'none',
  animation: `${mpDollBob} 3.4s ease-in-out infinite`,
})

/* 趴兔（z5；原稿 bbox [163,866,482,1179]） */
export const rabbit = style({
  position: 'absolute',
  left: '9px',
  top: '433px',
  width: '159.5px',
  height: '156.5px',
  zIndex: 3,
  pointerEvents: 'none',
  animation: `${mpFloat} 3.8s ease-in-out infinite`,
})

/* 益智乐园位图与透明按钮（z3；原稿 bbox [221,1167,1077,1396]） */
export const plazaBtn = style({
  position: 'absolute',
  left: '38px',
  top: '583.5px',
  width: '428px',
  height: '114.5px',
  zIndex: 5,
  border: 'none',
  background: 'transparent',
  padding: 0,
  cursor: 'pointer',
})

/* 轮播视窗（对齐大卡 z7 bbox [1264,352,2090,1373] 视窗区，右缘留 peek；
   卡容器维持 CSS 毛玻璃已验收几何 368.5×504.5，仅视窗平移对齐） */
export const carousel = style({
  position: 'absolute',
  left: '559.5px',
  top: '160px',
  width: '417.5px',
  height: '530px',
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

/* 圆点指示器（卡区正下方居中） */
export const dots = style({
  position: 'absolute',
  left: '722.5px',
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
  background: 'linear-gradient(180deg, #ffffff, #eef6fc)',
  border: '4px solid rgba(255, 255, 255, .85)',
  boxShadow: '0 18px 36px rgba(50, 100, 160, .22), inset 0 2px 10px rgba(255, 255, 255, .8)',
})

/* 卡体色调枚举（不透明，2026-10-10 走查裁定"尽量不透"）：连学卡白卡；
   真题卡蓝色（原稿卡2 窄边即其卡体色）、错题本橙色——后方卡露出的窄边
   是它自己的卡体色，滑到前台颜色一致不突变 */
export const cardTone = styleVariants({
  grass: {
    background: 'linear-gradient(180deg, #ffffff, #eef6fc)',
  },
  sky: {
    background: 'linear-gradient(180deg, #a5d3f8, #7fc0f0)',
  },
  orange: {
    background: 'linear-gradient(180deg, #ffdcb0, #f9ba75)',
  },
})

/* 仅连学卡可点 */
export const cardClickable = style({
  cursor: 'pointer',
})

/* 顶部外凸标签（z9 位）——对齐拆层 z09：奶油黄底、金棕立体字（上亮下暗）、
   上角小圆下角全圆；无外投影，底部深色薄边 */
export const tag = style({
  position: 'absolute',
  top: '-10.5px',
  left: '50%',
  transform: 'translateX(-50%)',
  padding: '6px 20px',
  borderRadius: '10px 10px 999px 999px',
  whiteSpace: 'nowrap',
  fontWeight: 900,
  fontSize: FONT.h2,
  color: '#b06a12',
  textShadow: '0 1px 0 rgba(255, 240, 200, .9), 0 -1px 1px rgba(140, 80, 0, .3)',
  boxShadow: 'inset 0 -3px 0 rgba(180, 120, 20, .35), inset 0 2px 3px rgba(255, 255, 255, .7)',
})

/* 标签色调枚举（grass / sky / orange）；grass 对齐 z09 奶油黄 */
export const tagTone = styleVariants({
  grass: { background: 'linear-gradient(180deg, #fff3d6 0%, #ffe3a1 55%, #f7cd7a 100%)' },
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

/* CTA 色调枚举（grass / sky / orange）——tile v2 语言：无外投影，底部深色薄边 */
export const ctaTone = styleVariants({
  grass: {
    background: 'linear-gradient(180deg, #9be37c 0%, #70cc52 42%, #4cb838 72%, #3ba02c 100%)',
    boxShadow: 'inset 0 3px 6px rgba(255, 255, 255, .65), inset 0 -6px 0 rgba(30, 110, 20, .3)',
  },
  sky: {
    background: 'linear-gradient(180deg, #8ed7fb 0%, #5cb6ee 42%, #40a2e4 72%, #3190d2 100%)',
    boxShadow: 'inset 0 3px 6px rgba(255, 255, 255, .65), inset 0 -6px 0 rgba(20, 85, 140, .3)',
  },
  orange: {
    background: 'linear-gradient(180deg, #ffc890 0%, #ff9f55 42%, #fb8328 72%, #ec7017 100%)',
    boxShadow: 'inset 0 3px 6px rgba(255, 255, 255, .65), inset 0 -6px 0 rgba(150, 70, 10, .3)',
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
