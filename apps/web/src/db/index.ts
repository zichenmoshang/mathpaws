// IndexedDB 10 表 + schema version（M0-DATA-03）
// 全新设备默认值初始化见 ./migration.ts。

import { openDB, type DBSchema, type IDBPDatabase } from 'idb'

import type {
  ProfileRecord, EconomyRecord, PetsRecord, CosmeticsRecord, FarmRecord,
  MasteryRecord, WrongbookRecord, StrokeSample, StreakRecord, SettingsRecord,
} from './types'

export const DB_NAME = 'mathpaws'
/** 当前 schema 版本（v2 = 10 表；v3 = 删除旧 v1 遗留的 state 仓） */
export const DB_VERSION = 3

interface MathpawsDB extends DBSchema {
  profile: { key: string; value: ProfileRecord }
  economy: { key: string; value: EconomyRecord }
  pets: { key: string; value: PetsRecord }
  cosmetics: { key: string; value: CosmeticsRecord }
  farm: { key: string; value: FarmRecord }
  mastery: { key: string; value: MasteryRecord }
  wrongbook: { key: string; value: WrongbookRecord }
  strokes: { key: string; value: StrokeSample }
  streak: { key: string; value: StreakRecord }
  settings: { key: string; value: SettingsRecord }
}

let dbPromise: Promise<IDBPDatabase<MathpawsDB>> | null = null

export function getDB(): Promise<IDBPDatabase<MathpawsDB>> {
  if (dbPromise) return dbPromise
  const p = openDB<MathpawsDB>(DB_NAME, DB_VERSION, {
    upgrade(d, oldVersion) {
      if (oldVersion < 2) {
        // 创建 10 张表（全新安装 oldVersion = 0 时同样走这里）
        for (const name of [
          'profile', 'economy', 'pets', 'cosmetics', 'farm',
          'mastery', 'wrongbook', 'strokes', 'streak', 'settings',
        ] as const) {
          if (!d.objectStoreNames.contains(name)) d.createObjectStore(name)
        }
      }
      if (oldVersion < 3) {
        // 一次性 schema 清理：删除旧 v1 遗留的 state 仓（非业务迁移；
        // 类型上已不在 schema 内，沿用本文件 as never 口径）
        if (d.objectStoreNames.contains('state' as never)) d.deleteObjectStore('state' as never)
      }
    },
  })
  dbPromise = p
  // 打开失败不缓存 rejected Promise：清空缓存，允许下次调用重试
  p.catch(() => {
    if (dbPromise === p) dbPromise = null
  })
  return p
}

/** 通用读 / 写（单主键表） */
export async function readTable<T>(name: keyof MathpawsDB, key: string): Promise<T | undefined> {
  const d = await getDB()
  return d.get(name as never, key) as Promise<T | undefined>
}

export async function writeTable(
  name: keyof MathpawsDB,
  key: string,
  value: unknown,
): Promise<void> {
  const d = await getDB()
  await d.put(name as never, value as never, key)
}

/** strokes 表：append-only，独立 key */
export async function addStroke(sample: StrokeSample): Promise<void> {
  const d = await getDB()
  await d.put('strokes', sample, sample.id)
}

export async function allStrokes(): Promise<StrokeSample[]> {
  const d = await getDB()
  return d.getAll('strokes')
}
