// PlazaScene 样式（P5 2D 广场，1024×768 逻辑舞台；vanilla-extract）
// 全部几何值为原稿 2364×1773 × K(1024/2364) 折算后的逻辑像素，与迁移前 CSS Modules 数值一致；
// 各类注释保留原稿 bbox 便于对账（台账：assets/hifi/plaza/manifest.json）。
import { style } from '@vanilla-extract/css'

/* 场景根：全视口容器，承载出血背景与 LogicalStage */
export const scene = style({
  position: 'absolute',
  inset: 0,
  overflow: 'hidden',
  fontFamily: '"Baloo 2", "Comic Sans MS", "Microsoft YaHei", system-ui, sans-serif',
})

/* 舞台外出血背景：同一张背景图 cover 填满整个视口 */
export const bleedImg = style({
  position: 'absolute',
  inset: 0,
  width: '100%',
  height: '100%',
  objectFit: 'cover',
})

/* 1024×768 逻辑舞台根（LogicalStage 负责居中与等比缩放） */
export const stage = style({
  position: 'relative',
  width: '1024px',
  height: '768px',
})

/* z0 舞台内重绘背景：铺满舞台，随舞台等比缩放不变形 */
export const stageBg = style({
  position: 'absolute',
  inset: 0,
  width: '100%',
  height: '100%',
})

/* 语义展示层公共定位 */
export const layer = style({
  position: 'absolute',
})

/* z1 农场建筑（原 bbox [863,221,1419,866]） */
export const lyrFarm = style({
  left: '373.8206px',
  top: '95.7293px',
  width: '240.8393px',
  height: '279.3909px',
})

/* z2 答题小屋（原 bbox [30,232,977,1233]） */
export const lyrQuiz = style({
  left: '12.9949px',
  top: '100.4941px',
  width: '410.2064px',
  height: '433.5973px',
})

/* z3 稻草人（原 bbox [1047,748,1160,920]） */
export const lyrScarecrow = style({
  left: '453.5228px',
  top: '324.0068px',
  width: '48.9475px',
  height: '74.5042px',
})

/* z4 答题招牌（原 bbox [475,652,719,800]） */
export const lyrSignQuiz = style({
  left: '205.753px',
  top: '282.423px',
  width: '105.692px',
  height: '64.1083px',
})

/* z5 农场招牌（原 bbox [1182,442,1339,546]） */
export const lyrSignFarm = style({
  left: '512px',
  top: '191.4585px',
  width: '68.0068px',
  height: '45.0491px',
})

/* z6 宠物商店（原 bbox [1533,360,2213,1163]） */
export const lyrPetshop = style({
  left: '664.0406px',
  top: '155.9391px',
  width: '294.5516px',
  height: '347.8308px',
})

/* z7 宠物店招牌（原 bbox [1686,533,1847,705]） */
export const lyrSignPetshop = style({
  left: '730.3147px',
  top: '230.8765px',
  width: '69.7394px',
  height: '74.5042px',
})

/* z8 屋顶小鸟（原 bbox [1735,350,1847,462]） */
export const lyrRoofBird = style({
  left: '751.5398px',
  top: '151.6074px',
  width: '48.5144px',
  height: '48.5144px',
})

/* z9 橱窗宠物（原 bbox [1864,849,2046,1055]） */
export const lyrPetshopPets = style({
  left: '807.4179px',
  top: '367.7563px',
  width: '78.8359px',
  height: '89.2318px',
})

/* z11 农场圆钮（原 bbox [1527,1485,1745,1706]） */
export const lyrBtnFarm = style({
  left: '661.4416px',
  top: '643.2487px',
  width: '94.4298px',
  height: '95.7293px',
})

/* z12 宠物圆钮（原 bbox [1792,1485,2007,1706]） */
export const lyrBtnPet = style({
  left: '776.2301px',
  top: '643.2487px',
  width: '93.1303px',
  height: '95.7293px',
})

/* z13 背包圆钮（原 bbox [2053,1487,2270,1707]） */
export const lyrBtnBackpack = style({
  left: '889.286px',
  top: '644.1151px',
  width: '93.9966px',
  height: '95.2961px',
})

/* 顶部中央：学盒入口 */
export const gachaEntry = style({
  position: 'absolute',
  left: '483px',
  top: '6px',
  width: '58px',
  height: '58px',
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

/* 右上资源条 */
export const resourcePlate = style({
  position: 'absolute',
  right: '14px',
  top: '10px',
  display: 'flex',
  alignItems: 'center',
  gap: '10px',
})

export const pill = style({
  display: 'inline-flex',
  alignItems: 'center',
  gap: '7px',
  height: '40px',
  padding: '0 16px',
  borderRadius: '999px',
  background: 'rgba(255, 255, 255, .96)',
  border: '3px solid rgba(255, 255, 255, .85)',
  boxShadow: '0 4px 10px rgba(40, 110, 180, .25)',
  fontWeight: 900,
  fontSize: '23px',
  color: '#3f4d5c',
})

export const pillIcon = style({
  width: '26px',
  height: '26px',
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

/* 答题小屋热点（原 bbox [30,232,977,1233]） */
export const hotQuiz = style({
  left: '12.9949px',
  top: '100.4941px',
  width: '410.2064px',
  height: '433.5973px',
})

/* 农场建筑热点（原 bbox [863,221,1419,900]） */
export const hotFarm = style({
  left: '373.8206px',
  top: '95.7293px',
  width: '240.8393px',
  height: '294.1184px',
})

/* 宠物商店热点（原 bbox [1533,360,2213,1163]） */
export const hotPetshop = style({
  left: '664.0406px',
  top: '155.9391px',
  width: '294.5516px',
  height: '347.8308px',
})

/* 农场入口圆钮热点（原 bbox [1527,1485,1745,1706]） */
export const hotBtnFarm = style({
  left: '661.4416px',
  top: '643.2487px',
  width: '94.4298px',
  height: '95.7293px',
})

/* 宠物入口圆钮热点（原 bbox [1792,1485,2007,1706]） */
export const hotBtnPet = style({
  left: '776.2301px',
  top: '643.2487px',
  width: '93.1303px',
  height: '95.7293px',
})

/* 背包入口圆钮热点（原 bbox [2053,1487,2270,1707]） */
export const hotBtnBackpack = style({
  left: '889.286px',
  top: '644.1151px',
  width: '93.9966px',
  height: '95.2961px',
})
