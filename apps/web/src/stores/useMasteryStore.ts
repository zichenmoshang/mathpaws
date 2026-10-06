// 域 store：掌握度（运行态；持久化骨架）
import { create } from 'zustand'

import {
  initMastery, applyAnswer, currentLearning, roundDistribution,
  filterUnlocked, mergeMastery, type MasteryNodeRuntime,
} from '../content/mastery'
import { getDB } from '../db'
import type { MasteryRecord } from '../db/types'
import { MAIN_KEY } from '../db/types'

interface MasteryState {
  nodes: MasteryNodeRuntime[]
  recordAnswer: (nodeId: string, correct: boolean) => void
  current: () => MasteryNodeRuntime | null
  distribution: (total: number) => Array<{ id: string; count: number }>
  unlocked: (ids: string[]) => string[]
  reset: () => void
}

export const useMasteryStore = create<MasteryState>((set, get) => ({
  nodes: initMastery(),

  recordAnswer: (nodeId, correct) =>
    set(s => ({ nodes: applyAnswer(s.nodes, nodeId, correct) })),

  current: () => currentLearning(get().nodes),

  distribution: (total) => roundDistribution(get().nodes, total),

  unlocked: (ids) => filterUnlocked(get().nodes, ids),

  reset: () => set({ nodes: initMastery() }),
}))

export async function loadMastery(): Promise<void> {
  const d = await getDB()
  const rec: MasteryRecord | undefined = await d.get('mastery', MAIN_KEY)
  if (rec && Array.isArray(rec.nodes) && rec.nodes.length > 0) {
    // 与当前知识点路径做并集：保留存档状态、补入新增节点、剔除已删节点
    useMasteryStore.setState({
      nodes: mergeMastery(rec.nodes as MasteryNodeRuntime[]),
    })
  }
}
