#!/usr/bin/env node
// M6-QA-06：老存档升级回归（v1 单 state → v2 十表）
//
// 场景：
//   A 典型旧 v1 存档（含 stamina/waterDrops/equipped/宠物 dog/daisy 等废弃字段）→ 升级映射正确
//   B 残缺/损坏旧档（类型错误、缺字段）→ 默认兜底、不抛异常
//   C 幂等：迁移完成后再次执行 → migrated=false 且数据不被覆盖
//   D 无旧档全新设备 → 写入全套默认值
//
// 运行：node scripts/migration-regression.mjs
// 依赖：fake-indexeddb（devDependencies）、esbuild（打包 src/db TS 源码，单一事实源）。

import 'fake-indexeddb/auto'
import { build } from 'esbuild'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { dirname, join } from 'node:path'
import { rmSync } from 'node:fs'

const WEB = join(dirname(fileURLToPath(import.meta.url)), '..')
const BUNDLE = join(WEB, 'scripts', '.tmp-migration-bundle.mjs')

// ---------- 打包被测模块（真实 src/db 代码） ----------
await build({
  stdin: {
    contents: `export { migrateIfNeeded } from './src/db/migration.ts'\nexport { getDB } from './src/db/index.ts'`,
    resolveDir: WEB,
    loader: 'ts',
  },
  outfile: BUNDLE,
  bundle: true,
  platform: 'node',
  format: 'esm',
  logLevel: 'silent',
})

const DB_NAME = 'mathpaws'
let failures = 0
function assert(cond, label) {
  if (cond) console.log(`  ✓ ${label}`)
  else { failures++; console.error(`  ✗ ${label}`) }
}

function deleteDB() {
  return new Promise((res, rej) => {
    const req = indexedDB.deleteDatabase(DB_NAME)
    req.onsuccess = res
    req.onerror = () => rej(req.error)
    req.onblocked = res
  })
}

/** 以 v1 schema 建旧库并写入 gameState */
function seedLegacy(gameState) {
  return new Promise((res, rej) => {
    const req = indexedDB.open(DB_NAME, 1)
    req.onupgradeneeded = () => {
      req.result.createObjectStore('state')
    }
    req.onsuccess = () => {
      const db = req.result
      const tx = db.transaction('state', 'readwrite')
      tx.objectStore('state').put(gameState, 'gameState')
      tx.oncomplete = () => { db.close(); res() }
      tx.onerror = () => rej(tx.error)
    }
    req.onerror = () => rej(req.error)
  })
}

/** 每个用例独立加载被测模块（重置模块级 dbPromise 缓存） */
async function loadCase(tag) {
  const mod = await import(`${pathToFileURL(BUNDLE).href}?case=${tag}`)
  return mod
}

const TABLES = ['profile', 'economy', 'pets', 'cosmetics', 'farm', 'mastery', 'wrongbook', 'strokes', 'streak', 'settings']

try {
  // ---------- A：典型旧 v1 存档 ----------
  console.log('\n[A] 典型旧 v1 存档升级')
  await deleteDB()
  await seedLegacy({
    shells: 320, flowerCoins: 45, petFood: 7,
    hasPet: true, petName: '雪球', petType: 'dog', petExp: 66,
    farmExp: 30,
    plots: [
      { seedId: 'corn', plantedAt: 1727000000000 },
      { seedId: 'daisy', plantedAt: 1727000000000 }, // 废弃作物 → 丢弃
      { seedId: 'pumpkin', plantedAt: 0 },
      {},
    ],
    cropInventory: { corn: 5, daisy: 3 },
    streakDays: 4, lastPracticeDate: '2026-09-30', chestLastOpened: '2026-09-30',
    wrongQuestions: [{ prompt: '1+1', answer: '2' }],
    ownedItems: ['pet-armor-1'],
    equipped: { body: 'pet-armor-1' },
    gachaPityRare: 6, gachaPityLegend: 40,
    // 已废弃字段：应被忽略且不进入新表
    stamina: 80, waterDrops: 12,
  })
  {
    const m = await loadCase('A')
    const { migrated } = await m.migrateIfNeeded()
    assert(migrated === true, '返回 migrated=true')
    const db = await m.getDB()
    for (const t of TABLES) assert(db.objectStoreNames.contains(t), `表 ${t} 已建立`)

    const eco = await db.get('economy', 'main')
    assert(eco.shells === 320 && eco.flowerCoins === 45 && eco.petFood === 7, 'economy 三货币映射')
    assert(!('stamina' in eco) && !('waterDrops' in eco), '废弃 stamina/waterDrops 不残留')

    const pets = await db.get('pets', 'main')
    assert(pets.hasPet === true && pets.petType === 'dog' && pets.petName === '雪球' && pets.petExp === 66, 'pets 映射（dog 保留）')

    const cos = await db.get('cosmetics', 'main')
    assert(cos.pityRare === 6 && cos.pityLegend === 40, 'gacha 保底计数迁入')
    assert(cos.owned.length === 0 && Object.keys(cos.equipped).length === 0, '旧宠物装备按作废处理（不迁入 owned/equipped）')

    const farm = await db.get('farm', 'main')
    assert(farm.farmExp === 30, 'farmExp 迁入')
    assert(farm.plots[0].seedId === 'corn' && farm.plots[0].plantedAt === 1727000000000, '有效地块保留')
    assert(farm.plots[1].seedId === null, '废弃 daisy 地块作物丢弃')
    assert(farm.cropInventory.corn === 5 && !('daisy' in farm.cropInventory), '果实库存过滤废弃作物')
    assert(farm.seedInventory.corn === 2, '冷启动 2 份玉米种子兜底')

    const streak = await db.get('streak', 'main')
    assert(streak.streak === 4 && streak.totalDays === 4 && streak.lastStudyDate === '2026-09-30', 'streak 映射（totalDays 兜底=streak）')

    const legacy = await db.get('state', 'gameState')
    assert(legacy === undefined, '旧 gameState 已删除')
    db.close()
  }

  // ---------- B：残缺/损坏旧档 ----------
  console.log('\n[B] 残缺/损坏旧档兜底')
  await deleteDB()
  await seedLegacy({
    shells: 'abc', petType: 'daisy', plots: 'not-an-array',
    cropInventory: 42, streakDays: null,
  })
  {
    const m = await loadCase('B')
    const { migrated } = await m.migrateIfNeeded()
    assert(migrated === true, '损坏档也能完成迁移')
    const db = await m.getDB()
    const eco = await db.get('economy', 'main')
    assert(eco.shells === 0, '非法数字兜底 0')
    const pets = await db.get('pets', 'main')
    assert(pets.petType === 'rabbit' && pets.hasPet === false, '非法 petType/缺省兜底')
    const farm = await db.get('farm', 'main')
    assert(Array.isArray(farm.plots) && farm.plots.length === 4, '损坏 plots 兜底为 4 空地')
    db.close()
  }

  // ---------- C：幂等 ----------
  console.log('\n[C] 幂等（重复迁移不覆盖）')
  {
    const m = await loadCase('C')
    const first = await m.migrateIfNeeded()
    assert(first.migrated === false, '已有新表：跳过迁移')
    const db = await m.getDB()
    await db.put('economy', { ...(await db.get('economy', 'main')), shells: 999 }, 'main')
    const again = await m.migrateIfNeeded()
    const eco = await db.get('economy', 'main')
    assert(again.migrated === false && eco.shells === 999, '再次迁移不覆盖现有数据')
    const pets = await db.get('pets', 'main')
    assert(pets.petType === 'rabbit', '缺表补齐逻辑可用（ensureMissingTables）')
    db.close()
  }

  // ---------- D：全新设备 ----------
  console.log('\n[D] 无旧档全新设备')
  await deleteDB()
  {
    const m = await loadCase('D')
    const { migrated } = await m.migrateIfNeeded()
    assert(migrated === false, 'migrated=false')
    const db = await m.getDB()
    const profile = await db.get('profile', 'main')
    assert(profile.heroName === '小朋友' && profile.onboardingDone === false, 'profile 默认（走首次引导）')
    const farm = await db.get('farm', 'main')
    assert(farm.seedInventory.corn === 2 && farm.plots.length === 4, 'farm 默认 + 冷启动种子')
    const settings = await db.get('settings', 'main')
    assert(settings.bgm === true && settings.sfx === true, 'settings 默认开')
    db.close()
  }

  await deleteDB()
} finally {
  rmSync(BUNDLE, { force: true })
}

if (failures > 0) {
  console.error(`\n✗ ${failures} 项断言失败`)
  process.exit(1)
}
console.log('\n✓ 老存档升级回归全部通过')
