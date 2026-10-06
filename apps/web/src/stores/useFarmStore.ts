// 域 store：农场（PRD §10）
// 地块随农场等级扩展；种子按份花币购买；分钟级真实时间生长；无水滴。
import { create } from 'zustand'

import {
  CROP_MAP, plotCountForLevel, farmLevelFromExp, emptyPlots,
  getPlotStage, type CropId,
} from '../config/farm'
import { getDB } from '../db'
import { defaultFarm } from '../db/migration'
import type { FarmRecord } from '../db/types'
import { MAIN_KEY } from '../db/types'

export interface HarvestResult {
  crop: CropId
  gained: number
  leveled: boolean
}

interface FarmState extends FarmRecord {
  farmLevel: () => number
  /** 购买 count 份种子（花币）；成功返回 true */
  buySeeds: (crop: CropId, count: number, pay: (n: number) => boolean) => boolean
  /**
   * 播种：目标须为空、作物已按农场等级解锁、持有 ≥1 份；
   * 消耗 1 份种子；plantedAt = now。
   */
  plant: (plotIndex: number, crop: CropId) => boolean
  /** 收获所有/指定成熟地块：果实入库存 + XP；可能升级（升级时扩展地块，保留旧状态） */
  harvest: (plotIndex?: number) => HarvestResult[]
  /** 卖果实（花币入账由调用方）；返回卖出数量 */
  removeCropForSell: (crop: CropId, qty: number) => number
  seedCount: (crop: CropId) => number
  cropCount: (crop: CropId) => number
}

export const useFarmStore = create<FarmState>((set, get) => ({
  ...defaultFarm(),

  farmLevel: () => farmLevelFromExp(get().farmExp),

  buySeeds: (crop, count, pay) => {
    const s = get()
    if (count <= 0) return false
    const price = CROP_MAP[crop].seedPrice * count
    if (!pay(price)) return false
    const seedInventory = { ...s.seedInventory }
    seedInventory[crop] = (seedInventory[crop] ?? 0) + count
    set({ seedInventory })
    return true
  },

  plant: (plotIndex, crop) => {
    const s = get()
    const plot = s.plots[plotIndex]
    if (!plot || plot.seedId) return false
    const def = CROP_MAP[crop]
    if (def.unlockLevel > farmLevelFromExp(s.farmExp)) return false
    if ((s.seedInventory[crop] ?? 0) < 1) return false

    const seedInventory = { ...s.seedInventory }
    seedInventory[crop] = (seedInventory[crop] ?? 0) - 1
    if (seedInventory[crop] <= 0) delete seedInventory[crop]

    const plots = s.plots.map((p, i) =>
      i === plotIndex ? { seedId: crop, plantedAt: Date.now() } : p,
    )
    set({ plots, seedInventory })
    return true
  },

  harvest: (plotIndex) => {
    const s = get()
    const now = Date.now()
    const results: HarvestResult[] = []
    let farmExp = s.farmExp
    const cropInventory = { ...s.cropInventory }
    let plots = s.plots

    // 记录实际产生收获的地块索引，清空时按索引而非作物名匹配
    const harvestedIdx: number[] = []
    s.plots.forEach((plot, i) => {
      if (plotIndex !== undefined && i !== plotIndex) return
      if (!plot.seedId) return
      if (getPlotStage(plot, now).stage !== 'ready') return
      const def = CROP_MAP[plot.seedId]
      cropInventory[plot.seedId] = (cropInventory[plot.seedId] ?? 0) + def.yield
      farmExp += def.xp
      results.push({ crop: plot.seedId, gained: def.yield, leveled: false })
      harvestedIdx.push(i)
    })

    if (results.length === 0) return results

    const beforeLevel = farmLevelFromExp(s.farmExp)
    const afterLevel = farmLevelFromExp(farmExp)
    const leveled = afterLevel > beforeLevel
    results.forEach(r => {
      r.leveled = leveled
    })

    // 只清空实际产生了收获结果的地块（避免误清未成熟的同作物地块）
    const cleared = new Set(harvestedIdx)
    plots = plots.map((p, i) => (cleared.has(i) ? { seedId: null, plantedAt: 0 } : p))

    // 升级扩展地块：追加新空地（不覆盖旧地块状态）
    const needPlots = plotCountForLevel(afterLevel)
    if (plots.length < needPlots) {
      plots = [...plots, ...emptyPlots(needPlots - plots.length)]
    }

    set({ plots, cropInventory, farmExp })
    return results
  },

  removeCropForSell: (crop, qty) => {
    const s = get()
    const have = s.cropInventory[crop] ?? 0
    const sold = Math.min(have, Math.max(0, qty))
    if (sold <= 0) return 0
    const cropInventory = { ...s.cropInventory }
    const left = have - sold
    if (left > 0) cropInventory[crop] = left
    else delete cropInventory[crop]
    set({ cropInventory })
    return sold
  },

  seedCount: (crop) => get().seedInventory[crop] ?? 0,
  cropCount: (crop) => get().cropInventory[crop] ?? 0,
}))

export async function loadFarm(): Promise<void> {
  const d = await getDB()
  const rec = await d.get('farm', MAIN_KEY)
  if (rec) useFarmStore.setState(rec)
}
