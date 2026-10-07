// 启动动线（P1–P3）共享背景：蓝天 + 多圆拼云朵 + 星点 + 底部彩虹，纯 CSS 绘制。
// 云朵不再用单条胶囊，用中心圆+两侧小圆+底部平垫拼出蓬松感（对齐 design/high-fi/splash/splash.png）。
// 自适应接线：装饰与 children 放进 1024×768 LogicalStage 随舞台等比缩放；
// 舞台外留边由 BackgroundBleed 以同一渐变 cover 出血填充。被引用方 API 不变。
import type { ReactNode } from 'react'

import { BackgroundBleed, LogicalStage } from '../../../app/viewport'

import styles from './SkyBackdrop.module.css'

/** 天空渐变：舞台根背景与舞台外出血层共用同一来源（避免字面量双写漂移） */
const SKY_GRADIENT = 'linear-gradient(180deg,#8fd4ff 0%,#a8defd 46%,#bfe8fc 100%)'

export function SkyBackdrop({ children }: { children?: ReactNode }) {
  return (
    <>
      {/* 舞台外留边：同一渐变出血铺满 */}
      <BackgroundBleed background={SKY_GRADIENT} />
      <LogicalStage>
        <div className={styles.root} style={{ background: SKY_GRADIENT }}>
          {CLOUDS.map((c, i) => (
            <Cloud key={i} x={c.x} y={c.y} s={c.s} />
          ))}
          {STARS.map((s, i) => (
            <span key={i} className={styles.star} style={{ left: s.x, top: s.y, fontSize: s.s }}>
              {s.tone ? '✦' : '✧'}
            </span>
          ))}
          {/* 底部细彩虹弧 */}
          <div className={styles.rainbow} />
          {children}
        </div>
      </LogicalStage>
    </>
  )
}

function Cloud({ x, y, s }: { x: string; y: string; s: number }) {
  return (
    <div className={styles.cloud} style={{ left: x, top: y, width: s * 2.4, height: s * 1.1 }}>
      {/* 左小圆 */}
      <div className={styles.puff} style={{ width: s * 0.9, height: s * 0.9, left: s * 0.1, bottom: 0 }} />
      {/* 中大圆 */}
      <div className={styles.puff} style={{ width: s * 1.3, height: s * 1.3, left: s * 0.55, bottom: 0 }} />
      {/* 右小圆 */}
      <div className={styles.puff} style={{ width: s * 0.95, height: s * 0.95, left: s * 1.45, bottom: 0 }} />
      {/* 底部平垫（把三圆底边连成平地） */}
      <div
        className={`${styles.puff} ${styles.puffBase}`}
        style={{ width: s * 1.9, height: s * 0.55, left: s * 0.25, bottom: 0 }}
      />
    </div>
  )
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
