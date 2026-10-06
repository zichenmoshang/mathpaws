// 宠物三阶段立绘（M1-AST-01）：雪球兔 s1 幼崽 / s2 少年 / s3 成年（core 同锚点衍生）。
// 等级（petLevelFromExp）1/2/3 → 对应阶段切图。
import s1 from '../assets/img/pets/pet-rabbit-s1.webp'
import s2 from '../assets/img/pets/pet-rabbit-s2.webp'
import s3 from '../assets/img/pets/pet-rabbit-s3.png'

export const RABBIT_STAGE_IMG: Record<1 | 2 | 3, string> = { 1: s1, 2: s2, 3: s3 }
