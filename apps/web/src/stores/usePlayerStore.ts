// 域 store：玩家档案（设备游客身份、主角名、引导 / 小测状态）
import { create } from 'zustand'

import { getDB } from '../db'
import { defaultProfile } from '../db/migration'
import type { ProfileRecord } from '../db/types'
import { MAIN_KEY } from '../db/types'

interface PlayerState extends ProfileRecord {
  /** 设置主角名（≤6 字；为空回退"小朋友"） */
  setHeroName: (name: string) => void
  markOnboardingDone: () => void
  markGuideDone: () => void
  markPlacementDone: () => void
}

export const usePlayerStore = create<PlayerState>((set) => ({
  ...defaultProfile(),
  setHeroName: (name) =>
    set({ heroName: name.trim().slice(0, 6) || '小朋友' }),
  markOnboardingDone: () => set({ onboardingDone: true }),
  markGuideDone: () => set({ guideDone: true }),
  markPlacementDone: () => set({ placementDone: true }),
}))

/** 从 DB 装载 */
export async function loadPlayer(): Promise<void> {
  const d = await getDB()
  const rec = await d.get('profile', MAIN_KEY)
  if (rec) usePlayerStore.setState(rec)
}
