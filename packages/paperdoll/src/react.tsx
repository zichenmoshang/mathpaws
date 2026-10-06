import { useEffect, useRef, useState, type CSSProperties } from 'react'

// ============================================================================
// PaperDoll —— 换装渲染组件（纯展示、无业务状态），v5 N+M 运行时模型
// （原 packages/ui 的 paperdoll.tsx，2026-10-06 迁入 @mathpaws/paperdoll）
//
// 每角色 1 张 body（nohat 全身）+ 每件 gear 1 个图层 + 鞋：
//   z-order：body -> shoe -> gear
//   item gear（遮阳帽/护目镜）：合成时按 mask 给 body 挖洞再叠加；
//   head gear（蛙/精灵/巫师头）：整头覆盖颈部接缝，pair 头（巫师）合成时
//     按所穿 body 颈色实时 relit。所有几何处理见 compose.ts。
//
// 关键渲染策略 —— 离屏 2048 canvas 先合成（含挖洞/relit）再整体缩放，
// 整体只经历一次缩放，避免分层缝隙。
//
// 组件只接收「已解析好的图片 URL + gear 规格」，不耦合资产路径 / 库存；
// 穿戴映射由 app 侧 catalog/store 负责。资产规范见 paperdoll-assets 的
// manifest.json(v5) / anchors.json。
// ============================================================================

import {
  composeLook,
  loadLayerImage,
  type SeamSpec,
} from './compose'

/** 头饰/帽子槽位的两种运行时形态 */
export type DollGear =
  | { kind: 'item'; layer: string; mask?: string }
  | { kind: 'head'; layer: string; seam?: SeamSpec }

export interface PaperDollLayers {
  /** 角色身体（nohat 全身，必填） */
  body: string
  /** 鞋层：存在即穿鞋（鞋领包踝、鞋头已向裸脚贴合） */
  shoe?: string
  /** 头饰：存在即佩戴，运行时挖洞或整头合成 */
  gear?: DollGear
}

/** 预览背景：checker 棋盘格用于查白边/羽化，其余贴近真实页面底色 */
export type PaperDollBackground = 'transparent' | 'checker' | 'white' | 'sky'

export interface PaperDollProps {
  layers: PaperDollLayers
  background?: PaperDollBackground
  className?: string
  style?: CSSProperties
}

const CHECKER: CSSProperties = {
  backgroundColor: '#ffffff',
  backgroundImage:
    'linear-gradient(45deg,#d7dde3 25%,transparent 25%,transparent 75%,#d7dde3 75%),' +
    'linear-gradient(45deg,#d7dde3 25%,#ffffff 25%,#ffffff 75%,#d7dde3 75%)',
  backgroundSize: '26px 26px',
  backgroundPosition: '0 0,13px 13px',
}

const BG: Record<PaperDollBackground, CSSProperties> = {
  transparent: { background: 'transparent' },
  checker: CHECKER,
  white: { background: '#ffffff' },
  sky: { background: 'linear-gradient(180deg,#e3f3fe,#bfe3f5)' },
}

export function PaperDoll({
  layers,
  background = 'transparent',
  className,
  style,
}: PaperDollProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const compositeRef = useRef<HTMLCanvasElement | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Cache key: every URL + gear kind/seam the current look depends on.
  const gearKey = layers.gear
    ? `${layers.gear.kind}|${layers.gear.layer}|${
        'mask' in layers.gear ? layers.gear.mask ?? '' : ''
      }|${'seam' in layers.gear && layers.gear.seam
        ? JSON.stringify(layers.gear.seam) : ''}`
    : ''

  // Draw the cached native composite onto the display canvas at the current
  // client size (one downscale only). Safe to call on resize without reloading.
  const paint = () => {
    const canvas = canvasRef.current
    const off = compositeRef.current
    if (!canvas || !off) return
    const size = canvas.clientWidth
    if (size <= 0) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const dpr = Math.min(window.devicePixelRatio || 1, 3)
    const backing = Math.max(1, Math.round(size * dpr))
    if (canvas.width !== backing || canvas.height !== backing) {
      canvas.width = canvas.height = backing
    }
    ctx.setTransform(1, 0, 0, 1, 0, 0)
    ctx.clearRect(0, 0, backing, backing)
    ctx.imageSmoothingEnabled = true
    ctx.imageSmoothingQuality = 'high'
    ctx.drawImage(off, 0, 0, backing, backing)
  }

  // Effect 1 — rebuild the native 2048 composite whenever the look changes
  // (runtime erase-mask / neck relit happens inside composeLook).
  useEffect(() => {
    let cancelled = false

    const build = async () => {
      const [body, shoe, gear, mask] = await Promise.all([
        loadLayerImage(layers.body),
        layers.shoe ? loadLayerImage(layers.shoe) : Promise.resolve(undefined),
        layers.gear ? loadLayerImage(layers.gear.layer) : Promise.resolve(undefined),
        layers.gear && layers.gear.kind === 'item' && layers.gear.mask
          ? loadLayerImage(layers.gear.mask)
          : Promise.resolve(undefined),
      ])
      if (cancelled) return

      const off = composeLook({
        body,
        shoe,
        gear,
        gearKind: layers.gear?.kind,
        mask,
        seam: layers.gear?.kind === 'head' ? layers.gear.seam : undefined,
      })

      compositeRef.current = off
      setError(null)

      // layout may not be ready on the very first frame -> retry once
      const canvas = canvasRef.current
      if (canvas && canvas.clientWidth <= 0) {
        await new Promise<void>((r) => requestAnimationFrame(() => r()))
        if (cancelled) return
      }
      paint()
    }

    build().catch((e: unknown) => {
      if (!cancelled) setError(e instanceof Error ? e.message : '渲染失败')
    })

    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [layers.body, layers.shoe, gearKey])

  // Effect 2 — repaint (and bump backing resolution) when the box is resized,
  // so dragging the window keeps the doll crisp. rAF-coalesced.
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    let raf = 0
    const ro = new ResizeObserver(() => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => paint())
    })
    ro.observe(canvas)
    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
    }
     
  }, [])

  return (
    <div
      className={className}
      style={{
        position: 'relative',
        width: '100%',
        aspectRatio: '1 / 1',
        overflow: 'hidden',
        borderRadius: 18,
        ...BG[background],
        ...style,
      }}
    >
      <canvas
        ref={canvasRef}
        aria-hidden
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          display: 'block',
          pointerEvents: 'none',
          userSelect: 'none',
        }}
      />
      {error ? (
        <span
          style={{
            position: 'absolute',
            inset: 'auto 0 8px',
            textAlign: 'center',
            fontSize: 12,
            color: '#c0392b',
          }}
        >
          {error}
        </span>
      ) : null}
    </div>
  )
}
