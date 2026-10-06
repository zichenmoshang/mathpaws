// 域 store：穿戴（equipped）持久化（PRD §9，P16 使用）
// owned 来自 gacha store；equipped 独立维护，落 cosmetics 表。
import { create } from 'zustand'

import { BASELINE_COSMETICS, isBaselineCosmetic, type CosmeticSlot } from '../config/cosmetics'
import { GACHA_ITEM_MAP } from '../config/gachaPool'
import { getDB } from '../db'
import { MAIN_KEY } from '../db/types'

interface EquippedState {
  equipped: Partial<Record<CosmeticSlot, string>>
  /** 穿戴：须已拥有（或基线装扮）且 slot 匹配；id=null 卸下 */
  equip: (slot: CosmeticSlot, id: string | null, isOwned: (id: string) => boolean) => void
  itemOf: (slot: CosmeticSlot) => string | undefined
}

export const useEquippedStore = create<EquippedState>((set, get) => ({
  equipped: {},
  equip: (slot, id, isOwned) => {
    const equipped = { ...get().equipped }
    if (id === null) {
      delete equipped[slot]
    } else {
      const item = GACHA_ITEM_MAP[id]
      // 非池内 id 仅允许基线装扮，且其定义槽位须与目标槽位一致；池内装扮须 slot 匹配
      const slotOk = item
        ? item.slot === slot
        : isBaselineCosmetic(id) &&
          BASELINE_COSMETICS.find(b => b.id === id)?.slot === slot
      if (!slotOk || !isOwned(id)) return
      equipped[slot] = id
    }
    set({ equipped })
  },
  itemOf: (slot) => get().equipped[slot],
}))

export async function loadEquipped(): Promise<void> {
  const d = await getDB()
  const rec = await d.get('cosmetics', MAIN_KEY)
  if (rec) useEquippedStore.setState({ equipped: rec.equipped ?? {} })
}
