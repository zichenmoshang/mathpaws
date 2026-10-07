// GachaScene 样式（vanilla-extract）
// 共享动画引自 styles/motion.css；稀有度配色走 styleVariants（RARITY_TONE）；
// 浮动环位置/延迟、十连小格弹出延迟走 createVar 插槽；开盒状态、尺寸切换等
// 值通道仍由 tsx 内联注入。font-family 取值与 @mathpaws/ui 的 FONT.family 一致；
// 999px 圆角即 R.pill；#78909C 即 C.inkSoft。
import {
  createVar, fallbackVar, style, styleVariants,
} from '@vanilla-extract/css'

import {
  mpCardFloat, mpChestBob, mpFadeIn, mpFloat, mpGlowPulse, mpPanelIn, mpPopIn, mpRaysSpin,
} from '../../styles/motion.css'

// 稀有度配色（原 tsx GLOW 表迁入）：edge=卡框/光芒色，glow=发光色，soft=内底浅色；
// name=卡名色，与 config/cosmetics 的 RARITY_META.color 对齐。
const RARITY_TONE = {
  normal: { edge: '#4EA8F5', glow: 'rgba(90,176,255,.65)', soft: '#EAF4FE', name: '#1565c0' },
  rare: { edge: '#A85CF5', glow: 'rgba(177,92,245,.72)', soft: '#F6ECFD', name: '#7b1fa2' },
  legendary: { edge: '#FFB300', glow: 'rgba(255,206,61,.82)', soft: '#FFF8E3', name: '#f57f17' },
} as const

// 四角浮动环：位置（上/下/左/右）与动画延迟插槽，由 tsx 按 FLOAT_POS/序号注入
export const floatTop = createVar()
export const floatBottom = createVar()
export const floatLeft = createVar()
export const floatRight = createVar()
export const floatDelay = createVar()

// 十连小格：逐格弹出延迟插槽（随序号递增）
export const miniDelay = createVar()

/* ---- 场景骨架 ---- */
export const root = style({
  position: 'absolute',
  inset: 0,
  overflow: 'hidden',
  fontFamily: '"Baloo 2", "Comic Sans MS", "Microsoft YaHei", system-ui, sans-serif',
})

export const shellPill = style({
  position: 'absolute',
  top: '14px',
  right: '14px',
  zIndex: 10,
  display: 'inline-flex',
  alignItems: 'center',
  gap: '8px',
  height: '44px',
  padding: '0 16px',
  borderRadius: '999px',
  background: 'rgba(0, 0, 0, .28)',
  border: '2px solid rgba(255, 255, 255, .25)',
})

export const shellCount = style({
  color: '#fff',
  fontWeight: 900,
  fontSize: '22px',
})

export const pityRow = style({
  position: 'absolute',
  top: '14px',
  left: '50%',
  translate: '-50% 0',
  display: 'flex',
  gap: '12px',
  zIndex: 9,
})

export const chestWrap = style({
  position: 'absolute',
  top: '46%',
  left: '50%',
  translate: '-50% -50%',
})

export const bottomBar = style({
  position: 'absolute',
  bottom: '24px',
  left: 0,
  right: 0,
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  gap: '24px',
  padding: '0 20px',
})

/* ---- 中央学盒 ---- */
export const chest = style({
  position: 'relative',
  width: 'clamp(210px, 34vmin, 330px)',
  aspectRatio: '640 / 660',
  animation: `${mpChestBob} 3s ease-in-out infinite`,
})

export const chestGlow = style({
  position: 'absolute',
  inset: '-30%',
  width: '160%',
  height: '160%',
  animation: `${mpGlowPulse} 2.6s ease-in-out infinite`,
})

export const chestImg = style({
  position: 'absolute',
  inset: 0,
  width: '100%',
  height: '100%',
  objectFit: 'contain',
  transition: 'opacity .28s',
})

/* 开盒态：多一个 transform 过渡（定义顺序在 chestImg 之后，覆盖其 transition） */
export const chestImgOpen = style({
  transition: 'opacity .28s, transform .28s',
})

/* ---- 四角浮动金环 ---- */
export const floatRing = style({
  position: 'absolute',
  top: fallbackVar(floatTop, 'auto'),
  bottom: fallbackVar(floatBottom, 'auto'),
  left: fallbackVar(floatLeft, 'auto'),
  right: fallbackVar(floatRight, 'auto'),
  width: 'clamp(88px, 13vmin, 130px)',
  aspectRatio: '1',
  borderRadius: '50%',
  padding: 'clamp(9px, 1.4vmin, 13px)',
  /* 立体金环：顶亮 -> 中部金 -> 底部深金 */
  background: 'linear-gradient(160deg, #FFF6C4 0%, #FFD968 30%, #F2A51C 62%, #B9760A 100%)',
  boxShadow: `0 10px 22px rgba(0, 0, 0, .38),
    0 0 14px rgba(255, 214, 90, .45),
    inset 0 2px 3px rgba(255, 255, 255, .85),
    inset 0 -3px 6px rgba(120, 70, 0, .55)`,
  animation: `${mpFloat} 3.4s ease-in-out infinite`,
  animationDelay: fallbackVar(floatDelay, '0s'),
})

export const floatRingInner = style({
  position: 'relative',
  width: '100%',
  height: '100%',
  borderRadius: '50%',
  overflow: 'hidden',
  /* 内圈透明，透出深蓝星空背景；仅加内阴影与极淡径向暗角增加凹陷感 */
  background: 'radial-gradient(circle at 50% 45%, rgba(20, 46, 120, 0), rgba(8, 20, 64, .28))',
  boxShadow: `inset 0 2px 4px rgba(255, 240, 180, .35),
    inset 0 -4px 8px rgba(6, 14, 46, .55)`,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
})

export const floatRingImg = style({
  width: '84%',
  height: '84%',
  objectFit: 'contain',
})

/* ---- 稀有度大卡 ---- */
export const featuredCard = style({
  position: 'relative',
  aspectRatio: '3 / 4',
  animation: `${mpCardFloat} 3.6s ease-in-out infinite`,
})

/* 旋转放射光芒（conic-gradient 背景按稀有度变体注入，叠在大卡背后） */
export const rays = style({
  position: 'absolute',
  top: '50%',
  left: '50%',
  width: '135%',
  aspectRatio: '1',
  translate: '-50% -50%',
  borderRadius: '50%',
  WebkitMaskImage: 'radial-gradient(circle, #000 18%, rgba(0, 0, 0, .55) 52%, transparent 72%)',
  maskImage: 'radial-gradient(circle, #000 18%, rgba(0, 0, 0, .55) 52%, transparent 72%)',
  opacity: 0.5,
  animation: `${mpRaysSpin} 22s linear infinite`,
})

export const cardFrame = style({
  position: 'absolute',
  inset: 0,
  borderRadius: '22px',
  padding: '6px',
})

export const cardInner = style({
  position: 'relative',
  width: '100%',
  height: '100%',
  borderRadius: '17px',
  overflow: 'hidden',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'flex-end',
  padding: '14px 10px 12px',
})

export const cardStarA = style({
  position: 'absolute',
  opacity: 0.9,
})

export const cardStarB = style({
  position: 'absolute',
  opacity: 0.8,
})

export const cardImg = style({
  position: 'absolute',
  top: '16%',
  left: 0,
  right: 0,
  margin: 'auto',
  width: '72%',
  aspectRatio: '1',
  objectFit: 'contain',
})

export const cardName = style({
  fontWeight: 900,
  lineHeight: 1.15,
  fontFamily: '"Baloo 2", "Comic Sans MS", "Microsoft YaHei", system-ui, sans-serif',
  textAlign: 'center',
})

export const cardSlot = style({
  color: '#78909C', // C.inkSoft
  fontWeight: 800,
  fontFamily: '"Baloo 2", "Comic Sans MS", "Microsoft YaHei", system-ui, sans-serif',
})

/* 稀有度变体：光芒底色 / 卡框渐变+发光 / 内底渐变 / 图标投影 / 卡名色 */
export const raysTone = styleVariants(RARITY_TONE, t => ({
  background: `conic-gradient(from 0deg, ${t.edge} 0deg 12deg, transparent 12deg 30deg, ${t.edge} 30deg 42deg, transparent 42deg 60deg, ${t.edge} 60deg 72deg, transparent 72deg 90deg, ${t.edge} 90deg 102deg, transparent 102deg 120deg, ${t.edge} 120deg 132deg, transparent 132deg 150deg, ${t.edge} 150deg 162deg, transparent 162deg 180deg)`,
}))

export const cardFrameTone = styleVariants(RARITY_TONE, t => ({
  background: `linear-gradient(160deg, ${t.edge}, #fff 40%, ${t.edge})`,
  boxShadow: `0 0 26px ${t.glow}, 0 16px 30px rgba(0,0,0,.28)`,
}))

export const cardInnerTone = styleVariants(RARITY_TONE, t => ({
  background: `radial-gradient(circle at 50% 32%, #fff, ${t.soft} 78%)`,
}))

export const cardImgTone = styleVariants(RARITY_TONE, t => ({
  filter: `drop-shadow(0 8px 10px ${t.glow})`,
}))

export const cardNameTone = styleVariants(RARITY_TONE, t => ({
  color: t.name,
}))

/* ---- 十连小格 ---- */
export const miniCard = style({
  position: 'relative',
  borderRadius: '13px',
  padding: '3px',
  boxShadow: '0 3px 6px rgba(0,0,0,.18)',
  animation: `${mpPopIn} .35s both`,
  animationDelay: fallbackVar(miniDelay, '0s'),
})

export const miniDup = style({
  position: 'absolute',
  top: '3px',
  left: '3px',
  zIndex: 2,
  background: '#eceff1',
  color: '#546e7a',
  fontSize: '9px',
  fontWeight: 800,
  lineHeight: 1,
  padding: '2px 5px',
  borderRadius: '999px',
  whiteSpace: 'nowrap',
  fontFamily: '"Baloo 2", "Comic Sans MS", "Microsoft YaHei", system-ui, sans-serif',
})

export const miniImgWrap = style({
  width: '100%',
  aspectRatio: '1',
  borderRadius: '10px',
  overflow: 'hidden',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
})

export const miniImg = style({
  width: '78%',
  height: '78%',
  objectFit: 'contain',
})

export const miniName = style({
  fontWeight: 900,
  fontSize: '10px',
  lineHeight: 1.1,
  textAlign: 'center',
  fontFamily: '"Baloo 2", "Comic Sans MS", "Microsoft YaHei", system-ui, sans-serif',
  padding: '2px 1px 3px',
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
})

/* 稀有度变体：小格渐变 / 最佳奖励发光（定义在 miniCard 之后以覆盖基础投影）/ 图标底 / 小格卡名色 */
export const miniCardTone = styleVariants(RARITY_TONE, t => ({
  background: `linear-gradient(160deg, ${t.edge}, ${t.soft})`,
}))

export const miniCardFeaturedTone = styleVariants(RARITY_TONE, t => ({
  boxShadow: `0 0 0 2px #fff, 0 0 10px ${t.glow}`,
}))

export const miniImgWrapTone = styleVariants(RARITY_TONE, t => ({
  background: `radial-gradient(circle at 50% 38%, #fff, ${t.soft} 80%)`,
}))

export const miniNameTone = styleVariants(RARITY_TONE, t => ({
  color: t.name,
}))

/* ---- 结果弹窗 ---- */
export const overlay = style({
  position: 'absolute',
  inset: 0,
  zIndex: 40,
  background: 'radial-gradient(circle at 50% 30%, rgba(60, 40, 120, .66), rgba(6, 12, 42, .8))',
  backdropFilter: 'blur(2px)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '16px',
  animation: `${mpFadeIn} .25s both`,
})

export const panel = style({
  position: 'relative',
  maxHeight: '94vh',
  animation: `${mpPanelIn} .42s cubic-bezier(.2, 1.2, .4, 1) both`,
})

export const decoStarMain = style({
  position: 'absolute',
  top: '-18px',
  left: '50%',
  translate: '-50% 0',
  zIndex: 3,
  filter: 'drop-shadow(0 4px 6px rgba(0, 0, 0, .3))',
})

export const decoStarLeft = style({
  position: 'absolute',
  top: '-6px',
  left: 'calc(50% - 64px)',
  zIndex: 2,
})

export const decoStarRight = style({
  position: 'absolute',
  top: '-6px',
  left: 'calc(50% + 44px)',
  zIndex: 2,
})

export const decoStarSmall = style({
  opacity: 0.95,
})

export const goldBead = style({
  position: 'absolute',
  top: '30px',
  zIndex: 3,
  width: '26px',
  height: '26px',
  borderRadius: '50%',
  background: 'radial-gradient(circle at 35% 30%, #FFF6BF, #E6A23C)',
  boxShadow: '0 3px 6px rgba(0, 0, 0, .3)',
})

export const goldBeadLeft = style({
  left: '-8px',
})

export const goldBeadRight = style({
  right: '-8px',
})

export const panelFrame = style({
  borderRadius: '30px',
  padding: '7px',
  background: 'linear-gradient(180deg, #FFF3B0 0%, #FFD25A 40%, #E69A24 80%, #C47E16 100%)',
  boxShadow: `0 0 26px rgba(255, 210, 90, .5),
    0 22px 50px rgba(0, 0, 0, .5),
    inset 0 2px 3px rgba(255, 255, 255, .8)`,
})

export const panelBody = style({
  borderRadius: '24px',
  maxHeight: 'calc(94vh - 14px)',
  overflowY: 'auto',
  overflowX: 'hidden',
  background: 'linear-gradient(180deg, #FFFDF6 0%, #FFF6E2 60%, #FFF1D4 100%)',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
})

export const banner = style({
  position: 'relative',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  minWidth: '62%',
  padding: '0 28px',
  borderRadius: '999px',
  background: 'linear-gradient(180deg, #FFD866 0%, #F5A623 100%)',
  boxShadow: '0 4px 8px rgba(180, 110, 10, .4), inset 0 2px 2px rgba(255, 255, 255, .7)',
})

export const bannerText = style({
  color: '#fff',
  fontWeight: 900,
  fontFamily: '"Baloo 2", "Comic Sans MS", "Microsoft YaHei", system-ui, sans-serif',
  whiteSpace: 'nowrap',
})

export const tenGrid = style({
  display: 'grid',
  gridTemplateColumns: 'repeat(5, minmax(0, 1fr))',
  gap: '7px',
  width: '100%',
})

export const actions = style({
  display: 'flex',
  gap: '12px',
  alignItems: 'center',
  marginTop: '2px',
})

export const goBackpackBtn = style({
  minWidth: '150px',
  border: 'none',
  borderRadius: '999px',
  background: 'linear-gradient(180deg, #9fd0f5, #6fb3e8)',
  color: '#fff',
  fontWeight: 900,
  fontSize: '19px',
  fontFamily: '"Baloo 2", "Comic Sans MS", "Microsoft YaHei", system-ui, sans-serif',
  boxShadow: '0 4px 0 #4a8fc4',
  cursor: 'pointer',
  textShadow: '0 1px 2px rgba(40, 90, 140, .5)',
})

export const okBtn = style({
  position: 'relative',
  minWidth: '190px',
  border: 'none',
  background: 'transparent',
})

export const okBtnLayer1 = style({
  position: 'absolute',
  inset: 0,
  borderRadius: '999px',
  background: 'linear-gradient(180deg, #FFF3B0 0%, #FFD25A 42%, #E69A24 80%, #C47E16 100%)',
})

export const okBtnLayer2 = style({
  position: 'absolute',
  inset: '5px',
  borderRadius: '999px',
  background: 'linear-gradient(180deg, #FFD866 0%, #F5A623 100%)',
})

export const okBtnLayer3 = style({
  position: 'absolute',
  inset: '5px',
  borderRadius: '999px',
  background: 'linear-gradient(180deg, rgba(255, 255, 255, .65), rgba(255, 255, 255, 0) 45%)',
})

export const okBtnStarLeft = style({
  position: 'absolute',
  left: '18px',
  top: '50%',
  translate: '0 -50%',
  zIndex: 2,
})

export const okBtnStarRight = style({
  position: 'absolute',
  right: '18px',
  top: '50%',
  translate: '0 -50%',
  zIndex: 2,
})

export const okBtnText = style({
  position: 'relative',
  zIndex: 2,
  color: '#fff',
  fontWeight: 900,
  fontSize: '22px',
  fontFamily: '"Baloo 2", "Comic Sans MS", "Microsoft YaHei", system-ui, sans-serif',
})

/* ---- 顶部保底胶囊 ---- */
export const pity = style({
  position: 'relative',
  display: 'inline-flex',
  alignItems: 'center',
  gap: '6px',
  height: '36px',
  padding: '0 14px 9px',
  borderRadius: '999px',
  overflow: 'hidden',
  background: 'linear-gradient(180deg, #3E9BEF 0%, #2E86DE 52%, #1F63B8 100%)',
  boxShadow: `0 0 0 2px #E8A93A,
    0 3px 6px rgba(0, 0, 0, .3),
    inset 0 1px 2px rgba(255, 255, 255, .5)`,
  whiteSpace: 'nowrap',
})

export const pityLabel = style({
  color: '#fff',
  fontWeight: 800,
  fontSize: '13px',
  textShadow: '0 1px 1px rgba(0, 0, 0, .35)',
})

export const pityTrack = style({
  position: 'absolute',
  left: '8px',
  right: '8px',
  bottom: '4px',
  height: '5px',
  borderRadius: '999px',
  background: 'rgba(9, 40, 92, .55)',
  boxShadow: 'inset 0 1px 2px rgba(0, 0, 0, .45)',
})

export const pityFill = style({
  display: 'block',
  height: '100%',
  borderRadius: '999px',
  background: 'linear-gradient(180deg, #FFF3B0, #FFD24A 55%, #F0A824)',
  boxShadow: '0 0 5px rgba(255, 210, 80, .8)',
})

/* ---- 底部抽卡按钮 ---- */
export const drawBtn = style({
  position: 'relative',
  height: '80px',
  minWidth: '212px',
  border: 'none',
  color: '#fff',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '12px',
  fontFamily: '"Baloo 2", "Comic Sans MS", "Microsoft YaHei", system-ui, sans-serif',
  userSelect: 'none',
  background: 'transparent',
})

export const drawBtnSun = style({
  padding: '0 30px',
  borderRadius: '999px',
})

export const drawBtnSky = style({
  padding: '0 34px 0 32px',
  borderRadius: 0,
  filter: 'drop-shadow(0 6px 8px rgba(0, 0, 0, .38))',
})

export const drawLabel = style({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'flex-start',
  lineHeight: 1.12,
  position: 'relative',
  zIndex: 2,
})

export const drawTitle = style({
  fontSize: '25px',
  fontWeight: 900,
  color: '#fff',
})

export const drawCost = style({
  fontSize: '18px',
  fontWeight: 800,
  color: '#fff',
})

export const flagImg = style({
  position: 'absolute',
  inset: 0,
  width: '100%',
  height: '100%',
  objectFit: 'fill',
  pointerEvents: 'none',
})

export const shellWrap = style({
  position: 'relative',
  zIndex: 2,
  display: 'flex',
})

export const sunLayer1 = style({
  position: 'absolute',
  inset: 0,
  borderRadius: '999px',
  background: 'linear-gradient(180deg, #FFF3B0 0%, #FFD25A 42%, #E69A24 78%, #C47E16 100%)',
})

export const sunLayer2 = style({
  position: 'absolute',
  inset: '6px',
  borderRadius: '999px',
  background: 'linear-gradient(180deg, #FFE88F 0%, #FFCE3D 48%, #F5A623 100%)',
})

export const sunLayer3 = style({
  position: 'absolute',
  inset: '6px',
  borderRadius: '999px',
  background: 'linear-gradient(180deg, rgba(255, 255, 255, .6), rgba(255, 255, 255, 0) 40%)',
})

/* ---- 高保真按钮文字描边（原 tsx textStroke() 的多方向 text-shadow，逐方向展开） ---- */
export const strokeSun = style({
  textShadow: `-2px -1px 0 #A8620A, 2px -1px 0 #A8620A, -2px 1px 0 #A8620A, 2px 1px 0 #A8620A,
    -1px -2px 0 #A8620A, 1px -2px 0 #A8620A, -1px 2px 0 #A8620A, 1px 2px 0 #A8620A,
    0 -2px 0 #A8620A, 0 2px 0 #A8620A, -2px 0 0 #A8620A, 2px 0 0 #A8620A,
    0 3px 3px rgba(0, 0, 0, .28)`,
})

export const strokeSky = style({
  textShadow: `-2px -1px 0 #1759A8, 2px -1px 0 #1759A8, -2px 1px 0 #1759A8, 2px 1px 0 #1759A8,
    -1px -2px 0 #1759A8, 1px -2px 0 #1759A8, -1px 2px 0 #1759A8, 1px 2px 0 #1759A8,
    0 -2px 0 #1759A8, 0 2px 0 #1759A8, -2px 0 0 #1759A8, 2px 0 0 #1759A8,
    0 3px 3px rgba(0, 0, 0, .28)`,
})

export const strokeGold = style({
  textShadow: `-2px -1px 0 #B06A0C, 2px -1px 0 #B06A0C, -2px 1px 0 #B06A0C, 2px 1px 0 #B06A0C,
    -1px -2px 0 #B06A0C, 1px -2px 0 #B06A0C, -1px 2px 0 #B06A0C, 1px 2px 0 #B06A0C,
    0 -2px 0 #B06A0C, 0 2px 0 #B06A0C, -2px 0 0 #B06A0C, 2px 0 0 #B06A0C,
    0 3px 3px rgba(0, 0, 0, .28)`,
})
