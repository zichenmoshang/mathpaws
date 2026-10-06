// stores 统一出口 + 应用启动编排（装载 → 迁移 → 绑定持久化）
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
import { migrateIfNeeded } from '../db/migration'
import { MAIN_KEY, type CosmeticsRecord } from '../db/types'

import { bindPersist } from './persist'
import { useEconomyStore, loadEconomy } from './useEconomyStore'
import { loadEquipped, useEquippedStore } from './useEquippedStore'
import { loadFarm, useFarmStore } from './useFarmStore'
import { loadGacha, useGachaStore } from './useGachaStore'
import { loadMastery, useMasteryStore } from './useMasteryStore'
import { loadPet, usePetStore } from './usePetStore'
import { usePlayerStore, loadPlayer } from './usePlayerStore'
import { useSettingsStore, loadSettings } from './useSettingsStore'
import { useStreakStore, loadStreak } from './useStreakStore'
import { useWrongbookStore, loadWrongbook } from './useWrongbookStore'

let started = false

/**
 * 应用启动：迁移（幂等）→ 装载各表到 stores → 跨日计数重置 → 绑定持久化。
 * 多次调用安全（只执行一次实际编排）。
 */
export async function bootstrapStores(): Promise<void> {
  // 1) DB 升级 + 旧档迁移（或全新用户默认值）
  await migrateIfNeeded()

  if (started) return
  started = true

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

  // 4) 绑定持久化（gacha 的 owned/pity 落在 cosmetics 表，随 equipped 一起持久化
  //    —— 这里由 cosmetics 同步器统一处理，见 bindCosmeticsSync）
  bindPersist(usePlayerStore, 'profile')
  bindPersist(useEconomyStore, 'economy')
  bindPersist(useSettingsStore, 'settings')
  bindPersist(useStreakStore, 'streak')
  bindPersist(usePetStore, 'pets')
  bindPersist(useFarmStore, 'farm')
  bindPersist(useMasteryStore, 'mastery')
  bindPersist(useWrongbookStore, 'wrongbook')
  bindCosmeticsSync()
}

/**
 * cosmetics 表同时承载：owned / pity（gacha store）+ equipped（equipped store）。
 * 订阅两者，防抖合并写同一行。
 */
function bindCosmeticsSync(): void {
  let timer: ReturnType<typeof setTimeout> | null = null
  const schedule = () => {
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => {
      timer = null
      const g = useGachaStoreGet()
      const e = useEquippedStoreGet()
      // 捕获写入失败：仅告警不抛出，避免静默丢档与 unhandled rejection
      void getDBPutCosmetics({
        owned: g.owned,
        pityRare: g.pityRare,
        pityLegend: g.pityLegend,
        equipped: e.equipped,
      }).catch(err => console.warn('持久化写入失败（cosmetics）', err))
    }, 300)
  }
  useGachaSubscribe(schedule)
  useEquippedSubscribe(schedule)
}

function useGachaStoreGet() {
  return useGachaStore.getState()
}
function useEquippedStoreGet() {
  return useEquippedStore.getState()
}
function useGachaSubscribe(cb: () => void) {
  useGachaStore.subscribe(cb)
}
function useEquippedSubscribe(cb: () => void) {
  useEquippedStore.subscribe(cb)
}
async function getDBPutCosmetics(
  value: Pick<CosmeticsRecord, 'owned' | 'pityRare' | 'pityLegend' | 'equipped'>,
): Promise<void> {
  const d = await getDB()
  await d.put('cosmetics', value as never, MAIN_KEY)
}
