// 宠物种类与成长配置（PRD §8、§13.6）
// 一期：仅初始领养雪球兔 1 只；犬 / 猫为"即将开放"占位（不可领养）。
// 宠物只有一个 Q 版形象、不换装；宠物装备系统彻底取消。

export type PetTypeId = 'rabbit' | 'dog' | 'cat'

/** 成长阶段：3 级、2 次形态变化；累计经验阈值 */
export interface PetStage {
  level: 1 | 2 | 3
  /** 达到该等级所需累计经验 */
  needExp: number
  /** 形态名 */
  form: string
}

export const PET_STAGES: PetStage[] = [
  { level: 1, needExp: 0, form: '幼崽' },
  { level: 2, needExp: 50, form: '小变化' },
  { level: 3, needExp: 1000, form: '成年' },
]

/** 由累计经验推导等级（阈值 0 / 50 / 1000） */
export function petLevelFromExp(totalExp: number): 1 | 2 | 3 {
  let level: 1 | 2 | 3 = 1
  for (const st of PET_STAGES) if (totalExp >= st.needExp) level = st.level
  return level
}

/** 宠物改名长度上限（PRD §8.5：最多 6 字、免费、一期不过滤敏感词） */
export const PET_RENAME_MAX = 6

/** 宠物种类台账：rabbit 一期可拥有；dog / cat 仅"即将开放" */
export const PET_SPECIES: Record<
  PetTypeId,
  { cnName: string; available: boolean; lockLabel: string }
> = {
  rabbit: { cnName: '雪球兔', available: true, lockLabel: '' },
  dog: { cnName: '布丁犬', available: false, lockLabel: '即将开放' },
  cat: { cnName: '电光猫', available: false, lockLabel: '即将开放' },
}
