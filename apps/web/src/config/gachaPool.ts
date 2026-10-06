// 学盒抽卡配置（PRD §9、§13.7）
// 抽取对象 = 中性人物装扮；花贝壳。新模型：整身 OUTFIT 成套抽取，HAT 独立
// 可抽且可跨套搭配；SHOE 为基础款、一期固定不进池。
// 规则：单抽 50 / 十连 450；普通 75% / 稀有 20% / 传说 5%；
//       保底 10 抽稀有+、100 抽传说（计数持久化、出货重置）；
//       每次必出一件装扮（无空奖）；重复仅提示"已有 XX"、不返贝壳。
//
// 【批次4 现状】池内 10 件：探险家 / 小科学家 / 小青蛙 / 小圣诞精灵 /
// 小魔法师，各 1 套装 + 1 帽；原 acc 道具随槽位移除、top/bottom 已并入整身。
// rarity：青蛙、精灵普通；探险家、科学家稀有；魔法师传说。

import elfHatIcon from '../assets/paperdoll/icons/hat-elf-icon.webp'
import explorerHatIcon from '../assets/paperdoll/icons/hat-explorer-icon.webp'
import frogHatIcon from '../assets/paperdoll/icons/hat-frog-icon.webp'
import scientistHatIcon from '../assets/paperdoll/icons/hat-scientist-icon.webp'
import wizardHatIcon from '../assets/paperdoll/icons/hat-wizard-icon.webp'
import elfOutfitIcon from '../assets/paperdoll/icons/outfit-elf-icon.webp'
import explorerOutfitIcon from '../assets/paperdoll/icons/outfit-explorer-icon.webp'
import frogOutfitIcon from '../assets/paperdoll/icons/outfit-frog-icon.webp'
import scientistOutfitIcon from '../assets/paperdoll/icons/outfit-scientist-icon.webp'
import wizardOutfitIcon from '../assets/paperdoll/icons/outfit-wizard-icon.webp'

import {
  RARITY_RATE,
  type Rarity,
  type CosmeticSlot,
} from './cosmetics'

export type { Rarity }

export interface GachaItem {
  id: string
  name: string
  icon: string
  rarity: Rarity
  slot: CosmeticSlot
}

/** 抽卡价格（贝壳） */
export const SINGLE_COST = 50
export const TEN_COST = 450

/** 保底抽数 */
export const RARE_PITY = 10
export const LEGEND_PITY = 100

/**
 * 重复不返还（PRD §9.3 修正旧规则）：
 * 抽到已有物品仅提示"已有 XX"，贝壳不回流。
 * 不再导出 DUP_REFUND。
 */

/**
 * 当前卡池（批次4，10 件）：整身成套抽取，帽独立可抽且可跨套搭配。
 * 普通：青蛙、精灵；稀有：探险家、科学家；传说：魔法师（套装与帽同品质）。
 */
export const GACHA_POOL: GachaItem[] = [
  { id: 'explorer-outfit', name: '探险家套装', icon: explorerOutfitIcon, rarity: 'rare', slot: 'outfit' },
  { id: 'explorer-hat', name: '探险家遮阳帽', icon: explorerHatIcon, rarity: 'rare', slot: 'hat' },
  { id: 'scientist-outfit', name: '小科学家套装', icon: scientistOutfitIcon, rarity: 'rare', slot: 'outfit' },
  { id: 'scientist-hat', name: '小科学家护目镜', icon: scientistHatIcon, rarity: 'rare', slot: 'hat' },
  { id: 'frog-outfit', name: '小青蛙套装', icon: frogOutfitIcon, rarity: 'normal', slot: 'outfit' },
  { id: 'frog-hat', name: '小青蛙蛙眼帽', icon: frogHatIcon, rarity: 'normal', slot: 'hat' },
  { id: 'elf-outfit', name: '小圣诞精灵套装', icon: elfOutfitIcon, rarity: 'normal', slot: 'outfit' },
  { id: 'elf-hat', name: '小圣诞精灵帽', icon: elfHatIcon, rarity: 'normal', slot: 'hat' },
  { id: 'wizard-outfit', name: '小魔法师套装', icon: wizardOutfitIcon, rarity: 'legendary', slot: 'outfit' },
  { id: 'wizard-hat', name: '小魔法师巫师帽', icon: wizardHatIcon, rarity: 'legendary', slot: 'hat' },
]

export const GACHA_ITEM_MAP: Record<string, GachaItem> = Object.fromEntries(
  GACHA_POOL.map(i => [i.id, i]),
)

export function itemsByRarity(r: Rarity): GachaItem[] {
  return GACHA_POOL.filter(i => i.rarity === r)
}

/**
 * 决定单次抽卡品质（含保底）；rng 可注入便于测试。
 * pityRare / pityLegend = 自上次出货以来已抽数（本次为第 N+1 抽）。
 */
export function rollRarity(
  pityRare: number,
  pityLegend: number,
  rng: () => number = Math.random,
): Rarity {
  if (pityLegend + 1 >= LEGEND_PITY) return 'legendary'
  if (pityRare + 1 >= RARE_PITY) {
    // 必稀有及以上：在稀有与传说间按相对概率分配
    const pLegend = RARITY_RATE.legendary / (RARITY_RATE.rare + RARITY_RATE.legendary)
    return rng() < pLegend ? 'legendary' : 'rare'
  }
  const r = rng()
  if (r < RARITY_RATE.legendary) return 'legendary'
  if (r < RARITY_RATE.legendary + RARITY_RATE.rare) return 'rare'
  return 'normal'
}

/** 从指定品质中均匀随机一件。 */
export function rollItem(rarity: Rarity, rng: () => number = Math.random): GachaItem {
  const pool = itemsByRarity(rarity)
  return pool[Math.floor(rng() * pool.length)]
}
