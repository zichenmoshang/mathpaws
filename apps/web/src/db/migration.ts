// 存档迁移（M0-DATA-04）：旧 v1 单 state(gameState) → v2 十张表
// 幂等：已迁移（新表有数据）则跳过；字段缺失按默认兜底。
// 一期本地单用户，迁移在 openDB 后执行（非原子，可重复执行、失败不破坏旧档）。

import { INITIAL_CURRENCY, COLD_START } from '../config/economy'
import { emptyPlots } from '../config/farm'
import { initMastery } from '../content/mastery'
import { uuid, dayKey } from '../utils/id'

import { MAIN_KEY, type ProfileRecord, type EconomyRecord, type PetsRecord,
  type CosmeticsRecord, type FarmRecord, type MasteryRecord,
  type WrongbookRecord, type StreakRecord, type SettingsRecord } from './types'

import {
  getDB, readLegacyState, deleteLegacyState,
} from './index'

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
    plots: emptyPlots(4),
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

/** 旧 v1 gameState 的宽松类型（旧原型字段，全部可选） */
interface LegacyGameState {
  shells?: unknown
  flowerCoins?: unknown
  petFood?: unknown
  hasPet?: unknown
  petName?: unknown
  petType?: unknown
  petExp?: unknown
  farmLevel?: unknown
  farmExp?: unknown
  plots?: unknown
  cropInventory?: unknown
  streakDays?: unknown
  lastPracticeDate?: unknown
  chestLastOpened?: unknown
  wrongQuestions?: unknown
  ownedItems?: unknown
  equipped?: unknown
  gachaPityRare?: unknown
  gachaPityLegend?: unknown
}

function num(v: unknown, fallback: number): number {
  return typeof v === 'number' && Number.isFinite(v) ? v : fallback
}
function str(v: unknown, fallback: string): string {
  return typeof v === 'string' ? v : fallback
}
function bool(v: unknown, fallback: boolean): boolean {
  return typeof v === 'boolean' ? v : fallback
}

/**
 * 执行迁移 / 初始化。
 * @returns migrated = 是否从旧 v1 迁入了数据
 */
export async function migrateIfNeeded(): Promise<{ migrated: boolean }> {
  const db = await getDB()
  const today = dayKey()

  const existingProfile = await db.get('profile', MAIN_KEY)
  // 新表已有 profile：视为已初始化（幂等跳过迁移，仅补齐缺失表）
  if (existingProfile) {
    // 老存档无 onboardingDone 字段：已有档案即视为启动动线完成，不再引导
    if (existingProfile.onboardingDone === undefined) {
      await db.put(
        'profile',
        { ...existingProfile, onboardingDone: true },
        MAIN_KEY,
      )
    }
    await ensureMissingTables(db, today)
    return { migrated: false }
  }

  const legacy = (await readLegacyState('gameState')) as LegacyGameState | undefined

  if (!legacy || typeof legacy !== 'object') {
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
    return { migrated: false }
  }

  // --- 旧 v1 → 新表映射 ---
  const profile = defaultProfile()
  await db.put('profile', profile, MAIN_KEY)

  await db.put('economy', {
    shells: num(legacy.shells, 0),
    flowerCoins: num(legacy.flowerCoins, 0),
    petFood: num(legacy.petFood, 0),
    dateKey: today,
    paidRounds: 0,
    floatDate: today,
    floatCount: 0,
  } satisfies EconomyRecord, MAIN_KEY)

  const petTypeRaw = str(legacy.petType, 'rabbit')
  const petType = (['rabbit', 'dog', 'cat'] as const).includes(
    petTypeRaw as 'rabbit' | 'dog' | 'cat',
  )
    ? (petTypeRaw as 'rabbit' | 'dog' | 'cat')
    : 'rabbit'

  await db.put('pets', {
    hasPet: bool(legacy.hasPet, false),
    petType,
    petName: str(legacy.petName, ''),
    petExp: num(legacy.petExp, 0),
  } satisfies PetsRecord, MAIN_KEY)

  // 旧 ownedItems（宠物装备 id 已废弃：不迁入 cosmetics.owned，仅保留可参考——
  // 旧 id 与新人物装扮 id 体系不同，无法映射，按"装备作废"处理）。
  await db.put('cosmetics', {
    owned: [],
    equipped: {},
    pityRare: num(legacy.gachaPityRare, 0),
    pityLegend: num(legacy.gachaPityLegend, 0),
  } satisfies CosmeticsRecord, MAIN_KEY)

  // 农场：迁 farmExp / 地块 / 果实；旧作物 daisy/tulip 与 6 作物 id 一致的保留，
  // 旧 id 'daisy'（菊花）在新体系不存在 → 丢弃该类果实与地块作物（无映射）。
  const oldPlots = Array.isArray(legacy.plots) ? legacy.plots : []
  const validCropIds = new Set(['corn', 'pumpkin', 'potato', 'carrot', 'tomato', 'strawberry'])
  const plots = defaultFarm().plots.map((p, i) => {
    const op = oldPlots[i] as { seedId?: unknown; plantedAt?: unknown } | undefined
    const seedId = str(op?.seedId, '')
    if (op && validCropIds.has(seedId)) {
      return { seedId: seedId as FarmRecord['plots'][number]['seedId'], plantedAt: num(op.plantedAt, 0) }
    }
    return p
  })

  const oldCropInv =
    legacy.cropInventory && typeof legacy.cropInventory === 'object'
      ? (legacy.cropInventory as Record<string, unknown>)
      : {}
  const cropInventory: FarmRecord['cropInventory'] = {}
  for (const id of Object.keys(oldCropInv)) {
    if (validCropIds.has(id)) {
      cropInventory[id as keyof FarmRecord['cropInventory']] = num(oldCropInv[id], 0)
    }
  }

  await db.put('farm', {
    farmExp: num(legacy.farmExp, 0),
    plots,
    seedInventory: { corn: COLD_START.cornSeeds },
    cropInventory,
  } satisfies FarmRecord, MAIN_KEY)

  await db.put('mastery', defaultMastery(), MAIN_KEY)

  // 旧 wrongQuestions（{prompt,answer} 简单结构）：无知识点/分步，无法映射为新错题，
  // 不迁入 wrongbook（错题本页面在 M3 新建；旧条目无消费价值）。
  await db.put('wrongbook', defaultWrongbook(), MAIN_KEY)

  await db.put('streak', {
    lastStudyDate: str(legacy.lastPracticeDate, ''),
    streak: num(legacy.streakDays, 0),
    // 旧原型无累计天数字段：以 streak 兜底（保守，不夸大）
    totalDays: num(legacy.streakDays, 0),
    chestLastOpened: str(legacy.chestLastOpened, ''),
  } satisfies StreakRecord, MAIN_KEY)

  await db.put('settings', defaultSettings(), MAIN_KEY)

  // 迁移完成：删除旧 gameState（旧 store 定义保留，仅清条目）
  await deleteLegacyState('gameState')

  return { migrated: true }
}

/** 幂等补齐：已初始化但个别新表缺失时补默认（兼容中间版本） */
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
