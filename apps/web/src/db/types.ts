// IndexedDB 分表行类型（M0-DATA-03）
// 10 张表：profile / economy / pets / cosmetics / farm /
//          mastery / wrongbook / strokes / streak / settings
// 说明：quiz（单轮答题）为纯内存状态，不落表。

import type { CosmeticSlot } from '../config/cosmetics'
import type { CropId, PlotState } from '../config/farm'
import type { PetTypeId } from '../config/pets'
import type { MasteryNodeState } from '../content/mastery'

/** profile：设备游客身份与主角 / 引导状态 */
export interface ProfileRecord {
  /** 设备游客 UUID */
  deviceUuid: string
  /** 主角名（默认"小朋友"，≤6 字） */
  heroName: string
  /** 启动动线（P1–P3）是否完成：首次进入走 Splash→亮相→领养，完成后直达首页 */
  onboardingDone: boolean
  /** 新手引导 B 是否完成（不重播） */
  guideDone: boolean
  /** 开学小测是否完成 / 已跳过 */
  placementDone: boolean
}

/** economy：三种货币 + 每日轮次 / 浮题计数 */
export interface EconomyRecord {
  shells: number
  flowerCoins: number
  petFood: number
  /** 当前已全额发奖轮次所属日期（本地自然日 key） */
  dateKey: string
  /** 当日已全额发奖轮次（上限 DAILY_PAID_ROUNDS） */
  paidRounds: number
  /** 浮题计数所属日期 */
  floatDate: string
  /** 当日浮题已作答次数（上限 FLOAT.dailyLimit） */
  floatCount: number
}

/** pets：一期仅 1 只跟随宠物 */
export interface PetsRecord {
  hasPet: boolean
  petType: PetTypeId
  petName: string
  /** 累计总经验（等级由阈值推导） */
  petExp: number
}

/** cosmetics：人物装扮拥有 / 穿戴与抽卡保底 */
export interface CosmeticsRecord {
  /** 已拥有装扮 id（GACHA_ITEM_MAP 中的 id） */
  owned: string[]
  /** 当前穿戴：4 槽 → item id */
  equipped: Partial<Record<CosmeticSlot, string>>
  /** 稀有保底计数（距上次稀有+已抽数） */
  pityRare: number
  /** 传说保底计数（距上次传说已抽数） */
  pityLegend: number
}

/** farm：农场等级 / 地块 / 种子 + 果实库存 */
export interface FarmRecord {
  farmExp: number
  plots: PlotState[]
  /** 种子库存（按份） */
  seedInventory: Partial<Record<CropId, number>>
  /** 果实库存（按个） */
  cropInventory: Partial<Record<CropId, number>>
}

/** mastery：知识点三态与掌握计数（骨架，随知识点路径填充） */
export interface MasteryRecord {
  nodes: Array<{
    id: string
    state: MasteryNodeState
    /** 累计答对 */
    count: number
    /** 连续答对（答错清零） */
    consecutive: number
  }>
}

/** wrongbook：错题（"知识点 + 题型"去重） */
export interface WrongItem {
  /** 去重键：知识点 id + 题型 */
  key: string
  knowledgeId: string
  /** 题型：oral / real */
  kind: 'oral' | 'real'
  /** 最近一次题干 */
  prompt: string
  /** 孩子的错误答案 */
  wrongAnswer: string
  /** 最终正确答案（默认隐藏、手动揭示） */
  answer: string
  /** 分步思路 */
  steps: string[]
  /** 累计错误次数 */
  errorCount: number
  /** 最终答案是否已被手动揭示 */
  revealed: boolean
}

export interface WrongbookRecord {
  items: WrongItem[]
}

/** strokes：手写样本（每条独立 key，append-only） */
export interface StrokeSample {
  /** uuid */
  id: string
  /** 笔迹栅格（dataURL，缩小尺寸） */
  image: string
  recognized: string
  answer: string
  correct: boolean
  /** 识别 ≠ 正确答案时待人工复核 */
  pendingReview: boolean
  createdAt: number
}

/** streak：连学 / 累计 / 宝箱领取 */
export interface StreakRecord {
  /** 最后学习日（本地自然日 key） */
  lastStudyDate: string
  /** 连续学习天数（中断重置） */
  streak: number
  /** 累计学习天数（不清零） */
  totalDays: number
  /** 宝箱最后领取日期 */
  chestLastOpened: string
}

/** settings：音频开关（一期仅这两项持久化） */
export interface SettingsRecord {
  bgm: boolean
  sfx: boolean
}

/** 单主键表统一使用的行键 */
export const MAIN_KEY = 'main'
