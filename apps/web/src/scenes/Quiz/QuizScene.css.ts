// QuizScene 静态样式（vanilla-extract）；字体栈等同 @mathpaws/ui 的 FONT.family。
// 原稿坐标换算出的 left/top/width/height 与状态驱动值（字号、判定色等）仍由 tsx 内联给出。
// 共享动画引自 styles/motion.css。
import { style } from '@vanilla-extract/css'

import { mpPopIn } from '../../styles/motion.css'

/* 贴合高保真蓝底：顶部中心偏亮、中部偏深、向底部变浅 */
export const scene = style({
  position: 'absolute',
  inset: 0,
  overflow: 'hidden',
  background:
    'radial-gradient(130% 72% at 50% -12%, rgba(133, 205, 252, .9) 0%, rgba(63, 150, 247, 0) 55%),' +
    'linear-gradient(180deg, #57a6f6 0%, #3796f6 36%, #43acf9 66%, #60d0fb 100%)',
  fontFamily: '"Baloo 2", "Comic Sans MS", "Microsoft YaHei", system-ui, sans-serif',
})

/* 顶部栏：返回 / 标题 / 进度+宝箱，同一层级 */
export const topBar = style({
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  height: '11vh',
  minHeight: '64px',
  display: 'flex',
  alignItems: 'center',
  gap: '18px',
  padding: '0 22px',
  boxSizing: 'border-box',
  zIndex: 10,
})

export const titleImg = style({
  height: '46%',
  maxHeight: '54px',
  minHeight: '34px',
  width: 'auto',
  objectFit: 'contain',
  filter: 'drop-shadow(0 2px 6px rgba(20, 80, 150, .3))',
})

export const progressWrap = style({
  marginLeft: 'auto',
  display: 'flex',
  alignItems: 'center',
  width: 'min(280px, 30vw)',
  flexShrink: 0,
})

export const chestInBar = style({
  height: '5.4vh',
  maxHeight: '56px',
  minHeight: '38px',
  width: 'auto',
  marginLeft: '-8px',
  objectFit: 'contain',
})

/* 书本区顶部与顶栏同口径：顶栏 height:11vh + min-height:64px，
   极小高度屏按 64px 让位，避免与顶栏互相挤压 */
export const bookArea = style({
  position: 'absolute',
  top: 'max(11vh, 64px)',
  left: 0,
  right: 0,
  bottom: 0,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
})

/* 笔记本舞台：等比缩放 */
export const stage = style({
  position: 'relative',
  aspectRatio: '2030 / 1350',
  height: 'min(97%, calc(96vw * 1350 / 2030))',
})

/* 书页切图按舞台拉伸填充 */
export const fillImg = style({
  objectFit: 'fill',
})

/* 纯装饰图层：不拦截指针（线圈 / 标签 / 占位提示 / 铅笔） */
export const peNone = style({
  pointerEvents: 'none',
})

/* 题目行（前端排版，自适应单行）；left/width/top 与运行时字号 fontPx 由 tsx 内联给出 */
export const prompt = style({
  position: 'absolute',
  transform: 'translateY(-50%)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '.3em',
  whiteSpace: 'nowrap',
  fontWeight: 800,
  color: '#263238', // 等同 C.ink
  fontFamily: '"Baloo 2", "Comic Sans MS", "Microsoft YaHei", system-ui, sans-serif',
  lineHeight: 1,
})

export const promptText = style({
  letterSpacing: '.02em',
})

/* 答案框：边框/文字颜色随判定状态由 tsx 内联给出 */
export const answerBox = style({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  minWidth: '1.18em',
  height: '1.18em',
  padding: '0 .06em',
  borderRadius: '.18em',
  boxSizing: 'border-box',
})

/* 答对提示：右上角 +奖励贝壳 + 太棒啦 */
export const correctHint = style({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'flex-end',
  pointerEvents: 'none',
  animation: `${mpPopIn} .35s ease-out`,
})

export const correctRow = style({
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
})

export const correctPlus = style({
  fontSize: 'clamp(22px, 3.4vh, 40px)',
  fontWeight: 900,
  color: '#ff6d1f',
  textShadow: '0 2px 0 #fff',
  lineHeight: 1,
})

export const correctShell = style({
  height: '1.9em',
  width: 'auto',
})

export const cheerText = style({
  fontSize: 'clamp(20px, 3vh, 36px)',
  fontWeight: 900,
  lineHeight: 1.1,
  marginTop: '4px',
  background: 'linear-gradient(180deg, #ff8a3d, #ff4f9a)',
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
  textShadow: '0 2px 0 rgba(255, 255, 255, .5)',
})

/* 浮动提示容器（答错重写 / 识别不可用）；left/top/width 由 tsx 内联给出 */
export const floatHint = style({
  position: 'absolute',
  textAlign: 'center',
  pointerEvents: 'none',
})

export const floatHintTag = style({
  display: 'inline-block',
  padding: '.5em 1.1em',
  borderRadius: '999px',
  background: 'rgba(255, 255, 255, .92)',
  fontSize: 'clamp(13px, 1.7vh, 20px)',
  fontWeight: 800,
  color: '#e53935', // 等同 C.redDeep
  boxShadow: '0 4px 12px rgba(200, 60, 60, .2)',
})
