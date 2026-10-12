// 2D 广场场景 P19（原稿重生成批次，接替 P5）：视觉按 design/high-fi/plaza/plaza.png
// （P19 终版，2338×1536）经 layer_decomposition 拆层重建——长期方案（同 P18）：
// z0 纯氛围远景由 SceneShell bleedImage cover 全屏清晰铺满（bleedBlur={false}），
// 舞台内不再叠 z0；内容层按"安全框映射"定位：逻辑坐标 = ((x−145)×0.5, y×0.5)
// （台账：assets/hifi/plaza/manifest.json）。
// 与 P5 差异：招牌/橱窗玩偶/屋顶白雏鸟并入建筑层（文字 bake，无独立招牌层）；
// 新增菜田/栅栏×2/路灯×3/底部花坛装饰层；右下三圆钮含文字标签牌（农场/宠物/背包），
// 整体左移 23px 逻辑（背包钮原稿越右界 2193，见 manifest bboxNote，走查裁定项）。
// 人物不画（P5 z10 已移除，广场＝纯场景枢纽）；点击建筑/圆钮进入下游，
// 未开放功能弹统一"即将开放"提示。
import { BackButton, btn as uiBtn } from '@mathpaws/ui'

import type { RouteId } from '../../app/router'
import { SceneShell, useViewport } from '../../app/viewport'
import { ChromeTopBar } from '../../components/ChromeTopBar/ChromeTopBar'
// 资产与 bbox 台账：assets/hifi/plaza/manifest.json（各层原稿 bbox 见 PlazaScene.css.ts 注释）
import bg from '../../assets/hifi/plaza/bg.jpg'
import bldFarm from '../../assets/hifi/plaza/bld-farm.webp'
import bldPetshop from '../../assets/hifi/plaza/bld-petshop.webp'
import bldQuiz from '../../assets/hifi/plaza/bld-quiz.webp'
import btnBackpack from '../../assets/hifi/plaza/btn-backpack.webp'
import btnFarm from '../../assets/hifi/plaza/btn-farm.webp'
import btnPet from '../../assets/hifi/plaza/btn-pet.webp'
import scarecrow from '../../assets/hifi/plaza/farm-scarecrow.webp'
import fencePetshop from '../../assets/hifi/plaza/fence-petshop.webp'
import fenceQuiz from '../../assets/hifi/plaza/fence-quiz.webp'
import garden from '../../assets/hifi/plaza/garden.webp'
import lampPetshopLeft from '../../assets/hifi/plaza/lamp-petshop-left.webp'
import lampPetshopRight from '../../assets/hifi/plaza/lamp-petshop-right.webp'
import lampQuiz from '../../assets/hifi/plaza/lamp-quiz.webp'
import flowerIcon from '../../assets/img/icons/i-flower@2x.webp'
import shellIcon from '../../assets/img/icons/i-shell@2x.webp'
import iconGacha from '../../assets/img/icons/icon-gacha@2x.webp'
import { comingSoon } from '../../components/ComingSoonToast/ComingSoonToast'
import { useEconomyStore } from '../../stores/useEconomyStore'
import { audio } from '../../utils/audio'
import * as s from './PlazaScene.css'

interface LayerDef { z: number; src: string; cls: string }

// 纯展示层（按 z 序回贴；几何类见 PlazaScene.css.ts，注释保留原稿 bbox）
const LAYERS: LayerDef[] = [
  { z: 1, src: garden, cls: s.lyrGarden },
  { z: 2, src: bldQuiz, cls: s.lyrQuiz },
  { z: 3, src: bldFarm, cls: s.lyrFarm },
  { z: 4, src: bldPetshop, cls: s.lyrPetshop },
  { z: 5, src: fenceQuiz, cls: s.lyrFenceQuiz },
  { z: 6, src: scarecrow, cls: s.lyrScarecrow },
  { z: 7, src: lampQuiz, cls: s.lyrLampQuiz },
  { z: 8, src: fencePetshop, cls: s.lyrFencePetshop },
  { z: 9, src: lampPetshopLeft, cls: s.lyrLampPetshopLeft },
  { z: 10, src: lampPetshopRight, cls: s.lyrLampPetshopRight },
  { z: 12, src: btnFarm, cls: s.lyrBtnFarm },
  { z: 13, src: btnPet, cls: s.lyrBtnPet },
  { z: 14, src: btnBackpack, cls: s.lyrBtnBackpack },
]

export function PlazaScene(
  { onNavigate }: { onNavigate: (id: RouteId) => void },
) {
  const shells = useEconomyStore(s => s.shells)
  const flowerCoins = useEconomyStore(s => s.flowerCoins)

  const go = (id: RouteId) => { audio.playSfx('click'); onNavigate(id) }

  return (
    <div className={s.scene}>
      {/* SceneShell：z0 纯氛围远景 cover 全屏清晰铺满（长期方案，bleedBlur={false}），
          舞台透明、不再叠 z0——无"两张图"零接缝；内容进 1024×768 安全框 */}
      <SceneShell bleed="#7cc3ec" bleedImage={bg} bleedBlur={false}>
        <div className={s.stage}>
          {/* 语义展示层 */}
          {LAYERS.map(l => (
            <img key={l.z} src={l.src} alt="" draggable={false} className={`${s.layer} ${l.cls}`} />
          ))}

          {/* 交互热点（透明覆盖在展示层之上） */}
          {/* 答题小屋 → quiz */}
          <button type="button" aria-label="答题小屋"
            className={`${uiBtn} ${s.hotspot} ${s.hotQuiz}`} onClick={() => go('quiz')} />
          {/* 农场建筑 → P8 农场 */}
          <button type="button" aria-label="农场"
            className={`${uiBtn} ${s.hotspot} ${s.hotFarm}`} onClick={() => go('farm')} />
          {/* 宠物商店 → 待开放 */}
          <button type="button" aria-label="宠物商店"
            className={`${uiBtn} ${s.hotspot} ${s.hotPetshop}`} onClick={comingSoon} />
          {/* 右下三圆钮（含标签牌，热点覆盖整体） */}
          <button type="button" aria-label="农场入口"
            className={`${uiBtn} ${s.hotspot} ${s.hotBtnFarm}`} onClick={() => go('farm')} />
          <button type="button" aria-label="宠物入口"
            className={`${uiBtn} ${s.hotspot} ${s.hotBtnPet}`} onClick={() => go('pet-panel')} />
          <button type="button" aria-label="背包入口"
            className={`${uiBtn} ${s.hotspot} ${s.hotBtnBackpack}`} onClick={() => go('backpack')} />
        </div>
      </SceneShell>

      {/* 顶栏 chrome 层（2026-10-11 迁移）：左返回 / 右：学盒 + 资源条（学盒居资源条左侧，同日裁定） */}
      <ChromeTopBar
        left={<BackButton size={Math.round(58 * useViewport().scale)} onClick={() => go('home')} />}
        right={
          <div className={s.resourcePlate}>
            <button
              type="button" aria-label="学盒"
              className={`${uiBtn} ${s.gachaEntry}`}
              onClick={() => go('gacha')}
            >
              <img src={iconGacha} alt="" draggable={false} className={s.gachaIcon} />
            </button>
            <Pill icon={shellIcon} value={shells} />
            <Pill icon={flowerIcon} value={flowerCoins} />
          </div>
        }
      />
    </div>
  )
}

function Pill({ icon, value }: { icon: string; value: number }) {
  return (
    <div className={s.pill}>
      <img src={icon} alt="" draggable={false} className={s.pillIcon} />
      <span>{value}</span>
    </div>
  )
}
