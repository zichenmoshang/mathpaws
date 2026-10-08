// FarmScene 局部样式（vanilla-extract；1024×768 逻辑像素）
// 数值与迁移前 CSS Modules 完全一致；mp-farm-ready 为本文件局部 keyframes。
import { FONT } from '@mathpaws/ui'
import { keyframes, style } from '@vanilla-extract/css'

/* 场景根：LogicalStage 内的 1024×768 逻辑画布 */
export const scene = style({
  position: 'absolute',
  inset: 0,
  overflow: 'hidden',
  fontFamily: '"Baloo 2", "Comic Sans MS", "Microsoft YaHei", system-ui, sans-serif',
})

/* 舞台内背景：铺满舞台随缩放（img 默认 object-fit 即 fill，不再显式声明） */
export const bg = style({
  position: 'absolute',
  inset: 0,
  width: '100%',
  height: '100%',
})

/* 资源牌数字（牌右半区居中，位置由内联 pillNumPlace 给） */
export const pillNum = style({
  position: 'absolute',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontWeight: 900,
  fontSize: FONT.title,
  color: '#9a6a24',
  textShadow: '0 2px 0 rgba(255, 255, 255, .8)',
})

/* 等级条：标题横幅（z2 y280-525）下方 */
export const levelWrap = style({
  position: 'absolute',
  top: '236px',
  left: '50%',
  transform: 'translateX(-50%)',
  width: '380px',
  display: 'flex',
  alignItems: 'center',
  gap: '10px',
})

export const progressGrow = style({
  flex: 1,
})

export const lv = style({
  padding: '3px 12px',
  borderRadius: '999px',
  background: '#7ed957',
  color: '#fff',
  fontWeight: 900,
  fontSize: FONT.small,
  boxShadow: '0 3px 0 #4e9c33',
})

export const xpText = style({
  fontWeight: 900,
  fontSize: FONT.aux,
  color: '#fff',
  textShadow: '0 1px 2px rgba(60, 110, 180, .6)',
})

/* 地块热点按钮（位置由内联 place(cell) 给） */
export const plotBtn = style({
  border: 'none',
  background: 'transparent',
  padding: 0,
  cursor: 'pointer',
})

/* 地块内容（相对地块热点定位） */
export const plantBtnImg = style({
  position: 'absolute',
  left: '50%',
  top: '50%',
  width: '42%',
  transform: 'translate(-50%, -50%)',
  objectFit: 'contain',
})

export const sproutsImg = style({
  position: 'absolute',
  left: '50%',
  top: '14%',
  width: '58%',
  transform: 'translateX(-50%)',
  objectFit: 'contain',
})

/* 倒计时小气泡：地块右上角，不挡植物 */
export const cdBubble = style({
  position: 'absolute',
  top: '10%',
  right: '8%',
  padding: '3px 12px',
  borderRadius: '999px',
  background: 'rgba(255, 255, 255, .95)',
  border: '2px solid #6fb3e8',
  color: '#2b6cb0',
  fontWeight: 900,
  fontSize: FONT.aux,
  boxShadow: '0 3px 6px rgba(40, 90, 160, .25)',
  whiteSpace: 'nowrap',
})

export const fruitImg = style({
  position: 'absolute',
  left: '50%',
  top: '46%',
  width: '52%',
  transform: 'translate(-50%, -50%)',
  objectFit: 'contain',
  filter: 'drop-shadow(0 6px 8px rgba(60, 30, 10, .35))',
})

/* 注意：farmReady 动画的 transform 会覆盖 fruitImg 的 transform，
   必须把 translate(-50%,-50%) 写进 keyframes，否则果实锚点失效向右下偏移 */
const farmReady = keyframes({
  '0%, 100%': { transform: 'translate(-50%, -50%) scale(1)' },
  '50%': { transform: 'translate(-50%, -50%) scale(1.08)' },
})

export const fruitReady = style({
  animation: `${farmReady} 1.2s ease-in-out infinite`,
})

export const readyTag = style({
  position: 'absolute',
  left: '50%',
  bottom: '6%',
  transform: 'translateX(-50%)',
  padding: '2px 14px',
  borderRadius: '999px',
  background: '#ffec99',
  color: '#8a6d1d',
  fontWeight: 900,
  fontSize: FONT.aux,
  whiteSpace: 'nowrap',
  boxShadow: '0 3px 6px rgba(60, 30, 10, .25)',
})

/* 仓库按钮：右下角橙色胶囊 */
export const warehouseBtn = style({
  position: 'absolute',
  right: '28px',
  bottom: '24px',
  height: '60px',
  padding: '0 34px',
  borderRadius: '999px',
  border: 'none',
  background: 'linear-gradient(180deg, #ffd83d, #ffb020)',
  color: '#7a4a12',
  fontWeight: 900,
  fontSize: FONT.h2,
  boxShadow: '0 5px 0 #e08f00',
  fontFamily: '"Baloo 2", "Comic Sans MS", "Microsoft YaHei", system-ui, sans-serif',
  cursor: 'pointer',
})

export const coldHint = style({
  position: 'absolute',
  bottom: '118px',
  left: '50%',
  transform: 'translateX(-50%)',
  padding: '8px 22px',
  borderRadius: '999px',
  background: '#fff',
  border: '3px solid #cdeab6',
  color: '#5da23f',
  fontWeight: 900,
  fontSize: FONT.small,
  boxShadow: '0 6px 12px rgba(90, 150, 80, .2)',
  fontFamily: '"Baloo 2", "Comic Sans MS", "Microsoft YaHei", system-ui, sans-serif',
  whiteSpace: 'nowrap',
})

export const fly = style({
  position: 'absolute',
  top: '240px',
  left: '50%',
  transform: 'translateX(-50%)',
  padding: '8px 20px',
  borderRadius: '999px',
  background: '#e8f5e9',
  border: '2px solid #7ed957',
  color: '#3e9c4c',
  fontWeight: 900,
  fontSize: FONT.body,
  whiteSpace: 'nowrap',
  fontFamily: '"Baloo 2", "Comic Sans MS", "Microsoft YaHei", system-ui, sans-serif',
  zIndex: 30,
})

/* 面板内部（种子袋 / 仓库共用） */
export const panel = style({
  display: 'flex',
  flexDirection: 'column',
  gap: '14px',
  alignItems: 'center',
  width: '100%',
  fontFamily: '"Baloo 2", "Comic Sans MS", "Microsoft YaHei", system-ui, sans-serif',
})

export const panelTitle = style({
  fontSize: FONT.h2,
  fontWeight: 900,
  color: '#3f4d5c',
})

export const panelList = style({
  display: 'flex',
  flexDirection: 'column',
  gap: '10px',
  width: '100%',
  maxHeight: '440px',
  overflowY: 'auto',
  padding: '2px',
})

export const cropRow = style({
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
  padding: '8px 12px',
  borderRadius: '16px',
  background: '#f7faf4',
  border: '2px solid #e3eee0',
})

export const cropIcon = style({
  width: '52px',
  height: '52px',
  objectFit: 'contain',
})

export const cropMeta = style({
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  gap: '2px',
})

export const cropName = style({
  fontWeight: 900,
  fontSize: FONT.body,
  color: '#3f4d5c',
})

export const cropSub = style({
  fontWeight: 800,
  fontSize: FONT.micro,
  color: '#8a97a3',
})

export const rowActions = style({
  display: 'flex',
  gap: '8px',
})

export const smallBuyBtn = style({
  height: '40px',
  padding: '0 14px',
  borderRadius: '999px',
  border: 'none',
  background: '#fff3e0',
  color: '#ad6800',
  fontWeight: 900,
  fontSize: FONT.aux,
  fontFamily: '"Baloo 2", "Comic Sans MS", "Microsoft YaHei", system-ui, sans-serif',
})

export const plantBtn = style({
  height: '40px',
  padding: '0 18px',
  borderRadius: '999px',
  border: 'none',
  background: 'linear-gradient(180deg, #9be15d, #6cc24a)',
  color: '#fff',
  fontWeight: 900,
  fontSize: FONT.small,
  boxShadow: '0 4px 0 #4e9c33',
  fontFamily: '"Baloo 2", "Comic Sans MS", "Microsoft YaHei", system-ui, sans-serif',
})

export const seedGrid = style({
  display: 'grid',
  gridTemplateColumns: 'repeat(3, 1fr)',
  gap: '12px',
  width: '100%',
})

export const whCell = style({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: '4px',
  padding: '12px',
  borderRadius: '16px',
  background: '#f7faf4',
  border: '2px solid #e3eee0',
})

export const whIcon = style({
  width: '48px',
  height: '48px',
  objectFit: 'contain',
})

export const whFoot = style({
  display: 'flex',
  alignItems: 'center',
  gap: '14px',
  justifyContent: 'center',
})

export const whFlower = style({
  fontWeight: 900,
  fontSize: FONT.body,
  color: '#ad6800',
})

export const sellFly = style({
  fontWeight: 900,
  fontSize: FONT.small,
  color: '#3e9c4c',
})
