// 域 store：宠物（PRD §8）
// 一期：领养雪球兔 1 只；累计经验；一键全部喂食。
// 宠物不换装、无装备槽。
import { create } from 'zustand'

import { FOOD_EXP_RATE } from '../config/economy'
import { PET_STAGES, petLevelFromExp, PET_RENAME_MAX, type PetTypeId } from '../config/pets'
import { getDB } from '../db'
import { defaultPets } from '../db/migration'
import type { PetsRecord } from '../db/types'
import { MAIN_KEY } from '../db/types'

interface FeedResult {
  fed: number
  leveledTo: 1 | 2 | 3 | null
}

interface PetState extends PetsRecord {
  /** 领养（一期仅 rabbit） */
  adopt: (type: PetTypeId) => void
  /** 改名（≤6 字） */
  rename: (name: string) => void
  /**
   * 一键全部喂食：把当前食物一次喂出；
   * 经验一次结算；返回喂食数与最终到达等级（跨多级不中间结算）。
   * 调用方负责先扣食物（食物来源 economy）。
   */
  feedAll: (foodCount: number) => FeedResult
  level: () => 1 | 2 | 3
}

export const usePetStore = create<PetState>((set, get) => ({
  ...defaultPets(),

  adopt: (type) =>
    set({ hasPet: true, petType: type, petName: '', petExp: 0 }),

  rename: (name) => set({ petName: name.trim().slice(0, PET_RENAME_MAX) }),

  feedAll: (foodCount) => {
    const s = get()
    if (foodCount <= 0) return { fed: 0, leveledTo: null }
    const beforeLevel = petLevelFromExp(s.petExp)
    const total = s.petExp + foodCount * FOOD_EXP_RATE
    set({ petExp: total })
    const afterLevel = petLevelFromExp(total)
    return {
      fed: foodCount,
      leveledTo: afterLevel > beforeLevel ? afterLevel : null,
    }
  },

  level: () => petLevelFromExp(get().petExp),
}))

export { PET_STAGES }

export async function loadPet(): Promise<void> {
  const d = await getDB()
  const rec = await d.get('pets', MAIN_KEY)
  if (rec) usePetStore.setState(rec)
}
