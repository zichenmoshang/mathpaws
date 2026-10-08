// P3 领养（自 AdoptScene.module.css 迁移至 vanilla-extract，数值不变）。
// 内容置于 SkyBackdrop 的 1024×768 LogicalStage 内，随舞台等比缩放。
// 卡片状态（选中 / 未解锁）用叠加变体类表达：基线类在前，
// cardActive / cardLocked 等同特异度变体靠后定义覆盖对应属性。
import { FONT } from '@mathpaws/ui'
import { style } from '@vanilla-extract/css'

export const titleWrap = style({
  position: 'absolute',
  top: '56px',
  left: 0,
  right: 0,
  display: 'flex',
  justifyContent: 'center',
})

export const title = style({
  fontSize: FONT.hero,
  fontWeight: 900,
  color: '#ffffff',
  textShadow:
    '0 0 0 #4aa8e8, -3px 0 0 #4aa8e8, 3px 0 0 #4aa8e8, 0 -3px 0 #4aa8e8,'
    + ' 0 3px 0 #4aa8e8, -3px -3px 0 #4aa8e8, 3px -3px 0 #4aa8e8,'
    + ' -3px 3px 0 #4aa8e8, 3px 3px 0 #4aa8e8, 0 8px 12px rgba(40, 110, 180, .3)',
})

export const cardsWrap = style({
  position: 'absolute',
  top: '170px',
  left: 0,
  right: 0,
  display: 'flex',
  justifyContent: 'center',
  gap: '36px',
})

// 宠物卡基线：未选白卡
export const card = style({
  position: 'relative',
  width: '252px',
  height: '372px',
  borderRadius: '30px',
  border: 'none',
  padding: 0,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  overflow: 'hidden',
  transition: 'background .15s ease',
  background: '#ffffff',
  boxShadow: '0 10px 20px rgba(60, 130, 190, .16)',
  cursor: 'pointer',
})

// 选中：实心蓝底白字
export const cardActive = style({
  background: '#4aa8f0',
  boxShadow: '0 14px 26px rgba(40, 130, 220, .4), 0 0 0 6px rgba(140, 200, 255, .45)',
})

// 未解锁：更淡、不可点
export const cardLocked = style({
  opacity: 0.66,
  cursor: 'default',
})

export const petImg = style({
  width: '214px',
  height: '262px',
  objectFit: 'contain',
  marginTop: '26px',
})

// 未解锁宠物图去色
export const petImgLocked = style({
  filter: 'grayscale(1) opacity(.85)',
})

// 名字胶囊基线：可领未选（蓝底白字）
export const nameBar = style({
  marginTop: '10px',
  width: '176px',
  height: '54px',
  borderRadius: '999px',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: FONT.h2,
  fontWeight: 900,
  boxShadow: '0 5px 0 rgba(0, 0, 0, .12)',
  background: '#4aa8f0',
  color: '#ffffff',
})

// 选中卡：名字为白底蓝字胶囊
export const nameBarActive = style({
  background: '#ffffff',
  color: '#4aa8f0',
})

// 未解锁：灰底
export const nameBarLocked = style({
  background: '#b6c2cc',
})

// 未解锁："即将开放"浮层盖在卡面
export const lockOverlay = style({
  position: 'absolute',
  inset: 0,
  display: 'flex',
  alignItems: 'flex-start',
  justifyContent: 'center',
  paddingTop: '22px',
  pointerEvents: 'none',
})

export const lockTag = style({
  padding: '6px 18px',
  borderRadius: '999px',
  background: 'rgba(84, 110, 122, .92)',
  color: '#ffffff',
  fontWeight: 800,
  fontSize: FONT.small,
  boxShadow: '0 3px 6px rgba(0, 0, 0, .18)',
})

export const btnZone = style({
  position: 'absolute',
  bottom: '44px',
  left: 0,
  right: 0,
  display: 'flex',
  justifyContent: 'center',
})
