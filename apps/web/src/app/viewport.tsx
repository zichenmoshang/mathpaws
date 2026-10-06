// 横屏适配层（M0-ENG-05 / PRD 适配）
// 逻辑基准 1024×768（4:3）：
//   - 内容层：按 contain 等比缩放、居中；
//   - 背景层：单独 cover 横向 bleed 铺满（由背景组件消费）；
//   - DPR 钳制 ≤2；
//   - 竖屏放行仅轻提示（非阻断）；"建议平板"提示；
//   - safe-area 经 scaffold.css 的 --sat/--sar/--sab/--sal 变量暴露给各层样式。
import { useEffect, useState } from 'react'
import './scaffold.css'

export const LOGICAL_WIDTH = 1024
export const LOGICAL_HEIGHT = 768
export const MAX_DPR = 2

export interface ViewportInfo {
  width: number
  height: number
  /** 内容层 contain 缩放比例 */
  scale: number
  /** 是否竖屏（严格高大于宽；正方形按横屏处理） */
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
    portrait: height > width,
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
 * 子内容按逻辑像素布局即可；刘海 / 圆角避让由子内容
 * 使用 var(--sat) 等 safe-area 变量自行内缩，画布本身不做裁切。
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
 * 背景层：cover 铺满整个视口（含刘海区，背景需出血）。
 * 接收颜色或渐变；位图背景由调用方用同样容器放 <img> cover。
 * 交互内容请放进 LogicalStage 或自行用 safe-area 变量避让。
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

/** 非阻断的顶部轻提示胶囊（竖屏引导 / 小屏横屏建议复用），避让顶部刘海 */
function HintPill({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        position: 'absolute', top: 'calc(8px + var(--sat, 0px))', left: '50%', zIndex: 60,
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
 * 横竖屏门（非阻断）：
 * 竖屏 → 顶部"建议横屏"轻提示；小屏横屏 → "建议平板"轻提示；正常 → children。
 */
export function OrientationGate({ children }: { children: React.ReactNode }) {
  const vp = useViewport()

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
