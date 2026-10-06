// 扩展通用组件（M0-UI-01）
// 全部 tokens 驱动、全内联样式、不依赖业务 store / 图片。
import type { ButtonHTMLAttributes, CSSProperties, ReactNode } from 'react'

import { C, FONT, R, VARIANT, edge } from './tokens'

// ---------- Switch ----------
export function Switch({
  checked, onChange, label,
}: {
  checked: boolean
  onChange: (v: boolean) => void
  label?: string
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 10,
        border: 'none', background: 'transparent', cursor: 'pointer',
        fontFamily: FONT.family, fontWeight: 800, color: C.ink,
      }}
    >
      <span
        style={{
          width: 56, height: 30, borderRadius: R.pill, position: 'relative',
          background: checked ? C.grass : '#b0bec5',
          transition: 'background .2s',
          boxShadow: 'inset 0 2px 4px rgba(0,0,0,.18)',
        }}
      >
        <span
          style={{
            position: 'absolute', top: 3, left: checked ? 29 : 3,
            width: 24, height: 24, borderRadius: '50%', background: '#fff',
            transition: 'left .2s', boxShadow: '0 2px 4px rgba(0,0,0,.25)',
          }}
        />
      </span>
      {label}
    </button>
  )
}

// ---------- Tabs / Segmented ----------
export function Tabs<T extends string>({
  tabs, active, onChange,
}: {
  tabs: Array<{ id: T; label: ReactNode }>
  active: T
  onChange: (id: T) => void
}) {
  return (
    <div style={{ display: 'inline-flex', gap: 6, flexWrap: 'wrap' }}>
      {tabs.map(t => {
        const on = t.id === active
        return (
          <button
            key={t.id}
            className={on ? '' : 'mp-btn'}
            onClick={() => onChange(t.id)}
            style={{
              height: 40, padding: '0 20px', borderRadius: R.pill,
              border: 'none', cursor: 'pointer', fontFamily: FONT.family,
              fontWeight: 900, fontSize: 17,
              background: on
                ? `linear-gradient(180deg,rgba(255,255,255,.4),rgba(255,255,255,0) 45%), ${VARIANT.sky.bg}`
                : '#eceff1',
              color: on ? '#fff' : '#546e7a',
              boxShadow: on ? edge(VARIANT.sky.deep, 4) : 'none',
            }}
          >
            {t.label}
          </button>
        )
      })}
    </div>
  )
}

// ---------- CloudInput（云形输入） ----------
export function CloudInput({
  value, onChange, placeholder, maxLength, onSubmit, style,
}: {
  value: string
  onChange: (v: string) => void
  placeholder?: string
  maxLength?: number
  onSubmit?: () => void
  style?: CSSProperties
}) {
  return (
    <input
      value={value}
      maxLength={maxLength}
      placeholder={placeholder}
      onChange={e => onChange(e.target.value)}
      onKeyDown={e => {
        if (e.key === 'Enter' && onSubmit) onSubmit()
      }}
      style={{
        height: 58, padding: '0 28px',
        borderRadius: R.pill,
        border: `4px solid ${C.sky}`,
        background: '#fff',
        color: C.ink,
        fontSize: 22,
        fontWeight: 800,
        fontFamily: FONT.family,
        outline: 'none',
        boxShadow: '0 6px 0 rgba(21,101,192,.18)',
        ...style,
      }}
    />
  )
}

// ---------- ConfirmDialog ----------
export function ConfirmDialog({
  title, message, confirmText = '确定', cancelText = '取消',
  onConfirm, onCancel, danger,
}: {
  title?: string
  message: ReactNode
  confirmText?: string
  cancelText?: string
  onConfirm: () => void
  onCancel: () => void
  danger?: boolean
}) {
  return (
    <div
      onClick={onCancel}
      style={{
        position: 'absolute', inset: 0, background: 'rgba(0,0,0,.42)',
        zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: 'min(90vw,440px)', background: '#fff', borderRadius: R.lg,
          padding: 26, boxShadow: '0 12px 36px rgba(0,0,0,.25)',
          fontFamily: FONT.family, textAlign: 'center',
        }}
      >
        {title && (
          <div style={{ fontSize: 24, fontWeight: 900, color: C.ink, marginBottom: 12 }}>
            {title}
          </div>
        )}
        <div style={{ fontSize: 18, color: '#455a64', marginBottom: 22, lineHeight: 1.5 }}>
          {message}
        </div>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
          <button
            className="mp-btn"
            onClick={onCancel}
            style={{
              height: 48, padding: '0 26px', borderRadius: R.md, border: 'none',
              background: '#eceff1', color: '#546e7a', fontWeight: 900,
              fontFamily: FONT.family, cursor: 'pointer',
            }}
          >
            {cancelText}
          </button>
          <button
            className="mp-btn"
            onClick={onConfirm}
            style={{
              height: 48, padding: '0 26px', borderRadius: R.md, border: 'none',
              background: danger ? C.red : C.grass, color: '#fff', fontWeight: 900,
              fontFamily: FONT.family, cursor: 'pointer',
              boxShadow: edge(danger ? C.redDeep : C.grassDeep, 4),
            }}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  )
}

// ---------- OptionButton（真题 ABC / 三选一） ----------
interface OptionButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  active?: boolean
  state?: 'idle' | 'correct' | 'wrong'
}
export function OptionButton({
  active, state = 'idle', children, style, ...rest
}: OptionButtonProps) {
  const bg =
    state === 'correct' ? C.grass
    : state === 'wrong' ? C.red
    : active ? VARIANT.sky.bg
    : '#f4f8fc'
  const fg = state === 'idle' && !active ? C.ink : '#fff'
  return (
    <button
      className="mp-btn"
      {...rest}
      style={{
        minWidth: 120, minHeight: 72, padding: '10px 22px',
        borderRadius: R.md, border: `3px solid ${active || state !== 'idle' ? bg : C.sky}`,
        background: bg, color: fg, fontSize: 28, fontWeight: 900,
        fontFamily: FONT.family, cursor: 'pointer', lineHeight: 1.2,
        boxShadow: active || state !== 'idle' ? edge(C.skyDeep, 4) : 'none',
        ...style,
      }}
    >
      {children}
    </button>
  )
}

// ---------- ItemGrid / ItemCell ----------
export function ItemGrid({
  children, columns = 4, gap = 12,
}: {
  children: ReactNode
  columns?: number
  gap?: number
}) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${columns}, minmax(0,1fr))`,
        gap,
      }}
    >
      {children}
    </div>
  )
}

export function ItemCell({
  children, selected, locked, onClick, style,
}: {
  children: ReactNode
  selected?: boolean
  locked?: boolean
  onClick?: () => void
  style?: CSSProperties
}) {
  return (
    <button
      onClick={locked ? undefined : onClick}
      style={{
        aspectRatio: '1 / 1', borderRadius: R.md, cursor: locked ? 'not-allowed' : 'pointer',
        background: locked ? '#f5f5f5' : '#fff',
        border: `3px solid ${selected ? C.orange : '#e0e0e0'}`,
        boxShadow: selected ? `0 0 0 3px ${C.orange}33` : 'none',
        padding: 8, position: 'relative', fontFamily: FONT.family,
        opacity: locked ? 0.6 : 1, ...style,
      }}
    >
      {children}
      {locked && (
        <span style={{ position: 'absolute', top: 6, right: 8, fontSize: 18 }}>🔒</span>
      )}
    </button>
  )
}

// ---------- RewardBadge / RewardRow ----------
export function RewardBadge({
  icon, value, tone = 'shell',
}: {
  icon: ReactNode
  value: ReactNode
  tone?: 'shell' | 'flower' | 'food'
}) {
  const colors = {
    shell: { bg: '#fff3cd', fg: '#8a6d1d' },
    flower: { bg: '#fde4ec', fg: C.pinkDeep },
    food: { bg: '#efebe9', fg: '#5d4037' },
  }[tone]
  return (
    <div
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 8,
        padding: '8px 18px', borderRadius: R.pill,
        background: colors.bg, color: colors.fg,
        fontFamily: FONT.family, fontWeight: 900, fontSize: 20,
      }}
    >
      <span style={{ fontSize: 24 }}>{icon}</span>
      {value}
    </div>
  )
}

export function RewardRow({ children }: { children: ReactNode }) {
  return (
    <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
      {children}
    </div>
  )
}

// ---------- Tag / LockTag ----------
export function Tag({
  children, tone = 'blue',
}: {
  children: ReactNode
  tone?: 'blue' | 'orange' | 'green' | 'purple' | 'gray'
}) {
  const map = {
    blue: { bg: '#e3f2fd', fg: C.skyDeep },
    orange: { bg: '#fff3e0', fg: C.orangeDeep },
    green: { bg: '#e8f5e9', fg: C.grassDeep },
    purple: { bg: '#f3e5f5', fg: '#7b1fa2' },
    gray: { bg: '#eceff1', fg: '#546e7a' },
  }[tone]
  return (
    <span
      style={{
        display: 'inline-flex', alignItems: 'center',
        padding: '3px 12px', borderRadius: R.pill,
        background: map.bg, color: map.fg,
        fontFamily: FONT.family, fontWeight: 800, fontSize: 14, whiteSpace: 'nowrap',
      }}
    >
      {children}
    </span>
  )
}

export function LockTag({ label = '即将开放' }: { label?: string }) {
  return (
    <span
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 4,
        padding: '3px 12px', borderRadius: R.pill,
        background: '#eceff1', color: '#546e7a',
        fontFamily: FONT.family, fontWeight: 800, fontSize: 14,
      }}
    >
      🔒 {label}
    </span>
  )
}

// ---------- EmptyState ----------
export function EmptyState({
  icon, title, hint, action,
}: {
  icon?: ReactNode
  title: string
  hint?: string
  action?: ReactNode
}) {
  return (
    <div
      style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        gap: 10, padding: '40px 20px', fontFamily: FONT.family,
      }}
    >
      {icon && <span style={{ fontSize: 84 }}>{icon}</span>}
      <div style={{ fontSize: 22, fontWeight: 900, color: C.ink }}>{title}</div>
      {hint && <div style={{ fontSize: 16, color: C.inkSoft }}>{hint}</div>}
      {action}
    </div>
  )
}

// ---------- StarTrack（进化/连学轨道） ----------
export function StarTrack({
  steps, current,
}: {
  steps: Array<{ label: ReactNode; reached: boolean }>
  current: number
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      {steps.map((s, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div
            style={{
              width: 40, height: 40, borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: s.reached ? C.sun : '#e0e0e0',
              color: s.reached ? '#8a6d1d' : '#9e9e9e',
              fontWeight: 900, fontFamily: FONT.family,
              outline: i === current ? `3px solid ${C.orange}66` : 'none',
            }}
          >
            {s.label}
          </div>
          {i < steps.length - 1 && (
            <span style={{ width: 22, height: 4, background: '#cfd8dc', borderRadius: 2 }} />
          )}
        </div>
      ))}
    </div>
  )
}

// ---------- CountdownRing（浮题 5s） ----------
export function CountdownRing({
  seconds, total, size = 44,
}: {
  seconds: number
  total: number
  size?: number
}) {
  const r = (size - 8) / 2
  const c = 2 * Math.PI * r
  const ratio = Math.max(0, Math.min(1, seconds / total))
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#e0e0e0" strokeWidth={4} />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke={seconds <= 2 ? C.red : C.sky}
        strokeWidth={4}
        strokeLinecap="round"
        strokeDasharray={c}
        strokeDashoffset={c * (1 - ratio)}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
      <text
        x="50%" y="56%" textAnchor="middle"
        fontSize={size * 0.42} fontWeight={900} fill={C.ink}
        fontFamily={FONT.family}
      >
        {seconds}
      </text>
    </svg>
  )
}

// ---------- Carousel（手动，不自动） ----------
export function Carousel({
  children, index, onIndex, count,
}: {
  children: ReactNode
  index: number
  onIndex: (i: number) => void
  count: number
}) {
  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <div
        style={{ overflow: 'hidden', borderRadius: R.lg }}
      >
        <div
          style={{
            display: 'flex',
            width: `${count * 100}%`,
            transform: `translateX(-${(index * 100) / count}%)`,
            transition: 'transform .3s',
          }}
        >
          {/* children 中每项应自带 width: ${100/count}% */}
          {children}
        </div>
      </div>
      <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 10 }}>
        {Array.from({ length: count }).map((_, i) => (
          <button
            key={i}
            aria-label={`第 ${i + 1} 张`}
            onClick={() => onIndex(i)}
            style={{
              width: i === index ? 18 : 10, height: 10, borderRadius: R.pill,
              border: 'none', background: i === index ? C.sky : '#cfd8dc',
              cursor: 'pointer', padding: 0,
            }}
          />
        ))}
      </div>
    </div>
  )
}

// ---------- ResourcePill（顶部货币） ----------
export function ResourcePill({
  icon, value, tone = 'shell',
}: {
  icon: ReactNode
  value: ReactNode
  tone?: 'shell' | 'flower'
}) {
  const map = {
    shell: { bg: '#ffffff', fg: C.ink, border: '#e0e0e0' },
    flower: { bg: '#fff8e1', fg: '#ad6800', border: '#ffe082' },
  }[tone]
  return (
    <div
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 6,
        height: 38, padding: '0 14px', borderRadius: R.pill,
        background: map.bg, color: map.fg, border: `2px solid ${map.border}`,
        fontFamily: FONT.family, fontWeight: 900, fontSize: 18, whiteSpace: 'nowrap',
      }}
    >
      <span style={{ fontSize: 20 }}>{icon}</span>
      {value}
    </div>
  )
}

// ---------- LoadingBar ----------
export function LoadingBar({
  progress, height = 12,
}: {
  progress: number
  height?: number
}) {
  return (
    <div
      style={{
        width: '100%', height, background: 'rgba(255,255,255,.5)',
        borderRadius: R.pill, overflow: 'hidden',
      }}
    >
      <div
        style={{
          width: `${Math.round(Math.min(1, Math.max(0, progress)) * 100)}%`,
          height: '100%', background: `linear-gradient(90deg,${C.sky},${C.skyDeep})`,
          transition: 'width .3s',
        }}
      />
    </div>
  )
}
