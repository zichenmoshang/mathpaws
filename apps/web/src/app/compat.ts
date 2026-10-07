// 启动期能力检测（M0-ENG-01）
// 应用已 2D 化，首屏不依赖 WebGL；硬性门槛为 WASM 手写识别与 IndexedDB 本地存档，
// 任一缺失时直接给出明确提示，避免进入后白屏 / 卡死。

export interface CompatReport {
  webgl2: boolean
  wasm: boolean
  indexedDB: boolean
  /** 阻断项：缺失能力的中文说明列表，空数组表示完全支持 */
  missing: string[]
  /** 非阻断警告项：缺失仅降级体验，不拦截启动 */
  warnings: string[]
  supported: boolean
}

function detectWebGL2(): boolean {
  try {
    const canvas = document.createElement('canvas')
    const gl = canvas.getContext('webgl2')
    // 检测用 context 用完显式释放，避免长期占用 WebGL context 配额
    gl?.getExtension('WEBGL_lose_context')?.loseContext()
    return !!gl
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
  const warnings: string[] = []
  // 应用已 2D 化，WebGL2 缺失仅记警告不阻断；
  // TODO(P2-3D): 二期 3D 广场决策时重新评估是否恢复为阻断项
  if (!webgl2) {
    warnings.push('WebGL2')
    console.warn('[mathpaws] 当前环境不支持 WebGL2，2D 功能不受影响')
  }
  if (!wasm) missing.push('WebAssembly（手写数字识别）')
  if (!indexedDB) missing.push('IndexedDB（本地学习存档）')

  return { webgl2, wasm, indexedDB, missing, warnings, supported: missing.length === 0 }
}
