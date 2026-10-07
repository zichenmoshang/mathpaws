// PaperDollLookDev 样式（vanilla-extract）—— 换装运行时验证页（#paperdoll）
// font-family 取值与 @mathpaws/ui 的 FONT.family 一致。
import { style } from '@vanilla-extract/css'

const FONT_FAMILY = '"Baloo 2", "Comic Sans MS", "Microsoft YaHei", system-ui, sans-serif'

export const root = style({
  // dev 工具页不进 LogicalStage，保留 fixed 全屏
  position: 'fixed',
  inset: 0,
  background: 'linear-gradient(180deg, #bfe3f5, #9ccfec)',
  fontFamily: FONT_FAMILY,
  overflow: 'hidden',
})

export const topBarLeft = style({
  display: 'flex',
  alignItems: 'center',
  gap: '10px',
})

export const topBarTitle = style({
  color: '#fff',
  fontWeight: 900,
  fontSize: '20px',
})

export const topBarHash = style({
  color: 'rgba(255, 255, 255, .9)',
  fontSize: '14px',
  fontWeight: 700,
})

export const main = style({
  position: 'absolute',
  inset: 0,
  top: '76px',
  display: 'flex',
  gap: '20px',
  padding: '20px',
})

// 左：娃娃舞台
export const stage = style({
  flex: 1,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  minWidth: 0,
})

export const dollBox = style({
  width: 'min(100%, 78vh)',
  aspectRatio: '1 / 1',
})

// 右：调试控件
export const sideCol = style({
  width: 'min(380px, 46vw)',
  flexShrink: 0,
  overflowY: 'auto',
})

export const sectionTitle = style({
  fontSize: '16px',
  fontWeight: 900,
  color: '#1565C0',
  margin: '14px 0 8px',
})

export const row = style({
  display: 'flex',
  flexWrap: 'wrap',
  gap: '8px',
})

// 槽位选项按钮（基类 + 带图/选中变体组合）
export const optionBtn = style({
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
  padding: '0 14px',
  height: '44px',
  borderRadius: '999px',
  border: '3px solid rgba(0, 0, 0, .08)',
  background: 'rgba(255, 255, 255, .82)',
  boxShadow: '0 3px 0 rgba(0, 0, 0, .12)',
  fontFamily: FONT_FAMILY,
  fontWeight: 900,
  fontSize: '15px',
  color: '#263238',
  cursor: 'pointer',
})

export const optionBtnIcon = style({
  padding: '4px 12px 4px 6px',
})

export const optionBtnActive = style({
  border: '3px solid #1565C0',
  background: '#fff8e1',
})

export const optionIcon = style({
  width: '34px',
  height: '34px',
  objectFit: 'contain',
})

// 预览背景切换按钮
export const bgBtn = style({
  padding: '0 14px',
  height: '38px',
  borderRadius: '999px',
  border: '3px solid rgba(0, 0, 0, .08)',
  background: 'rgba(255, 255, 255, .82)',
  fontFamily: FONT_FAMILY,
  fontWeight: 900,
  fontSize: '14px',
  color: '#263238',
  cursor: 'pointer',
})

export const bgBtnActive = style({
  border: '3px solid #1565C0',
  background: '#fff8e1',
})

export const actions = style({
  display: 'flex',
  gap: '10px',
  marginTop: '18px',
})

export const comboTitle = style({
  fontSize: '14px',
  fontWeight: 900,
  color: '#263238',
  lineHeight: 1.6,
})

export const comboBody = style({
  fontSize: '13px',
  color: '#455a64',
  lineHeight: 1.7,
  marginTop: '4px',
})

export const comboMeta = style({
  fontSize: '12px',
  color: '#78909C',
  marginTop: '10px',
  borderTop: '1px dashed #cfd8dc',
  paddingTop: '8px',
  lineHeight: 1.6,
})
