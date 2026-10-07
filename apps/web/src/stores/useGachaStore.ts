// 域 store：学盒抽卡（PRD §9、§13.7）
// 每次必出一件人物装扮；保底 10 稀有 / 100 传说（持久化、出货重置）；
// 重复仅标记 isNew=false（不返贝壳）。
import { create } from 'zustand'

import {
  GACHA_ITEM_MAP, rollRarity, rollItem, SINGLE_COST, TEN_COST,
  type GachaItem,
} from '../config/gachaPool'
import { getDB } from '../db'
import { defaultCosmetics } from '../db/migration'
import type { CosmeticsRecord } from '../db/types'
import { MAIN_KEY } from '../db/types'

import { useEconomyStore } from './useEconomyStore'

export interface DrawOutcome {
  item: GachaItem
  isNew: boolean
}

interface GachaState extends Omit<CosmeticsRecord, 'equipped'> {
  /**
   * 抽 times 次：扣费（调用方保证贝壳充足并先行扣费），
   * 逐抽 rollRarity/rollItem、更新保底计数、重复不返还。
   */
  draw: (times: 1 | 10) => DrawOutcome[]
  /** 是否拥有某装扮 */
  has: (id: string) => boolean
}

export const useGachaStore = create<GachaState>((set, get) => ({
  owned: defaultCosmetics().owned,
  pityRare: 0,
  pityLegend: 0,

  draw: (times) => {
    const s = get()
    const owned = [...s.owned]
    let pityRare = s.pityRare
    let pityLegend = s.pityLegend
    const outcomes: DrawOutcome[] = []

    for (let i = 0; i < times; i++) {
      const rarity = rollRarity(pityRare, pityLegend)
      const item = rollItem(rarity)

      pityLegend += 1
      pityRare += 1
      if (rarity === 'legendary') {
        pityLegend = 0
        pityRare = 0
      } else if (rarity === 'rare') {
        pityRare = 0
      }

      const isNew = !owned.includes(item.id)
      if (isNew) owned.push(item.id)
      outcomes.push({ item, isNew })
    }

    set({ owned, pityRare, pityLegend })
    return outcomes
  },

  has: (id) => get().owned.includes(id),
}))

/** 抽卡入口统一编排：扣费（余额检查与扣减一次原子完成）→ 抽；不足返回 null */
export function performDraw(times: 1 | 10): DrawOutcome[] | null {
  const cost = times === 10 ? TEN_COST : SINGLE_COST
  // spendShells 余额不足返回 false：直接不发货，不先查后扣
  if (!useEconomyStore.getState().spendShells(cost)) return null
  return useGachaStore.getState().draw(times)
}

export async function loadGacha(): Promise<void> {
  const d = await getDB()
  const rec = await d.get('cosmetics', MAIN_KEY)
  if (rec) {
    useGachaStore.setState({
      owned: rec.owned,
      pityRare: rec.pityRare,
      pityLegend: rec.pityLegend,
    })
  }
}

/** 穿戴读写（cosmetics 表 equipped）独立放在 useCosmeticsBridge，供 P16 使用 */
export { GACHA_ITEM_MAP }
