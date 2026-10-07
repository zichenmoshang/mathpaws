// P2 主角亮相 / 起名（自 HeroIntroScene.module.css 迁移至 vanilla-extract，数值不变）。
// 内容置于 SkyBackdrop 的 1024×768 LogicalStage 内，随舞台等比缩放。
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
  fontSize: '52px',
  fontWeight: 900,
  color: '#ffffff',
  textShadow:
    '0 0 0 #4aa8e8, -3px 0 0 #4aa8e8, 3px 0 0 #4aa8e8, 0 -3px 0 #4aa8e8,'
    + ' 0 3px 0 #4aa8e8, -3px -3px 0 #4aa8e8, 3px -3px 0 #4aa8e8,'
    + ' -3px 3px 0 #4aa8e8, 3px 3px 0 #4aa8e8, 0 8px 12px rgba(40, 110, 180, .3)',
})

// 主角区：从标题下到中部；内部纵向排 主角→脚下云
export const dollZone = style({
  position: 'absolute',
  top: '130px',
  left: 0,
  right: 0,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
})

// 仅在主角脚下的一朵蓬松云
export const cloud = style({
  width: '380px',
  height: '100px',
  marginTop: '-84px',
  borderRadius: '999px',
  background: 'rgba(255, 255, 255, .95)',
  boxShadow: '0 12px 22px rgba(70, 140, 200, .2)',
})

// 输入框区：云下方独立行（top 留出云的位置）
export const formZone = style({
  position: 'absolute',
  top: '596px',
  left: 0,
  right: 0,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: '10px',
})

export const hint = style({
  fontSize: '18px',
  fontWeight: 700,
  color: '#3f8fd0',
})

export const btnZone = style({
  position: 'absolute',
  bottom: '36px',
  left: 0,
  right: 0,
  display: 'flex',
  justifyContent: 'center',
})
