import type { CSSProperties, ReactNode, ButtonHTMLAttributes } from 'react'

import { C, FONT, R, SHADOW, VARIANT, edge, strokeText, type Variant } from './tokens'

// ---------- 糖果立体按钮 ----------
type Size = 'sm' | 'md' | 'lg'
interface BtnProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  fullWidth?: boolean
}
export function Btn({ variant = 'sun', size = 'md', fullWidth, style, children, ...rest }: BtnProps) {
  const v = VARIANT[variant]
  const h = size === 'lg' ? 62 : size === 'sm' ? 40 : 52
  const fs = size === 'lg' ? 24 : size === 'sm' ? 16 : 20
  const radius = size === 'sm' ? R.sm : R.md
  return (
    <button
      className="mp-btn"
      {...rest}
      style={{
        height: h,
        padding: `0 ${size === 'sm' ? 16 : 28}px`,
        border: 'none',
        borderRadius: radius,
        background: `linear-gradient(180deg,rgba(255,255,255,.42),rgba(255,255,255,0) 46%), ${v.bg}`,
        color: v.fg,
        fontSize: fs,
        fontWeight: 900,
        fontFamily: FONT.family,
        cursor: rest.disabled ? 'not-allowed' : 'pointer',
        opacity: rest.disabled ? 0.55 : 1,
        boxShadow: edge(v.deep, size === 'lg' ? 6 : 5),
        width: fullWidth ? '100%' : undefined,
        userSelect: 'none',
        ...style,
      }}
    >
      {children}
    </button>
  )
}

// ---------- 圆形图标按钮（右下功能键） ----------
export function RoundBtn({
  icon, label, bg, deep, fg = '#fff', size = 78, onClick, disabled,
}: {
  icon: ReactNode
  label?: string
  bg: string
  deep: string
  fg?: string
  size?: number
  onClick?: () => void
  disabled?: boolean
}) {
  return (
    <button
      className="mp-btn"
      onClick={onClick}
      disabled={disabled}
      style={{
        width: size, height: size, borderRadius: '50%', border: 'none',
        background: `radial-gradient(circle at 38% 30%,rgba(255,255,.5),rgba(255,255,255,0) 55%), ${bg}`,
        color: fg, boxShadow: edge(deep, 5), cursor: disabled ? 'not-allowed' : 'pointer',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        fontFamily: FONT.family, userSelect: 'none', lineHeight: 1.1,
      }}
    >
      <span style={{ fontSize: size * 0.42 }}>{icon}</span>
      {label && <span style={{ fontSize: 13, fontWeight: 900 }}>{label}</span>}
    </button>
  )
}

// ---------- 资源胶囊（顶栏） ----------
type ChipTone = 'shell' | 'flower' | 'heart' | 'water' | 'food'
const CHIP_TONE: Record<ChipTone, { bg: string; fg: string }> = {
  shell: { bg: 'linear-gradient(180deg,#ffffff,#eef3f8)', fg: C.ink },
  flower: { bg: 'linear-gradient(180deg,#fff8e1,#ffecb3)', fg: '#ad6800' },
  heart: { bg: 'linear-gradient(180deg,#fce4ec,#f8bbd0)', fg: C.pinkDeep },
  water: { bg: 'linear-gradient(180deg,#e1f5fe,#b3e5fc)', fg: '#0277bd' },
  food: { bg: 'linear-gradient(180deg,#efebe9,#d7ccc8)', fg: '#5d4037' },
}
export function Chip({ icon, value, tone = 'shell', suffix }: {
  icon: ReactNode
  value: ReactNode
  tone?: ChipTone
  suffix?: string
}) {
  const t = CHIP_TONE[tone]
  return (
    <div style={{
      height: 38, display: 'flex', alignItems: 'center', gap: 6, padding: '0 14px',
      borderRadius: R.pill, background: t.bg, color: t.fg, fontWeight: 900, fontSize: 18,
      fontFamily: FONT.family, boxShadow: '0 2px 0 rgba(0,0,0,.12)', whiteSpace: 'nowrap',
    }}>
      <span style={{ fontSize: 21, lineHeight: 1 }}>{icon}</span>
      <span>{value}</span>
      {suffix && <span style={{ fontSize: 14, opacity: 0.8 }}>{suffix}</span>}
    </div>
  )
}

// ---------- 顶栏容器 ----------
export function TopBar({ children, tone = 'sky' }: { children: ReactNode; tone?: 'sky' | 'none' }) {
  return (
    <div style={{
      position: 'absolute', top: 12, left: 12, right: 12, minHeight: 56,
      display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8,
      ...(tone === 'sky' ? {
        background: 'linear-gradient(180deg,#64b5f6,#1e88e5)',
        borderRadius: R.lg, padding: '8px 12px',
        boxShadow: '0 4px 0 #1565c0, 0 8px 16px rgba(21,101,192,.25)',
      } : {}),
      zIndex: 10,
    }}>
      {children}
    </div>
  )
}

export function BackBtn({ onClick, tone = 'onBlue' }: { onClick: () => void; tone?: 'onBlue' | 'plain' }) {
  return (
    <button className="mp-btn" onClick={onClick} style={{
      width: 42, height: 42, borderRadius: R.sm, border: 'none', cursor: 'pointer',
      background: tone === 'onBlue' ? 'rgba(255,255,255,.25)' : 'rgba(0,0,0,.08)',
      color: tone === 'onBlue' ? '#fff' : C.ink, fontSize: 22, fontWeight: 900,
      fontFamily: FONT.family, boxShadow: tone === 'onBlue' ? '0 3px 0 rgba(0,0,0,.15)' : 'none',
    }}>←</button>
  )
}

// ---------- 卡片 ----------
export function Card({ children, style, padding = 18 }: {
  children: ReactNode
  style?: CSSProperties
  padding?: number
}) {
  return (
    <div style={{
      background: C.white, borderRadius: R.lg, padding,
      boxShadow: SHADOW.card, fontFamily: FONT.family, ...style,
    }}>{children}</div>
  )
}

// ---------- 底部弹层 ----------
export function Sheet({ children, title, onClose }: {
  children: ReactNode
  title?: string
  onClose: () => void
}) {
  return (
    <div onClick={onClose} style={{
      position: 'absolute', inset: 0, background: 'rgba(0,0,0,.42)', zIndex: 30,
      display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
    }}>
      <div onClick={(e) => e.stopPropagation()} style={{
        width: '100%', maxWidth: 760, maxHeight: '82%', overflowY: 'auto',
        background: 'linear-gradient(180deg,#fff8e1,#ffecb3)',
        borderRadius: '26px 26px 0 0', padding: 20,
        boxShadow: '0 -8px 28px rgba(0,0,0,.25)', fontFamily: FONT.family,
      }}>
        {title && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <span style={{ fontSize: 24, fontWeight: 900, color: '#5d4037' }}>{title}</span>
            <button onClick={onClose} style={{ border: 'none', borderRadius: '50%', width: 34, height: 34, background: '#bcaaa4', color: '#fff', fontWeight: 900, cursor: 'pointer' }}>✕</button>
          </div>
        )}
        {children}
      </div>
    </div>
  )
}

// ---------- 居中弹窗 ----------
export function Modal({ children, onClose, width = 480 }: {
  children: ReactNode
  onClose?: () => void
  width?: number
}) {
  return (
    <div onClick={onClose} style={{
      position: 'absolute', inset: 0, background: 'rgba(0,0,0,.4)', zIndex: 40,
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
    }}>
      <div onClick={(e) => e.stopPropagation()} style={{
        width: 'min(92vw,' + width + 'px)', maxHeight: '86vh', overflowY: 'auto',
        background: C.white, borderRadius: 26, padding: 24,
        boxShadow: SHADOW.panel, fontFamily: FONT.family,
      }}>{children}</div>
    </div>
  )
}

// ---------- 进度条 ----------
export function ProgressBar({ ratio, base = C.grass, deep = C.grassDeep, height = 14 }: {
  ratio: number
  base?: string
  deep?: string
  height?: number
}) {
  return (
    <div style={{ flex: 1, height, background: 'rgba(255,255,255,.6)', borderRadius: R.pill, overflow: 'hidden' }}>
      <div style={{
        width: `${Math.round(Math.min(1, Math.max(0, ratio)) * 100)}%`, height: '100%',
        background: `linear-gradient(180deg,rgba(255,255,255,.4),rgba(255,255,255,0)), ${base}`,
        boxShadow: `0 0 8px ${deep}`, transition: 'width .4s',
      }} />
    </div>
  )
}

// ---------- 卡通描边标题 ----------
export function Title({ children, fill = '#fff', stroke = C.skyDeep, px = 2, size = FONT.title, center }: {
  children: ReactNode
  fill?: string
  stroke?: string
  px?: number
  size?: number
  center?: boolean
}) {
  return (
    <div style={{
      fontSize: size, fontWeight: 900, fontFamily: FONT.family,
      ...Object.fromEntries(
        strokeText(fill, stroke, px).split(';').filter(Boolean).map((kv) => {
          const i = kv.indexOf(':')
          return [kv.slice(0, i).trim(), kv.slice(i + 1).trim()]
        }),
      ),
      textAlign: center ? 'center' : 'left',
    }}>{children}</div>
  )
}
