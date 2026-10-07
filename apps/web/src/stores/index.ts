// stores 统一出口 + 应用启动编排（初始化 → 装载 → 绑定持久化）
export { usePlayerStore, loadPlayer } from './usePlayerStore'
export { useEconomyStore, loadEconomy } from './useEconomyStore'
export { useSettingsStore, loadSettings } from './useSettingsStore'
export { useStreakStore, loadStreak } from './useStreakStore'
export { usePetStore, loadPet, PET_STAGES } from './usePetStore'
export { useFarmStore, loadFarm } from './useFarmStore'
export { useGachaStore, performDraw, loadGacha, GACHA_ITEM_MAP } from './useGachaStore'
export type { DrawOutcome } from './useGachaStore'
export { useEquippedStore, loadEquipped } from './useEquippedStore'
export { useMasteryStore, loadMastery } from './useMasteryStore'
export { useWrongbookStore, wrongKey, loadWrongbook } from './useWrongbookStore'

import { getDB } from '../db'
import { ensureInitialized } from '../db/migration'
import { MAIN_KEY } from '../db/types'

import { bindPersist, flushPersist, registerPersistFlush, PERSIST_DEBOUNCE_MS } from './persist'
import { useEconomyStore, loadEconomy } from './useEconomyStore'
import { loadEquipped, useEquippedStore } from './useEquippedStore'
import { loadFarm, useFarmStore } from './useFarmStore'
import { loadGacha, useGachaStore } from './useGachaStore'
import { loadMastery, useMasteryStore } from './useMasteryStore'
import { loadPet, usePetStore } from './usePetStore'
import { usePlayerStore, loadPlayer } from './usePlayerStore'
import { loadSettings, useSettingsStore } from './useSettingsStore'
import { loadStreak, useStreakStore } from './useStreakStore'
import { loadWrongbook, useWrongbookStore } from './useWrongbookStore'

// in-flight 缓存：并发调用共享同一次编排，避免迁移/装载/绑定竞态
let bootstrapPromise: Promise<void> | null = null
// 持久化解绑函数：重复绑定时先解绑旧订阅，避免旧订阅泄漏
let unbinds: Array<() => void> = []

/**
 * 应用启动：初始化（幂等）→ 装载各表到 stores → 跨日计数重置 → 绑定持久化。
 * 多次调用安全：并发共享同一 in-flight Promise；失败后可重试。
 */
export function bootstrapStores(): Promise<void> {
  if (bootstrapPromise) return bootstrapPromise
  const p = (async () => {
    // 1) DB 建表（v3 一次性清理旧 state 仓）+ 新装默认值初始化
    await ensureInitialized()

    // 2) 装载到内存 stores
    await Promise.all([
      loadPlayer(),
      loadEconomy(),
      loadSettings(),
      loadStreak(),
      loadPet(),
      loadFarm(),
      loadGacha(),
      loadEquipped(),
      loadMastery(),
      loadWrongbook(),
    ])

    // 3) 跨日计数重置
    useEconomyStore.getState().rolloverIfNewDay()

    // 4) 绑定持久化（重复绑定前先解绑旧订阅；gacha 的 owned/pity 落在
    //    cosmetics 表，随 equipped 一起由 cosmetics 同步器统一处理）
    unbinds.forEach(u => u())
    unbinds = [
      bindPersist(usePlayerStore, 'profile'),
      bindPersist(useEconomyStore, 'economy'),
      bindPersist(useSettingsStore, 'settings'),
      bindPersist(useStreakStore, 'streak'),
      bindPersist(usePetStore, 'pets'),
      bindPersist(useFarmStore, 'farm'),
      bindPersist(useMasteryStore, 'mastery'),
      bindPersist(useWrongbookStore, 'wrongbook'),
      bindCosmeticsSync(),
    ]

    // 5) 关页 flush：立即写盘防抖挂起的最后一次变更
    //    （flushPersist 为稳定引用，先 remove 再 add 保证幂等）
    window.removeEventListener('beforeunload', flushPersist)
    window.removeEventListener('pagehide', flushPersist)
    window.addEventListener('beforeunload', flushPersist)
    window.addEventListener('pagehide', flushPersist)
  })()
  bootstrapPromise = p
  // 启动失败不缓存 rejected Promise：清空缓存，允许下次调用重试
  p.catch(() => {
    if (bootstrapPromise === p) bootstrapPromise = null
  })
  return p
}

/**
 * cosmetics 表同时承载：owned / pity（gacha store）+ equipped（equipped store）。
 * 订阅两者，防抖合并写同一行；返回解绑函数。
 */
function bindCosmeticsSync(): () => void {
  let timer: ReturnType<typeof setTimeout> | null = null
  let disposed = false

  // 捕获写入失败：仅告警不抛出，避免静默丢档与 unhandled rejection
  const writeNow = () => {
    if (disposed) return
    const g = useGachaStore.getState()
    const e = useEquippedStore.getState()
    void getDB()
      .then(d =>
        d.put(
          'cosmetics',
          {
            owned: g.owned,
            pityRare: g.pityRare,
            pityLegend: g.pityLegend,
            equipped: e.equipped,
          } as never,
          MAIN_KEY,
        ),
      )
      .catch(err => console.warn('持久化写入失败（cosmetics）', err))
  }

  const schedule = () => {
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => {
      timer = null
      writeNow()
    }, PERSIST_DEBOUNCE_MS)
  }
  const unsubGacha = useGachaStore.subscribe(schedule)
  const unsubEquipped = useEquippedStore.subscribe(schedule)

  // 关页 flush：有挂起的防抖写盘则立即执行
  const flush = () => {
    if (!timer) return
    clearTimeout(timer)
    timer = null
    writeNow()
  }
  const unregFlush = registerPersistFlush(flush)

  return () => {
    disposed = true
    unregFlush()
    if (timer) clearTimeout(timer)
    unsubGacha()
    unsubEquipped()
  }
}
