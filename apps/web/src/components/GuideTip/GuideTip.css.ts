// GuideTip 静态样式（自 GuideTip.module.css 迁移至 vanilla-extract，数值不变）；
// 字体栈等同 @mathpaws/ui 的 FONT.family
import { FONT } from '@mathpaws/ui'
import { style } from '@vanilla-extract/css'

export const wrap = style({
  position: 'absolute',
  zIndex: 70,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: '10px',
  padding: '14px 18px',
  borderRadius: '20px',
  background: 'rgba(255, 255, 255, .98)',
  border: '3px solid #ffd9e6',
  boxShadow: '0 10px 24px rgba(60, 120, 180, .3)',
  fontFamily: '"Baloo 2", "Comic Sans MS", "Microsoft YaHei", system-ui, sans-serif',
})

export const text = style({
  fontWeight: 900,
  fontSize: FONT.small,
  color: '#3f4d5c',
  whiteSpace: 'nowrap',
})

export const actions = style({
  display: 'flex',
  gap: '8px',
})

export const okBtn = style({
  height: '38px',
  padding: '0 20px',
  borderRadius: '999px',
  border: 'none',
  background: 'linear-gradient(180deg, #ffd83d, #ffb020)',
  color: '#7a4a12',
  fontWeight: 900,
  fontSize: FONT.small,
  boxShadow: '0 4px 0 #e08f00',
  cursor: 'pointer',
})

export const skipBtn = style({
  height: '38px',
  padding: '0 16px',
  borderRadius: '999px',
  border: 'none',
  background: '#eceff1',
  color: '#78909c',
  fontWeight: 800,
  fontSize: FONT.aux,
  cursor: 'pointer',
})
