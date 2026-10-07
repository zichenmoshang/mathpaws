// ensureInitialized 集成测试：全新初始化 / 幂等 / 补缺失表 / v2→v3 schema 升级。
// 每用例独立空库（freshIsolatedEnv），动态 import 被测模块。
import { describe, it, expect, beforeEach } from 'vitest'

import { INITIAL_CURRENCY, COLD_START } from '../../config/economy'
import { PLOT_COUNT } from '../../config/farm'
import { KNOWLEDGE_PATH } from '../../content/knowledgePath'
import { initMastery } from '../../content/mastery'
import { freshIsolatedEnv } from '../../test/idb'
import { dayKey } from '../../utils/id'
import type {
  ProfileRecord, EconomyRecord, PetsRecord, CosmeticsRecord, FarmRecord,
  MasteryRecord, WrongbookRecord, StreakRecord, SettingsRecord,
} from '../types'
import { MAIN_KEY } from '../types'

beforeEach(() => {
  freshIsolatedEnv()
})

describe('ensureInitialized', () => {
  it('全新设备：9 张业务表写入默认值，关键字段与 config 口径一致', async () => {
    const { ensureInitialized } = await import('../migration')
    const { readTable } = await import('../index')
    await ensureInitialized()

    const today = dayKey()

    const profile = await readTable<ProfileRecord>('profile', MAIN_KEY)
    expect(profile?.heroName).toBe('小朋友')
    expect(profile?.onboardingDone).toBe(false)
    expect(profile?.guideDone).toBe(false)
    expect(profile?.placementDone).toBe(false)
    expect(typeof profile?.deviceUuid).toBe('string')
    expect(profile?.deviceUuid.length).toBeGreaterThan(0)

    const economy = await readTable<EconomyRecord>('economy', MAIN_KEY)
    expect(economy?.shells).toBe(INITIAL_CURRENCY.shells)
    expect(economy?.flowerCoins).toBe(INITIAL_CURRENCY.flowerCoins)
    expect(economy?.petFood).toBe(INITIAL_CURRENCY.petFood)
    expect(economy?.dateKey).toBe(today)
    expect(economy?.paidRounds).toBe(0)
    expect(economy?.floatDate).toBe(today)
    expect(economy?.floatCount).toBe(0)

    const pets = await readTable<PetsRecord>('pets', MAIN_KEY)
    expect(pets).toEqual({ hasPet: false, petType: 'rabbit', petName: '', petExp: 0 })

    const cosmetics = await readTable<CosmeticsRecord>('cosmetics', MAIN_KEY)
    expect(cosmetics).toEqual({ owned: [], equipped: {}, pityRare: 0, pityLegend: 0 })

    const farm = await readTable<FarmRecord>('farm', MAIN_KEY)
    expect(farm?.farmExp).toBe(0)
    expect(farm?.plots).toHaveLength(PLOT_COUNT)
    expect(farm?.plots.every(p => p.seedId === null && p.plantedAt === 0)).toBe(true)
    // 冷启动赠玉米种子
    expect(farm?.seedInventory).toEqual({ corn: COLD_START.cornSeeds })
    expect(farm?.cropInventory).toEqual({})

    const mastery = await readTable<MasteryRecord>('mastery', MAIN_KEY)
    // 与 initMastery 形态一致：节点数同知识点路径，第 1 个 learning、其余 locked
    expect(mastery?.nodes).toEqual(initMastery())
    expect(mastery?.nodes).toHaveLength(KNOWLEDGE_PATH.length)
    expect(mastery?.nodes[0]?.state).toBe('learning')
    expect(mastery?.nodes.slice(1).every(n => n.state === 'locked')).toBe(true)
    expect(mastery?.nodes.every(n => n.count === 0 && n.consecutive === 0)).toBe(true)

    const wrongbook = await readTable<WrongbookRecord>('wrongbook', MAIN_KEY)
    expect(wrongbook).toEqual({ items: [] })

    const streak = await readTable<StreakRecord>('streak', MAIN_KEY)
    expect(streak).toEqual({ lastStudyDate: '', streak: 0, totalDays: 0, chestLastOpened: '' })

    const settings = await readTable<SettingsRecord>('settings', MAIN_KEY)
    expect(settings).toEqual({ bgm: true, sfx: true })
  })

  it('幂等：已初始化后重跑不覆盖已有数据', async () => {
    const { ensureInitialized } = await import('../migration')
    const { readTable, writeTable } = await import('../index')
    await ensureInitialized()

    // 模拟已有用户数据
    const before = await readTable<ProfileRecord>('profile', MAIN_KEY)
    await writeTable('profile', MAIN_KEY, { ...before, heroName: '阿宝', onboardingDone: true })
    const eco = await readTable<EconomyRecord>('economy', MAIN_KEY)
    await writeTable('economy', MAIN_KEY, { ...eco, shells: 123, paidRounds: 1 })

    await ensureInitialized()

    const profile = await readTable<ProfileRecord>('profile', MAIN_KEY)
    expect(profile?.heroName).toBe('阿宝')
    expect(profile?.onboardingDone).toBe(true)
    expect(profile?.deviceUuid).toBe(before?.deviceUuid)
    const economy = await readTable<EconomyRecord>('economy', MAIN_KEY)
    expect(economy?.shells).toBe(123)
    expect(economy?.paidRounds).toBe(1)
  })

  it('补缺失表：个别表记录被删后重跑，仅补回缺失表、不动已有数据', async () => {
    const { ensureInitialized } = await import('../migration')
    const { getDB, readTable, writeTable } = await import('../index')
    await ensureInitialized()

    // 已有数据做标记，再删 farm / streak 两表记录
    const eco = await readTable<EconomyRecord>('economy', MAIN_KEY)
    await writeTable('economy', MAIN_KEY, { ...eco, shells: 77 })
    const db = await getDB()
    await db.delete('farm', MAIN_KEY)
    await db.delete('streak', MAIN_KEY)
    expect(await readTable<FarmRecord>('farm', MAIN_KEY)).toBeUndefined()

    await ensureInitialized()

    // 缺失表补回默认值
    const farm = await readTable<FarmRecord>('farm', MAIN_KEY)
    expect(farm?.plots).toHaveLength(PLOT_COUNT)
    expect(farm?.seedInventory).toEqual({ corn: COLD_START.cornSeeds })
    const streak = await readTable<StreakRecord>('streak', MAIN_KEY)
    expect(streak).toEqual({ lastStudyDate: '', streak: 0, totalDays: 0, chestLastOpened: '' })
    // 未删的表保持原数据
    const economy = await readTable<EconomyRecord>('economy', MAIN_KEY)
    expect(economy?.shells).toBe(77)
  })

  it('schema 升级：v2 库（含遗留 state 仓）走 getDB 升到 v3 后 state 被删除', async () => {
    const { DB_NAME, DB_VERSION, getDB } = await import('../index')

    // 先用原始 indexedDB.open 以 version 2 建库：10 张业务表 + 遗留 state 仓
    await new Promise<void>((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, 2)
      req.onupgradeneeded = () => {
        const d = req.result
        for (const name of [
          'profile', 'economy', 'pets', 'cosmetics', 'farm',
          'mastery', 'wrongbook', 'strokes', 'streak', 'settings', 'state',
        ]) {
          if (!d.objectStoreNames.contains(name)) d.createObjectStore(name)
        }
      }
      req.onsuccess = () => {
        req.result.close()
        resolve()
      }
      req.onerror = () => reject(req.error)
    })

    // 走应用入口打开（version 3）：触发 upgrade 清理
    const db = await getDB()
    expect(db.version).toBe(DB_VERSION)
    const names = Array.from(db.objectStoreNames)
    expect(names).not.toContain('state')
    for (const name of [
      'profile', 'economy', 'pets', 'cosmetics', 'farm',
      'mastery', 'wrongbook', 'strokes', 'streak', 'settings',
    ]) {
      expect(names).toContain(name)
    }
  })
})
