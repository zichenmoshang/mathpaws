// 全局共享动画（vanilla-extract）——替代原 styles/global.css 的 mp-* @keyframes。
// 各场景 .css.ts 按需 import 引用，单点定义、hash 一致、可 tree-shake。
// 原 global.css 保留 reset 部分后，mp-* keyframes 将全部下线。
import { keyframes } from '@vanilla-extract/css'

/** 上下漂浮 */
export const mpFloat = keyframes({
  '0%, 100%': { transform: 'translateY(0)' },
  '50%': { transform: 'translateY(-12px)' },
})

/** 闪烁（opacity + scale） */
export const mpTwinkle = keyframes({
  '0%, 100%': { opacity: 0.25, transform: 'scale(0.8)' },
  '50%': { opacity: 1, transform: 'scale(1.15)' },
})

/** 宝箱呼吸 */
export const mpChestBob = keyframes({
  '0%, 100%': { transform: 'translateY(0) scale(1)' },
  '50%': { transform: 'translateY(-8px) scale(1.02)' },
})

/** 弹入（缩放） */
export const mpPopIn = keyframes({
  '0%': { opacity: 0, transform: 'scale(0.4)' },
  '70%': { transform: 'scale(1.08)' },
  '100%': { opacity: 1, transform: 'scale(1)' },
})

/** 光晕脉冲 */
export const mpGlowPulse = keyframes({
  '0%, 100%': { opacity: 0.5, transform: 'scale(1)' },
  '50%': { opacity: 0.9, transform: 'scale(1.12)' },
})

/** 结果面板弹入（缩放 + 上移） */
export const mpPanelIn = keyframes({
  '0%': { opacity: 0, transform: 'scale(0.7) translateY(24px)' },
  '70%': { transform: 'scale(1.03) translateY(0)' },
  '100%': { opacity: 1, transform: 'scale(1) translateY(0)' },
})

/** 光芒旋转 */
export const mpRaysSpin = keyframes({
  '0%': { transform: 'rotate(0)' },
  '100%': { transform: 'rotate(360deg)' },
})

/** 卡片漂浮（带旋转） */
export const mpCardFloat = keyframes({
  '0%, 100%': { transform: 'translateY(0) rotate(-3deg)' },
  '50%': { transform: 'translateY(-10px) rotate(3deg)' },
})

/** 淡入 */
export const mpFadeIn = keyframes({
  from: { opacity: 0 },
  to: { opacity: 1 },
})

/** 立绘呼吸（背包/主页） */
export const mpDollBob = keyframes({
  '0%, 100%': { transform: 'translateY(0)' },
  '50%': { transform: 'translateY(-8px)' },
})
