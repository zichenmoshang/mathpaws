// store 持久化辅助：订阅域 store，防抖写入对应 IndexedDB 表。
import { getDB } from '../db'
import { MAIN_KEY } from '../db/types'

/** 持久化防抖间隔（ms）；stores/index.ts 的 cosmetics 同步器共用同一口径 */
export const PERSIST_DEBOUNCE_MS = 300

type TableName =
  | 'profile'
  | 'economy'
  | 'pets'
  | 'cosmetics'
  | 'farm'
  | 'mastery'
  | 'wrongbook'
  | 'streak'
  | 'settings'

// 关页 flush 注册表：beforeunload / pagehide 时立即写盘挂起的防抖变更
const flushers = new Set<() => void>()

/** 注册关页 flush 回调；返回注销函数 */
export function registerPersistFlush(f: () => void): () => void {
  flushers.add(f)
  return () => {
    flushers.delete(f)
  }
}

/**
 * 立即执行所有挂起的防抖写盘（关页前调用）。
 * best-effort：IndexedDB 写为异步，关页瞬间不保证全部落盘，但优于直接丢弃。
 */
export function flushPersist(): void {
  for (const f of [...flushers]) f()
}

/**
 * 把域 store（整对象 = 行值）绑定到指定表：
 * 订阅变更，防抖写入；首次绑定不产生冗余写。
 * 返回解绑函数（同时注销关页 flush）。
 */
export function bindPersist<T extends object>(
  store: {
    getState: () => T
    subscribe: (cb: (s: T, prev: T) => void) => () => void
  },
  table: TableName,
): () => void {
  let timer: ReturnType<typeof setTimeout> | null = null
  let disposed = false

  // 立即写盘当前状态；捕获写入失败：仅告警不抛出，避免静默丢档与 unhandled rejection
  const writeNow = () => {
    if (disposed) return
    const value = stripActions(store.getState())
    void getDB()
      .then(d => d.put(table as never, value as never, MAIN_KEY))
      .catch(err => console.warn(`持久化写入失败（${table}）`, err))
  }

  // 关页 flush：有挂起的防抖写盘则立即执行
  const flush = () => {
    if (!timer) return
    clearTimeout(timer)
    timer = null
    writeNow()
  }
  const unregFlush = registerPersistFlush(flush)

  const unsub = store.subscribe(() => {
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => {
      timer = null
      writeNow()
    }, PERSIST_DEBOUNCE_MS)
  })

  return () => {
    disposed = true
    unregFlush()
    if (timer) clearTimeout(timer)
    unsub()
  }
}

/** 剥离 store 中的 action（函数），只保留可结构化克隆的数据字段。 */
function stripActions<T extends object>(state: T): Partial<T> {
  const out: Record<string, unknown> = {}
  for (const key of Object.keys(state)) {
    const v = (state as Record<string, unknown>)[key]
    if (typeof v !== 'function') out[key] = v
  }
  return out as Partial<T>
}
