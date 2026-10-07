// DevHomeScene 样式（vanilla-extract）—— 开发测试台，仅开发模式可见
import { style } from '@vanilla-extract/css'

export const page = style({
  minHeight: '100vh',
  background: '#f5f6f8',
  padding: '24px 16px',
  fontFamily: 'system-ui, sans-serif',
  color: '#263238',
})

export const wrap = style({
  maxWidth: '780px',
  margin: '0 auto',
  display: 'flex',
  flexDirection: 'column',
  gap: '16px',
})

export const headerRow = style({
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
})

export const title = style({
  margin: 0,
  fontSize: '20px',
})

export const homeLink = style({
  color: '#1e88e5',
})

export const section = style({
  background: '#fff',
  border: '1px solid #e0e0e0',
  borderRadius: '12px',
  padding: '14px 16px',
})

export const h2 = style({
  margin: '0 0 10px',
  fontSize: '16px',
})

export const row = style({
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  flexWrap: 'wrap',
  margin: '6px 0',
})

export const label = style({
  minWidth: '120px',
  fontWeight: 700,
  flexShrink: 0,
})

export const input = style({
  width: '90px',
  padding: '4px 8px',
  border: '1px solid #ccc',
  borderRadius: '6px',
})

// 日期输入框比数值框宽（YYYY-MM-DD）
export const dateInput = style({
  width: '110px',
})

export const btn = style({
  padding: '4px 12px',
  border: '1px solid #bbb',
  borderRadius: '6px',
  background: '#fff',
  cursor: 'pointer',
})

// 紧跟前文的小按钮（种子 +5）
export const seedBtn = style({
  marginLeft: '4px',
})

// 危险区按钮：红底白字大按钮
export const dangerBtn = style({
  padding: '8px 20px',
  border: 'none',
  borderRadius: '6px',
  background: '#d32f2f',
  color: '#fff',
  fontWeight: 700,
  cursor: 'pointer',
})

export const hint = style({
  color: '#90a4ae',
  fontSize: '12px',
})
