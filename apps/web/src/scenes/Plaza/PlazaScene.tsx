// 2D 广场场景 P5（M5-P5-01）：走标准 layer_decomposition 流程重建。
// z0 重绘背景 + 13 个透明语义层按 bbox 回贴；人物不可移动，
// 点击建筑/圆钮进入下游，未开放功能弹统一"即将开放"提示。
// 内容包在 1024×768 LogicalStage 内（原稿 2364×1773，坐标 ×K(1024/2364) 折算的
//   逻辑像素已固化到 PlazaScene.module.css）；舞台外留边由 BackgroundBleed 以同背景 cover 填充。
// 注：固定宠物位 + PetBubble（M5-P5-02）已移出，转二期。
import { BackButton } from '@mathpaws/ui'

import type { RouteId } from '../../app/router'
import { BackgroundBleed, LogicalStage } from '../../app/viewport'
// 资产与 bbox 台账：assets/hifi/plaza/manifest.json（各层原稿 bbox 见 PlazaScene.module.css 注释）
import bg from '../../assets/hifi/plaza/bg.jpg'
import bldFarm from '../../assets/hifi/plaza/bld-farm.webp'
import bldPetshop from '../../assets/hifi/plaza/bld-petshop.webp'
import bldQuiz from '../../assets/hifi/plaza/bld-quiz.webp'
import btnBackpack from '../../assets/hifi/plaza/btn-backpack.webp'
import btnFarm from '../../assets/hifi/plaza/btn-farm.webp'
import btnPet from '../../assets/hifi/plaza/btn-pet.webp'
import scarecrow from '../../assets/hifi/plaza/farm-scarecrow.webp'
import petshopPets from '../../assets/hifi/plaza/petshop-pets.webp'
import roofBird from '../../assets/hifi/plaza/roof-bird.webp'
import signFarm from '../../assets/hifi/plaza/sign-farm.webp'
import signQuiz from '../../assets/hifi/plaza/sign-quiz.webp'
import signPetshop from '../../assets/hifi/plaza/sign-petshop.webp'
import flowerIcon from '../../assets/img/icons/i-flower@2x.webp'
import shellIcon from '../../assets/img/icons/i-shell@2x.webp'
import iconGacha from '../../assets/img/icons/icon-gacha@2x.webp'
import { comingSoon } from '../../components/ComingSoonToast/ComingSoonToast'
import { useEconomyStore } from '../../stores/useEconomyStore'
import { audio } from '../../utils/audio'
import styles from './PlazaScene.module.css'

interface LayerDef { z: number; src: string; cls: string }

// 纯展示层（按 z 序回贴；几何类见 PlazaScene.module.css，注释保留原稿 bbox）
const LAYERS: LayerDef[] = [
  { z: 1, src: bldFarm, cls: styles.lyrFarm },
  { z: 2, src: bldQuiz, cls: styles.lyrQuiz },
  { z: 3, src: scarecrow, cls: styles.lyrScarecrow },
  { z: 4, src: signQuiz, cls: styles.lyrSignQuiz },
  { z: 5, src: signFarm, cls: styles.lyrSignFarm },
  { z: 6, src: bldPetshop, cls: styles.lyrPetshop },
  { z: 7, src: signPetshop, cls: styles.lyrSignPetshop },
  { z: 8, src: roofBird, cls: styles.lyrRoofBird },
  { z: 9, src: petshopPets, cls: styles.lyrPetshopPets },
  { z: 11, src: btnFarm, cls: styles.lyrBtnFarm },
  { z: 12, src: btnPet, cls: styles.lyrBtnPet },
  { z: 13, src: btnBackpack, cls: styles.lyrBtnBackpack },
]

export function PlazaScene(
  { onNavigate }: { onNavigate: (id: RouteId) => void },
) {
  const shells = useEconomyStore(s => s.shells)
  const flowerCoins = useEconomyStore(s => s.flowerCoins)

  const go = (id: RouteId) => { audio.playSfx('click'); onNavigate(id) }

  return (
    <div className={styles.scene}>
      {/* 舞台外出血背景：同一张背景图 cover 填满视口留边（加载前以天空蓝兜底） */}
      <BackgroundBleed background="#7cc3ec">
        <img src={bg} alt="" aria-hidden draggable={false} className={styles.bleedImg} />
      </BackgroundBleed>

      <LogicalStage>
        <div className={styles.stage}>
          {/* z0 舞台内重绘背景：铺满 1024×768 舞台，随舞台等比缩放不变形 */}
          <img src={bg} alt="" draggable={false} className={styles.stageBg} />

          {/* 语义展示层 */}
          {LAYERS.map(l => (
            <img key={l.z} src={l.src} alt="" draggable={false} className={`${styles.layer} ${l.cls}`} />
          ))}

          {/* 左上：返回首页（新稿顶部干净，无重叠）
              BackButton 仅接受 style prop，静态定位保留内联 */}
          <BackButton size={58} onClick={() => go('home')} style={{ position: 'absolute', left: 16, top: 14 }} />

          {/* 顶部中央：学盒入口（仅图标，不带文字） */}
          <button
            type="button" aria-label="学盒"
            className={`mp-btn ${styles.gachaEntry}`}
            onClick={() => go('gacha')}
          >
            <img src={iconGacha} alt="" draggable={false} className={styles.gachaIcon} />
          </button>

          {/* 右上：真实资源条（贝壳/花朵币，无体力） */}
          <div className={styles.resourcePlate}>
            <Pill icon={shellIcon} value={shells} />
            <Pill icon={flowerIcon} value={flowerCoins} />
          </div>

          {/* 交互热点（透明覆盖在展示层之上） */}
          {/* 答题小屋 → quiz */}
          <button type="button" aria-label="答题小屋"
            className={`mp-btn ${styles.hotspot} ${styles.hotQuiz}`} onClick={() => go('quiz')} />
          {/* 农场建筑 → P8 农场 */}
          <button type="button" aria-label="农场"
            className={`mp-btn ${styles.hotspot} ${styles.hotFarm}`} onClick={() => go('farm')} />
          {/* 宠物商店 → 待开放 */}
          <button type="button" aria-label="宠物商店"
            className={`mp-btn ${styles.hotspot} ${styles.hotPetshop}`} onClick={comingSoon} />
          {/* 右下三圆钮 */}
          <button type="button" aria-label="农场入口"
            className={`mp-btn ${styles.hotspot} ${styles.hotBtnFarm}`} onClick={() => go('farm')} />
          <button type="button" aria-label="宠物入口"
            className={`mp-btn ${styles.hotspot} ${styles.hotBtnPet}`} onClick={() => go('pet-panel')} />
          <button type="button" aria-label="背包入口"
            className={`mp-btn ${styles.hotspot} ${styles.hotBtnBackpack}`} onClick={() => go('backpack')} />
        </div>
      </LogicalStage>
    </div>
  )
}

function Pill({ icon, value }: { icon: string; value: number }) {
  return (
    <div className={styles.pill}>
      <img src={icon} alt="" draggable={false} className={styles.pillIcon} />
      <span>{value}</span>
    </div>
  )
}
