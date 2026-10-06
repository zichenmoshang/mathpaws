// 农场配置（PRD §10）：2D 俯视、6 种作物、分钟级真实时间生长
// 一期不做：水滴 / 浇水 / 施肥、花币扩地、装饰、特殊种子。

export type CropId = 'corn' | 'pumpkin' | 'potato' | 'carrot' | 'tomato' | 'strawberry'

export interface CropDef {
  id: CropId
  name: string
  emoji: string
  /** 解锁所需农场等级 */
  unlockLevel: number
  /** 生长周期（分钟，真实时间） */
  growMinutes: number
  /** 收获获得的农场 XP */
  xp: number
  /** 种子单价（花朵币 / 份） */
  seedPrice: number
  /** 单次产量（个） */
  yield: number
  /** 果实售价（花朵币 / 个） */
  sellPrice: number
}

/** 6 作物（PRD §10.2）；保证 售价 × 产量 > 种子价 */
export const CROPS: CropDef[] = [
  { id: 'corn', name: '玉米', emoji: '🌽', unlockLevel: 1, growMinutes: 1, xp: 3, seedPrice: 5, yield: 3, sellPrice: 3 },
  { id: 'pumpkin', name: '南瓜', emoji: '🎃', unlockLevel: 2, growMinutes: 3, xp: 5, seedPrice: 10, yield: 2, sellPrice: 8 },
  { id: 'potato', name: '土豆', emoji: '🥔', unlockLevel: 3, growMinutes: 5, xp: 8, seedPrice: 20, yield: 2, sellPrice: 15 },
  { id: 'carrot', name: '胡萝卜', emoji: '🥕', unlockLevel: 5, growMinutes: 8, xp: 12, seedPrice: 35, yield: 2, sellPrice: 25 },
  { id: 'tomato', name: '番茄', emoji: '🍅', unlockLevel: 7, growMinutes: 12, xp: 18, seedPrice: 55, yield: 2, sellPrice: 40 },
  { id: 'strawberry', name: '草莓', emoji: '🍓', unlockLevel: 10, growMinutes: 15, xp: 25, seedPrice: 80, yield: 1, sellPrice: 150 },
]

export const CROP_MAP: Record<CropId, CropDef> = CROPS.reduce(
  (acc, c) => {
    acc[c.id] = c
    return acc
  },
  {} as Record<CropId, CropDef>,
)

/** 农场等级与累计 XP（PRD §10.3：10 级） */
export const FARM_LEVELS = [
  { level: 1, xp: 0 },
  { level: 2, xp: 20 },
  { level: 3, xp: 50 },
  { level: 4, xp: 100 },
  { level: 5, xp: 170 },
  { level: 6, xp: 260 },
  { level: 7, xp: 370 },
  { level: 8, xp: 500 },
  { level: 9, xp: 660 },
  { level: 10, xp: 850 },
] as const

export const MAX_FARM_LEVEL = FARM_LEVELS[FARM_LEVELS.length - 1].level

export function farmLevelFromExp(totalExp: number): number {
  let level = 1
  for (const lv of FARM_LEVELS) if (totalExp >= lv.xp) level = lv.level
  return level
}

/** 当前等级升到下一级所需累计 XP；已满级返回 null */
export function nextFarmLevelXp(level: number): number | null {
  const next = FARM_LEVELS.find(lv => lv.level === level + 1)
  return next ? next.xp : null
}

/**
 * 各农场等级的耕地数量：
 * 一期 = 2×2 固定 4 块（对齐高保真 farm-v2 四块木栅栏田地）；
 * PRD §10.3 的扩地（Lv2→6 / Lv4→8 / Lv6→9）转二期，届时函数恢复分级。
 */
export function plotCountForLevel(_farmLevel: number): number {
  return 4
}

export const MAX_PLOT_COUNT = 4

/** 初始（农场 Lv.1）地块数；兼容旧引用名 */
export const PLOT_COUNT = plotCountForLevel(1)

/** 一块耕地的持久化状态；作物阶段由 plantedAt 与当前时间派生 */
export interface PlotState {
  seedId: CropId | null
  /** 毫秒时间戳；空地为 0 */
  plantedAt: number
}

export function emptyPlots(count: number = PLOT_COUNT): PlotState[] {
  return Array.from({ length: count }, () => ({ seedId: null, plantedAt: 0 }))
}

export type PlotStage = 'empty' | 'growing' | 'ready'

/** 由地块状态与当前时间派生阶段及剩余秒数（分钟级生长） */
export function getPlotStage(
  plot: PlotState,
  now: number,
): { stage: PlotStage; remainSeconds: number } {
  if (!plot.seedId || !plot.plantedAt) return { stage: 'empty', remainSeconds: 0 }
  const growMs = CROP_MAP[plot.seedId].growMinutes * 60 * 1000
  const elapsed = now - plot.plantedAt
  if (elapsed >= growMs) return { stage: 'ready', remainSeconds: 0 }
  return { stage: 'growing', remainSeconds: Math.ceil((growMs - elapsed) / 1000) }
}
