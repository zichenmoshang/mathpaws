// ResultScene 静态样式（vanilla-extract）；字体栈等同 @mathpaws/ui 的 FONT.family。
// 原稿坐标换算出的 left/top/width/height 仍由 tsx 内联给出（保留浮点精度，视觉零变化）。
// 共享动画引自 styles/motion.css。
import { style } from '@vanilla-extract/css'

import { mpPopIn } from '../../styles/motion.css'

export const scene = style({
  position: 'absolute',
  inset: 0,
  overflow: 'hidden',
  background: '#1f4fb0',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontFamily: '"Baloo 2", "Comic Sans MS", "Microsoft YaHei", system-ui, sans-serif',
})

export const stage = style({
  position: 'relative',
  aspectRatio: '2364 / 1773',
  height: 'min(100%, calc(100vw * 1773 / 2364))',
})

export const bg = style({
  position: 'absolute',
  inset: 0,
  width: '100%',
  height: '100%',
})

export const banner = style({
  animation: `${mpPopIn} .5s ease-out both`,
})

export const bird = style({
  transformOrigin: '50% 90%',
  animation: `${mpPopIn} .55s ease-out .08s both`,
})

export const title = style({
  animation: `${mpPopIn} .5s ease-out .18s both`,
})

export const iconShell = style({
  animation: `${mpPopIn} .45s ease-out .3s both`,
})

export const iconStar = style({
  animation: `${mpPopIn} .45s ease-out .4s both`,
})

export const iconFlame = style({
  animation: `${mpPopIn} .45s ease-out .5s both`,
})

/* 果冻立体奖励字：坐标/填充色/描边色由 tsx 内联给出（随奖励项变化） */
export const rewardLabel = style({
  position: 'absolute',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  whiteSpace: 'nowrap',
  fontWeight: 900,
  fontSize: 'clamp(15px, 2.75vh, 34px)',
  lineHeight: 1,
})

export const practiceTip = style({
  position: 'absolute',
  display: 'flex',
  justifyContent: 'center',
  fontSize: 'clamp(15px, 2.4vh, 30px)',
  fontWeight: 900,
  color: '#fff',
  textShadow: '0 2px 0 rgba(150, 60, 10, .55)',
})

export const againBtn = style({
  border: 'none',
  borderRadius: '999px',
  cursor: 'pointer',
  fontFamily: '"Baloo 2", "Comic Sans MS", "Microsoft YaHei", system-ui, sans-serif',
  fontWeight: 900,
  fontSize: 'clamp(18px, 3vh, 36px)',
  color: '#fff',
  background: 'linear-gradient(180deg, #83d96b 0%, #4fb83b 55%, #379b27 100%)',
  boxShadow: '0 6px 0 #2c7d1f, 0 10px 18px rgba(50, 140, 40, .35), inset 0 2px 4px rgba(255, 255, 255, .5)',
  animation: `${mpPopIn} .45s ease-out .6s both`,
})

export const plazaImg = style({
  animation: `${mpPopIn} .45s ease-out .6s both`,
})

/* 覆盖在「回首页」切图上的透明可点按钮 */
export const homeBtn = style({
  padding: 0,
  border: 'none',
  background: 'transparent',
  cursor: 'pointer',
})
