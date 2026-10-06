// 域 store：最近一轮答题结果（纯内存，不落 IndexedDB）。
// QuizScene 一轮结束时写入，ResultScene（result 路由）读取展示；
// 刷新页面后数据消失，结算页随之回到默认演示值，不影响任何存档。
import { create } from 'zustand'

export interface RoundResult {
  /** 本轮首次答对的题数 */
  correctCount: number
  totalCount: number
  shellsEarned: number
  foodEarned: number
  /** 本轮是否为全额奖励轮（false = 练习轮，无任何奖励） */
  paidRound: boolean
  finishedAt: number
}

interface LastRoundState {
  result: RoundResult | null
  save: (r: RoundResult) => void
}

export const useLastRoundStore = create<LastRoundState>((set) => ({
  result: null,
  save: (r) => set({ result: r }),
}))
