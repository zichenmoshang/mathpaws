#!/usr/bin/env node
// M6-QA-02：7/30 天经济数值模拟（按一期新链路重算）
//
// 产出口径：贝壳 = 口算（每日前 2 轮全额）+ 连学宝箱；食物 = 口算 +5/轮 + 宝箱；
//           花朵币 = 农场果实售卖（非贝壳）。
// 消耗：抽卡（贝壳 450 十连）、喂食（食物）、买种子（花朵币）。
// 重点验证：① 砍浮题后 450 十连的贝壳获取节奏；② "进化约一周"是否成立。
//
// 数值来源：直接解析 apps/web/src/config/*.ts（单一事实源，config 改动即反映）。
// 用法：node scripts/economy-sim.mjs
//
// 注意：quiz.ts 的 QUESTIONS_PER_ROUND 若为验收临时值（≠20），模拟仍按正式 20 题计。

import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const SRC = join(dirname(fileURLToPath(import.meta.url)), '..', 'src', 'config')
const read = f => readFileSync(join(SRC, f), 'utf8')

const num = (text, key) => {
  const m = text.match(new RegExp(`${key}:\\s*(\\d+)`))
  if (!m) throw new Error(`config 解析失败：${key}`)
  return Number(m[1])
}
const constNum = (text, name) => {
  const m = text.match(new RegExp(`${name}\\s*=\\s*(\\d+)`))
  if (!m) throw new Error(`config 解析失败：${name}`)
  return Number(m[1])
}

// ---------- 解析 config ----------
const economy = read('economy.ts')
const ORAL_PER_Q = num(economy, 'oralPerQuestion')       // 10
const ROUND_BONUS = num(economy, 'roundBonus')           // 50
const FOOD_PER_ROUND = num(economy, 'foodPerRound')      // 5
const DAILY_PAID = constNum(economy, 'DAILY_PAID_ROUNDS') // 2
const FOOD_EXP = constNum(economy, 'FOOD_EXP_RATE')      // 10
const CORN_SEEDS = num(economy, 'cornSeeds')             // 2

const quiz = read('quiz.ts')
const Q_PER_ROUND_CFG = constNum(quiz, 'QUESTIONS_PER_ROUND')
const Q_PER_ROUND = 20 // 正式口径（验收临时值不影响模拟）
if (Q_PER_ROUND_CFG !== 20) {
  console.warn(`⚠️  quiz.ts QUESTIONS_PER_ROUND=${Q_PER_ROUND_CFG}（验收临时值），本模拟按正式 20 题/轮计`)
}

const gacha = read('gachaPool.ts')
const TEN_COST = constNum(gacha, 'TEN_COST')             // 450

const streak = read('streak.ts')
const CHEST = [...streak.matchAll(/\{ level: (\d), streakDays: (\d+), shells: (\d+), food: (\d+) \}/g)]
  .map(m => ({ level: +m[1], days: +m[2], shells: +m[3], food: +m[4] }))
const chestFor = s => CHEST.reduce((p, c) => (s >= c.days ? c : p), CHEST[0])

const pets = read('pets.ts')
const STAGE_EXP = [...pets.matchAll(/\{ level: (\d), needExp: (\d+),/g)].map(m => +m[2])
const petLevel = exp => STAGE_EXP.reduce((lv, need, i) => (exp >= need ? i + 1 : lv), 1)

const farm = read('farm.ts')
const CROPS = [...farm.matchAll(
  /\{ id: '(\w+)', name: '([^']+)', emoji: '[^']*', unlockLevel: (\d+), growMinutes: (\d+), xp: (\d+), seedPrice: (\d+), yield: (\d+), sellPrice: (\d+) \}/g,
)].map(m => ({
  id: m[1], name: m[2], unlock: +m[3], minutes: +m[4], xp: +m[5],
  seedPrice: +m[6], yield: +m[7], sellPrice: +m[8],
}))
const FARM_LEVELS = [...farm.matchAll(/\{ level: (\d+), xp: (\d+) \}/g)].map(m => ({ level: +m[1], xp: +m[2] }))
const farmLevel = xp => FARM_LEVELS.reduce((lv, c) => (xp >= c.xp ? c.level : lv), 1)
const plotsFor = lv => (lv >= 6 ? 9 : lv >= 4 ? 8 : lv >= 2 ? 6 : 4)
// 收益率（花朵币/分钟）排序，供选种
const PROFIT = CROPS.map(c => ({ ...c, rate: (c.sellPrice * c.yield - c.seedPrice) / c.minutes }))
  .sort((a, b) => b.rate - a.rate)

// ---------- 模拟 ----------
const FARM_SESSIONS_PER_DAY = 3 // 假设孩子每天 3 次回农场收/种（分钟级生长，间隔足够）

function simulate(days) {
  let shells = 0, flowers = 0, food = 0, petExp = 0
  let farmXp = 0, streakDays = 0
  let tenDraws = 0, firstTenDay = null
  let evolveLv2Day = null, evolveLv3Day = null
  const seeds = { corn: CORN_SEEDS }
  const rows = []

  for (let day = 1; day <= days; day++) {
    // 1) 口算：每日前 2 轮全额（20 题全对 + 保底 + 食物）
    let dShells = DAILY_PAID * (Q_PER_ROUND * ORAL_PER_Q + ROUND_BONUS)
    let dFood = DAILY_PAID * FOOD_PER_ROUND

    // 2) 连学 + 宝箱
    streakDays += 1
    const chest = chestFor(streakDays)
    dShells += chest.shells
    dFood += chest.food

    shells += dShells
    food += dFood

    // 3) 喂食：全部喂出
    petExp += food * FOOD_EXP
    food = 0
    const pLv = petLevel(petExp)
    if (pLv >= 2 && evolveLv2Day === null) evolveLv2Day = day
    if (pLv >= 3 && evolveLv3Day === null) evolveLv3Day = day

    // 4) 农场：每天 N 个收获/播种会话
    let planted = seeds.__planted ?? 0
    for (let s = 0; s < FARM_SESSIONS_PER_DAY; s++) {
      // 收获上一轮全部种下（分钟级，会话间隔足够成熟）
      for (const c of CROPS) {
        const key = `__plot_${c.id}`
        const n = seeds[key] ?? 0
        if (n > 0) {
          flowers += n * c.yield * c.sellPrice
          farmXp += n * c.xp
          seeds[key] = 0
        }
      }
      // 播种全部地块：选已解锁且买得起的最优作物
      const lvNow = farmLevel(farmXp)
      const slots = plotsFor(lvNow)
      for (let p = 0; p < slots; p++) {
        const choice = PROFIT.find(c => c.unlock <= lvNow && (seeds[c.id] ?? 0) > 0)
          ?? PROFIT.find(c => c.unlock <= lvNow && flowers >= c.seedPrice)
        if (!choice) break
        if ((seeds[choice.id] ?? 0) > 0) seeds[choice.id] -= 1
        else flowers -= choice.seedPrice
        seeds[`__plot_${choice.id}`] = (seeds[`__plot_${choice.id}`] ?? 0) + 1
      }
      void planted
    }

    // 5) 抽卡：贝壳够就十连（孩子攒不住假设：优先十连）
    while (shells >= TEN_COST) {
      shells -= TEN_COST
      tenDraws += 1
      if (firstTenDay === null) firstTenDay = day
    }

    rows.push({ day, streak: streakDays, dShells, dFood, chestLv: chest.level, petExp, pLv, farmLv: farmLevel(farmXp), flowers, shellsLeft: shells, tenDraws })
  }
  return { rows, tenDraws, firstTenDay, evolveLv2Day, evolveLv3Day, shellsLeft: shells, flowers, petExp }
}

function report(days) {
  const r = simulate(days)
  console.log(`\n===== ${days} 天模拟 =====`)
  console.log('day | streak chest | +贝壳 +食物 | petExp Lv | farmLv 花朵币 | 十连(累计) 贝壳余')
  for (const x of r.rows) {
    if (x.day <= 10 || x.day % 5 === 0) {
      console.log(
        `${String(x.day).padStart(3)} | ${String(x.streak).padStart(2)} Lv${x.chestLv} | ` +
        `${String(x.dShells).padStart(4)} ${String(x.dFood).padStart(3)} | ${String(x.petExp).padStart(5)} Lv${x.pLv} | ` +
        `Lv${x.farmLv} ${String(x.flowers).padStart(5)} | ${String(x.tenDraws).padStart(2)} ${String(x.shellsLeft).padStart(4)}`,
      )
    }
  }
  console.log(`→ 首次十连：第 ${r.firstTenDay ?? '—'} 天；${days} 天累计十连 ${r.tenDraws} 次`)
  console.log(`→ 进化：Lv2 第 ${r.evolveLv2Day ?? '—'} 天；Lv3 第 ${r.evolveLv3Day ?? '—'} 天（目标"约一周"）`)
  return r
}

console.log('config 读取：', JSON.stringify({
  ORAL_PER_Q, ROUND_BONUS, FOOD_PER_ROUND, DAILY_PAID, FOOD_EXP, TEN_COST,
  chest: CHEST, stageExp: STAGE_EXP, crops: CROPS.length,
}))
report(7)
report(30)
