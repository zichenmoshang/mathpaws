// PaperDollCompositeDev 样式（vanilla-extract）—— 运行时合成回归页（#paperdoll-rt）
import { style } from '@vanilla-extract/css'

export const root = style({
  // dev 工具页不进 LogicalStage，保留 fixed 全屏
  position: 'fixed',
  inset: 0,
  overflow: 'auto',
  background: 'linear-gradient(180deg, #e8f5fd, #c8e6f8)',
  fontFamily: 'system-ui, "PingFang SC", sans-serif',
  padding: '18px',
})

export const heading = style({
  margin: '0 0 4px',
  color: '#0d47a1',
  fontSize: '20px',
})

export const intro = style({
  fontSize: '13px',
  color: '#37474f',
  marginBottom: '14px',
  lineHeight: 1.7,
})

export const err = style({
  color: '#c62828',
})

export const progress = style({
  fontSize: '15px',
  color: '#1565C0',
  fontWeight: 700,
})

// 每个身体一行：标签列 + A/B 全身 + 颈部放大 + 热图 + 统计
export const rowCard = style({
  background: 'rgba(255, 255, 255, .92)',
  borderRadius: '14px',
  padding: '12px 14px',
  marginBottom: '14px',
  display: 'flex',
  gap: '16px',
  alignItems: 'flex-start',
  flexWrap: 'wrap',
  boxShadow: '0 2px 10px rgba(0, 0, 0, .08)',
})

export const labelCol = style({
  width: '150px',
  flexShrink: 0,
  paddingTop: '20px',
})

export const labelTitle = style({
  fontSize: '14px',
  fontWeight: 900,
  color: '#0d47a1',
  lineHeight: 1.5,
})

export const labelId = style({
  fontSize: '12px',
  color: '#78909C',
  marginTop: '6px',
})

// 画布小标题（颜色按列类型动态注入）
export const cap = style({
  fontSize: '13px',
  fontWeight: 900,
  textAlign: 'center',
  margin: '0 0 4px',
})

export const canvas = style({
  borderRadius: '8px',
  display: 'block',
})

export const statsCol = style({
  fontSize: '12.5px',
  color: '#263238',
  lineHeight: 1.75,
  minWidth: '210px',
  paddingTop: '14px',
})
