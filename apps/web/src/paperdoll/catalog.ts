// ============================================================================
// paperdoll catalog —— 「穿戴选项 → 运行时图层」的唯一映射（app 侧业务层）
//
// v5 N+M 模型（2026-10-03）：每角色 1 张 body，每件 gear 1 个图层，组合在
// 浏览器里实时合成（挖洞 mask / 颈部 relit 由 @mathpaws/paperdoll 的 composeLook
// 完成）。不再存在 N×M 份 forhat 烘焙文件；新角色只需在此加 1 个 body。
//
//   z-order：body -> shoe -> gear
//   item gear（explorer/scientist）：body 先按 mask 挖洞再叠帽子；
//   head gear（frog/elf/wizard）：整头覆盖颈缝；wizard 按 body 颈色 relit。
//
// 资产来源：design/paperdoll-assets（step4 导出 v5）→ src/assets/paperdoll。
// 离线烘焙真值在 _truth/，只被 PaperDollCompositeDev 回归页引用，不进生产。
// ============================================================================
import type { DollGear, PaperDollLayers, SeamSpec } from '@mathpaws/paperdoll'


// --- 角色身体（每角色 1 层）-------------------------------------------------
import elfHatIcon from '../assets/paperdoll/icons/hat-elf-icon.webp'
import explorerHatIcon from '../assets/paperdoll/icons/hat-explorer-icon.webp'
import frogHatIcon from '../assets/paperdoll/icons/hat-frog-icon.webp'
import scientistHatIcon from '../assets/paperdoll/icons/hat-scientist-icon.webp'
import wizardHatIcon from '../assets/paperdoll/icons/hat-wizard-icon.webp'
import defaultOutfitIcon from '../assets/paperdoll/icons/outfit-default-icon.webp'
import elfOutfitIcon from '../assets/paperdoll/icons/outfit-elf-icon.webp'
import explorerOutfitIcon from '../assets/paperdoll/icons/outfit-explorer-icon.webp'
import scientistOutfitIcon from '../assets/paperdoll/icons/outfit-scientist-icon.webp'
import bodyDefault from '../assets/paperdoll/layers/bodies/body-default@2x.webp'
import bodyExplorer from '../assets/paperdoll/layers/bodies/body-explorer@2x.webp'
import bodyScientist from '../assets/paperdoll/layers/bodies/body-scientist@2x.webp'
import bodyFrog from '../assets/paperdoll/layers/bodies/body-frog@2x.webp'
import bodyElf from '../assets/paperdoll/layers/bodies/body-elf@2x.webp'
import bodyWizard from '../assets/paperdoll/layers/bodies/body-wizard@2x.webp'

// --- item gear：帽子/护目镜本体 + 挖洞 mask ---------------------------------
import hatExplorer from '../assets/paperdoll/layers/hats/hat-explorer@2x.webp'
import holeExplorer from '../assets/paperdoll/layers/masks/hole-explorer@2x.webp'
import hatScientist from '../assets/paperdoll/layers/hats/hat-scientist@2x.webp'
import holeScientist from '../assets/paperdoll/layers/masks/hole-scientist@2x.webp'

// --- head gear：整头层 -------------------------------------------------------
import headFrog from '../assets/paperdoll/layers/heads/head-frog@2x.webp'
import headElf from '../assets/paperdoll/layers/heads/head-elf@2x.webp'
import headWizard from '../assets/paperdoll/layers/heads/head-wizard@2x.webp'

// --- 鞋 ---------------------------------------------------------------------
import defaultShoe from '../assets/paperdoll/layers/shoes/shoe-default@2x.webp'

// --- 图标 -------------------------------------------------------------------
import frogOutfitIcon from '../assets/paperdoll/icons/outfit-frog-icon.webp'
import wizardOutfitIcon from '../assets/paperdoll/icons/outfit-wizard-icon.webp'
import defaultShoeIcon from '../assets/paperdoll/icons/shoe-default-icon.webp'
import type { CosmeticSlot } from '../config/cosmetics'

export type SlotId = 'outfit' | 'hat' | 'shoe'

/** wizard pair 头的颈部 relit 规格（与 manifest v5 gear.seam 一致） */
const WIZARD_SEAM: SeamSpec = {
  y0: 1003, cut: 1078, overlap: 12, sigma: 8,
  relitSrc: 0.28, relitNeck: 0.72, skinSampleRows: 80,
}
/** 非 pair 整头（frog/elf）：只需颈缝几何，不 relit（值见 step2 HEAD_CUTS） */
const FROG_SEAM: SeamSpec = { y0: 880, cut: 920, overlap: 12, sigma: 3, skinSampleRows: 80 }
const ELF_SEAM: SeamSpec = { y0: 945, cut: 985, overlap: 12, sigma: 3, skinSampleRows: 80 }

export interface OutfitOption {
  id: string
  label: string
  icon: string
  body: string
}

export interface GearOption {
  id: string
  label: string
  icon: string
  gear: DollGear
}

export const SLOT_LABEL: Record<SlotId, string> = {
  outfit: '套装',
  hat: '头饰',
  shoe: '鞋子',
}

export const OUTFIT_OPTIONS: OutfitOption[] = [
  { id: 'default', label: '默认套装', icon: defaultOutfitIcon, body: bodyDefault },
  { id: 'explorer', label: '探险家套装', icon: explorerOutfitIcon, body: bodyExplorer },
  { id: 'scientist', label: '小科学家套装', icon: scientistOutfitIcon, body: bodyScientist },
  { id: 'frog', label: '小青蛙套装', icon: frogOutfitIcon, body: bodyFrog },
  { id: 'elf', label: '小圣诞精灵套装', icon: elfOutfitIcon, body: bodyElf },
  { id: 'wizard', label: '小魔法师套装', icon: wizardOutfitIcon, body: bodyWizard },
]

export const HAT_OPTIONS: GearOption[] = [
  {
    id: 'explorer', label: '探险家遮阳帽', icon: explorerHatIcon,
    gear: { kind: 'item', layer: hatExplorer, mask: holeExplorer },
  },
  {
    id: 'scientist', label: '小科学家护目镜', icon: scientistHatIcon,
    gear: { kind: 'item', layer: hatScientist, mask: holeScientist },
  },
  { id: 'frog', label: '小青蛙蛙眼帽', icon: frogHatIcon, gear: { kind: 'head', layer: headFrog, seam: FROG_SEAM } },
  { id: 'elf', label: '小圣诞精灵帽', icon: elfHatIcon, gear: { kind: 'head', layer: headElf, seam: ELF_SEAM } },
  {
    id: 'wizard', label: '小魔法师巫师帽', icon: wizardHatIcon,
    gear: { kind: 'head', layer: headWizard, seam: WIZARD_SEAM },
  },
]

export const SHOE_OPTIONS: { id: string; label: string; icon?: string; layer?: string }[] = [
  { id: 'none', label: '光脚' },
  { id: 'default', label: '暖白软底鞋', layer: defaultShoe, icon: defaultShoeIcon },
]

/** 当前穿戴选择：套装 id + 头饰 id（'none' 不戴）+ 鞋 id（'none' 光脚） */
export interface OutfitSelection {
  outfit: string
  hat: string
  shoe: string
}

/** 默认主角形象：默认套装、光脚、不戴帽 */
export const DEFAULT_SELECTION: OutfitSelection = {
  outfit: 'default',
  hat: 'none',
  shoe: 'none',
}

function outfitOf(id: string): OutfitOption {
  return OUTFIT_OPTIONS.find(o => o.id === id) ?? OUTFIT_OPTIONS[0]
}

function gearOf(id: string): GearOption | undefined {
  return HAT_OPTIONS.find(g => g.id === id)
}

/** 把穿戴选择解析成 PaperDoll 运行时图层（N+M：1 body + 至多 1 gear）。 */
export function buildLayers(sel: OutfitSelection): PaperDollLayers {
  return {
    body: outfitOf(sel.outfit).body,
    shoe: sel.shoe === 'none' ? undefined : SHOE_OPTIONS.find(s => s.id === sel.shoe)?.layer,
    gear: sel.hat === 'none' ? undefined : gearOf(sel.hat)?.gear,
  }
}

/**
 * equipped store（gacha id）→ catalog OutfitSelection（短 id）。
 * P4 首页立绘与 P16 背包共用同一桥接：缺失 / 未知名一律回退默认，
 * 保证存档异常时立绘始终可合成。
 */
export function equippedToSelection(
  equipped: Partial<Record<CosmeticSlot, string>>,
): OutfitSelection {
  const resolve = (slot: SlotId, fallback: string): string => {
    const gid = equipped[slot]
    if (!gid) return fallback
    const short = gid.endsWith(`-${slot}`) ? gid.slice(0, -slot.length - 1) : gid
    const pool = slot === 'outfit' ? OUTFIT_OPTIONS : slot === 'hat' ? HAT_OPTIONS : SHOE_OPTIONS
    return pool.some(o => o.id === short) ? short : fallback
  }
  return {
    outfit: resolve('outfit', DEFAULT_SELECTION.outfit),
    hat: resolve('hat', DEFAULT_SELECTION.hat),
    shoe: resolve('shoe', DEFAULT_SELECTION.shoe),
  }
}

export function optionLabel(slot: SlotId, id: string): string {
  if (slot === 'outfit') return outfitOf(id).label
  if (slot === 'hat') return HAT_OPTIONS.find(g => g.id === id)?.label ?? id
  return SHOE_OPTIONS.find(s => s.id === id)?.label ?? id
}

/** 随机混搭（LookDev 回归用，覆盖全部组合空间） */
export function randomSelection(): OutfitSelection {
  const pickId = <T extends { id: string }>(arr: T[]): string =>
    arr[Math.floor(Math.random() * arr.length)].id
  return {
    outfit: pickId(OUTFIT_OPTIONS),
    hat: pickId(HAT_OPTIONS),
    shoe: pickId(SHOE_OPTIONS),
  }
}
