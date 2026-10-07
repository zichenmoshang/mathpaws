// PetPanelScene 局部样式（vanilla-extract；1024×768 逻辑像素）
// 数值与迁移前 CSS Modules 完全一致；5 组动画（宠物蹦跳/光柱旋转/彩带下落/星心跳动/立绘弹入）
// 为本文件局部 keyframes；彩带与星心的 animationDelay 经 createVar 插槽由 tsx 注入。
import { createVar, fallbackVar, keyframes, style } from '@vanilla-extract/css'

/* 舞台外出血背景：cover 铺满视口留边 */
export const bleedBg = style({
  display: 'block',
  width: '100%',
  height: '100%',
  objectFit: 'cover',
})

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
  fontSize: '24px',
  color: '#9a6a24',
  textShadow: '0 2px 0 rgba(255, 255, 255, .8)',
})

export const pkBtn = style({
  position: 'absolute',
  right: '40px',
  top: '92px',
  height: '34px',
  padding: '0 16px',
  borderRadius: '999px',
  border: 'none',
  background: 'linear-gradient(180deg, #ffb35c, #ff9f33)',
  color: '#fff',
  fontWeight: 900,
  fontSize: '15px',
  boxShadow: '0 4px 0 #e07f1a',
  cursor: 'pointer',
})

/* 中心立绘按钮（位置由内联 place(BBOX.hero) 给） */
export const heroBtn = style({
  border: 'none',
  background: 'transparent',
  padding: 0,
  cursor: 'pointer',
})

export const heroImg = style({
  width: '100%',
  height: '100%',
  objectFit: 'contain',
  filter: 'drop-shadow(0 8px 12px rgba(120, 80, 40, .25))',
})

const petBounceKf = keyframes({
  '0%, 100%': { transform: 'translateY(0) scaleY(1)' },
  '30%': { transform: 'translateY(-14px) scaleY(1.02)' },
  '55%': { transform: 'translateY(0) scaleY(.96)' },
  '75%': { transform: 'translateY(-6px) scaleY(1)' },
})

export const petBounce = style({
  animation: `${petBounceKf} 1.8s ease-in-out infinite`,
})

export const cheer = style({
  position: 'absolute',
  top: '-6px',
  right: '-30px',
  padding: '6px 14px',
  borderRadius: '999px',
  background: '#fff0f5',
  border: '2px solid #ffb3c8',
  color: '#e0638f',
  fontWeight: 900,
  fontSize: '16px',
  whiteSpace: 'nowrap',
})

/* 名字（立绘与进度条之间） */
export const name = style({
  position: 'absolute',
  left: '224px',
  top: '415px',
  width: '418px', /* 面板居中（非舞台居中） */
  textAlign: 'center',
  fontWeight: 900,
  fontSize: '22px',
  color: '#8a6d3b',
  pointerEvents: 'none',
})

export const lvBadge = style({
  position: 'absolute',
  padding: '2px 10px',
  borderRadius: '999px',
  background: '#f6b929',
  color: '#fff',
  fontWeight: 900,
  fontSize: '15px',
  boxShadow: '0 3px 0 #d4940a',
})

/* 等级进度条容器（位置由内联 place(BBOX.expBar) 给） */
export const expBar = style({
  display: 'flex',
  alignItems: 'center',
})

export const expText = style({
  position: 'absolute',
  display: 'flex',
  alignItems: 'center',
  fontWeight: 900,
  fontSize: '15px',
  color: '#a08a5a',
})

/* 进化提示（进度条与相框之间） */
export const evoHint = style({
  position: 'absolute',
  left: '224px',
  top: '467px',
  width: '418px', /* 进度条（底 465）与相框（顶 481）之间 */
  textAlign: 'center',
  fontWeight: 900,
  fontSize: '13px',
  color: '#e0638f',
  pointerEvents: 'none',
})

/* 进化轨道相框（外框缩至 92% 居中：给上方进化提示留出可视间隙） */
export const evoFrame = style({
  position: 'absolute',
  inset: '4%',
  width: '92%',
  height: '92%',
  objectFit: 'contain',
})

export const evoStageImg = style({
  position: 'absolute',
  left: '20%',
  top: '12%',
  width: '60%',
  height: '56%',
  objectFit: 'contain',
})

export const evoLock = style({
  position: 'absolute',
  right: '10%',
  bottom: '10%',
  width: '24%',
  height: '24%',
  objectFit: 'contain',
})

export const frameLabel = style({
  position: 'absolute',
  left: 0,
  right: 0,
  bottom: '9%',
  textAlign: 'center',
  fontWeight: 900,
  fontSize: '12px',
  color: '#b08d4a',
  pointerEvents: 'none',
})

/* 圆形图钮（喂食 / 改名） */
export const roundBtn = style({
  position: 'absolute',
  left: 0,
  top: 0,
  width: '100%',
  height: '78%',
  border: 'none',
  background: 'transparent',
  padding: 0,
})

export const roundBtnImg = style({
  width: '100%',
  height: '100%',
  objectFit: 'contain',
})

export const foodBubble = style({
  position: 'absolute',
  top: '-22px',
  left: '50%',
  transform: 'translateX(-50%)',
  padding: '2px 12px',
  borderRadius: '999px',
  background: '#fff',
  border: '2px solid #ffd9e6',
  fontWeight: 900,
  fontSize: '14px',
  color: '#e0638f',
  whiteSpace: 'nowrap',
  boxShadow: '0 3px 6px rgba(200, 100, 140, .18)',
  zIndex: 2,
})

/* 按钮名标签：容器内底部（不再负偏移贴面板边） */
export const btnLabel = style({
  position: 'absolute',
  left: 0,
  right: 0,
  bottom: 0,
  textAlign: 'center',
  fontWeight: 900,
  fontSize: '15px',
  color: '#a08a5a',
  pointerEvents: 'none',
})

/* 右侧宠物格 */
export const gridCell = style({
  border: 'none',
  background: 'transparent',
  padding: 0,
})

export const gridImg = style({
  position: 'absolute',
  inset: 0,
  width: '100%',
  height: '100%',
  objectFit: 'contain',
})

export const gridCore = style({
  position: 'absolute',
  left: '20%',
  top: '18%',
  width: '60%',
  height: '60%',
  objectFit: 'contain',
})

export const gridLock = style({
  position: 'absolute',
  right: '8%',
  bottom: '8%',
  width: '22%',
  height: '22%',
  objectFit: 'contain',
})

export const gridLockLabel = style({
  position: 'absolute',
  left: 0,
  right: 0,
  bottom: '4%',
  textAlign: 'center',
  fontWeight: 800,
  fontSize: '12px',
  color: '#9aa6b0',
})

export const gridOwn = style({
  position: 'absolute',
  top: '6%',
  left: '6%',
  padding: '1px 8px',
  borderRadius: '999px',
  background: '#7ed957',
  color: '#fff',
  fontWeight: 800,
  fontSize: '12px',
})

export const feedFly = style({
  position: 'absolute',
  top: '380px',
  left: '50%',
  transform: 'translateX(-50%)',
  padding: '8px 20px',
  borderRadius: '999px',
  background: '#e8f5e9',
  border: '2px solid #7ed957',
  color: '#3e9c4c',
  fontWeight: 900,
  fontSize: '18px',
  whiteSpace: 'nowrap',
  zIndex: 30,
})

/* 改名弹窗 */
export const renameBox = style({
  display: 'flex',
  flexDirection: 'column',
  gap: '16px',
  alignItems: 'center',
  minWidth: '300px',
})

export const renameTitle = style({
  fontSize: '22px',
  fontWeight: 900,
  color: '#3f4d5c',
})

export const renameActions = style({
  display: 'flex',
  gap: '12px',
})

/* 注意：Btn ghost 变体是白字+近透明白底，白 Modal 上不可见，禁用 */
export const renameCancel = style({
  height: '52px',
  padding: '0 28px',
  borderRadius: '14px',
  border: 'none',
  background: '#eceff1',
  color: '#546e7a',
  fontWeight: 900,
  fontSize: '20px',
  fontFamily: '"Baloo 2", "Comic Sans MS", "Microsoft YaHei", system-ui, sans-serif',
  cursor: 'pointer',
})

/* 进化仪式全屏层 */
export const ceremonyMask = style({
  position: 'absolute',
  inset: 0,
  zIndex: 60,
  overflow: 'hidden',
  background: 'radial-gradient(circle at 50% 40%, rgba(80, 60, 160, .55), rgba(20, 30, 80, .78))',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontFamily: '"Baloo 2", "Comic Sans MS", "Microsoft YaHei", system-ui, sans-serif',
})

const evoBeamSpinKf = keyframes({
  from: { transform: 'translate(-50%, -50%) rotate(0deg)' },
  to: { transform: 'translate(-50%, -50%) rotate(360deg)' },
})

export const evoBeam = style({
  position: 'absolute',
  left: '50%',
  top: '42%',
  width: '160%',
  aspectRatio: '1',
  background: 'conic-gradient(from 0deg, rgba(255, 236, 150, .5) 0deg 14deg, transparent 14deg 36deg, rgba(255, 236, 150, .5) 36deg 50deg, transparent 50deg 72deg, rgba(255, 236, 150, .5) 72deg 86deg, transparent 86deg 108deg, rgba(255, 236, 150, .5) 108deg 122deg, transparent 122deg 144deg, rgba(255, 236, 150, .5) 144deg 158deg, transparent 158deg 180deg, rgba(255, 236, 150, .5) 180deg 194deg, transparent 194deg 216deg, rgba(255, 236, 150, .5) 216deg 230deg, transparent 230deg 252deg, rgba(255, 236, 150, .5) 252deg 266deg, transparent 266deg 288deg, rgba(255, 236, 150, .5) 288deg 302deg, transparent 302deg 324deg, rgba(255, 236, 150, .5) 324deg 338deg, transparent 338deg 360deg)',
  maskImage: 'radial-gradient(circle, #000 12%, rgba(0, 0, 0, .5) 46%, transparent 68%)',
  WebkitMaskImage: 'radial-gradient(circle, #000 12%, rgba(0, 0, 0, .5) 46%, transparent 68%)',
  animation: `${evoBeamSpinKf} 9s linear infinite`,
})

/** 彩带下落延迟插槽（tsx 按 CONFETTI 项注入） */
export const confettiDelayVar = createVar()

const evoFallKf = keyframes({
  '0%': { top: '-6%', transform: 'rotate(0deg)', opacity: 1 },
  '90%': { opacity: 1 },
  '100%': { top: '104%', transform: 'rotate(540deg)', opacity: 0 },
})

export const evoConfetti = style({
  position: 'absolute',
  top: '-6%',
  width: '12px',
  height: '20px',
  borderRadius: '3px',
  animation: `${evoFallKf} 2.6s ease-in infinite`,
  animationDelay: confettiDelayVar,
})

/** 星心跳动延迟插槽（tsx 按需注入，未注入取 0s） */
export const orbitDelayVar = createVar()

const evoOrbitPopKf = keyframes({
  '0%, 100%': { transform: 'scale(1)' },
  '50%': { transform: 'scale(1.25)' },
})

export const orbitIcon = style({
  position: 'absolute',
  width: '44px',
  height: '44px',
  objectFit: 'contain',
  filter: 'drop-shadow(0 4px 8px rgba(0, 0, 0, .3))',
  animation: `${evoOrbitPopKf} 1.4s ease-in-out infinite`,
  animationDelay: fallbackVar(orbitDelayVar, '0s'),
})

export const ceremonyCard = style({
  position: 'relative',
  zIndex: 2,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: '10px',
})

export const ceremonyTitle = style({
  fontSize: '44px',
  fontWeight: 900,
  color: '#ffe98a',
  textShadow: '0 3px 0 rgba(150, 90, 10, .6), 0 8px 18px rgba(0, 0, 0, .4)',
})

const evoPetInKf = keyframes({
  '0%': { transform: 'scale(.2)', opacity: 0 },
  '60%': { transform: 'scale(1.12)', opacity: 1 },
  '100%': { transform: 'scale(1)', opacity: 1 },
})

export const ceremonyImg = style({
  width: '260px',
  height: '260px',
  objectFit: 'contain',
  filter: 'drop-shadow(0 12px 22px rgba(0, 0, 0, .45))',
  animation: `${evoPetInKf} .6s cubic-bezier(.2, 1.4, .4, 1) both`,
})

export const ceremonyForm = style({
  fontSize: '24px',
  fontWeight: 900,
  color: '#fff',
})

export const ceremonyBtn = style({
  marginTop: '8px',
  height: '54px',
  padding: '0 40px',
  borderRadius: '999px',
  border: 'none',
  background: 'linear-gradient(180deg, #ffd83d, #ffb020)',
  color: '#7a4a12',
  fontWeight: 900,
  fontSize: '21px',
  boxShadow: '0 6px 0 #e08f00',
  cursor: 'pointer',
})
