// 知识点有序路径 — Gate G2 已审核通过（2026-10-01，用户确认）
// 教材依据：北师大版（2024）三年级上册（2025 秋启用新版）。
//
// 纳入节点：
//   一 混合运算 / 三 大数加与减（二）/ 五 认识图形 /
//   六 乘除法的应用（二）/ 七 认识小数 / 综合实践 年月日
// 剔除（PRD §7.6，作图测量/观察物体/统计，不可程序化）：
//   二 测量（二）/ 四 我们生活的空间（一）/ 八 调查与记录
//   综合实践 记录我们的校园。

import type { DifficultyLevel, OralGenParams } from './types'

export interface KnowledgeNode {
  id: string
  cnName: string
  unit: string
  /** 能力类型 */
  capability: 'compute' | 'concept'
  /** 出题题型 */
  kind: 'oral' | 'real' | 'both'
  /** 掌握所需连续答对阈值（计算 4、概念 3） */
  masteryThreshold: number
  /** 该节点允许出题的难度等级（L1 基础 / L2 熟练 / L3 提升） */
  levels: DifficultyLevel[]
  /** 口算生成参数（compute 节点；concept 节点为 null） */
  oralParams: OralGenParams | null
}

/** 全册出题难度权重 L1:L2:L3 = 3:5:2（G2 确认） */
export const DIFFICULTY_WEIGHT: Record<DifficultyLevel, number> = {
  1: 3,
  2: 5,
  3: 2,
}

/**
 * 有序路径（数组顺序即解锁顺序）：
 * 混合运算 → 大数加与减 → 认识图形 → 乘除法的应用 → 认识小数 → 年月日
 * 数域均经 2025-2026 学年新版配套真题卷核实。
 */
export const KNOWLEDGE_PATH: KnowledgeNode[] = [
  {
    id: 'mixed-ops', cnName: '混合运算', unit: '第一单元',
    capability: 'compute', kind: 'both', masteryThreshold: 4,
    levels: [1, 2, 3],
    oralParams: {
      ops: ['mix'], min: 2, max: 80,
      carry: true, parentheses: true, multiStep: true,
      factorRange: { min: 2, max: 9 },
    },
  },
  {
    id: 'big-add-subtract', cnName: '大数加与减（二）', unit: '第三单元',
    capability: 'compute', kind: 'both', masteryThreshold: 4,
    levels: [1, 2, 3],
    oralParams: {
      ops: ['+', '-'], min: 100, max: 999,
      carry: true, parentheses: true, multiStep: true,
    },
  },
  {
    id: 'shapes', cnName: '认识图形', unit: '第五单元',
    capability: 'concept', kind: 'real', masteryThreshold: 3,
    levels: [1, 2, 3],
    oralParams: null,
  },
  {
    id: 'multiply-divide-apply', cnName: '乘除法的应用（二）', unit: '第六单元',
    capability: 'compute', kind: 'both', masteryThreshold: 4,
    levels: [1, 2, 3],
    oralParams: {
      ops: ['×', '÷'], min: 100, max: 999,
      carry: false, parentheses: true, multiStep: true,
      multiplesOf: 10, factorRange: { min: 2, max: 9 },
    },
  },
  {
    id: 'decimal', cnName: '认识小数', unit: '第七单元',
    capability: 'compute', kind: 'both', masteryThreshold: 4,
    levels: [1, 2, 3],
    oralParams: {
      ops: ['+', '-'], min: 0, max: 20,
      carry: true, parentheses: false, multiStep: false,
      decimalPlaces: 1,
    },
  },
  {
    id: 'date', cnName: '年月日', unit: '综合实践·探索年月日的秘密',
    capability: 'concept', kind: 'real', masteryThreshold: 3,
    levels: [1, 2, 3],
    oralParams: null,
  },
]

/** 审核状态：G2 已通过，可用于 M3 正式出题 */
export const KNOWLEDGE_PATH_STATUS: 'draft' | 'approved' = 'approved'
