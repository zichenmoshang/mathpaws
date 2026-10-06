// 启动期能力检测（M0-ENG-01）
// mathpaws 一期首屏即 3D 广场，并依赖 WASM 手写识别与 IndexedDB 本地存档，
// 任一关键能力缺失时直接给出明确提示，避免进入后白屏 / 卡死。

export interface CompatReport {
  webgl2: boolean
  wasm: boolean
  indexedDB: boolean
  /** 缺失能力的中文说明列表，空数组表示完全支持 */
  missing: string[]
  supported: boolean
}

function detectWebGL2(): boolean {
  try {
    const canvas = document.createElement('canvas')
    return !!(
      canvas.getContext('webgl2') ||
      (canvas.getContext as unknown as ((name: string) => RenderingContext | null))(
        'experimental-webgl2'
      )
    )
  } catch {
    return false
  }
}

function detectWasm(): boolean {
  return (
    typeof WebAssembly === 'object' &&
    typeof WebAssembly.instantiate === 'function'
  )
}

function detectIndexedDB(): boolean {
  return typeof window !== 'undefined' && typeof window.indexedDB !== 'undefined'
}

export function detectCompat(): CompatReport {
  const webgl2 = detectWebGL2()
  const wasm = detectWasm()
  const indexedDB = detectIndexedDB()

  const missing: string[] = []
  // TODO(P2-3D): 二期 3D 广场决策时重新评估 WebGL2 门禁口径
  if (!webgl2) missing.push('WebGL2（3D 广场渲染）')
  if (!wasm) missing.push('WebAssembly（手写数字识别）')
  if (!indexedDB) missing.push('IndexedDB（本地学习存档）')

  return { webgl2, wasm, indexedDB, missing, supported: missing.length === 0 }
}
