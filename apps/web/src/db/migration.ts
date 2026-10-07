// 新装默认初始化（M0-DATA-04）：demo 阶段无老存档，不做 v1→v2 legacy 迁移。
// 幂等：profile 已存在视为已初始化，仅补齐缺失表；字段级兜底由 store 装载时 spread 默认值承担。

import { INITIAL_CURRENCY, COLD_START } from '../config/economy'
import { emptyPlots, PLOT_COUNT } from '../config/farm'
import { initMastery } from '../content/mastery'
import { uuid, dayKey } from '../utils/id'

import { MAIN_KEY, type ProfileRecord, type EconomyRecord, type PetsRecord,
  type CosmeticsRecord, type FarmRecord, type MasteryRecord,
  type WrongbookRecord, type StreakRecord, type SettingsRecord } from './types'

import { getDB } from './index'

/** 各表默认值（全新用户） */
export function defaultProfile(): ProfileRecord {
  return {
    deviceUuid: uuid(),
    heroName: '小朋友',
    onboardingDone: false,
    guideDone: false,
    placementDone: false,
  }
}

export function defaultEconomy(today: string = dayKey()): EconomyRecord {
  return {
    shells: INITIAL_CURRENCY.shells,
    flowerCoins: INITIAL_CURRENCY.flowerCoins,
    petFood: INITIAL_CURRENCY.petFood,
    dateKey: today,
    paidRounds: 0,
    floatDate: today,
    floatCount: 0,
  }
}

export function defaultPets(): PetsRecord {
  return { hasPet: false, petType: 'rabbit', petName: '', petExp: 0 }
}

export function defaultCosmetics(): CosmeticsRecord {
  return { owned: [], equipped: {}, pityRare: 0, pityLegend: 0 }
}

export function defaultFarm(): FarmRecord {
  return {
    farmExp: 0,
    plots: emptyPlots(PLOT_COUNT),
    // 冷启动：2 份玉米种子
    seedInventory: { corn: COLD_START.cornSeeds },
    cropInventory: {},
  }
}

export function defaultMastery(): MasteryRecord {
  return { nodes: initMastery() }
}

export function defaultWrongbook(): WrongbookRecord {
  return { items: [] }
}

export function defaultStreak(): StreakRecord {
  return { lastStudyDate: '', streak: 0, totalDays: 0, chestLastOpened: '' }
}

export function defaultSettings(): SettingsRecord {
  return { bgm: true, sfx: true }
}

/**
 * 新装初始化：profile 不存在（全新设备）时写入全套默认值；
 * 已初始化则幂等补齐缺失表（兼容中间版本）。
 */
export async function ensureInitialized(): Promise<void> {
  const db = await getDB()
  const today = dayKey()

  const existingProfile = await db.get('profile', MAIN_KEY)
  if (existingProfile) {
    await ensureMissingTables(db, today)
    return
  }

  // 全新用户：写入全套默认
  await db.put('profile', defaultProfile(), MAIN_KEY)
  await db.put('economy', defaultEconomy(today), MAIN_KEY)
  await db.put('pets', defaultPets(), MAIN_KEY)
  await db.put('cosmetics', defaultCosmetics(), MAIN_KEY)
  await db.put('farm', defaultFarm(), MAIN_KEY)
  await db.put('mastery', defaultMastery(), MAIN_KEY)
  await db.put('wrongbook', defaultWrongbook(), MAIN_KEY)
  await db.put('streak', defaultStreak(), MAIN_KEY)
  await db.put('settings', defaultSettings(), MAIN_KEY)
}

/** 幂等补齐：已初始化但个别表缺失时补默认（兼容中间版本） */
async function ensureMissingTables(
  db: Awaited<ReturnType<typeof getDB>>,
  today: string,
): Promise<void> {
  const checks: Array<['economy' | 'pets' | 'cosmetics' | 'farm' | 'mastery' | 'wrongbook' | 'streak' | 'settings', unknown]> = [
    ['economy', defaultEconomy(today)],
    ['pets', defaultPets()],
    ['cosmetics', defaultCosmetics()],
    ['farm', defaultFarm()],
    ['mastery', defaultMastery()],
    ['wrongbook', defaultWrongbook()],
    ['streak', defaultStreak()],
    ['settings', defaultSettings()],
  ]
  for (const [name, value] of checks) {
    const cur = await db.get(name as never, MAIN_KEY)
    if (!cur) await db.put(name as never, value as never, MAIN_KEY)
  }
}
