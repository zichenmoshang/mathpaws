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

import { useEconomyStore } from './useEconomyStore'

/** 满级 = 最高形态等级（经验达上限后拒绝喂食） */
const MAX_PET_LEVEL = PET_STAGES[PET_STAGES.length - 1].level

export interface FeedResult {
  /** 是否成功喂出 */
  ok: boolean
  /** 失败原因：max-level 已满级 / no-food 无食物 */
  reason?: 'max-level' | 'no-food'
  /** 本次喂出份数（失败为 0） */
  fed: number
  /** 本次是否升级 */
  leveled: boolean
  /** 升级后到达等级（未升级为 null） */
  leveledTo: 1 | 2 | 3 | null
}

interface PetState extends PetsRecord {
  /** 领养（一期仅 rabbit） */
  adopt: (type: PetTypeId) => void
  /** 改名（≤6 字） */
  rename: (name: string) => void
  /**
   * 一键全部喂食（自包含编排，参照 performDraw）：
   * - 满级（Lv.3，经验达上限）→ 拒绝喂食，返回 reason='max-level'；
   * - economy.petFood 为 0 → 返回 reason='no-food'；
   * - 否则内部校验并扣减全部食物、一次结算经验
   *   （扣费与加经验在同一同步编排内完成，原子化；跨多级只报最终等级）。
   */
  feedAll: () => FeedResult
  level: () => 1 | 2 | 3
}

export const usePetStore = create<PetState>((set, get) => ({
  ...defaultPets(),

  adopt: (type) =>
    set({ hasPet: true, petType: type, petName: '', petExp: 0 }),

  rename: (name) => set({ petName: name.trim().slice(0, PET_RENAME_MAX) }),

  feedAll: () => {
    const s = get()
    const fail = (reason: 'max-level' | 'no-food'): FeedResult => ({
      ok: false, reason, fed: 0, leveled: false, leveledTo: null,
    })
    // 满级拒绝喂食
    if (petLevelFromExp(s.petExp) >= MAX_PET_LEVEL) return fail('max-level')
    const economy = useEconomyStore.getState()
    const count = economy.petFood
    if (count <= 0) return fail('no-food')

    // 扣食物 + 加经验：同一同步编排内连续完成，不会只扣不加
    economy.addPetFood(-count)
    const beforeLevel = petLevelFromExp(s.petExp)
    const total = s.petExp + count * FOOD_EXP_RATE
    set({ petExp: total })
    const afterLevel = petLevelFromExp(total)
    return {
      ok: true,
      fed: count,
      leveled: afterLevel > beforeLevel,
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
