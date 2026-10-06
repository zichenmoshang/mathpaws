// ============================================================================
// compose —— 换装 N+M 运行时合成（v5，2026-10-03；原 packages/ui 的
// paperdoll-compose，2026-10-06 迁入 @mathpaws/paperdoll）
//
// 生产资产每角色只有 1 张 body（nohat）+ 每件 gear 1 个图层，不再有
// N×M 份 forhat 烘焙文件。两种 gear 在合成时处理方式不同：
//
//   item（explorer/scientist）：gear 是帽子/护目镜本身，body 先按配套的
//     柔边 erase mask 挖洞（alpha AND NOT mask），再画鞋、再画 gear。
//
//   head（frog/elf/wizard）：gear 是「整头到颈部」图层，alpha 里已烘焙好
//     头部覆盖（含 pair 头发 gate 与纵向羽化，见 step2 head_cut_coverage），
//     直接覆盖 body 即可；pair 头（wizard）携带 seam：合成前把头部皮肤色
//     按 0.28 源色 + 0.72 所穿 body 的颈部中位肤色重新打光（源颈有深袍影）。
//     非 pair 头（frog/elf）无 seam，原样绘制（离线验证时即不 relit）。
//
// 本文件为纯函数，不依赖 React；PaperDoll 组件与 Dev 回归页共用同一实现，
// 保证「页面所见 = 组件所用」。所有几何常量来自 manifest/anchors，
// 与 design/paperdoll-spike/step2_layers.py 严格对应。
// ============================================================================

export const NATIVE = 2048

// ---- HSV 肤色/发条带（同 step2 SKIN_*/HAIR_*）-----------------------------
const SKIN = { h0: 3, h1: 32, s0: 0.18, s1: 0.48, vMin: 0.62 }
const HAIR = { h0: 4, h1: 45, sMin: 0.32, vMax: 0.72 }
const ALPHA_TH = 8

/** pair 头（wizard）的颈部合成规格；与 step2 pair gate 严格对应 */
export interface SeamSpec {
  /** 过渡带起始行（cut - transition） */
  y0: number
  /** 颈部切割行 */
  cut: number
  /** 源层向下覆盖行数 */
  overlap: number
  /** 纵向高斯羽化 σ */
  sigma: number
  /** relit 混合权重；仅 pair 头（wizard）存在，frog/elf 不 relit */
  relitSrc?: number
  relitNeck?: number
  /** 在 y0 上方多少行起采样身体受光肤色 */
  skinSampleRows: number
}

export type RGB = [number, number, number]

export function loadLayerImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error(`图片加载失败: ${url}`))
    img.src = url
  })
}

export function toCanvas(img: HTMLImageElement, n = NATIVE): HTMLCanvasElement {
  const c = document.createElement('canvas')
  c.width = c.height = n
  const ctx = c.getContext('2d', { willReadFrequently: true })!
  ctx.drawImage(img, 0, 0, n, n)
  return c
}

function isSkin(h: number, s: number, v: number) {
  return h >= SKIN.h0 && h <= SKIN.h1 && s >= SKIN.s0 && s <= SKIN.s1 && v >= SKIN.vMin
}
function isBodylike(h: number, s: number, v: number) {
  return isSkin(h, s, v)
    || (h >= HAIR.h0 && h <= HAIR.h1 && s >= HAIR.sMin && v <= HAIR.vMax)
}

/** alpha>th 像素包围盒（仅读 alpha 通道，远快于全量 HSV 分类） */
function alphaBoxOf(data: Uint8ClampedArray, w: number, h: number, th = ALPHA_TH): Box | null {
  let x0 = w, y0 = h, x1 = -1, y1 = -1
  for (let y = 0; y < h; y++) {
    const row = y * w
    for (let x = 0; x < w; x++) {
      if (data[(row + x) * 4 + 3] > th) {
        if (x < x0) x0 = x; if (x > x1) x1 = x
        if (y < y0) y0 = y; if (y > y1) y1 = y
      }
    }
  }
  return x1 < 0 ? null : { x0, y0, x1: x1 + 1, y1: y1 + 1 }
}

/**
 * 头部包围盒内裁剪的分类结果。下游所有读取都发生在盒内（盒外等价于 0），
 * 因此只保留盒内数据、丢弃全量 RGBA ImageData 引用：
 *   - alpha：盒内原始 alpha（0-255）；> ALPHA_TH 即旧二值 alpha 的 1，
 *     同时充当非 pair 头软接缝的覆盖值（旧 S.data[p*4+3]）。
 *   - skin/hair：盒内 HSV 分类（pair gate 用，非 pair 头闲置但同构）。
 *   - rgb：盒内源像素 RGB（pair relit 取色用）。
 * 每 head 常驻从 ~28MB（全量 RGBA + 3 张全尺寸掩码）降到 ~4MB 级。
 */
interface ClassifyResult {
  alpha: Uint8Array
  skin: Uint8Array
  hair: Uint8Array
  rgb: Uint8Array
  box: Box
}
function classify(img: ImageData, box?: Box | null): ClassifyResult {
  const d = img.data
  const b = box ?? alphaBoxOf(d, img.width, img.height) ?? { x0: 0, y0: 0, x1: img.width, y1: img.height }
  const bw = b.x1 - b.x0
  const total = bw * (b.y1 - b.y0)
  const alpha = new Uint8Array(total)
  const skin = new Uint8Array(total)
  const hair = new Uint8Array(total)
  const rgb = new Uint8Array(total * 3)
  for (let y = b.y0; y < b.y1; y++) {
    const row = y * img.width
    const crow = (y - b.y0) * bw - b.x0
    for (let x = b.x0; x < b.x1; x++) {
      const i = (row + x) * 4
      const cp = crow + x
      const a = d[i + 3]
      alpha[cp] = a
      rgb[cp * 3] = d[i]
      rgb[cp * 3 + 1] = d[i + 1]
      rgb[cp * 3 + 2] = d[i + 2]
      if (a <= ALPHA_TH) continue
      const [h, s, v] = rgb2hsv(d[i], d[i + 1], d[i + 2])
      const sk = isSkin(h, s, v)
      skin[cp] = sk ? 1 : 0
      hair[cp] = !sk && h >= HAIR.h0 && h <= HAIR.h1 && s >= HAIR.sMin && v <= HAIR.vMax ? 1 : 0
    }
  }
  return { alpha, skin, hair, rgb, box: b }
}

/**
 * 源头分类按图片 URL 缓存（回归页 6 行共用同一 wizard 头）。
 * 只缓存盒内裁剪数据（见 ClassifyResult），全量 RGBA 分类完即释放。
 */
const headClassifyCache = new Map<string, ClassifyResult>()

function rgb2hsv(r: number, g: number, b: number): [number, number, number] {
  const rn = r / 255, gn = g / 255, bn = b / 255
  const mx = Math.max(rn, gn, bn), mn = Math.min(rn, gn, bn), df = mx - mn
  let h = 0
  if (df > 1e-6) {
    if (mx === rn) h = (60 * ((gn - bn) / df)) % 360
    else if (mx === gn) h = 60 * ((bn - rn) / df) + 120
    else h = 60 * ((rn - gn) / df) + 240
  }
  if (h < 0) h += 360
  return [h, mx > 0 ? df / mx : 0, mx]
}

function median(arr: number[]): number {
  arr.sort((a, b) => a - b)
  return arr[arr.length >> 1] ?? 0
}

interface Box { x0: number; y0: number; x1: number; y1: number }

/**
 * 采样身体「受光肤色」中位数：从 y0 上方 skinSampleRows 行起，向下覆盖全部
 * 身体皮肤（颈被高领遮住的 wizard 靠手臂/腿/脚取色），大步径抽样。
 * 必须与 step2 head_cut_coverage 的 neck_col 取法一致（ys >= y0-80，
 * 无上界）——不能只取 cut 上方窄带：那里对高领角色是空集（曾采到 (0,0,0)
 * 把整张脸 relit 成黑色），对其他角色也只是下巴阴影的偏暗肤色。
 */
export function sampleNeckColor(bodyCanvas: HTMLCanvasElement, seam: SeamSpec): RGB {
  const ctx = bodyCanvas.getContext('2d', { willReadFrequently: true })!
  const yLo = Math.max(0, seam.y0 - seam.skinSampleRows)
  const data = ctx.getImageData(0, yLo, NATIVE, NATIVE - yLo).data
  const rs: number[] = [], gs: number[] = [], bs: number[] = []
  const h = NATIVE - yLo
  // 逐像素采样，与离线 head_cut_coverage 的 np.median(ba[skin]) 同口径
  // （步径抽样会让中位数偏 ±1，探险家颈缝因此有系统性色差）；高领角色
  // 靠手臂/腿/脚取色。
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < NATIVE; x++) {
      const i = (y * NATIVE + x) * 4
      if (data[i + 3] <= ALPHA_TH) continue
      const [hh, ss, vv] = rgb2hsv(data[i], data[i + 1], data[i + 2])
      if (isSkin(hh, ss, vv)) {
        rs.push(data[i]); gs.push(data[i + 1]); bs.push(data[i + 2])
      }
    }
  }
  return [median(rs), median(gs), median(bs)]
}

/**
 * 从 pair 头【源头】（未 gate、未 relit 的水平切头）按【所穿身体】动态构建
 * pair 头，逐像素复刻 step2 head_cut_coverage 的 pair 分支：
 *   gate = 源皮肤 OR (源头发 AND 身体肤发)
 *   hard cov：y0 以上全 255，过渡带按 gate；纵向 σ 高斯羽化；再乘源头 alpha
 *   源皮肤 RGB 按 0.28·源 + 0.72·body 受光肤色 relit
 * explorer 颈后独有一缕后发，gate 必须按当前身体算，否则接缝缺发（2026-10-03
 * 离线验证动态头与 per-body 烘焙头 RGB 差 0.00）。
 */
export function buildPairHead(
  srcHeadCanvas: HTMLCanvasElement,
  bodyCanvas: HTMLCanvasElement,
  seam: SeamSpec,
  neck: RGB,
  cacheKey?: string,
): { canvas: HTMLCanvasElement; cov: Float32Array } {
  const total = NATIVE * NATIVE
  const { y0, cut, overlap, sigma, relitSrc, relitNeck } = seam

  // 源头 HSV 分类只算一次（同一 wizard 头 × N 身体时复用缓存）
  let S: ClassifyResult | undefined = cacheKey ? headClassifyCache.get(cacheKey) : undefined
  if (!S) {
    const src = srcHeadCanvas.getContext('2d', { willReadFrequently: true })!
      .getImageData(0, 0, NATIVE, NATIVE)
    S = classify(src)
    if (cacheKey) headClassifyCache.set(cacheKey, S)
  }
  const box = S.box
  const bw = box.x1 - box.x0
  // 盒内行读取（列恒在盒内；盒外行等价于旧全尺寸掩码的 0）
  const alphaAt = (y: number, x: number) =>
    y >= box.y0 && y < box.y1 ? S!.alpha[(y - box.y0) * bw + (x - box.x0)] : 0
  const skinAt = (y: number, x: number) =>
    y >= box.y0 && y < box.y1 ? S!.skin[(y - box.y0) * bw + (x - box.x0)] : 0
  const hairAt = (y: number, x: number) =>
    y >= box.y0 && y < box.y1 ? S!.hair[(y - box.y0) * bw + (x - box.x0)] : 0
  const xL = Math.max(0, box.x0), xR = Math.min(NATIVE, box.x1)
  // 离线 cov[:y0-2r]=255 强制覆盖到行 y0-2r-1（Python 切片），即硬区 y<y0-2r
  const yTop = y0 - 2 * sigma

  // 身体肤发分类只需过渡带 y0..cut+overlap 这 87 行（gate 不在别处用）
  const bandH = cut + overlap - y0
  const band = bodyCanvas.getContext('2d', { willReadFrequently: true })!
    .getImageData(0, y0, NATIVE, bandH)
  const bLike = new Uint8Array(total)
  for (let y = 0; y < bandH; y++) {
    for (let x = xL; x < xR; x++) {
      const i = (y * NATIVE + x) * 4
      if (band.data[i + 3] <= ALPHA_TH) continue
      const [h, s, v] = rgb2hsv(band.data[i], band.data[i + 1], band.data[i + 2])
      if (isBodylike(h, s, v)) bLike[(y0 + y) * NATIVE + x] = 1
    }
  }

  // scipy gaussian_filter1d 默认 truncate=4：radius = int(sigma*4+0.5)，
  // Python int() 是截断（σ=8 时 32，不是 Math.round 的 33）
  const radius = Math.floor(sigma * 4 + 0.5)
  const kernel = new Float32Array(radius * 2 + 1)
  let ksum = 0
  for (let k = -radius; k <= radius; k++) {
    const w = Math.exp(-(k * k) / (2 * sigma * sigma))
    kernel[k + radius] = w; ksum += w
  }
  for (let k = 0; k < kernel.length; k++) kernel[k] /= ksum

  // hard gate：y0 以上为 1（头本体），过渡带按 gate；只存过渡带
  const gateBand = new Uint8Array(bandH * NATIVE)
  for (let y = 0; y < bandH; y++) {
    const gr = y * NATIVE, fr = (y0 + y) * NATIVE
    for (let x = xL; x < xR; x++) {
      gateBand[gr + x] = skinAt(y0 + y, x) || (hairAt(y0 + y, x) && bLike[fr + x]) ? 1 : 0
    }
  }

  // 纵向一维高斯（仅头部包围盒列、过渡带上下各一个半径的范围）
  const cov = new Float32Array(total)
  const yLo = Math.max(0, yTop)
  const yHi = Math.min(NATIVE, cut + overlap + radius)
  for (let x = xL; x < xR; x++) {
    for (let y = yLo; y < yHi; y++) {
      let acc = 0
      for (let k = -radius; k <= radius; k++) {
        const q = y + k
        let g = 0
        if (q < y0) g = 1
        else if (q < cut + overlap) g = gateBand[(q - y0) * NATIVE + x]
        acc += g * kernel[k + radius]
      }
      cov[y * NATIVE + x] = acc * 255
    }
  }
  // yTop 以上的头本体：覆盖=源 alpha（二值）；包围盒外保持 0
  for (let y = box.y0; y < Math.min(yTop, box.y1); y++) {
    const row = y * NATIVE
    for (let x = xL; x < xR; x++) {
      if (alphaAt(y, x) > ALPHA_TH) cov[row + x] = 255
    }
  }
  // 过渡带再门控到源头不透明像素（真正的羽化来自上面的 gate 高斯；
  // 不能乘导出 alpha，否则双重羽化——曾导致 explorer 残留色差）
  for (let y = yLo; y < Math.min(cut + overlap, box.y1); y++) {
    const row = y * NATIVE
    for (let x = xL; x < xR; x++) {
      if (alphaAt(y, x) <= ALPHA_TH) cov[row + x] = 0
    }
  }

  // 组装 RGBA（仅包围盒行 × 包围盒列），皮肤按颈色 relit。与离线一致：
  // cov 与 RGB 都【截断】到 uint8（numpy astype），不是 Uint8Clamped 的四舍五入。
  const wSrc = relitSrc ?? 1, wNeck = relitNeck ?? 0
  const doRelit = wNeck > 0
  const out = new ImageData(NATIVE, NATIVE)
  const od = out.data
  const yOutHi = Math.min(cut + overlap, box.y1)
  const trunc = (v: number) => (v >= 255 ? 255 : v <= 0 ? 0 : Math.trunc(v))
  for (let y = box.y0; y < yOutHi; y++) {
    const row = y * NATIVE
    const crow = (y - box.y0) * bw - box.x0
    for (let x = xL; x < xR; x++) {
      const p = row + x
      const cf = cov[p]
      if (cf <= 0) continue
      const c = trunc(cf)
      cov[p] = c // 返回给挖洞的 cov 与离线 L mask 同字节
      const i = p * 4
      const ci = (crow + x) * 3
      const rl = doRelit && S.skin[crow + x]
      od[i] = rl ? trunc(wSrc * S.rgb[ci] + wNeck * neck[0]) : S.rgb[ci]
      od[i + 1] = rl ? trunc(wSrc * S.rgb[ci + 1] + wNeck * neck[1]) : S.rgb[ci + 1]
      od[i + 2] = rl ? trunc(wSrc * S.rgb[ci + 2] + wNeck * neck[2]) : S.rgb[ci + 2]
      od[i + 3] = c
    }
  }
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = NATIVE
  canvas.getContext('2d')!.putImageData(out, 0, 0)
  return { canvas, cov }
}

/**
 * 头部归属洞（对应 step2 head_ownership_hole + cut_hole）：整头 gear 的源
 * 拥有整个头部，身体必须按洞擦除后再盖头。洞由两部分合成：
 *   - 硬头区（y < y0-2σ）：源头是硬 255 覆盖、衣领到不了这里，源头包围盒列内
 *     的身体像素【全部】擦掉——包括 HSV 条带判不到的低饱和头发羽化边
 *     （否则帽冠两侧残留身体头发穹顶/呆毛羽絮）。
 *   - 接缝带（hardY .. cut）：body.alpha 先按头覆盖 cov（pair 传入，非 pair
 *     用源头自身 alpha；cov 的羽化尾自然延到 cut+overlap）软挖，再把源头是
 *     空气处的身体肤/发擦掉（bulge，只到 cut！），保留衣服衣领。
 * 注意 bulge 行范围严格 y<cut——多擦到 cut..cut+overlap 会把探险家卡其衣领
 * （HSV 落在肤色带） punch 出三角洞（2026-10-04 回归飘红根因）。
 * pairCov 为动态 gate 算好并按 uint8 截断的 0-255 覆盖；非 pair 不传。
 */
export function applyHeadHole(
  bodyCanvas: HTMLCanvasElement,
  headCanvas: HTMLCanvasElement,
  seam: SeamSpec,
  pairCov?: Float32Array,
  cacheKey?: string,
): void {
  const total = NATIVE * NATIVE
  let S = cacheKey ? headClassifyCache.get(cacheKey) : undefined
  if (!S) {
    const img = headCanvas.getContext('2d', { willReadFrequently: true })!
      .getImageData(0, 0, NATIVE, NATIVE)
    S = classify(img)
    if (cacheKey) headClassifyCache.set(cacheKey, S)
  }
  const { y0, cut, overlap, sigma } = seam
  const hardY = y0 - 2 * sigma // 硬区行 y < hardY（离线 rows[:hard_y]）
  const yHi = Math.min(NATIVE, cut + overlap)
  const { x0: bx0, x1: bx1, y0: by0 } = S.box
  const bw = bx1 - bx0
  const xL = Math.max(0, bx0), xR = Math.min(NATIVE, bx1)

  const ctx = bodyCanvas.getContext('2d', { willReadFrequently: true })!
  const body = ctx.getImageData(0, 0, NATIVE, yHi)
  const bd = body.data
  // 接缝带身体肤/发分类：bulge 只需 hardY..cut（cov 软挖自带到 cut+overlap）
  const bLike = new Uint8Array(total)
  for (let y = Math.max(0, hardY); y < cut; y++) {
    for (let x = xL; x < xR; x++) {
      const i = (y * NATIVE + x) * 4
      if (bd[i + 3] <= 0) continue
      const [h, s, v] = rgb2hsv(bd[i], bd[i + 1], bd[i + 2])
      if (isBodylike(h, s, v)) bLike[y * NATIVE + x] = 1
    }
  }

  const yStart = Math.max(0, by0)
  for (let y = yStart; y < Math.min(yHi, S.box.y1); y++) {
    const hard = y < hardY
    const crow = (y - by0) * bw - bx0
    for (let x = xL; x < xR; x++) {
      const p = y * NATIVE + x
      const i = p * 4
      if (bd[i + 3] <= 0) continue
      let hole = 0
      if (hard) {
        hole = 255
      } else {
        // 软接缝：动态 cov（pair）或源头自身 alpha
        const covA = pairCov ? pairCov[p] : S.alpha[crow + x]
        if (covA > hole) hole = covA
        // 归属 bulge 严格限制 y<cut，保护 cut 以下衣领
        if (y < cut && S.alpha[crow + x] <= ALPHA_TH && bLike[p]) hole = 255
      }
      if (hole > 0) {
        bd[i + 3] = Math.min(bd[i + 3], 255 - Math.max(0, Math.min(255, hole)))
      }
    }
  }
  ctx.putImageData(body, 0, 0)
}

/**
 * item gear 的柔边挖洞：body.alpha = min(body.alpha, 255 - mask.alpha)，
 * 只在 mask alpha bbox 内逐像素处理。mask 的 RGB 忽略（导出时为 0）。
 */
export function eraseByMask(
  bodyCanvas: HTMLCanvasElement,
  maskCanvas: HTMLCanvasElement,
): HTMLCanvasElement {
  const bctx = bodyCanvas.getContext('2d', { willReadFrequently: true })!
  const mctx = maskCanvas.getContext('2d', { willReadFrequently: true })!
  const mImg = mctx.getImageData(0, 0, NATIVE, NATIVE)
  const box = alphaBoxOf(mImg.data, NATIVE, NATIVE, 0)
  if (!box) return bodyCanvas
  const bImg = bctx.getImageData(box.x0, box.y0, box.x1 - box.x0, box.y1 - box.y0)
  const bd = bImg.data, md = mImg.data
  const w = box.x1 - box.x0
  for (let y = 0; y < bImg.height; y++) {
    for (let x = 0; x < w; x++) {
      const bi = (y * w + x) * 4 + 3
      const mi = ((box.y0 + y) * NATIVE + (box.x0 + x)) * 4 + 3
      bd[bi] = Math.min(bd[bi], 255 - md[mi])
    }
  }
  bctx.putImageData(bImg, box.x0, box.y0)
  return bodyCanvas
}

export interface ComposeInput {
  body: HTMLImageElement
  shoe?: HTMLImageElement
  /** item/head gear 原图（head 为烘焙覆盖的整头层） */
  gear?: HTMLImageElement
  gearKind?: 'item' | 'head'
  /** item gear 的挖洞 mask */
  mask?: HTMLImageElement
  /** head gear 中需要 relit 的 pair 头（wizard）；frog/elf 不传 */
  seam?: SeamSpec
}

/** 2048 离屏画布上合成整套 look；调用方负责再整体缩放绘制。 */
export function composeLook(input: ComposeInput, n = NATIVE): HTMLCanvasElement {
  const body = toCanvas(input.body, n)

  let gear: HTMLCanvasElement | null = null
  if (input.gear) {
    if (input.gearKind === 'item') {
      if (input.mask) eraseByMask(body, toCanvas(input.mask, n))
      gear = toCanvas(input.gear, n)
    } else {
      const srcHead = toCanvas(input.gear, n)
      if (input.seam && input.seam.relitNeck) {
        // pair 头（wizard）：颈色采样 → 动态 hair gate + relit 出头，再按
        // 动态 cov 挖身体（含头部归属洞，擦掉帽冠外身体头发鼓包）。
        const neck = sampleNeckColor(body, input.seam)
        const built = buildPairHead(srcHead, body, input.seam, neck, input.gear.src)
        applyHeadHole(body, srcHead, input.seam, built.cov, input.gear.src)
        gear = built.canvas
      } else if (input.seam) {
        // 非 pair 整头（frog/elf）：按头 alpha + 头部归属洞挖身体再盖。
        applyHeadHole(body, srcHead, input.seam, undefined, input.gear.src)
        gear = srcHead
      } else {
        gear = srcHead
      }
    }
  }

  const ctx = body.getContext('2d')!
  if (input.shoe) ctx.drawImage(toCanvas(input.shoe, n), 0, 0, n, n)
  if (gear) ctx.drawImage(gear, 0, 0, n, n)
  return body
}
