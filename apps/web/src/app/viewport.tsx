// 横屏适配层（M0-ENG-05 / PRD 适配）
// 逻辑基准 1024×768（4:3）：
//   - 内容层：按 contain 等比缩放、居中（可用高度扣除 safe-area，见 compute()）；
//   - 背景层：单独 cover 横向 bleed 铺满（由背景组件消费）；
//   - DPR 钳制 ≤2；
//   - 竖屏放行仅轻提示（非阻断）；"建议平板"提示；
//   - safe-area 经 scaffold.css 的 --sat/--sar/--sab/--sal 变量暴露给各层样式。
// 2026-10-10 真机适配（TGR-W10 状态栏/左右 bleed 问题）：
//   - LogicalStage 可用高度扣除 --sat/--sab，舞台居中于 safe 区（顶部不再贴状态栏）；
//   - bleed 过渡为 blur 藏拙（bleedBlur 默认开）；2338×1536（1.5217）宽图资产
//     页传 bleedBlur={false}，bleed 区显示真实扩展带（同图同倍率零接缝）。
import { useEffect, useState } from 'react'
import './scaffold.css'

export const LOGICAL_WIDTH = 1024
export const LOGICAL_HEIGHT = 768
export const MAX_DPR = 2

export interface ViewportInfo {
  width: number
  height: number
  /** 内容层 contain 缩放比例（可用高度已扣除 safe-area） */
  scale: number
  /** 是否竖屏（严格高大于宽；正方形按横屏处理） */
  portrait: boolean
  /** 是否"小屏横屏"（建议平板） */
  small: boolean
  dpr: number
  /** 顶部安全区（状态栏，CSS px；无则为 0） */
  sat: number
  /** 底部安全区（手势条，CSS px；无则为 0） */
  sab: number
}

function readSafeArea(name: '--sat' | '--sab'): number {
  const v = getComputedStyle(document.documentElement).getPropertyValue(name)
  const n = parseFloat(v)
  return Number.isFinite(n) ? n : 0
}

function compute(): ViewportInfo {
  const width = window.innerWidth
  const height = window.innerHeight
  const sat = readSafeArea('--sat')
  const sab = readSafeArea('--sab')
  const safeH = Math.max(height - sat - sab, 0)
  const scale = Math.min(width / LOGICAL_WIDTH, safeH / LOGICAL_HEIGHT)
  return {
    width,
    height,
    scale,
    portrait: height > width,
    // 横屏但内容有效高度明显小于基准
    small: !!(height < 600),
    dpr: Math.min(window.devicePixelRatio || 1, MAX_DPR),
    sat,
    sab,
  }
}

/** 订阅视口（resize / orientationchange） */
export function useViewport(): ViewportInfo {
  const [vp, setVp] = useState<ViewportInfo>(() =>
    typeof window === 'undefined'
      ? {
          width: LOGICAL_WIDTH, height: LOGICAL_HEIGHT, scale: 1,
          portrait: false, small: false, dpr: 1, sat: 0, sab: 0,
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
 * 可用高度扣除顶部/底部 safe-area（scale 已在 compute() 内折算），
 * 画布居中于 safe 区（top 偏移 (sat-sab)/2），顶部不再贴状态栏；
 * 刘海 / 圆角避让由子内容使用 var(--sat) 等 safe-area 变量自行内缩，画布本身不做裁切。
 */
export function LogicalStage({ children }: { children: React.ReactNode }) {
  const vp = useViewport()
  return (
    <div
      style={{
        position: 'absolute',
        left: '50%',
        top: `calc(50% + ${(vp.sat - vp.sab) / 2}px)`,
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

/**
 * 场景脚手架（固定像素场景的统一入口）：BackgroundBleed 留边出血 + LogicalStage 内容层二合一。
 *   - bleed：留边兜底色 / 渐变（位图加载前兜底；无位图场景直接当背景）；
 *   - bleedImage：留边 cover 出血位图（通常与舞台内 z0 背景同一张）；
 *   - bleedBlur（2026-10-10 过渡）：4:3 资产默认 true——cover 放大错位用 blur 藏拙；
 *     2338×1536（1.5217）宽图资产页传 false——bleed 区显示真实扩展带
 *     （z0 按"height 100% + width auto + 居中"渲染，溢出即成同倍率清晰 bleed）。
 * 舞台内 z0 背景仍由场景自行放置（随舞台缩放）；全屏弹层放 SceneShell 外。
 */
export function SceneShell({ bleed, bleedImage, bleedBlur = true, children }: {
  bleed?: string
  bleedImage?: string
  bleedBlur?: boolean
  children: React.ReactNode
}) {
  return (
    <BackgroundBleed background={bleed ?? 'transparent'}>
      {bleedImage && (
        <img
          src={bleedImage}
          alt=""
          aria-hidden
          draggable={false}
          style={{
            position: 'absolute', inset: 0,
            width: '100%', height: '100%', objectFit: 'cover',
            // blur 缩边补偿：放大 1.06 避免模糊带在视口边缘露兜底色
            ...(bleedBlur ? { filter: 'blur(14px)', transform: 'scale(1.06)' } : {}),
          }}
        />
      )}
      <LogicalStage>{children}</LogicalStage>
    </BackgroundBleed>
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
