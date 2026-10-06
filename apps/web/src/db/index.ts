// IndexedDB 10 表 + schema version（M0-DATA-03）
// 由旧版单 'state'(v1) 升级；迁移见 ./migration.ts。

import { openDB, type DBSchema, type IDBPDatabase } from 'idb'

import type {
  ProfileRecord, EconomyRecord, PetsRecord, CosmeticsRecord, FarmRecord,
  MasteryRecord, WrongbookRecord, StrokeSample, StreakRecord, SettingsRecord,
} from './types'

export const DB_NAME = 'mathpaws'
/** 当前 schema 版本（v1 = 旧单 state；v2 = 10 表） */
export const DB_VERSION = 2

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
  /** 仅旧 v1 存在；v2 保留空 store 以便读取旧档迁移后清空 */
  state: { key: string; value: unknown }
}

let dbPromise: Promise<IDBPDatabase<MathpawsDB>> | null = null

export function getDB(): Promise<IDBPDatabase<MathpawsDB>> {
  if (dbPromise) return dbPromise
  dbPromise = openDB<MathpawsDB>(DB_NAME, DB_VERSION, {
    upgrade(d, oldVersion, _newVersion, transaction) {
      // v1 旧库：state store 已存在（由旧版本创建），不重复创建。
      if (oldVersion < 2) {
        // 创建 10 张新表
        for (const name of [
          'profile', 'economy', 'pets', 'cosmetics', 'farm',
          'mastery', 'wrongbook', 'strokes', 'streak', 'settings',
        ] as const) {
          if (!d.objectStoreNames.contains(name)) d.createObjectStore(name)
        }
        // 旧档迁移必须在同一事务中读取 state → 写入新表（异步部分在 migration 完成）。
        // transaction 延期由 migration 的读写保证；此处只建表。
        void transaction
      }
    },
  })
  return dbPromise
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

/** 读取旧 v1 单 state（迁移用） */
export async function readLegacyState(key: string): Promise<unknown> {
  const d = await getDB()
  if (d.objectStoreNames.contains('state')) return d.get('state', key)
  return undefined
}

/** 迁移完成后删除旧 state 仓中的存档（保留空 store 或直接删库条目） */
export async function deleteLegacyState(key: string): Promise<void> {
  const d = await getDB()
  if (d.objectStoreNames.contains('state')) await d.delete('state', key)
}
