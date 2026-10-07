// @mathpaws/ui —— 共享交互态样式（vanilla-extract）
// 替代原 styles.css 的全局 .mp-btn：伪类规则内联样式表达不了，收敛在此单点导出。
import { style } from '@vanilla-extract/css'

/** 糖果按钮按下下沉（原全局 .mp-btn） */
export const btn = style({
  transition: 'transform .08s ease, box-shadow .08s ease',
  selectors: {
    '&:not(:disabled):active': { transform: 'translateY(4px)' },
  },
})
