// 人物装扮（cosmetics）定义：槽位 / 品质 / 系列 / 默认服（PRD §9）
// 中性、无性别：配置层无 gender 字段；发型固定、不参与抽取；
// 主题限定 职业 / 动物 / 幻想 / 节日，禁强性别符号。
// 换装模型：整身 OUTFIT 为一整套，仅 HAT / SHOE 弱耦合可换。

export type CosmeticSlot = 'outfit' | 'hat' | 'shoe'
export type Rarity = 'normal' | 'rare' | 'legendary'
export type CosmeticSeries = 'job' | 'animal' | 'fantasy' | 'festival'

/** 三个可换槽（与纸娃娃槽位一致） */
export const COSMETIC_SLOTS: CosmeticSlot[] = ['outfit', 'hat', 'shoe']

export const COSMETIC_SLOT_LABEL: Record<CosmeticSlot, string> = {
  outfit: '套装',
  hat: '头饰',
  shoe: '鞋子',
}

/** 系列（一期目标 2–3 个） */
export const COSMETIC_SERIES_LABEL: Record<CosmeticSeries, string> = {
  job: '职业',
  animal: '动物',
  fantasy: '幻想',
  festival: '节日',
}

/** 品质概率（PRD §9.3、§13.7） */
export const RARITY_RATE: Record<Rarity, number> = {
  normal: 0.75,
  rare: 0.2,
  legendary: 0.05,
}

/**
 * 基线装扮：默认套装 / 默认鞋不进抽卡池、owned 初始为空，
 * 但冷启动形象需要它们始终可穿戴（PRD §9）。id 与抽卡 id 同构（带槽后缀）。
 */
export const BASELINE_COSMETICS: ReadonlyArray<{ id: string; slot: CosmeticSlot }> = [
  { id: 'default-outfit', slot: 'outfit' },
  { id: 'default-shoe', slot: 'shoe' },
]
const BASELINE_IDS = new Set(BASELINE_COSMETICS.map(i => i.id))

export function isBaselineCosmetic(id: string): boolean {
  return BASELINE_IDS.has(id)
}

/** 品质视觉：普通蓝 / 稀有紫 / 传说金（仅 UI 边框与光效，不画进服装贴图） */
export const RARITY_META: Record<
  Rarity,
  { label: string; color: string; bg: string; border: string }
> = {
  normal: { label: '普通', color: '#1565c0', bg: '#e3f2fd', border: '#90caf9' },
  rare: { label: '稀有', color: '#7b1fa2', bg: '#f3e5f5', border: '#ce93d8' },
  legendary: { label: '传说', color: '#f57f17', bg: '#fff8e1', border: '#ffd54f' },
}
