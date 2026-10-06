// store 持久化辅助：订阅域 store，防抖写入对应 IndexedDB 表。
import type { IDBPDatabase } from 'idb'

import { getDB, type DB_VERSION, type DB_NAME } from '../db'

// 重新导出，便于业务侧统一从 stores 引用
export { getDB }
export type { IDBPDatabase, DB_VERSION, DB_NAME }

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

import { MAIN_KEY } from '../db/types'

/**
 * 把域 store（整对象 = 行值）绑定到指定表：
 * 订阅变更，300ms 防抖写入；首次绑定不产生冗余写。
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

  const unsub = store.subscribe(() => {
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => {
      timer = null
      if (disposed) return
      const value = stripActions(store.getState())
      // 捕获写入失败：仅告警不抛出，避免静默丢档与 unhandled rejection
      void getDB()
        .then(d => d.put(table as never, value as never, MAIN_KEY))
        .catch(err => console.warn(`持久化写入失败（${table}）`, err))
    }, 300)
  })

  return () => {
    disposed = true
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
