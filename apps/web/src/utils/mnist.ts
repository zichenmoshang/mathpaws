import * as tf from '@tensorflow/tfjs'
import { setWasmPaths } from '@tensorflow/tfjs-backend-wasm'
// 三个 wasm 二进制作为本地资源（Vite 打包/serve），不依赖 CDN，可离线
import wasmSimdUrl from '@tensorflow/tfjs-backend-wasm/dist/tfjs-backend-wasm-simd.wasm?url'
import wasmThreadedUrl from '@tensorflow/tfjs-backend-wasm/dist/tfjs-backend-wasm-threaded-simd.wasm?url'
import wasmBaseUrl from '@tensorflow/tfjs-backend-wasm/dist/tfjs-backend-wasm.wasm?url'

// 用 BASE_URL 拼接：GitHub Pages 子路径部署（/mathpaws/）下绝对路径会 404
const MODEL_URL = `${import.meta.env.BASE_URL}models/mnist/model.json`
const INK_THRESHOLD = 200

let model: tf.LayersModel | null = null
let modelPromise: Promise<tf.LayersModel> | null = null
let backendReady: Promise<void> | null = null

/**
 * 配置并切换到 WASM 后端：
 * - 不与 three.js 争抢核显 WebGL，避免 GPU 上下文丢失（Context Lost）；
 * - wasm 走本地打包资源、可离线；浏览器支持 SIMD 时自动用 SIMD 版。
 */
function ensureWasmBackend(): Promise<void> {
  if (backendReady) return backendReady
  backendReady = (async () => {
    try {
      setWasmPaths({
        'tfjs-backend-wasm.wasm': wasmBaseUrl,
        'tfjs-backend-wasm-simd.wasm': wasmSimdUrl,
        'tfjs-backend-wasm-threaded-simd.wasm': wasmThreadedUrl,
      })
      await tf.setBackend('wasm')
      await tf.ready()
      console.info('[mnist] tfjs backend:', tf.getBackend())
    } catch (e) {
      backendReady = null // 初始化失败：清空缓存的 Promise，允许下次重试
      throw e
    }
  })()
  return backendReady
}

/** 加载模型（单例 + in-flight 复用；失败后允许下次重试） */
export async function loadModel(): Promise<tf.LayersModel> {
  if (model) return model
  if (modelPromise) return modelPromise
  modelPromise = (async () => {
    try {
      await ensureWasmBackend()
      const m = await tf.loadLayersModel(MODEL_URL)
      model = m
      return m
    } catch (e) {
      modelPromise = null // 加载失败，下次调用重新尝试
      throw e
    }
  })()
  return modelPromise
}

/** 预热：进入答题页即后台初始化后端 + 加载模型，避免点提交时才加载造成卡顿 */
export function warmupModel(): void {
  loadModel().catch(() => { /* 忽略，提交识别时会再次尝试并提示 */ })
}

function preprocessFromData(
  src: Uint8ClampedArray,
  srcW: number,
  srcH: number,
): tf.Tensor4D {
  const size = 28

  // 1) 墨迹包围盒
  let minX = srcW, minY = srcH, maxX = -1, maxY = -1
  for (let y = 0; y < srcH; y++) {
    for (let x = 0; x < srcW; x++) {
      const i = (y * srcW + x) * 4
      if (src[i] < INK_THRESHOLD) {
        if (x < minX) minX = x; if (x > maxX) maxX = x
        if (y < minY) minY = y; if (y > maxY) maxY = y
      }
    }
  }
  const bw = Math.max(maxX - minX + 1, 1)
  const bh = Math.max(maxY - minY + 1, 1)

  // 2) 等比缩放到长边 20
  const target = 20
  const scale = Math.min(target / bw, target / bh)
  const drawW = Math.max(Math.round(bw * scale), 1)
  const drawH = Math.max(Math.round(bh * scale), 1)

  // 3) 几何居中放入 28，再按质心（重心）居中（MNIST 标准，非 bbox 几何中心）
  const tmp = document.createElement('canvas')
  tmp.width = size; tmp.height = size
  const srcCanvas = document.createElement('canvas')
  srcCanvas.width = srcW; srcCanvas.height = srcH
  srcCanvas.getContext('2d')!.putImageData(
    new ImageData(src.slice(), srcW, srcH), 0, 0,
  )
  tmp.getContext('2d')!.drawImage(
    srcCanvas, minX, minY, bw, bh,
    (size - drawW) / 2, (size - drawH) / 2, drawW, drawH,
  )
  const td = tmp.getContext('2d')!.getImageData(0, 0, size, size).data
  let sumX = 0, sumY = 0, mass = 0
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const i = (y * size + x) * 4
      const w = 255 - td[i] // 黑笔迹权重
      if (w > 0) { sumX += x * w; sumY += y * w; mass += w }
    }
  }
  const cx = mass > 0 ? sumX / mass : size / 2
  const cy = mass > 0 ? sumY / mass : size / 2
  const shifted = document.createElement('canvas')
  shifted.width = size; shifted.height = size
  shifted.getContext('2d')!.drawImage(tmp, size / 2 - cx, size / 2 - cy)

  // shifted 边缘可能透明；fromPixels 会把透明读成黑，故先合成到白底
  const work = document.createElement('canvas')
  work.width = size; work.height = size
  const wctx = work.getContext('2d')!
  wctx.fillStyle = '#fff'; wctx.fillRect(0, 0, size, size)
  wctx.drawImage(shifted, 0, 0)

  // 4) 反转为黑底白字（与 MNIST 训练分布一致：墨迹=1、底=0）并归一化
  const out = tf.browser.fromPixels(work, 1).toFloat().div(255)
  return tf.scalar(1).sub(out)
    .reshape([1, size, size, 1]) as tf.Tensor4D
}

function preprocess(source: HTMLCanvasElement): tf.Tensor4D {
  const srcCtx = source.getContext('2d')!
  const src = srcCtx.getImageData(0, 0, source.width, source.height).data
  return preprocessFromData(src, source.width, source.height)
}

/** 识别整块画布上某矩形区域（CSS 像素坐标）内的数字。
 *  画布可为透明底：先按 alpha 合成到白底（透明 = 纸色，不计墨迹）。 */
export async function recognizeRegion(
  source: HTMLCanvasElement,
  rect: { x: number; y: number; w: number; h: number },
): Promise<number> {
  const dpr = Math.max(1, window.devicePixelRatio || 1)
  const sx = Math.max(0, Math.round(rect.x * dpr))
  const sy = Math.max(0, Math.round(rect.y * dpr))
  const sw = Math.round(rect.w * dpr)
  const sh = Math.round(rect.h * dpr)
  const ctx = source.getContext('2d')!
  const crop = ctx.getImageData(sx, sy, sw, sh)
  // alpha 合成到白底：out = ink*a + 255*(1-a)
  const flat = new Uint8ClampedArray(sw * sh * 4)
  let hasInk = false
  for (let p = 0; p < sw * sh; p++) {
    const i = p * 4
    const a = crop.data[i + 3] / 255
    const r = Math.round(crop.data[i] * a + 255 * (1 - a))
    const g = Math.round(crop.data[i + 1] * a + 255 * (1 - a))
    const b = Math.round(crop.data[i + 2] * a + 255 * (1 - a))
    flat[i] = r; flat[i + 1] = g; flat[i + 2] = b; flat[i + 3] = 255
    if (r < INK_THRESHOLD || g < INK_THRESHOLD || b < INK_THRESHOLD) hasInk = true
  }
  if (!hasInk) throw new Error('blank region')

  const m = await loadModel()
  const y = tf.tidy(
    () => m.predict(preprocessFromData(flat, sw, sh)) as tf.Tensor,
  )
  const probs = await y.data()
  y.dispose()
  let best = 0
  for (let i = 1; i < probs.length; i++) {
    if (probs[i] > probs[best]) best = i
  }
  return best
}

/** 识别，返回概率最高的 k 个候选（按概率降序） */
export async function recognizeDigitTopK(
  source: HTMLCanvasElement,
  k = 3
): Promise<{ digit: number; prob: number }[]> {
  if (isCanvasBlank(source)) throw new Error('canvas is blank')
  const m = await loadModel()
  const y = tf.tidy(() => m.predict(preprocess(source)) as tf.Tensor)
  const probs = await y.data()
  y.dispose()
  return Array.from(probs)
    .map((p, i) => ({ digit: i, prob: p }))
    .sort((a, b) => b.prob - a.prob)
    .slice(0, k)
}

/** 识别单个数字（Top1） */
export async function recognizeDigit(source: HTMLCanvasElement): Promise<number> {
  const top = await recognizeDigitTopK(source, 1)
  return top[0].digit
}

/** 空白检查：无墨迹返回 true（与 recognizeRegion 同口径：RGB 任一通道低于阈值即有墨迹） */
export function isCanvasBlank(source: HTMLCanvasElement): boolean {
  const ctx = source.getContext('2d')!
  const d = ctx.getImageData(0, 0, source.width, source.height).data
  for (let i = 0; i < d.length; i += 4) {
    if (d[i] < INK_THRESHOLD || d[i + 1] < INK_THRESHOLD || d[i + 2] < INK_THRESHOLD) {
      return false
    }
  }
  return true
}
