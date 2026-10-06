// 域 store：错题本（PRD §11）
// 收录范围：仅正式答题（口算/真题）错题；"知识点+题型"去重。
// 一期口径：静默预采集——照常写入 wrongbook 表、无展示入口，上限 100 条（淘汰最旧）；
// 错题本页面二期开放（PRD §7.4 / §14）。
import { create } from 'zustand'

import type { QuizQuestion } from '../content/types'
import { getDB } from '../db'
import { defaultWrongbook } from '../db/migration'
import type { WrongItem, WrongbookRecord } from '../db/types'
import { MAIN_KEY } from '../db/types'

const CAPACITY = 100

interface WrongbookState extends WrongbookRecord {
  /** 收录一道错题（已去重；重复则刷新错误次数与题干） */
  add: (q: QuizQuestion, wrongAnswer: string) => void
  /** 重做正确 → 移出；返回是否移出 */
  removeIfCorrect: (key: string, correct: boolean) => boolean
  /** 手动揭示最终答案 */
  reveal: (key: string) => void
  count: () => number
}

export function wrongKey(q: QuizQuestion): string {
  return `${q.knowledgeId}#${q.kind}`
}

export const useWrongbookStore = create<WrongbookState>((set, get) => ({
  items: defaultWrongbook().items,

  add: (q, wrongAnswer) => {
    const key = wrongKey(q)
    const items = [...get().items]
    const existIdx = items.findIndex(i => i.key === key)
    if (existIdx >= 0) {
      const old = items[existIdx]
      items[existIdx] = {
        ...old,
        prompt: q.prompt,
        wrongAnswer,
        answer: q.answer,
        steps: q.steps,
        errorCount: old.errorCount + 1,
        // 再次答错重置为隐藏答案，与"默认隐藏"口径一致
        revealed: false,
      }
    } else {
      const item: WrongItem = {
        key,
        knowledgeId: q.knowledgeId,
        kind: q.kind,
        prompt: q.prompt,
        wrongAnswer,
        answer: q.answer,
        steps: q.steps,
        errorCount: 1,
        revealed: false,
      }
      items.push(item)
      // 容量上限：淘汰最旧
      if (items.length > CAPACITY) items.splice(0, items.length - CAPACITY)
    }
    set({ items })
  },

  removeIfCorrect: (key, correct) => {
    if (!correct) return false
    const items = get().items.filter(i => i.key !== key)
    set({ items })
    return true
  },

  reveal: (key) =>
    set(s => ({
      items: s.items.map(i => (i.key === key ? { ...i, revealed: true } : i)),
    })),

  count: () => get().items.length,
}))

export async function loadWrongbook(): Promise<void> {
  const d = await getDB()
  const rec = await d.get('wrongbook', MAIN_KEY)
  if (rec) useWrongbookStore.setState({ items: rec.items ?? [] })
}
