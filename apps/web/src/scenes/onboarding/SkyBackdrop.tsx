// 启动动线（P1–P3）共享背景：蓝天 + 多圆拼云朵 + 星点 + 底部彩虹，纯 CSS 绘制。
// 云朵不再用单条胶囊，用中心圆+两侧小圆+底部平垫拼出蓬松感（对齐 design/high-fi/splash/splash.png）。
import type { CSSProperties, ReactNode } from 'react'

export function SkyBackdrop({ children }: { children?: ReactNode }) {
  return (
    <div style={rootStyle}>
      {CLOUDS.map((c, i) => (
        <Cloud key={i} x={c.x} y={c.y} s={c.s} />
      ))}
      {STARS.map((s, i) => (
        <span key={i} style={{ ...starStyle, left: s.x, top: s.y, fontSize: s.s }}>
          {s.tone ? '\u2726' : '\u2727'}
        </span>
      ))}
      {/* 底部细彩虹弧 */}
      <div style={rainbowStyle} />
      {children}
    </div>
  )
}

function Cloud({ x, y, s }: { x: string; y: string; s: number }) {
  return (
    <div style={{ position: 'absolute', left: x, top: y, width: s * 2.4, height: s * 1.1 }}>
      {/* 左小圆 */}
      <div style={{ ...puffStyle, width: s * 0.9, height: s * 0.9, left: s * 0.1, bottom: 0 }} />
      {/* 中大圆 */}
      <div style={{ ...puffStyle, width: s * 1.3, height: s * 1.3, left: s * 0.55, bottom: 0 }} />
      {/* 右小圆 */}
      <div style={{ ...puffStyle, width: s * 0.95, height: s * 0.95, left: s * 1.45, bottom: 0 }} />
      {/* 底部平垫（把三圆底边连成平地） */}
      <div
        style={{
          ...puffStyle,
          width: s * 1.9,
          height: s * 0.55,
          left: s * 0.25,
          bottom: 0,
          borderRadius: 999,
        }}
      />
    </div>
  )
}

const puffStyle: CSSProperties = {
  position: 'absolute',
  borderRadius: '50%',
  background: 'rgba(255,255,255,.92)',
  boxShadow: '0 8px 14px rgba(80,150,210,.10)',
}

const CLOUDS: Array<{ x: string; y: string; s: number }> = [
  { x: '-1%', y: '6%', s: 66 },
  { x: '86%', y: '14%', s: 78 },
  { x: '4%', y: '72%', s: 58 },
  { x: '84%', y: '78%', s: 70 },
]

const STARS = [
  { x: '20%', y: '14%', s: 20, tone: 1 },
  { x: '68%', y: '8%', s: 15, tone: 0 },
  { x: '84%', y: '38%', s: 18, tone: 1 },
  { x: '28%', y: '58%', s: 14, tone: 0 },
  { x: '60%', y: '66%', s: 19, tone: 1 },
  { x: '9%', y: '40%', s: 16, tone: 0 },
  { x: '90%', y: '62%', s: 15, tone: 0 },
  { x: '42%', y: '26%', s: 13, tone: 1 },
  { x: '55%', y: '48%', s: 17, tone: 0 },
  { x: '75%', y: '54%', s: 14, tone: 1 },
]

const rootStyle: CSSProperties = {
  position: 'absolute',
  inset: 0,
  overflow: 'hidden',
  background: 'linear-gradient(180deg,#8fd4ff 0%,#a8defd 46%,#bfe8fc 100%)',
}

const starStyle: CSSProperties = {
  position: 'absolute',
  color: 'rgba(255,225,120,.9)',
  lineHeight: 1,
  userSelect: 'none',
}

const rainbowStyle: CSSProperties = {
  position: 'absolute',
  left: 0, right: 0, bottom: -14,
  height: 90,
  background:
    'linear-gradient(90deg,' +
    'rgba(255,107,107,0) 0%,' +
    'rgba(255,107,107,.28) 16%,' +
    'rgba(255,179,71,.28) 34%,' +
    'rgba(255,235,59,.28) 50%,' +
    'rgba(126,217,87,.28) 66%,' +
    'rgba(79,195,247,.28) 84%,' +
    'rgba(79,195,247,0) 100%)',
  pointerEvents: 'none',
}
