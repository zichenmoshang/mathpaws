// 测试隔离辅助：每个用例重建模块图 + 换上全新空 IndexedDB。
// 背景：db/index.ts 的 getDB() 模块级缓存 dbPromise、zustand store 为模块级单例，
// 因此用例间必须 vi.resetModules() 后动态 import 被测模块，并同步换掉全局 indexedDB。
import { IDBFactory as FakeIDBFactory } from 'fake-indexeddb'
import { vi } from 'vitest'

/**
 * 重置模块缓存并把全局 indexedDB 换成全新空实例。
 * 之后动态 import 的被测模块会拿到干净的 dbPromise 与干净的库。
 * （直接赋值而非 vi.stubGlobal：不受 unstub 影响，逐用例显式重建）
 */
export function freshIsolatedEnv(): void {
  globalThis.indexedDB = new FakeIDBFactory() as unknown as IDBFactory
  vi.resetModules()
}

/** 等待持久化防抖（PERSIST_DEBOUNCE_MS = 300）自然到期并完成 IndexedDB 写入 */
export function waitForPersist(): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, 400))
}
