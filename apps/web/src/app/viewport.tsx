// 横屏适配层（M0-ENG-05 / PRD 适配）
// 逻辑基准 1024×768（4:3）：
//   - 内容层：按 contain 等比缩放、居中；
//   - 背景层：单独 cover 横向 bleed 铺满（由背景组件消费）；
//   - DPR 钳制 ≤2；
//   - 竖屏非阻断引导（BLOCK_PORTRAIT=true 可恢复强制遮罩）；"建议平板"提示；safe-area 避让。
import { useEffect, useState } from 'react'
import './scaffold.css'

export const LOGICAL_WIDTH = 1024
export const LOGICAL_HEIGHT = 768
export const MAX_DPR = 2

/** 是否强制横屏：true = 竖屏显示阻断遮罩；false = 竖屏放行仅轻提示。当前先放开。 */
const BLOCK_PORTRAIT = false

export interface ViewportInfo {
  width: number
  height: number
  /** 内容层 contain 缩放比例 */
  scale: number
  /** 是否竖屏 */
  portrait: boolean
  /** 是否"小屏横屏"（建议平板） */
  small: boolean
  dpr: number
}

function compute(): ViewportInfo {
  const width = window.innerWidth
  const height = window.innerHeight
  const scale = Math.min(width / LOGICAL_WIDTH, height / LOGICAL_HEIGHT)
  return {
    width,
    height,
    scale,
    portrait: height >= width,
    // 横屏但内容有效高度明显小于基准
    small: !!(height < 600),
    dpr: Math.min(window.devicePixelRatio || 1, MAX_DPR),
  }
}

/** 订阅视口（resize / orientationchange） */
export function useViewport(): ViewportInfo {
  const [vp, setVp] = useState<ViewportInfo>(() =>
    typeof window === 'undefined'
      ? {
          width: LOGICAL_WIDTH, height: LOGICAL_HEIGHT, scale: 1,
          portrait: false, small: false, dpr: 1,
        }
      : compute(),
  )
  useEffect(() => {
    const on = () => setVp(compute())
    window.addEventListener('resize', on)
    window.addEventListener('orientationchange', on)
    return () => {
      window.removeEventListener('resize', on)
      window.removeEventListener('orientationchange', on)
    }
  }, [])
  return vp
}

/**
 * 内容层容器：以 1024×768 逻辑画布做 contain 等比缩放并居中。
 * 子内容按逻辑像素布局即可。
 */
export function LogicalStage({ children }: { children: React.ReactNode }) {
  const vp = useViewport()
  return (
    <div
      style={{
        position: 'absolute',
        left: '50%',
        top: '50%',
        width: LOGICAL_WIDTH,
        height: LOGICAL_HEIGHT,
        transform: `translate(-50%,-50%) scale(${vp.scale})`,
        transformOrigin: 'center center',
      }}
    >
      {children}
    </div>
  )
}

/**
 * 背景层：cover 铺满整个视口（横向 bleed）。
 * 接收颜色或渐变；位图背景由调用方用同样容器放 <img> cover。
 */
export function BackgroundBleed({
  background, children,
}: {
  background: string
  children?: React.ReactNode
}) {
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background,
        overflow: 'hidden',
      }}
    >
      {children}
    </div>
  )
}

/** 非阻断的顶部轻提示胶囊（竖屏引导 / 小屏横屏建议复用） */
function HintPill({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        position: 'absolute', top: 8, left: '50%', zIndex: 60,
        transform: 'translateX(-50%)',
        background: 'rgba(38,50,56,.82)', color: '#fff',
        padding: '6px 16px', borderRadius: 999,
        fontFamily: 'inherit', fontWeight: 700, fontSize: 13,
      }}
    >
      {children}
    </div>
  )
}

/**
 * 横竖屏门：
 * 默认（BLOCK_PORTRAIT=false）竖屏放行，仅顶部显示"建议横屏"轻提示（不阻断）；
 * 小屏横屏 → "建议平板"轻提示（不阻断）；正常 → children。
 * BLOCK_PORTRAIT=true 时竖屏恢复为"请横屏使用"阻断遮罩。
 * safe-area 由内边距预留。
 */
export function OrientationGate({ children }: { children: React.ReactNode }) {
  const vp = useViewport()

  if (BLOCK_PORTRAIT && vp.portrait) {
    return (
      <div className="mp-overlay">
        <div className="mp-card" role="alert">
          <div className="mp-card-title">请横屏使用</div>
          <p className="mp-card-text">旋转设备以获得最佳体验 📐</p>
        </div>
      </div>
    )
  }

  return (
    <>
      {vp.portrait && <HintPill>建议横屏体验更佳 📐</HintPill>}
      {!vp.portrait && vp.small && (
        <HintPill>建议在平板上获得最佳体验</HintPill>
      )}
      {children}
    </>
  )
}
