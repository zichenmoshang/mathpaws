// 掌握度引擎骨架（M0-CTN-02 / PRD §7.7）
// 知识点三态：locked 未解锁 / learning 学习中 / mastered 已掌握。
// 推进：当前点连续答对达到阈值（默认 3–5、可配）→ mastered 并解锁下一节点；
//       答错 → consecutive 清零、节点保持 learning。
// 每轮配比：当前学习中 ~70% + 已掌握复习 ~30%；未解锁不出题。

import { KNOWLEDGE_PATH } from './knowledgePath'

export type MasteryNodeState = 'locked' | 'learning' | 'mastered'

export interface MasteryNodeRuntime {
  id: string
  state: MasteryNodeState
  count: number
  consecutive: number
}

/** 初始化运行态：第 1 个节点 learning，其余 locked */
export function initMastery(): MasteryNodeRuntime[] {
  return KNOWLEDGE_PATH.map((node, i) => ({
    id: node.id,
    state: i === 0 ? 'learning' : 'locked',
    count: 0,
    consecutive: 0,
  }))
}

/**
 * 存档与当前知识点路径合并（内容更新后老存档可学到新节点）：
 * - 存档已有且路径仍在的节点：保留其掌握度状态；
 * - 路径新增节点：按 initMastery 初始规则补入（第 1 个 learning、其余 locked）；
 * - 路径已删除的存档节点：剔除。
 */
export function mergeMastery(saved: MasteryNodeRuntime[]): MasteryNodeRuntime[] {
  const byId = new Map(saved.map(n => [n.id, n]))
  return initMastery().map(fresh => byId.get(fresh.id) ?? fresh)
}

function thresholdOf(id: string): number {
  return KNOWLEDGE_PATH.find(n => n.id === id)?.masteryThreshold ?? 4
}

/**
 * 记录一次作答结果，返回更新后的节点状态（含可能的解锁推进）。
 * 纯函数；只更新被作答节点，并在其 mastered 时解锁下一节点。
 */
export function applyAnswer(
  nodes: MasteryNodeRuntime[],
  nodeId: string,
  correct: boolean,
): MasteryNodeRuntime[] {
  const idx = nodes.findIndex(n => n.id === nodeId)
  if (idx < 0) return nodes
  const cur = nodes[idx]
  if (cur.state === 'locked') return nodes

  const next: MasteryNodeRuntime = correct
    ? {
        ...cur,
        count: cur.count + 1,
        consecutive: cur.consecutive + 1,
      }
    : { ...cur, consecutive: 0 }

  let justMastered = false
  if (next.state === 'learning' && next.consecutive >= thresholdOf(nodeId)) {
    next.state = 'mastered'
    justMastered = true
  }

  const out = nodes.slice()
  out[idx] = next
  if (justMastered && idx + 1 < out.length && out[idx + 1].state === 'locked') {
    out[idx + 1] = { ...out[idx + 1], state: 'learning' }
  }
  return out
}

/** 当前学习中节点（取第一个，理论上同一时间可有多个；M3 选主节点） */
export function currentLearning(nodes: MasteryNodeRuntime[]): MasteryNodeRuntime | null {
  return nodes.find(n => n.state === 'learning') ?? null
}

/**
 * 每轮出题配比：返回各知识点应抽题数。
 * @param total 一轮题数（20）
 */
export function roundDistribution(
  nodes: MasteryNodeRuntime[],
  total: number,
): Array<{ id: string; count: number }> {
  const learning = nodes.filter(n => n.state === 'learning')
  const mastered = nodes.filter(n => n.state === 'mastered')
  const result: Array<{ id: string; count: number }> = []

  if (learning.length === 0 && mastered.length === 0) return result

  // 某一阵营为空时，其配额全部重分配给存在的阵营，保证分配总和 === total
  let learningTarget = Math.round(total * 0.7)
  let reviewTarget = total - learningTarget
  if (learning.length === 0) {
    learningTarget = 0
    reviewTarget = total
  } else if (mastered.length === 0) {
    learningTarget = total
    reviewTarget = 0
  }

  if (learning.length > 0) {
    const base = Math.floor(learningTarget / learning.length)
    let extra = learningTarget - base * learning.length
    learning.forEach(n => {
      const add = extra > 0 ? 1 : 0
      if (extra > 0) extra -= 1
      result.push({ id: n.id, count: base + add })
    })
  }
  if (mastered.length > 0) {
    const base = Math.floor(reviewTarget / mastered.length)
    let extra = reviewTarget - base * mastered.length
    mastered.forEach(n => {
      const add = extra > 0 ? 1 : 0
      if (extra > 0) extra -= 1
      result.push({ id: n.id, count: base + add })
    })
  }
  return result.filter(r => r.count > 0)
}

/** 未解锁节点过滤：给定候选知识点 id，剔除 locked（保证不超纲） */
export function filterUnlocked(nodes: MasteryNodeRuntime[], ids: string[]): string[] {
  return ids.filter(id => {
    const n = nodes.find(x => x.id === id)
    return n && n.state !== 'locked'
  })
}
