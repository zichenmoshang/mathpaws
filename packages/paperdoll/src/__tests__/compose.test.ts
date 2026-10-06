import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest'

import {
  NATIVE,
  composeLook,
  eraseByMask,
  sampleNeckColor,
  buildPairHead,
  type SeamSpec,
  type RGB,
} from '../compose'

// ============================================================================
// 最小 Canvas/ImageData stub：compose.ts 只用到 getImageData / putImageData /
// drawImage 三个 2d 上下文方法，这里用真实 Uint8ClampedArray 模拟像素存储，
// 保证 alphaBoxOf / classify / 挖洞等纯像素逻辑按真实语义执行。
// ============================================================================

interface StubImageData {
  data: Uint8ClampedArray
  width: number
  height: number
}

function makeImageData(w: number, h: number): StubImageData {
  return { data: new Uint8ClampedArray(w * h * 4), width: w, height: h }
}

interface StubCanvas {
  canvas: HTMLCanvasElement
  store: StubImageData
  draws: { img: unknown; args: number[] }[]
  puts: { img: StubImageData; dx: number; dy: number }[]
}

function makeStubCanvas(w: number, h: number): StubCanvas {
  const store = makeImageData(w, h)
  const draws: { img: unknown; args: number[] }[] = []
  const puts: { img: StubImageData; dx: number; dy: number }[] = []
  const ctx = {
    getImageData(x: number, y: number, sw: number, sh: number): StubImageData {
      const out = makeImageData(sw, sh)
      for (let row = 0; row < sh; row++) {
        const src = ((y + row) * w + x) * 4
        out.data.set(store.data.subarray(src, src + sw * 4), row * sw * 4)
      }
      return out
    },
    putImageData(img: StubImageData, dx: number, dy: number) {
      puts.push({ img, dx, dy })
      for (let row = 0; row < img.height; row++) {
        const dst = ((dy + row) * w + dx) * 4
        store.data.set(img.data.subarray(row * img.width * 4, (row + 1) * img.width * 4), dst)
      }
    },
    drawImage(img: unknown, ...args: number[]) {
      draws.push({ img, args })
    },
  }
  const canvas = {
    width: w,
    height: h,
    getContext: () => ctx,
  } as unknown as HTMLCanvasElement
  return { canvas, store, draws, puts }
}

/** 设置矩形区域 RGBA */
function fillRect(
  store: StubImageData,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  r: number,
  g: number,
  b: number,
  a: number,
) {
  for (let y = y0; y < y1; y++) {
    for (let x = x0; x < x1; x++) {
      const i = (y * store.width + x) * 4
      store.data[i] = r
      store.data[i + 1] = g
      store.data[i + 2] = b
      store.data[i + 3] = a
    }
  }
}

function px(store: StubImageData, x: number, y: number): [number, number, number, number] {
  const i = (y * store.width + x) * 4
  return [store.data[i], store.data[i + 1], store.data[i + 2], store.data[i + 3]]
}

// document.createElement('canvas') 记录：composeLook / buildPairHead 内部建画布
let created: StubCanvas[] = []

beforeAll(() => {
  created = []
  vi.stubGlobal('document', {
    createElement: () => {
      const stub = makeStubCanvas(NATIVE, NATIVE)
      created.push(stub)
      return stub.canvas
    },
  })
  vi.stubGlobal(
    'ImageData',
    class {
      data: Uint8ClampedArray
      width: number
      height: number
      constructor(w: number, h: number) {
        this.width = w
        this.height = h
        this.data = new Uint8ClampedArray(w * h * 4)
      }
    },
  )
})

afterAll(() => {
  vi.unstubAllGlobals()
})

const img = (src: string) => ({ src }) as unknown as HTMLImageElement

// 与 compose.ts 的 SKIN/HAIR HSV 条带对应的代表色：
// (240,200,170): h≈25.6 s≈0.29 v≈0.94 → 皮肤；(230,190,160) 同带
// (40,80,240): h≈228 → 非肤非发
const SKIN_A: RGB = [240, 200, 170]
const SKIN_B: RGB = [230, 190, 160]
const BLUE: RGB = [40, 80, 240]

describe('eraseByMask —— item gear 柔边挖洞', () => {
  it('body.alpha = min(body.alpha, 255 - mask.alpha)，且只处理 mask bbox 内', () => {
    const body = makeStubCanvas(NATIVE, NATIVE)
    fillRect(body.store, 0, 0, NATIVE, NATIVE, 10, 20, 30, 200)
    const mask = makeStubCanvas(NATIVE, NATIVE)
    // mask 仅 100..110 × 200..210 区域 alpha=80，其余透明
    fillRect(mask.store, 100, 200, 110, 210, 0, 0, 0, 80)

    const ret = eraseByMask(body.canvas, mask.canvas)
    expect(ret).toBe(body.canvas) // 原地修改并返回同一画布

    // 洞内：min(200, 255-80) = 175
    expect(px(body.store, 105, 205)[3]).toBe(175)
    // 洞外不受影响
    expect(px(body.store, 99, 205)[3]).toBe(200)
    expect(px(body.store, 110, 205)[3]).toBe(200)
    expect(px(body.store, 105, 199)[3]).toBe(200)
    expect(px(body.store, 1000, 1000)[3]).toBe(200)
  })

  it('全透明 mask 是无操作：返回原画布、不回写、像素不变', () => {
    const body = makeStubCanvas(NATIVE, NATIVE)
    fillRect(body.store, 0, 0, NATIVE, NATIVE, 1, 2, 3, 255)
    const mask = makeStubCanvas(NATIVE, NATIVE) // 全 0

    const ret = eraseByMask(body.canvas, mask.canvas)
    expect(ret).toBe(body.canvas)
    // 空 mask 无 bbox，函数提前返回：不应有任何 putImageData 回写
    expect(body.puts).toHaveLength(0)
    // 抽样确认像素未被改动（不整帧 deep-equal，避免 16M 元素比对开销）
    expect(px(body.store, 0, 0)).toEqual([1, 2, 3, 255])
    expect(px(body.store, 1024, 1024)).toEqual([1, 2, 3, 255])
    expect(px(body.store, NATIVE - 1, NATIVE - 1)).toEqual([1, 2, 3, 255])
  })
})

describe('sampleNeckColor —— 身体受光肤色中位数采样', () => {
  it('只对采样窗内皮肤像素取中位数，忽略非肤/透明像素', () => {
    // yLo = y0 - skinSampleRows = 2040 - 80 = 1960，采样窗 1960..2048
    const seam: SeamSpec = {
      y0: 2040,
      cut: 2044,
      overlap: 4,
      sigma: 2,
      relitSrc: 0.28,
      relitNeck: 0.72,
      skinSampleRows: 80,
    }
    const body = makeStubCanvas(NATIVE, NATIVE)
    // 5 个 SKIN_A 像素 + 3 个 SKIN_B 像素 → 中位数为 SKIN_A
    fillRect(body.store, 0, 1970, 5, 1971, ...SKIN_A, 255)
    fillRect(body.store, 10, 1970, 13, 1971, ...SKIN_B, 255)
    // 干扰项：非肤蓝（不透明）与透明皮肤色，均不得参与中位数
    fillRect(body.store, 20, 1970, 30, 1971, ...BLUE, 255)
    fillRect(body.store, 40, 1970, 50, 1971, ...SKIN_B, 0)
    // 采样窗上方的皮肤像素不得参与
    fillRect(body.store, 0, 100, 20, 101, ...SKIN_B, 255)

    expect(sampleNeckColor(body.canvas, seam)).toEqual(SKIN_A)
  })

  it('采样窗内无皮肤像素时退化为 [0,0,0]', () => {
    const seam: SeamSpec = {
      y0: 2040,
      cut: 2044,
      overlap: 4,
      sigma: 2,
      skinSampleRows: 80,
    }
    const body = makeStubCanvas(NATIVE, NATIVE)
    fillRect(body.store, 0, 1970, 50, 1971, ...BLUE, 255)
    expect(sampleNeckColor(body.canvas, seam)).toEqual([0, 0, 0])
  })
})

describe('buildPairHead —— pair 头动态 gate + relit', () => {
  const seam: SeamSpec = {
    y0: 1000,
    cut: 1050,
    overlap: 37,
    sigma: 8,
    relitSrc: 0.28,
    relitNeck: 0.72,
    skinSampleRows: 80,
  }
  const NECK: RGB = [200, 150, 100]

  function makeHead(): StubCanvas {
    const head = makeStubCanvas(NATIVE, NATIVE)
    // 皮肤块 x 800..1200, y 900..1100（横跨硬区与过渡带）
    fillRect(head.store, 800, 900, 1200, 1100, ...SKIN_A, 255)
    // 非肤蓝块（验证 relit 只作用于皮肤像素）
    fillRect(head.store, 1300, 900, 1310, 910, ...BLUE, 255)
    // 过渡带内的透明洞（验证 cov 门控回 0）
    fillRect(head.store, 900, 1010, 901, 1011, 0, 0, 0, 0)
    return head
  }

  it('硬头区 cov=255、皮肤像素按 0.28·源+0.72·颈色 relit 且 uint8 截断', () => {
    const head = makeHead()
    const body = makeStubCanvas(NATIVE, NATIVE)
    created = []
    const { canvas, cov } = buildPairHead(head.canvas, body.canvas, seam, NECK)

    // 硬区 y < y0-2σ=984，包围盒内、源不透明 → 全覆盖
    expect(cov[950 * NATIVE + 1000]).toBe(255)
    // 输出画布只有一处 putImageData（created[0]）
    expect(created).toHaveLength(1)
    const out = created[0].store
    // relit: trunc(0.28*240+0.72*200)=211, trunc(0.28*200+0.72*150)=164,
    //        trunc(0.28*170+0.72*100)=119
    expect(px(out, 1000, 950)).toEqual([211, 164, 119, 255])
    // 非肤蓝块：覆盖但【不】relit，保持源色
    expect(cov[905 * NATIVE + 1305]).toBe(255)
    expect(px(out, 1305, 905)).toEqual([...BLUE, 255])
  })

  it('包围盒外覆盖恒 0；cut+overlap 以下只剩羽化尾且输出 RGBA 截断', () => {
    const head = makeHead()
    const body = makeStubCanvas(NATIVE, NATIVE)
    created = []
    const { canvas, cov } = buildPairHead(head.canvas, body.canvas, seam, NECK)
    const out = created[0].store

    // 包围盒外（x=100 远在头部块外）
    expect(cov[950 * NATIVE + 100]).toBe(0)
    expect(px(out, 100, 950)[3]).toBe(0)
    // cut+overlap=1087 以下：高斯羽化尾仍在（0 < cov < 255），
    // 但输出 ImageData 只写到 yOutHi=1087，1090 行 RGBA 保持全 0
    const tail = cov[1090 * NATIVE + 1000]
    expect(tail).toBeGreaterThan(0)
    expect(tail).toBeLessThan(255)
    expect(px(out, 1000, 1090)[3]).toBe(0)
    // 羽化半径之外（cut+overlap+radius=1119 再往下）覆盖归 0
    expect(cov[1150 * NATIVE + 1000]).toBe(0)
  })

  it('过渡带内源透明像素的 cov 被门控回 0（防止双重羽化）', () => {
    const head = makeHead()
    const body = makeStubCanvas(NATIVE, NATIVE)
    created = []
    const { cov } = buildPairHead(head.canvas, body.canvas, seam, NECK)

    // 洞 (900,1010)：邻域 gate 全 1，高斯模糊本会给正覆盖，但源透明 → 强制 0
    expect(cov[1010 * NATIVE + 900]).toBe(0)
    // 洞旁正常皮肤像素在过渡带内覆盖为正（gate=皮肤 → 模糊后 ≈255）
    expect(cov[1010 * NATIVE + 1000]).toBeGreaterThan(200)
  })
})

describe('composeLook —— 槽位合成顺序', () => {
  it('z-order 严格 body → shoe → gear（head gear 无 seam 直接整头覆盖）', () => {
    created = []
    const bodyImg = img('body.png')
    const out = composeLook({
      body: bodyImg,
      shoe: img('shoe.png'),
      gear: img('frog.png'),
      gearKind: 'head',
    })
    // createElement 顺序：body, gear（head 分支先建）, shoe
    expect(created).toHaveLength(3)
    expect(out).toBe(created[0].canvas) // 合成结果画在 body 画布上
    // body 画布上的绘制序列：先铺 body 原图（toCanvas），再叠加鞋、再叠加头
    const draws = created[0].draws
    expect(draws).toHaveLength(3)
    expect(draws[0].img).toBe(bodyImg)
    expect(draws[1].img).toBe(created[2].canvas) // shoe
    expect(draws[2].img).toBe(created[1].canvas) // gear
    expect(draws[1].args).toEqual([0, 0, NATIVE, NATIVE])
  })

  it('item gear 带 mask：先给 body 挖洞，再按 shoe → gear 叠加', () => {
    // composeLook 内部通过 toCanvas 建 body/mask/gear 画布，mask 内容由
    // createElement 返回的空画布承载（全透明）——挖洞应为无操作，但顺序可验证。
    created = []
    const bodyImg = img('body.png')
    const out = composeLook({
      body: bodyImg,
      shoe: img('shoe.png'),
      gear: img('hat.png'),
      gearKind: 'item',
      mask: img('mask.png'),
    })
    // createElement 顺序：body, mask, gear, shoe
    expect(created).toHaveLength(4)
    expect(out).toBe(created[0].canvas)
    // 全透明 mask → eraseByMask 提前返回，body 无任何 putImageData 回写
    expect(created[0].puts).toHaveLength(0)
    // body 画布上的绘制序列：body 原图 → shoe → gear
    const draws = created[0].draws
    expect(draws).toHaveLength(3)
    expect(draws[0].img).toBe(bodyImg)
    expect(draws[1].img).toBe(created[3].canvas) // shoe
    expect(draws[2].img).toBe(created[2].canvas) // gear
  })

  it('无 gear 无 shoe：仅 body 画布，只铺 body 原图、无叠加层', () => {
    created = []
    const bodyImg = img('body.png')
    const out = composeLook({ body: bodyImg })
    expect(created).toHaveLength(1)
    expect(out).toBe(created[0].canvas)
    expect(created[0].draws).toHaveLength(1)
    expect(created[0].draws[0].img).toBe(bodyImg)
  })
})
