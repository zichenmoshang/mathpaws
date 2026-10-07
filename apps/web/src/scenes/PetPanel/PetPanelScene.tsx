// P9 宠物面板（M4-P9-01/02/03/04）— 按 hifi-ui-extraction-spec 拆层重建：
// 高保真 design/high-fi/pet/pet.png（Seedream 出稿：去红心/装备/玩耍，加进化相框/宠物格）
// → layer_decomposition 15 层（_tmp/decomp-pet-v2，交叉校验 maxdiff≤2，PIL 回贴一致）
// → 采用 11 层落 assets/hifi/pet + manifest.json。
// 相框内兔/卡片内动物/资源牌数字已 PIL 擦除，全部前端动态替换；
// z5 进度条 / z9 中心兔不采用（前端 ProgressBar / 动态阶段立绘放同 bbox）。
//   P9-01：一键全部喂食（扣全部食物、经验一次结算、喂食飘字；食物数气泡在喂食钮上方）
//   P9-02：进化轨道方案 A（三阶段相框+未解锁灰度锁角标）+ 进化仪式（跨多级只播最终形态）
//   P9-03：改名（铅笔钮，≤6 字免费）；点立绘 → 蹦跳 + 开心话飘字
//   P9-04：右侧宠物格（犬猫"即将开放"）；顶部 PK 入口"即将开放"；装备三槽已删除
// 自适应：场景内容运行在 1024×768 LogicalStage 内（坐标数值不变），
// 舞台外留边由 BackgroundBleed 以同一背景 cover 出血填充；
// 静态样式已迁移至 PetPanelScene.css.ts，内联仅保留运行时动态值。
import { BackButton, Modal, CloudInput, Btn, ProgressBar, btn as uiBtn } from '@mathpaws/ui'
import type { CSSProperties } from 'react'
import { useEffect, useRef, useState } from 'react'

import type { RouteId } from '../../app/router'
import { BackgroundBleed, LogicalStage } from '../../app/viewport'
// 拆层资产（assets/hifi/pet/manifest.json）
import bg from '../../assets/hifi/pet/bg.jpg'
import btnFeed from '../../assets/hifi/pet/btn-feed.webp'
import btnRename from '../../assets/hifi/pet/btn-rename.webp'
import pillFood from '../../assets/hifi/pet/pill-food.webp'
import evoFrame1 from '../../assets/hifi/pet/evo-frame-1.webp'
import evoFrame2 from '../../assets/hifi/pet/evo-frame-2.webp'
import evoFrame3 from '../../assets/hifi/pet/evo-frame-3.webp'
import gridRabbit from '../../assets/hifi/pet/grid-rabbit.webp'
import gridDog from '../../assets/hifi/pet/grid-dog.webp'
import gridCat from '../../assets/hifi/pet/grid-cat.webp'
import panel from '../../assets/hifi/pet/panel.webp'
import pillShell from '../../assets/hifi/pet/pill-shell.webp'
import titleCloud from '../../assets/hifi/pet/title-cloud.webp'
// 动态图（阶段立绘 / core / 图标）
import catImg from '../../assets/img/core/pet-cat-core@2x.png'
import dogImg from '../../assets/img/core/pet-dog-core@2x.png'
import heartIcon from '../../assets/img/icons/i-heart@2x.webp'
import lockIcon from '../../assets/img/icons/i-lock@2x.webp'
import starIcon from '../../assets/img/icons/i-star@2x.webp'
import { comingSoon } from '../../components/ComingSoonToast/ComingSoonToast'
import { FOOD_EXP_RATE } from '../../config/economy'
import { RABBIT_STAGE_IMG } from '../../config/petArt'
import { PET_SPECIES, PET_STAGES, petLevelFromExp, type PetTypeId } from '../../config/pets'
import { useEconomyStore } from '../../stores/useEconomyStore'
import { usePetStore } from '../../stores/usePetStore'
import { audio } from '../../utils/audio'
import * as s from './PetPanelScene.css'

/** 原稿 2364×1773 → 1024×768 逻辑像素 */
const K = 1024 / 2364

/** 原稿 bbox → 逻辑像素定位 */
const place = (bbox: [number, number, number, number]): CSSProperties => {
  const [x0, y0, x1, y1] = bbox
  return {
    position: 'absolute',
    left: x0 * K, top: y0 * K,
    width: (x1 - x0) * K, height: (y1 - y0) * K,
  }
}

// 关键 bbox（原稿坐标，见 manifest.json）
const BBOX = {
  panel: [516, 318, 1480, 1676] as [number, number, number, number],
  title: [660, 120, 1332, 434] as [number, number, number, number],
  hero: [836, 454, 1145, 976] as [number, number, number, number], // z9 中心立绘位
  expBar: [731, 1017, 1257, 1073] as [number, number, number, number], // z5 进度条位
  pillShell: [1602, 64, 1915, 183] as [number, number, number, number],
  pillFood: [1953, 64, 2280, 182] as [number, number, number, number],
  feed: [690, 1371, 939, 1619] as [number, number, number, number],
  rename: [1053, 1371, 1303, 1620] as [number, number, number, number],
}
const EVO_FRAMES: Array<{ src: string; bbox: [number, number, number, number] }> = [
  { src: evoFrame1, bbox: [580, 1112, 818, 1353] },
  { src: evoFrame2, bbox: [870, 1111, 1110, 1353] },
  { src: evoFrame3, bbox: [1162, 1111, 1398, 1353] },
]
const GRID_CELLS: Array<{ id: PetTypeId; src: string; bbox: [number, number, number, number] }> = [
  { id: 'rabbit', src: gridRabbit, bbox: [1601, 388, 1937, 712] },
  { id: 'dog', src: gridDog, bbox: [1601, 754, 1939, 1079] },
  { id: 'cat', src: gridCat, bbox: [1602, 1123, 1939, 1448] },
]

const CORE_IMG: Record<PetTypeId, string> = { rabbit: RABBIT_STAGE_IMG[3], dog: dogImg, cat: catImg }

/** 当前形态主立绘：兔按进化阶段切图；犬猫占位 core */
function stageImg(petType: PetTypeId, level: 1 | 2 | 3): string {
  return petType === 'rabbit' ? RABBIT_STAGE_IMG[level] : CORE_IMG[petType]
}

// 点击形象的开心话
const CHEER = ['好开心呀', '摸摸头', '嘿嘿嘿', '我喜欢你', '再点我一下']

export function PetPanelScene({ onNavigate }: { onNavigate: (id: RouteId) => void }) {
  const hasPet = usePetStore(s => s.hasPet)
  const petType = usePetStore(s => s.petType)
  const petName = usePetStore(s => s.petName)
  const petExp = usePetStore(s => s.petExp)
  const petFood = useEconomyStore(s => s.petFood)
  const shells = useEconomyStore(s => s.shells)

  // 无宠物时（如 dev 直达）回领养页
  useEffect(() => {
    if (!hasPet) onNavigate('adopt')
  }, [hasPet, onNavigate])

  const level = petLevelFromExp(petExp)
  const stage = PET_STAGES[level - 1]
  const nextStage = PET_STAGES[level] // level 3 时 undefined
  const expInLevel = petExp - stage.needExp
  const expSpan = nextStage ? nextStage.needExp - stage.needExp : 0
  const expRatio = nextStage ? Math.min(1, expInLevel / expSpan) : 1

  const [renameOpen, setRenameOpen] = useState(false)
  const [nameDraft, setNameDraft] = useState('')
  const [cheer, setCheer] = useState<string | null>(null)
  const [feedFly, setFeedFly] = useState<string | null>(null)
  // 进化仪式：目标形态等级（跨多级只播最终形态一次）
  const [ceremonyTo, setCeremonyTo] = useState<1 | 2 | 3 | null>(null)

  // 飘字定时器：卸载时清理，避免组件销毁后 setState
  const cheerTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const feedTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(() => () => {
    if (cheerTimer.current) clearTimeout(cheerTimer.current)
    if (feedTimer.current) clearTimeout(feedTimer.current)
  }, [])

  const displayName = petName || PET_SPECIES[petType].cnName

  // 点击形象：蹦跳 + 开心话（无消耗）
  const poke = () => {
    audio.playSfx('click')
    setCheer(CHEER[Math.floor(Math.random() * CHEER.length)])
    if (cheerTimer.current) clearTimeout(cheerTimer.current)
    cheerTimer.current = setTimeout(() => setCheer(null), 1200)
  }

  // 喂食飘字（成功经验 / 失败提示共用）
  const showFeedFly = (text: string) => {
    setFeedFly(text)
    if (feedTimer.current) clearTimeout(feedTimer.current)
    feedTimer.current = setTimeout(() => setFeedFly(null), 1600)
  }

  // 满级（Lv.3，无下一阶段）或无食物时喂食钮置灰禁用
  const feedDisabled = !nextStage || petFood <= 0

  // 一键全部喂食（store 自包含编排：内部校验满级、校验并扣减食物）
  const feedAll = () => {
    if (!hasPet || feedDisabled) return
    audio.playSfx('click')
    const res = usePetStore.getState().feedAll()
    if (!res.ok) {
      // 失败兜底可见反馈（正常已被按钮置灰拦截）
      showFeedFly(res.reason === 'max-level' ? '已经满级啦' : '没有食物了，去答题赢取吧')
      return
    }
    if (res.leveledTo) {
      setFeedFly(null)
      setCeremonyTo(res.leveledTo)
      audio.playSfx('evolve')
    } else {
      showFeedFly(`+${res.fed * FOOD_EXP_RATE} 经验`)
    }
  }

  const openRename = () => {
    audio.playSfx('click')
    setNameDraft(petName)
    setRenameOpen(true)
  }
  const confirmRename = () => {
    usePetStore.getState().rename(nameDraft)
    setRenameOpen(false)
    audio.playSfx('click')
  }

  const go = (id: RouteId) => { audio.playSfx('click'); onNavigate(id) }

  return (
    <BackgroundBleed background="#f2ddc0">
      {/* 舞台外留边：同一背景 cover 出血填充 */}
      <img src={bg} alt="" draggable={false} className={s.bleedBg} />
      <LogicalStage>
        <div className={s.scene}>
          {/* z0 重绘背景（儿童房，铺满舞台随缩放） */}
          <img src={bg} alt="" draggable={false} className={s.bg} />

          {/* 主面板 + 云标题 */}
          <img src={panel} alt="" draggable={false} style={place(BBOX.panel)} />
          <img src={titleCloud} alt="我的宠物" draggable={false} style={place(BBOX.title)} />

          {/* 左上返回 / 右上资源牌 + 前端数字 + PK 入口 */}
          <BackButton size={58} onClick={() => go('plaza')} style={{ position: 'absolute', left: 14, top: 10 }} />
          <img src={pillShell} alt="" draggable={false} style={place(BBOX.pillShell)} />
          <span className={s.pillNum} style={pillNumPlace(BBOX.pillShell)}>{shells}</span>
          <img src={pillFood} alt="" draggable={false} style={place(BBOX.pillFood)} />
          <span className={s.pillNum} style={pillNumPlace(BBOX.pillFood)}>{petFood}</span>
          <button type="button" className={`${uiBtn} ${s.pkBtn}`} onClick={comingSoon}>宠物 PK</button>

          {/* 中心立绘（z9 位，按进化阶段切图；点击互动） */}
          <button type="button" className={`${uiBtn} ${s.heroBtn}`} onClick={poke} style={place(BBOX.hero)} aria-label="点我互动">
            <img
              src={stageImg(petType, level)} alt={displayName} draggable={false}
              className={`${s.heroImg} ${s.petBounce}`}
            />
            {cheer && <span className={s.cheer}>{cheer}</span>}
          </button>

          {/* 名字（立绘与进度条之间） */}
          <span className={s.name}>{displayName}</span>

          {/* 等级进度条（z5 位，前端 ProgressBar + Lv 徽章 + 数字） */}
          <span className={s.lvBadge} style={{ left: BBOX.expBar[0] * K - 64, top: BBOX.expBar[1] * K - 4 }}>Lv.{level}</span>
          <div className={s.expBar} style={place(BBOX.expBar)}>
            <ProgressBar ratio={expRatio} base="#ffd83d" deep="#e08f00" height={16} />
          </div>
          <span className={s.expText} style={{ left: BBOX.expBar[2] * K + 8, top: BBOX.expBar[1] * K, height: (BBOX.expBar[3] - BBOX.expBar[1]) * K }}>
            {nextStage ? `${expInLevel}/${expSpan}` : '已满级'}
          </span>

          {/* 进化提示（进度条与相框之间） */}
          <span className={s.evoHint}>
            {nextStage
              ? expRatio >= 0.8
                ? '快要进化啦！'
                : `再喂 ${Math.ceil((nextStage.needExp - petExp) / FOOD_EXP_RATE)} 个食物进化到 Lv.${nextStage.level}`
              : '已是最高形态'}
          </span>

          {/* 进化轨道：三个相框（内放阶段图，未解锁灰度 + 锁角标） */}
          {PET_STAGES.map((st, i) => {
            const frame = EVO_FRAMES[i]
            const reached = level >= st.level
            return (
              <div key={st.level} style={place(frame.bbox)}>
                {/* 相框缩至 92% 居中：给上方进化提示留出可视间隙 */}
                <img src={frame.src} alt="" draggable={false} className={s.evoFrame} />
                <img
                  src={stageImg(petType, st.level)} alt={st.form} draggable={false}
                  className={s.evoStageImg}
                  style={{
                    filter: reached ? 'none' : 'grayscale(1)',
                    opacity: reached ? 1 : 0.5,
                  }}
                />
                {!reached && (
                  <img src={lockIcon} alt="" draggable={false} className={s.evoLock} />
                )}
                <span className={s.frameLabel}>Lv.{st.level}</span>
              </div>
            )
          })}

          {/* 喂食钮（z10 骨头）+ 食物数气泡；改名钮（z11 铅笔） */}
          <div style={place(BBOX.feed)}>
            {petFood > 0 && <span className={s.foodBubble}>×{petFood}</span>}
            <button
              type="button" aria-label="一键喂食" className={`${uiBtn} ${s.roundBtn}`}
              onClick={feedAll} disabled={feedDisabled}
              style={{ opacity: feedDisabled ? 0.5 : 1, cursor: feedDisabled ? 'not-allowed' : 'pointer' }}
            >
              <img src={btnFeed} alt="" draggable={false} className={s.roundBtnImg} />
            </button>
            <span className={s.btnLabel}>喂食</span>
          </div>
          <div style={place(BBOX.rename)}>
            <button type="button" aria-label="改名" className={`${uiBtn} ${s.roundBtn}`} onClick={openRename}>
              <img src={btnRename} alt="" draggable={false} className={s.roundBtnImg} />
            </button>
            <span className={s.btnLabel}>改名</span>
          </div>

          {/* 右侧宠物格（兔已拥有；犬猫"即将开放"） */}
          {GRID_CELLS.map(cell => {
            const spec = PET_SPECIES[cell.id]
            const owned = hasPet && petType === cell.id
            return (
              <button
                key={cell.id}
                type="button"
                className={`${uiBtn} ${s.gridCell}`}
                aria-label={spec.cnName}
                onClick={() => (spec.available ? undefined : comingSoon())}
                style={{ ...place(cell.bbox), cursor: spec.available ? 'pointer' : 'default' }}
              >
                <img src={cell.src} alt="" draggable={false} className={s.gridImg} />
                <img
                  src={CORE_IMG[cell.id]} alt={spec.cnName} draggable={false}
                  className={s.gridCore}
                  style={{
                    filter: spec.available ? 'none' : 'grayscale(1)',
                    opacity: spec.available ? 1 : 0.55,
                  }}
                />
                {!spec.available && (
                  <>
                    <img src={lockIcon} alt="" draggable={false} className={s.gridLock} />
                    <span className={s.gridLockLabel}>即将开放</span>
                  </>
                )}
                {owned && <span className={s.gridOwn}>已拥有</span>}
              </button>
            )
          })}

          {/* 喂食飘字 */}
          {feedFly && <div className={s.feedFly}>{feedFly}</div>}

          {/* 改名弹窗 */}
          {renameOpen && (
            <Modal onClose={() => setRenameOpen(false)}>
              <div className={s.renameBox}>
                <span className={s.renameTitle}>给宠物起个名字</span>
                <CloudInput
                  value={nameDraft} onChange={setNameDraft}
                  placeholder={PET_SPECIES[petType].cnName} maxLength={6}
                  onSubmit={confirmRename} style={{ width: 260, textAlign: 'center' }}
                />
                <div className={s.renameActions}>
                  {/* 注意：Btn ghost 变体是白字+近透明白底，白 Modal 上不可见，禁用 */}
                  <button
                    type="button" className={`${uiBtn} ${s.renameCancel}`} onClick={() => setRenameOpen(false)}
                  >
                    取消
                  </button>
                  <Btn variant="grass" onClick={confirmRename}>确定</Btn>
                </div>
              </div>
            </Modal>
          )}

          {/* 进化仪式（跨多级只播最终形态一次） */}
          {ceremonyTo && (
            <EvolutionCeremony
              to={ceremonyTo}
              petType={petType}
              onClose={() => { audio.playSfx('click'); setCeremonyTo(null) }}
            />
          )}
        </div>
      </LogicalStage>
    </BackgroundBleed>
  )
}

/** 进化仪式全屏层：CSS 光柱/彩带 + 星心图标 + "进化成功"文案（不专门出图） */
function EvolutionCeremony({
  to, petType, onClose,
}: {
  to: 1 | 2 | 3
  petType: PetTypeId
  onClose: () => void
}) {
  const stage = PET_STAGES[to - 1]
  return (
    <div className={s.ceremonyMask}>
      <div className={s.evoBeam} />
      {CONFETTI.map((c, i) => (
        <span
          key={i}
          className={s.evoConfetti}
          style={{ left: c.x, background: c.color, [s.confettiDelayVar]: c.delay } as CSSProperties}
        />
      ))}
      <img src={starIcon} alt="" draggable={false} className={s.orbitIcon} style={{ left: '32%', top: '24%' }} />
      <img src={heartIcon} alt="" draggable={false} className={s.orbitIcon} style={{ right: '30%', top: '30%', [s.orbitDelayVar]: '.4s' } as CSSProperties} />
      <img src={starIcon} alt="" draggable={false} className={s.orbitIcon} style={{ left: '38%', bottom: '26%', [s.orbitDelayVar]: '.8s', width: 34, height: 34 } as CSSProperties} />

      <div className={s.ceremonyCard}>
        <span className={s.ceremonyTitle}>进化成功！</span>
        <img
          src={stageImg(petType, to)} alt={stage.form} draggable={false}
          className={s.ceremonyImg}
        />
        <span className={s.ceremonyForm}>Lv.{to} {stage.form}</span>
        <button type="button" className={`${uiBtn} ${s.ceremonyBtn}`} onClick={onClose}>太棒了</button>
      </div>
    </div>
  )
}

const CONFETTI = [
  { x: '18%', color: '#ff8fae', delay: '0s' },
  { x: '30%', color: '#ffd83d', delay: '.3s' },
  { x: '44%', color: '#7ed957', delay: '.15s' },
  { x: '58%', color: '#6fb3e8', delay: '.45s' },
  { x: '70%', color: '#ffb35c', delay: '.1s' },
  { x: '82%', color: '#c39bd3', delay: '.35s' },
]

/* ---------- 动态定位辅助（运行时计算，保留内联） ---------- */

/* 资源牌数字（牌右半区居中） */
const pillNumPlace = (bbox: [number, number, number, number]): CSSProperties => ({
  left: (bbox[0] + (bbox[2] - bbox[0]) * 0.45) * K,
  top: bbox[1] * K,
  width: (bbox[2] - bbox[0]) * 0.43 * K,
  height: (bbox[3] - bbox[1]) * K,
})
