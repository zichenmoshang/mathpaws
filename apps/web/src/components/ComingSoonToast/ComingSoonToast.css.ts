// ComingSoonToast 静态样式（自 ComingSoonToast.module.css 迁移至 vanilla-extract，数值不变）；
// 字体栈等同 @mathpaws/ui 的 FONT.family；动画引用 styles/motion.css 的共享 keyframes，不重复定义。
import { style } from '@vanilla-extract/css'

import { mpPopIn } from '../../styles/motion.css'

// 全屏背板不拦截指针（1.6s 自动消失期间不吞下层点击）
export const backdrop = style({
  position: 'fixed',
  inset: 0,
  zIndex: 200,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: 'rgba(30, 60, 100, .18)',
  fontFamily: '"Baloo 2", "Comic Sans MS", "Microsoft YaHei", system-ui, sans-serif',
  animation: `${mpPopIn} .18s ease-out`,
  pointerEvents: 'none',
})

// 提示气泡本身可点击提前关闭
export const toast = style({
  display: 'inline-flex',
  alignItems: 'center',
  gap: '10px',
  padding: '18px 34px',
  borderRadius: '999px',
  background: 'linear-gradient(180deg, #ffffff, #eef6ff)',
  border: '4px solid rgba(255, 255, 255, .9)',
  boxShadow: '0 14px 34px rgba(30, 70, 130, .3)',
  fontWeight: 900,
  fontSize: 'clamp(18px, 2.6vh, 26px)',
  color: '#3f6ea3',
  pointerEvents: 'auto',
  cursor: 'pointer',
})

export const emoji = style({
  fontSize: '1.2em',
})
