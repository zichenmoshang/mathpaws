// 2D 广场场景 P5（M5-P5-01）：走标准 layer_decomposition 流程重建。
// z0 重绘背景 + 13 个透明语义层按 bbox 回贴；人物不可移动，
// 点击建筑/圆钮进入下游，未开放功能弹统一"即将开放"提示。
// 场景运行在 1024×768 LogicalStage 内（原稿 2364×1773，坐标×K 即逻辑像素）。
// 注：固定宠物位 + PetBubble（M5-P5-02）已移出，转二期。
import { FONT } from '@mathpaws/ui'
import { BackButton } from '@mathpaws/ui'
import type { CSSProperties } from 'react'

import type { RouteId } from '../app/router'
// 资产与 bbox 台账：assets/hifi/plaza/manifest.json
import bg from '../assets/hifi/plaza/bg.jpg'
import bldFarm from '../assets/hifi/plaza/bld-farm.webp'
import bldPetshop from '../assets/hifi/plaza/bld-petshop.webp'
import bldQuiz from '../assets/hifi/plaza/bld-quiz.webp'
import btnBackpack from '../assets/hifi/plaza/btn-backpack.webp'
import btnFarm from '../assets/hifi/plaza/btn-farm.webp'
import btnPet from '../assets/hifi/plaza/btn-pet.webp'
import scarecrow from '../assets/hifi/plaza/farm-scarecrow.webp'
import petshopPets from '../assets/hifi/plaza/petshop-pets.webp'
import roofBird from '../assets/hifi/plaza/roof-bird.webp'
import signFarm from '../assets/hifi/plaza/sign-farm.webp'
import signQuiz from '../assets/hifi/plaza/sign-quiz.webp'
import signPetshop from '../assets/hifi/plaza/sign-petshop.webp'
import flowerIcon from '../assets/img/icons/i-flower@2x.webp'
import shellIcon from '../assets/img/icons/i-shell@2x.webp'
import iconGacha from '../assets/img/icons/icon-gacha@2x.webp'
import { comingSoon } from '../components/ComingSoonToast'
import { useEconomyStore } from '../stores/useEconomyStore'
import { audio } from '../utils/audio'

const K = 1024 / 2364

interface LayerDef { z: number; src: string; bbox: [number, number, number, number] }

// 纯展示层（按 z 序回贴）
const LAYERS: LayerDef[] = [
  { z: 1, src: bldFarm, bbox: [863, 221, 1419, 866] },
  { z: 2, src: bldQuiz, bbox: [30, 232, 977, 1233] },
  { z: 3, src: scarecrow, bbox: [1047, 748, 1160, 920] },
  { z: 4, src: signQuiz, bbox: [475, 652, 719, 800] },
  { z: 5, src: signFarm, bbox: [1182, 442, 1339, 546] },
  { z: 6, src: bldPetshop, bbox: [1533, 360, 2213, 1163] },
  { z: 7, src: signPetshop, bbox: [1686, 533, 1847, 705] },
  { z: 8, src: roofBird, bbox: [1735, 350, 1847, 462] },
  { z: 9, src: petshopPets, bbox: [1864, 849, 2046, 1055] },
  { z: 11, src: btnFarm, bbox: [1527, 1485, 1745, 1706] },
  { z: 12, src: btnPet, bbox: [1792, 1485, 2007, 1706] },
  { z: 13, src: btnBackpack, bbox: [2053, 1487, 2270, 1707] },
]

/** 原稿 bbox → 逻辑像素定位 */
const place = (bbox: [number, number, number, number]): CSSProperties => {
  const [x0, y0, x1, y1] = bbox
  return {
    position: 'absolute',
    left: x0 * K, top: y0 * K,
    width: (x1 - x0) * K, height: (y1 - y0) * K,
  }
}

export function PlazaScene(
  { onNavigate }: { onNavigate: (id: RouteId) => void },
) {
  const shells = useEconomyStore(s => s.shells)
  const flowerCoins = useEconomyStore(s => s.flowerCoins)

  const go = (id: RouteId) => { audio.playSfx('click'); onNavigate(id) }

  return (
    <div style={sceneStyle}>
      {/* z0 重绘背景 */}
      <img src={bg} alt="" draggable={false} style={bgStyle} />

      {/* 语义展示层 */}
      {LAYERS.map(l => (
        <img key={l.z} src={l.src} alt="" draggable={false} style={place(l.bbox)} />
      ))}

      {/* 左上：返回首页（新稿顶部干净，无重叠） */}
      <BackButton size={58} onClick={() => go('home')} style={backStyle} />

      {/* 顶部中央：学盒入口（仅图标，不带文字） */}
      <button
        type="button" aria-label="学盒"
        className="mp-btn"
        onClick={() => go('gacha')}
        style={gachaEntryStyle}
      >
        <img src={iconGacha} alt="" draggable={false} style={gachaIconStyle} />
      </button>

      {/* 右上：真实资源条（贝壳/花朵币，无体力） */}
      <div style={resourcePlateStyle}>
        <Pill icon={shellIcon} value={shells} />
        <Pill icon={flowerIcon} value={flowerCoins} />
      </div>

      {/* 交互热点（透明覆盖在展示层之上） */}
      {/* 答题小屋 → quiz */}
      <button type="button" aria-label="答题小屋" className="mp-btn"
        style={hotspot([30, 232, 977, 1233])} onClick={() => go('quiz')} />
      {/* 农场建筑 → P8 农场 */}
      <button type="button" aria-label="农场" className="mp-btn"
        style={hotspot([863, 221, 1419, 900])} onClick={() => go('farm')} />
      {/* 宠物商店 → 待开放 */}
      <button type="button" aria-label="宠物商店" className="mp-btn"
        style={hotspot([1533, 360, 2213, 1163])} onClick={comingSoon} />
      {/* 右下三圆钮 */}
      <button type="button" aria-label="农场入口" className="mp-btn"
        style={hotspot([1527, 1485, 1745, 1706])} onClick={() => go('farm')} />
      <button type="button" aria-label="宠物入口" className="mp-btn"
        style={hotspot([1792, 1485, 2007, 1706])} onClick={() => go('pet-panel')} />
      <button type="button" aria-label="背包入口" className="mp-btn"
        style={hotspot([2053, 1487, 2270, 1707])} onClick={() => go('backpack')} />
    </div>
  )
}

function Pill({ icon, value }: { icon: string; value: number }) {
  return (
    <div style={pillStyle}>
      <img src={icon} alt="" draggable={false} style={pillIconStyle} />
      <span>{value}</span>
    </div>
  )
}

/* ---------------- 样式（逻辑像素） ---------------- */

const sceneStyle: CSSProperties = {
  position: 'absolute', inset: 0, overflow: 'hidden',
  fontFamily: FONT.family,
}

const bgStyle: CSSProperties = {
  position: 'absolute', inset: 0,
  width: '100%', height: '100%', objectFit: 'fill',
}

const backStyle: CSSProperties = {
  position: 'absolute', left: 16, top: 14,
}

const gachaEntryStyle: CSSProperties = {
  position: 'absolute', left: 483, top: 6,
  width: 58, height: 58,
  border: 'none', background: 'transparent', padding: 0,
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  cursor: 'pointer',
  filter: 'drop-shadow(0 4px 6px rgba(30,90,160,.35))',
}

const gachaIconStyle: CSSProperties = {
  width: '100%', height: '100%', objectFit: 'contain',
}

const resourcePlateStyle: CSSProperties = {
  position: 'absolute', right: 14, top: 10,
  display: 'flex', alignItems: 'center', gap: 10,
}

const pillStyle: CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: 7,
  height: 40, padding: '0 16px', borderRadius: 999,
  background: 'rgba(255,255,255,.96)',
  border: '3px solid rgba(255,255,255,.85)',
  boxShadow: '0 4px 10px rgba(40,110,180,.25)',
  fontWeight: 900, fontSize: 23, color: '#3f4d5c',
}

const pillIconStyle: CSSProperties = {
  width: 26, height: 26, objectFit: 'contain',
}

/** 透明交互热点：原稿 bbox → 逻辑像素 */
function hotspot(bbox: [number, number, number, number]): CSSProperties {
  return {
    ...place(bbox),
    border: 'none', background: 'transparent', padding: 0, cursor: 'pointer',
  }
}
