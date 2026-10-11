// QuizScene 静态样式（vanilla-extract）；字体栈等同 @mathpaws/ui 的 FONT.family。
// 原稿坐标换算出的 left/top/width/height 与状态驱动值（字号、判定色等）仍由 tsx 内联给出。
// 共享动画引自 styles/motion.css。
import { style } from '@vanilla-extract/css'

import { mpPopIn } from '../../styles/motion.css'

/* 场景根：承载 SceneShell（渐变背景已移交 tsx 的 QUIZ_BG 经 bleed 铺满） */
export const scene = style({
  position: 'absolute',
  inset: 0,
  overflow: 'hidden',
  fontFamily: '"Baloo 2", "Comic Sans MS", "Microsoft YaHei", system-ui, sans-serif',
})

/* 顶栏容器已抽通用组件 ChromeTopBar（components/ChromeTopBar）；
   此处仅保留本页内容件样式——尺寸 = 逻辑 px × var(--stage-scale)（随舞台缩放，
   2026-10-11 规范修订；TGR-W10 渲染 ≈ 标题 54 / 进度 320×22 / 宝箱 64） */
export const titleImg = style({
  height: 'calc(48px * var(--stage-scale, 1))',
  width: 'auto',
  objectFit: 'contain',
  filter: 'drop-shadow(0 2px 6px rgba(20, 80, 150, .3))',
})

export const progressWrap = style({
  display: 'flex',
  alignItems: 'center',
  width: 'calc(190px * var(--stage-scale, 1))',
  flexShrink: 0,
})

export const chestInBar = style({
  height: 'calc(57px * var(--stage-scale, 1))',
  width: 'auto',
  marginLeft: 'calc(-8px * var(--stage-scale, 1))',
  objectFit: 'contain',
})

/* 书本区：视口 chrome 层（57 逻辑内容高=宝箱 + 32 CSS 间距余量）之下——
   让位带随内容同步缩放，任何屏幕精确对齐，书本在剩余空间居中 */
export const bookArea = style({
  position: 'absolute',
  top: 'calc(57px + 32px / var(--stage-scale, 1))',
  left: 0,
  right: 0,
  bottom: 0,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
})

/* 笔记本舞台：宽满 1024 舞台、按 ORIG 纵横比等比（2030:1350 → 高 680.7，
   书本区可用高 684，TGR-W10 实测与迁移前渲染尺寸一致） */
export const stage = style({
  position: 'relative',
  aspectRatio: '2030 / 1350',
  width: '1024px',
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
  fontSize: '28px',
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
  fontSize: '24px',
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
  fontSize: '14px',
  fontWeight: 800,
  color: '#e53935', // 等同 C.redDeep
  boxShadow: '0 4px 12px rgba(200, 60, 60, .2)',
})
