// 域 store：设置（BGM / 音效开关；localStorage 同步可选）
import { create } from 'zustand'

import { getDB } from '../db'
import { defaultSettings } from '../db/migration'
import type { SettingsRecord } from '../db/types'
import { MAIN_KEY } from '../db/types'

interface SettingsState extends SettingsRecord {
  setBgm: (v: boolean) => void
  setSfx: (v: boolean) => void
}

export const useSettingsStore = create<SettingsState>((set) => ({
  ...defaultSettings(),
  setBgm: (v) => set({ bgm: v }),
  setSfx: (v) => set({ sfx: v }),
}))

export async function loadSettings(): Promise<void> {
  const d = await getDB()
  const rec = await d.get('settings', MAIN_KEY)
  if (rec) useSettingsStore.setState(rec)
}
