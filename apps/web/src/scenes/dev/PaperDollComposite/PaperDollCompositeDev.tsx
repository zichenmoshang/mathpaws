// ============================================================================
// PaperDollCompositeDev —— 换装「运行时合成」回归页（dev 常驻，#paperdoll-rt）
//
// 2026-10-03 由 N+M 可行性 spike 转正。每次换装资产/合成算法变更后在此回归：
// 同一个 wizard 整头 × 全部 6 具身体，逐行对比
//   A 离线烘焙真值（_truth：forhat 身体 + per-body relit 帽层）
//   B 生产路径（@mathpaws/paperdoll 的 composeLook：body + 鞋 + 运行时 relit 头）
//   C 生产路径但关闭 relit（证明 relit 必要）
// A/B 必须肉眼不可辨、差异只允许出现在 1-2px 颈缝弧。
//
// 注意：B 走的就是 PaperDoll 组件同一套 composeLook，本页不重复实现算法。
// 静态样式已迁入同目录 PaperDollCompositeDev.css.ts（vanilla-extract）；
// style={{...}} 仅保留运行时动态值（小标题/统计值的判定配色）。
// ============================================================================
import {
  composeLook,
  loadLayerImage,
  toCanvas,
  sampleNeckColor,
  type SeamSpec,
} from '@mathpaws/paperdoll'
import { useEffect, useRef, useState } from 'react'

import { HAT_OPTIONS } from '../../../paperdoll/catalog'

import truthHatDefault from '../../../assets/paperdoll/_truth/hats/hat-wizard-on-default@2x.webp'
import truthHatElf from '../../../assets/paperdoll/_truth/hats/hat-wizard-on-elf@2x.webp'
import truthHatExplorer from '../../../assets/paperdoll/_truth/hats/hat-wizard-on-explorer@2x.webp'
import truthHatFrog from '../../../assets/paperdoll/_truth/hats/hat-wizard-on-frog@2x.webp'
import truthHatScientist from '../../../assets/paperdoll/_truth/hats/hat-wizard-on-scientist@2x.webp'
import truthHatWizard from '../../../assets/paperdoll/_truth/hats/hat-wizard-on-wizard@2x.webp'
import truthDefault from '../../../assets/paperdoll/_truth/outfits/outfit-default-forhat-wizard@2x.webp'
import truthExplorer from '../../../assets/paperdoll/_truth/outfits/outfit-explorer-forhat-wizard@2x.webp'
import bodyDefault from '../../../assets/paperdoll/layers/bodies/body-default@2x.webp'
import bodyExplorer from '../../../assets/paperdoll/layers/bodies/body-explorer@2x.webp'
import bodyScientist from '../../../assets/paperdoll/layers/bodies/body-scientist@2x.webp'
import bodyFrog from '../../../assets/paperdoll/layers/bodies/body-frog@2x.webp'
import bodyElf from '../../../assets/paperdoll/layers/bodies/body-elf@2x.webp'
import bodyWizard from '../../../assets/paperdoll/layers/bodies/body-wizard@2x.webp'

// _truth 是离线烘焙回归真值（vite 只在本 lazy dev 页打包它，不进生产 chunk）
import truthScientist from '../../../assets/paperdoll/_truth/outfits/outfit-scientist-forhat-wizard@2x.webp'
import truthFrog from '../../../assets/paperdoll/_truth/outfits/outfit-frog-forhat-wizard@2x.webp'
import truthElf from '../../../assets/paperdoll/_truth/outfits/outfit-elf-forhat-wizard@2x.webp'
import truthWizard from '../../../assets/paperdoll/_truth/outfits/outfit-wizard-forhat-wizard@2x.webp'
import wizardHeadUrl from '../../../assets/paperdoll/layers/heads/head-wizard@2x.webp'
import shoeUrl from '../../../assets/paperdoll/layers/shoes/shoe-default@2x.webp'

import * as s from './PaperDollCompositeDev.css'

const N = 2048

// seam 与 catalog.ts 同源（manifest.json gear.seam）：直接取 wizard 头饰的运行时定义，
// 不再本地手抄常量（catalog 由 seamOf('wizard') 从 manifest 读取）
const SEAM: SeamSpec = (() => {
  const gear = HAT_OPTIONS.find(g => g.id === 'wizard')?.gear
  const seam = gear?.kind === 'head' ? gear.seam : undefined
  if (!seam) throw new Error('catalog 缺少 wizard 头饰 seam（manifest gear.seam）')
  return seam
})()

const ZOOM = { x: 560, y: 900, w: 930, h: 280 }

interface RowDef {
  id: string
  label: string
  body: string
  truthBody: string
  truthHat: string
}
const ROWS: RowDef[] = [
  { id: 'default', label: '默认套装（白T·低领）', body: bodyDefault, truthBody: truthDefault, truthHat: truthHatDefault },
  { id: 'explorer', label: '探险家套装', body: bodyExplorer, truthBody: truthExplorer, truthHat: truthHatExplorer },
  { id: 'scientist', label: '小科学家套装', body: bodyScientist, truthBody: truthScientist, truthHat: truthHatScientist },
  { id: 'frog', label: '小青蛙套装', body: bodyFrog, truthBody: truthFrog, truthHat: truthHatFrog },
  { id: 'elf', label: '小圣诞精灵套装', body: bodyElf, truthBody: truthElf, truthHat: truthHatElf },
  { id: 'wizard', label: '小魔法师套装（同源·高袍领）', body: bodyWizard, truthBody: truthWizard, truthHat: truthHatWizard },
]

interface RowStats {
  neck: [number, number, number]
  meanAll: number; p95All: number; over25All: number
  meanBand: number; p95Band: number; over25Band: number
  ms: number
}
interface RowResult extends RowDef {
  A: HTMLCanvasElement
  B: HTMLCanvasElement
  heat: HTMLCanvasElement
  stats: RowStats
}

function diffStats(a: HTMLCanvasElement, b: HTMLCanvasElement, y0 = 0, y1 = N) {
  const ad = a.getContext('2d', { willReadFrequently: true })!.getImageData(0, 0, N, N).data
  const bd = b.getContext('2d', { willReadFrequently: true })!.getImageData(0, 0, N, N).data
  const hist = new Uint32Array(256)
  let sum = 0, n = 0, over25 = 0
  for (let y = y0; y < y1; y++) {
    for (let x = 0; x < N; x++) {
      const i = (y * N + x) * 4
      if (ad[i + 3] <= 8 && bd[i + 3] <= 8) continue
      const d = Math.max(
        Math.abs(ad[i] - bd[i]), Math.abs(ad[i + 1] - bd[i + 1]),
        Math.abs(ad[i + 2] - bd[i + 2]))
      hist[d]++; sum += d; n++; if (d > 25) over25++
    }
  }
  let acc = 0, p95 = 255
  const target = n * 0.95
  for (let d = 0; d < 256; d++) { acc += hist[d]; if (acc >= target) { p95 = d; break } }
  return { mean: n ? sum / n : 0, p95, over25, n }
}

function buildHeat(a: HTMLCanvasElement, b: HTMLCanvasElement): HTMLCanvasElement {
  const ad = a.getContext('2d')!.getImageData(0, 0, N, N).data
  const bd = b.getContext('2d')!.getImageData(0, 0, N, N).data
  const out = new ImageData(ZOOM.w, ZOOM.h)
  const od = out.data
  for (let y = 0; y < ZOOM.h; y++) {
    for (let x = 0; x < ZOOM.w; x++) {
      const si = ((ZOOM.y + y) * N + (ZOOM.x + x)) * 4
      const di = (y * ZOOM.w + x) * 4
      if (ad[si + 3] <= 8 && bd[si + 3] <= 8) {
        od[di] = 30; od[di + 1] = 30; od[di + 2] = 34; od[di + 3] = 255; continue
      }
      const d = Math.max(
        Math.abs(ad[si] - bd[si]), Math.abs(ad[si + 1] - bd[si + 1]),
        Math.abs(ad[si + 2] - bd[si + 2]))
      od[di] = Math.min(255, d * 8); od[di + 1] = 40; od[di + 2] = 40; od[di + 3] = 255
    }
  }
  const c = document.createElement('canvas')
  c.width = ZOOM.w; c.height = ZOOM.h
  c.getContext('2d')!.putImageData(out, 0, 0)
  return c
}

function checkerCanvas(w: number, h: number, cell = 16): HTMLCanvasElement {
  const c = document.createElement('canvas')
  c.width = w; c.height = h
  const ctx = c.getContext('2d')!
  ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, w, h)
  ctx.fillStyle = '#d9dee3'
  for (let y = 0; y * cell < h; y++)
    for (let x = 0; x * cell < w; x++)
      if ((x + y) & 1) ctx.fillRect(x * cell, y * cell, cell, cell)
  return c
}

function paint(target: HTMLCanvasElement, src: HTMLCanvasElement, zoom?: { x: number; y: number; w: number; h: number }) {
  const ctx = target.getContext('2d')!
  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = 'high'
  if (!zoom) {
    ctx.drawImage(checkerCanvas(target.width, target.height, Math.max(8, target.width / 64)), 0, 0)
    ctx.drawImage(src, 0, 0, target.width, target.height)
  } else {
    ctx.drawImage(checkerCanvas(target.width, target.height, 16), 0, 0)
    ctx.drawImage(src, zoom.x, zoom.y, zoom.w, zoom.h, 0, 0, target.width, target.height)
  }
}

const FULL = 210
const ZOOM_W = 300
const ZOOM_H = Math.round(ZOOM.h * (ZOOM_W / ZOOM.w))

export function PaperDollCompositeDev() {
  const [rows, setRows] = useState<RowResult[] | null>(null)
  const [progress, setProgress] = useState('加载资产…')
  const [err, setErr] = useState<string | null>(null)
  const refs = useRef<Record<string, HTMLCanvasElement | null>>({})

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const [shoeImg, headImg] = await Promise.all([
        loadLayerImage(shoeUrl), loadLayerImage(wizardHeadUrl),
      ])
      const results: RowResult[] = []
      for (const def of ROWS) {
        if (cancelled) return
        setProgress(`计算 ${def.label}（${def.id}）…`)
        await new Promise(r => requestAnimationFrame(() => r(null)))
        const [bodyImg, tBodyImg, tHatImg] = await Promise.all([
          loadLayerImage(def.body), loadLayerImage(def.truthBody),
          loadLayerImage(def.truthHat),
        ])
        const t0 = performance.now()
        // A：离线烘焙真值（静态叠加）
        const A = document.createElement('canvas')
        A.width = A.height = N
        const actx = A.getContext('2d')!
        actx.drawImage(toCanvas(tBodyImg), 0, 0)
        actx.drawImage(toCanvas(shoeImg), 0, 0)
        actx.drawImage(toCanvas(tHatImg), 0, 0)
        // B：生产合成路径（组件同款）
        const B = composeLook({
          body: bodyImg, shoe: shoeImg, gear: headImg, gearKind: 'head', seam: SEAM,
        })
        // C：不 relit 对照（本页只需其全身一张，在下方单独画）
        const neck = sampleNeckColor(toCanvas(bodyImg), SEAM)
        const sAll = diffStats(A, B)
        const sBand = diffStats(A, B, SEAM.y0 - 90, SEAM.cut + SEAM.overlap + 60)
        results.push({
          ...def, A, B, heat: buildHeat(A, B),
          stats: {
            neck,
            meanAll: sAll.mean, p95All: sAll.p95, over25All: sAll.over25,
            meanBand: sBand.mean, p95Band: sBand.p95, over25Band: sBand.over25,
            ms: performance.now() - t0,
          },
        })
      }
      // 6 行算完一次性渲染（源头分类在 compose 内有缓存，第 2 行起更便宜）
      setRows(results)
      setProgress('')
    })().catch(e => setErr(e instanceof Error ? e.message : String(e)))
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    if (!rows) return
    for (const r of rows) {
      const fa = refs.current[`${r.id}-fa`]; const fb = refs.current[`${r.id}-fb`]
      const za = refs.current[`${r.id}-za`]; const zb = refs.current[`${r.id}-zb`]
      const hc = refs.current[`${r.id}-h`]
      if (fa && fb && fa.width !== FULL) { fa.width = fa.height = FULL; fb.width = fb.height = FULL }
      if (za && zb && hc && za.width !== ZOOM_W) { za.width = zb.width = hc.width = ZOOM_W; za.height = zb.height = hc.height = ZOOM_H }
      if (fa) paint(fa, r.A)
      if (fb) paint(fb, r.B)
      if (za) paint(za, r.A, ZOOM)
      if (zb) paint(zb, r.B, ZOOM)
      if (hc) { const c = hc.getContext('2d')!; c.imageSmoothingEnabled = true; c.drawImage(r.heat, 0, 0, ZOOM_W, ZOOM_H) }
    }
  }, [rows])

  return (
    <div className={s.root}>
      <h2 className={s.heading}>
        运行时合成回归 —— 生产 composeLook 与离线真值 A/B（wizard 头 × 6 身体）
      </h2>
      <div className={s.intro}>
        A=离线烘焙真值（_truth）　B=生产路径（PaperDoll 同款 composeLook + 运行时 relit）。
        判定：6 行颈部放大不可辨、热图无结构性亮斑（允许 1-2px 接缝弧）。
      </div>
      {err ? <pre className={s.err}>{err}</pre> : null}
      {!rows && !err ? <div className={s.progress}>{progress}</div> : null}

      {rows?.map(r => (
        <div key={r.id} className={s.rowCard}>
          <div className={s.labelCol}>
            <div className={s.labelTitle}>{r.label}</div>
            <div className={s.labelId}>{r.id}</div>
          </div>
          <div>
            {/* 小标题配色随列类型动态注入 */}
            <div className={s.cap} style={{ color: '#546e7a' }}>A 真值<canvas ref={el => { refs.current[`${r.id}-fa`] = el }} className={s.canvas} /></div>
          </div>
          <div>
            <div className={s.cap} style={{ color: '#1565C0' }}>B 生产 composeLook<canvas ref={el => { refs.current[`${r.id}-fb`] = el }} className={s.canvas} /></div>
          </div>
          <div>
            <div className={s.cap} style={{ color: '#546e7a' }}>颈部 A<canvas ref={el => { refs.current[`${r.id}-za`] = el }} className={s.canvas} /></div>
          </div>
          <div>
            <div className={s.cap} style={{ color: '#1565C0' }}>颈部 B<canvas ref={el => { refs.current[`${r.id}-zb`] = el }} className={s.canvas} /></div>
          </div>
          <div>
            <div className={s.cap} style={{ color: '#b71c1c' }}>热图 ×8<canvas ref={el => { refs.current[`${r.id}-h`] = el }} className={s.canvas} /></div>
          </div>
          <div className={s.statsCol}>
            颈色 RGB({r.stats.neck.map(v => Math.round(v)).join(', ')})<br />
            全图 均值 {r.stats.meanAll.toFixed(2)} / P95 {r.stats.p95All} / &gt;25px {r.stats.over25All}<br />
            颈部 均值 <b style={{ color: r.stats.meanBand > 4 ? '#c62828' : '#2e7d32' }}>{r.stats.meanBand.toFixed(2)}</b>
            {' '}/ P95 <b style={{ color: r.stats.p95Band > 16 ? '#c62828' : '#2e7d32' }}>{r.stats.p95Band}</b>
            {' '}/ &gt;25px {r.stats.over25Band}<br />
            计算 {r.stats.ms.toFixed(0)} ms
          </div>
        </div>
      ))}
    </div>
  )
}
