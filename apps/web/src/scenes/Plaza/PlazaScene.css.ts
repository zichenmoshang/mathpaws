// PlazaScene 样式（P19 2D 广场，1024×768 逻辑舞台；vanilla-extract）
// 原稿 2338×1536，逻辑坐标 = (x−145)×0.5, y×0.5（中央 2048×1536 为 4:3 安全框
// x∈[145,2193]）；各类注释保留原稿 bbox 便于对账（台账：assets/hifi/plaza/manifest.json）。
import { FONT } from '@mathpaws/ui'
import { style } from '@vanilla-extract/css'

/* 场景根：全视口容器，承载 SceneShell（出血背景 + LogicalStage） */
export const scene = style({
  position: 'absolute',
  inset: 0,
  overflow: 'hidden',
  fontFamily: '"Baloo 2", "Comic Sans MS", "Microsoft YaHei", system-ui, sans-serif',
})

/* 1024×768 逻辑舞台根（LogicalStage 负责居中与等比缩放） */
export const stage = style({
  position: 'relative',
  width: '1024px',
  height: '768px',
})

/* 语义展示层公共定位 */
export const layer = style({
  position: 'absolute',
})

/* z1 种植菜田（原 bbox [778,654,1245,806]） */
export const lyrGarden = style({
  left: '316.5px',
  top: '327px',
  width: '233.5px',
  height: '76px',
})

/* z2 答题小屋（原 bbox [145,204,826,1039]，x0 由 129 裁至安全框边界） */
export const lyrQuiz = style({
  left: '0px',
  top: '102px',
  width: '340.5px',
  height: '417.5px',
})

/* z3 农场小屋（原 bbox [858,194,1401,754]） */
export const lyrFarm = style({
  left: '356.5px',
  top: '97px',
  width: '271.5px',
  height: '280px',
})

/* z4 宠物商店小屋（原 bbox [1512,305,2179,1010]） */
export const lyrPetshop = style({
  left: '683.5px',
  top: '152.5px',
  width: '333.5px',
  height: '352.5px',
})

/* z5 答题小屋外围栏（原 bbox [145,824,686,1195]，x0 由 36 裁至安全框边界） */
export const lyrFenceQuiz = style({
  left: '0px',
  top: '412px',
  width: '270.5px',
  height: '185.5px',
})

/* z6 农场稻草人（原 bbox [1038,653,1148,800]） */
export const lyrScarecrow = style({
  left: '446.5px',
  top: '326.5px',
  width: '55px',
  height: '73.5px',
})

/* z7 答题小屋旁路灯（原 bbox [793,720,861,939]） */
export const lyrLampQuiz = style({
  left: '324px',
  top: '360px',
  width: '34px',
  height: '109.5px',
})

/* z8 宠物商店外围栏（原 bbox [1660,850,2193,1188]，x1 由 2301 裁至安全框边界） */
export const lyrFencePetshop = style({
  left: '757.5px',
  top: '425px',
  width: '266.5px',
  height: '169px',
})

/* z9 宠物商店左侧路灯（原 bbox [1476,691,1539,947]） */
export const lyrLampPetshopLeft = style({
  left: '665.5px',
  top: '345.5px',
  width: '31.5px',
  height: '128px',
})

/* z10 宠物商店右侧路灯（原 bbox [2118,786,2178,1005]） */
export const lyrLampPetshopRight = style({
  left: '986.5px',
  top: '393px',
  width: '30px',
  height: '109.5px',
})

/* z11 底部小花坛：2026-10-12 走查修复——撤销独立层，回归 z0 背景（母图原样恢复） */

/* z12 农场圆钮+标签牌（原 bbox [1508,1286,1721,1502]；三钮整体左移 23px 逻辑） */
export const lyrBtnFarm = style({
  left: '658.5px',
  top: '643px',
  width: '106.5px',
  height: '108px',
})

/* z13 宠物圆钮+标签牌（原 bbox [1767,1285,1979,1501]；左移 23px） */
export const lyrBtnPet = style({
  left: '788px',
  top: '642.5px',
  width: '106px',
  height: '108px',
})

/* z14 背包圆钮+标签牌（原 bbox [2025,1286,2235,1501]；左移 23px 后右缘 1022 入框） */
export const lyrBtnBackpack = style({
  left: '917px',
  top: '643px',
  width: '105px',
  height: '107.5px',
})

/* 顶栏右侧：学盒入口 */
/* 学盒入口（chrome 右槽内、资源条左侧，2026-10-11 由居中槽改置；
   2026-10-12 走查"右上图标过小"：58→72） */
export const gachaEntry = style({
  width: 'calc(72px * var(--stage-scale, 1))',
  height: 'calc(72px * var(--stage-scale, 1))',
  border: 'none',
  background: 'transparent',
  padding: 0,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
  filter: 'drop-shadow(0 4px 6px rgba(30, 90, 160, .35))',
})

export const gachaIcon = style({
  width: '100%',
  height: '100%',
  objectFit: 'contain',
})

/* 右上资源条（chrome 右槽内；去舞台定位） */
export const resourcePlate = style({
  display: 'flex',
  alignItems: 'center',
  gap: '16px',
})

/* 资源胶囊（2026-10-12 走查"右上图标过小"：高 40→48、icon 26→30、字号 h2→title） */
export const pill = style({
  display: 'inline-flex',
  alignItems: 'center',
  gap: '8px',
  height: 'calc(48px * var(--stage-scale, 1))',
  padding: '0 20px',
  borderRadius: '999px',
  background: 'rgba(255, 255, 255, .96)',
  border: '3px solid rgba(255, 255, 255, .85)',
  boxShadow: '0 4px 10px rgba(40, 110, 180, .25)',
  fontWeight: 900,
  fontSize: FONT.title,
  color: '#3f4d5c',
})

export const pillIcon = style({
  width: 'calc(30px * var(--stage-scale, 1))',
  height: 'calc(30px * var(--stage-scale, 1))',
  objectFit: 'contain',
})

/* 透明交互热点公共样式 */
export const hotspot = style({
  position: 'absolute',
  border: 'none',
  background: 'transparent',
  padding: 0,
  cursor: 'pointer',
})

/* 答题小屋热点（同 z2 bbox [145,204,826,1039]） */
export const hotQuiz = style({
  left: '0px',
  top: '102px',
  width: '340.5px',
  height: '417.5px',
})

/* 农场建筑热点（同 z3 bbox [858,194,1401,754]） */
export const hotFarm = style({
  left: '356.5px',
  top: '97px',
  width: '271.5px',
  height: '280px',
})

/* 宠物商店热点（同 z4 bbox [1512,305,2179,1010]） */
export const hotPetshop = style({
  left: '683.5px',
  top: '152.5px',
  width: '333.5px',
  height: '352.5px',
})

/* 农场入口圆钮热点（同 z12，含标签牌） */
export const hotBtnFarm = style({
  left: '658.5px',
  top: '643px',
  width: '106.5px',
  height: '108px',
})

/* 宠物入口圆钮热点（同 z13，含标签牌） */
export const hotBtnPet = style({
  left: '788px',
  top: '642.5px',
  width: '106px',
  height: '108px',
})

/* 背包入口圆钮热点（同 z14，含标签牌） */
export const hotBtnBackpack = style({
  left: '917px',
  top: '643px',
  width: '105px',
  height: '107.5px',
})
