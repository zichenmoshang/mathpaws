import fc from 'fast-check'
import { describe, it, expect } from 'vitest'

import { KNOWLEDGE_PATH } from '../knowledgePath'
import {
  initMastery,
  mergeMastery,
  applyAnswer,
  currentLearning,
  roundDistribution,
  filterUnlocked,
  type MasteryNodeRuntime,
  type MasteryNodeState,
} from '../mastery'

const IDS = KNOWLEDGE_PATH.map(n => n.id)

/** 对首节点连续答对 n 次，推进到 mastered */
function answerTimes(
  nodes: MasteryNodeRuntime[],
  id: string,
  correct: boolean,
  times: number,
): MasteryNodeRuntime[] {
  let cur = nodes
  for (let i = 0; i < times; i++) cur = applyAnswer(cur, id, correct)
  return cur
}

describe('initMastery', () => {
  it('节点集合与顺序同 KNOWLEDGE_PATH，首个 learning、其余 locked', () => {
    const nodes = initMastery()
    expect(nodes.map(n => n.id)).toEqual(IDS)
    expect(nodes[0].state).toBe('learning')
    nodes.slice(1).forEach(n => expect(n.state).toBe('locked'))
    nodes.forEach(n => {
      expect(n.count).toBe(0)
      expect(n.consecutive).toBe(0)
    })
  })
})

describe('mergeMastery', () => {
  it('存档节点保留状态，路径新增节点按初始规则补入，已删节点剔除', () => {
    const saved: MasteryNodeRuntime[] = [
      { id: 'mixed-ops', state: 'mastered', count: 9, consecutive: 4 },
      { id: 'ghost-node', state: 'learning', count: 3, consecutive: 1 },
    ]
    const merged = mergeMastery(saved)
    expect(merged.map(n => n.id)).toEqual(IDS)
    expect(merged.find(n => n.id === 'mixed-ops')).toEqual(saved[0])
    expect(merged.find(n => n.id === 'ghost-node')).toBeUndefined()
    // 存档缺失的节点按 initMastery 规则补入（首节点之外一律 locked）
    const big = merged.find(n => n.id === 'big-add-subtract')!
    expect(big).toEqual({ id: 'big-add-subtract', state: 'locked', count: 0, consecutive: 0 })
  })

  it('空存档等价于 initMastery', () => {
    expect(mergeMastery([])).toEqual(initMastery())
  })
})

describe('applyAnswer', () => {
  it('未知节点 id 原样返回（同一引用）', () => {
    const nodes = initMastery()
    expect(applyAnswer(nodes, 'nope', true)).toBe(nodes)
  })

  it('locked 节点作答不生效', () => {
    const nodes = initMastery()
    expect(applyAnswer(nodes, IDS[1], true)).toBe(nodes)
  })

  it('答对：count 与 consecutive 各 +1；答错：consecutive 清零、count 不变', () => {
    let nodes = initMastery()
    nodes = applyAnswer(nodes, IDS[0], true)
    expect(nodes[0]).toMatchObject({ count: 1, consecutive: 1, state: 'learning' })
    nodes = applyAnswer(nodes, IDS[0], false)
    expect(nodes[0]).toMatchObject({ count: 1, consecutive: 0, state: 'learning' })
  })

  it('连对达到阈值（计算点 4）→ mastered，并解锁下一节点', () => {
    const nodes = answerTimes(initMastery(), IDS[0], true, 4)
    expect(nodes[0].state).toBe('mastered')
    expect(nodes[0].consecutive).toBe(4)
    expect(nodes[1].state).toBe('learning')
    expect(nodes[2].state).toBe('locked')
  })

  it('未达阈值前答错清零，需重新连对', () => {
    let nodes = answerTimes(initMastery(), IDS[0], true, 3)
    nodes = applyAnswer(nodes, IDS[0], false)
    expect(nodes[0]).toMatchObject({ state: 'learning', consecutive: 0, count: 3 })
    nodes = answerTimes(nodes, IDS[0], true, 4)
    expect(nodes[0].state).toBe('mastered')
  })

  it('mastered 后答错不回退状态，仅 consecutive 清零', () => {
    let nodes = answerTimes(initMastery(), IDS[0], true, 4)
    nodes = applyAnswer(nodes, IDS[0], false)
    expect(nodes[0].state).toBe('mastered')
    expect(nodes[0].consecutive).toBe(0)
  })

  it('最后一个节点 mastered 时无下一节点可解锁，不越界', () => {
    const last = IDS[IDS.length - 1]
    const base: MasteryNodeRuntime[] = initMastery().map((n, i) =>
      i < IDS.length - 1
        ? { ...n, state: 'mastered', count: 4, consecutive: 4 }
        : { ...n, state: 'learning' },
    )
    const nodes = answerTimes(base, last, true, 3)
    expect(nodes).toHaveLength(IDS.length)
    expect(nodes[IDS.length - 1].state).toBe('mastered')
  })

  it('纯函数：不修改入参数组', () => {
    const nodes = initMastery()
    const snapshot = JSON.parse(JSON.stringify(nodes))
    applyAnswer(nodes, IDS[0], true)
    expect(nodes).toEqual(snapshot)
  })

  it('任意作答序列下不变量恒成立', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({ id: fc.constantFrom(...IDS), correct: fc.boolean() }),
          { minLength: 0, maxLength: 60 },
        ),
        ops => {
          let nodes = initMastery()
          let prev = nodes
          const correctCount = new Map<string, number>()
          for (const op of ops) {
            nodes = applyAnswer(nodes, op.id, op.correct)
            const before = prev.find(n => n.id === op.id)
            if (op.correct && before && before.state !== 'locked') {
              correctCount.set(op.id, (correctCount.get(op.id) ?? 0) + 1)
            }
            prev = nodes
          }
          for (const n of nodes) {
            // 连对数不超过累计答对数
            expect(n.consecutive).toBeLessThanOrEqual(n.count)
            // count 恰等于该节点在 learning/mastered 态下的答对次数
            expect(n.count).toBe(correctCount.get(n.id) ?? 0)
          }
          // mastered 节点数不超过已解锁（非 locked）节点数
          const unlocked = nodes.filter(n => n.state !== 'locked').length
          expect(nodes.filter(n => n.state === 'mastered').length).toBeLessThanOrEqual(unlocked)
          // 末位节点之外：locked 节点的前驱必未 mastered
          for (let i = 1; i < nodes.length; i++) {
            if (nodes[i].state !== 'locked') {
              expect(nodes[i - 1].state).toBe('mastered')
            }
          }
        },
      ),
      { numRuns: 200 },
    )
  })
})

describe('currentLearning', () => {
  it('返回第一个 learning 节点；无 learning 返回 null', () => {
    expect(currentLearning(initMastery())?.id).toBe(IDS[0])
    const allLocked = initMastery().map(n => ({ ...n, state: 'locked' as MasteryNodeState }))
    expect(currentLearning(allLocked)).toBeNull()
  })

  it('首节点 mastered 后指向新解锁节点', () => {
    const nodes = answerTimes(initMastery(), IDS[0], true, 4)
    expect(currentLearning(nodes)?.id).toBe(IDS[1])
  })
})

describe('filterUnlocked', () => {
  it('剔除 locked 与未知 id，保留 learning/mastered', () => {
    const nodes = answerTimes(initMastery(), IDS[0], true, 4)
    const out = filterUnlocked(nodes, [IDS[0], IDS[1], IDS[2], 'ghost'])
    expect(out).toEqual([IDS[0], IDS[1]])
  })

  it('初始态仅首节点通过', () => {
    expect(filterUnlocked(initMastery(), IDS)).toEqual([IDS[0]])
  })
})

describe('roundDistribution', () => {
  it('全部 locked 时返回空数组', () => {
    const allLocked = initMastery().map(n => ({ ...n, state: 'locked' as MasteryNodeState }))
    expect(roundDistribution(allLocked, 20)).toEqual([])
  })

  it('初始态（仅学习中、无复习）：题数全部给学习中节点', () => {
    const dist = roundDistribution(initMastery(), 20)
    expect(dist).toEqual([{ id: IDS[0], count: 20 }])
  })

  it('学习中 1 个 + 已掌握 1 个：按 7:3 分配（20 → 14/6）', () => {
    const nodes = answerTimes(initMastery(), IDS[0], true, 4)
    const dist = roundDistribution(nodes, 20)
    expect(dist).toEqual([
      { id: IDS[1], count: 14 },
      { id: IDS[0], count: 6 },
    ])
  })

  it('全部 mastered：题数全部进复习阵营', () => {
    const nodes = initMastery().map(n => ({ ...n, state: 'mastered' as MasteryNodeState }))
    const dist = roundDistribution(nodes, 20)
    expect(dist.reduce((s, d) => s + d.count, 0)).toBe(20)
    expect(dist).toHaveLength(IDS.length)
  })

  it('任意状态与题数：各桶之和 === total，桶均非 locked，同阵营内配额差 ≤1', () => {
    const stateArb = fc.constantFrom<MasteryNodeState>('locked', 'learning', 'mastered')
    fc.assert(
      fc.property(
        fc.array(stateArb, { minLength: IDS.length, maxLength: IDS.length }),
        fc.integer({ min: 1, max: 60 }),
        (states, total) => {
          const nodes = initMastery().map((n, i) => ({ ...n, state: states[i] }))
          const dist = roundDistribution(nodes, total)
          const anyUnlocked = states.some(s => s !== 'locked')
          if (!anyUnlocked) {
            expect(dist).toEqual([])
            return
          }
          // 总和严格等于一轮题数
          expect(dist.reduce((s, d) => s + d.count, 0)).toBe(total)
          const learningCounts: number[] = []
          const masteredCounts: number[] = []
          for (const d of dist) {
            expect(d.count).toBeGreaterThan(0)
            const st = states[IDS.indexOf(d.id)]
            expect(st).not.toBe('locked')
            ;(st === 'learning' ? learningCounts : masteredCounts).push(d.count)
          }
          // 同阵营内按余数逐个 +1，任意两桶差 ≤1
          for (const arr of [learningCounts, masteredCounts]) {
            if (arr.length > 0) {
              expect(Math.max(...arr) - Math.min(...arr)).toBeLessThanOrEqual(1)
            }
          }
          // 阵营配额：双方都在时 学习=round(total*0.7)；一方为空时全部归另一方
          const learningTotal = learningCounts.reduce((s, c) => s + c, 0)
          if (learningCounts.length > 0 && masteredCounts.length > 0) {
            expect(learningTotal).toBe(Math.round(total * 0.7))
          } else if (learningCounts.length === 0) {
            expect(learningTotal).toBe(0)
          } else {
            expect(learningTotal).toBe(total)
          }
        },
      ),
      { numRuns: 300 },
    )
  })
})
