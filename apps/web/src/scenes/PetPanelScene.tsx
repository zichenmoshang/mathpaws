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
import { FONT, BackButton, Modal, CloudInput, Btn, ProgressBar } from '@mathpaws/ui'
import type { CSSProperties } from 'react'
import { useEffect, useRef, useState } from 'react'

import type { RouteId } from '../app/router'
// 拆层资产（assets/hifi/pet/manifest.json）
import bg from '../assets/hifi/pet/bg.jpg'
import btnFeed from '../assets/hifi/pet/btn-feed.webp'
import btnRename from '../assets/hifi/pet/btn-rename.webp'
import pillFood from '../assets/hifi/pet/pill-food.webp'
import evoFrame1 from '../assets/hifi/pet/evo-frame-1.webp'
import evoFrame2 from '../assets/hifi/pet/evo-frame-2.webp'
import evoFrame3 from '../assets/hifi/pet/evo-frame-3.webp'
import gridRabbit from '../assets/hifi/pet/grid-rabbit.webp'
import gridDog from '../assets/hifi/pet/grid-dog.webp'
import gridCat from '../assets/hifi/pet/grid-cat.webp'
import panel from '../assets/hifi/pet/panel.webp'
import pillShell from '../assets/hifi/pet/pill-shell.webp'
import titleCloud from '../assets/hifi/pet/title-cloud.webp'
// 动态图（阶段立绘 / core / 图标）
import catImg from '../assets/img/core/pet-cat-core@2x.png'
import dogImg from '../assets/img/core/pet-dog-core@2x.png'
import heartIcon from '../assets/img/icons/i-heart@2x.webp'
import lockIcon from '../assets/img/icons/i-lock@2x.webp'
import starIcon from '../assets/img/icons/i-star@2x.webp'
import { comingSoon } from '../components/ComingSoonToast'
import { FOOD_EXP_RATE } from '../config/economy'
import { RABBIT_STAGE_IMG } from '../config/petArt'
import { PET_SPECIES, PET_STAGES, petLevelFromExp, type PetTypeId } from '../config/pets'
import { useEconomyStore } from '../stores/useEconomyStore'
import { usePetStore } from '../stores/usePetStore'
import { audio } from '../utils/audio'

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

  // 一键全部喂食
  const feedAll = () => {
    if (!hasPet || petFood <= 0) return
    audio.playSfx('click')
    const count = petFood
    useEconomyStore.getState().addPetFood(-count)
    const res = usePetStore.getState().feedAll(count)
    if (res.leveledTo) {
      setFeedFly(null)
      setCeremonyTo(res.leveledTo)
      audio.playSfx('evolve')
    } else {
      setFeedFly(`+${res.fed * FOOD_EXP_RATE} 经验`)
      if (feedTimer.current) clearTimeout(feedTimer.current)
      feedTimer.current = setTimeout(() => setFeedFly(null), 1600)
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
    <div style={sceneStyle}>
      {/* z0 重绘背景（儿童房） */}
      <img src={bg} alt="" draggable={false} style={bgStyle} />

      {/* 主面板 + 云标题 */}
      <img src={panel} alt="" draggable={false} style={place(BBOX.panel)} />
      <img src={titleCloud} alt="我的宠物" draggable={false} style={place(BBOX.title)} />

      {/* 左上返回 / 右上资源牌 + 前端数字 + PK 入口 */}
      <BackButton size={58} onClick={() => go('plaza')} style={{ position: 'absolute', left: 14, top: 10 }} />
      <img src={pillShell} alt="" draggable={false} style={place(BBOX.pillShell)} />
      <span style={{ ...pillNumStyle, ...pillNumPlace(BBOX.pillShell) }}>{shells}</span>
      <img src={pillFood} alt="" draggable={false} style={place(BBOX.pillFood)} />
      <span style={{ ...pillNumStyle, ...pillNumPlace(BBOX.pillFood) }}>{petFood}</span>
      <button type="button" className="mp-btn" onClick={comingSoon} style={pkBtnStyle}>宠物 PK</button>

      {/* 中心立绘（z9 位，按进化阶段切图；点击互动） */}
      <button type="button" className="mp-btn" onClick={poke} style={{ ...place(BBOX.hero), ...heroBtnStyle }} aria-label="点我互动">
        <img
          src={stageImg(petType, level)} alt={displayName} draggable={false}
          className="mp-pet-bounce"
          style={{ width: '100%', height: '100%', objectFit: 'contain', filter: 'drop-shadow(0 8px 12px rgba(120,80,40,.25))' }}
        />
        {cheer && <span style={cheerStyle}>{cheer}</span>}
      </button>

      {/* 名字（立绘与进度条之间） */}
      <span style={nameStyle}>{displayName}</span>

      {/* 等级进度条（z5 位，前端 ProgressBar + Lv 徽章 + 数字） */}
      <span style={{ ...lvBadgeStyle, left: BBOX.expBar[0] * K - 64, top: BBOX.expBar[1] * K - 4 }}>Lv.{level}</span>
      <div style={{ ...place(BBOX.expBar), display: 'flex', alignItems: 'center' }}>
        <ProgressBar ratio={expRatio} base="#ffd83d" deep="#e08f00" height={16} />
      </div>
      <span style={{ ...expTextStyle, left: BBOX.expBar[2] * K + 8, top: BBOX.expBar[1] * K, height: (BBOX.expBar[3] - BBOX.expBar[1]) * K }}>
        {nextStage ? `${expInLevel}/${expSpan}` : '已满级'}
      </span>

      {/* 进化提示（进度条与相框之间） */}
      <span style={evoHintStyle}>
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
            <img src={frame.src} alt="" draggable={false} style={{ position: 'absolute', inset: '4%', width: '92%', height: '92%', objectFit: 'contain' }} />
            <img
              src={stageImg(petType, st.level)} alt={st.form} draggable={false}
              style={{
                position: 'absolute', left: '20%', top: '12%', width: '60%', height: '56%',
                objectFit: 'contain',
                filter: reached ? 'none' : 'grayscale(1)',
                opacity: reached ? 1 : 0.5,
              }}
            />
            {!reached && (
              <img src={lockIcon} alt="" draggable={false} style={{ position: 'absolute', right: '10%', bottom: '10%', width: '24%', height: '24%', objectFit: 'contain' }} />
            )}
            <span style={frameLabelStyle}>Lv.{st.level}</span>
          </div>
        )
      })}

      {/* 喂食钮（z10 骨头）+ 食物数气泡；改名钮（z11 铅笔） */}
      <div style={place(BBOX.feed)}>
        {petFood > 0 && <span style={foodBubbleStyle}>×{petFood}</span>}
        <button
          type="button" aria-label="一键喂食" className="mp-btn"
          onClick={feedAll} disabled={petFood <= 0}
          style={{ ...roundBtnStyle, opacity: petFood <= 0 ? 0.5 : 1, cursor: petFood <= 0 ? 'not-allowed' : 'pointer' }}
        >
          <img src={btnFeed} alt="" draggable={false} style={roundBtnImgStyle} />
        </button>
        <span style={btnLabelStyle}>喂食</span>
      </div>
      <div style={place(BBOX.rename)}>
        <button type="button" aria-label="改名" className="mp-btn" onClick={openRename} style={roundBtnStyle}>
          <img src={btnRename} alt="" draggable={false} style={roundBtnImgStyle} />
        </button>
        <span style={btnLabelStyle}>改名</span>
      </div>

      {/* 右侧宠物格（兔已拥有；犬猫"即将开放"） */}
      {GRID_CELLS.map(cell => {
        const spec = PET_SPECIES[cell.id]
        const owned = hasPet && petType === cell.id
        return (
          <button
            key={cell.id}
            type="button"
            className="mp-btn"
            aria-label={spec.cnName}
            onClick={() => (spec.available ? undefined : comingSoon())}
            style={{ ...place(cell.bbox), border: 'none', background: 'transparent', padding: 0, cursor: spec.available ? 'pointer' : 'default' }}
          >
            <img src={cell.src} alt="" draggable={false} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'contain' }} />
            <img
              src={CORE_IMG[cell.id]} alt={spec.cnName} draggable={false}
              style={{
                position: 'absolute', left: '20%', top: '18%', width: '60%', height: '60%',
                objectFit: 'contain',
                filter: spec.available ? 'none' : 'grayscale(1)',
                opacity: spec.available ? 1 : 0.55,
              }}
            />
            {!spec.available && (
              <>
                <img src={lockIcon} alt="" draggable={false} style={{ position: 'absolute', right: '8%', bottom: '8%', width: '22%', height: '22%', objectFit: 'contain' }} />
                <span style={gridLockLabelStyle}>即将开放</span>
              </>
            )}
            {owned && <span style={gridOwnStyle}>已拥有</span>}
          </button>
        )
      })}

      {/* 喂食飘字 */}
      {feedFly && <div style={feedFlyStyle}>{feedFly}</div>}

      {/* 改名弹窗 */}
      {renameOpen && (
        <Modal onClose={() => setRenameOpen(false)}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, alignItems: 'center', minWidth: 300 }}>
            <span style={{ fontSize: 22, fontWeight: 900, color: '#3f4d5c' }}>给宠物起个名字</span>
            <CloudInput
              value={nameDraft} onChange={setNameDraft}
              placeholder={PET_SPECIES[petType].cnName} maxLength={6}
              onSubmit={confirmRename} style={{ width: 260, textAlign: 'center' }}
            />
            <div style={{ display: 'flex', gap: 12 }}>
              {/* 注意：Btn ghost 变体是白字+近透明白底，白 Modal 上不可见，禁用 */}
              <button
                type="button" className="mp-btn" onClick={() => setRenameOpen(false)}
                style={{
                  height: 52, padding: '0 28px', borderRadius: 14, border: 'none',
                  background: '#eceff1', color: '#546e7a', fontWeight: 900, fontSize: 20,
                  fontFamily: FONT.family, cursor: 'pointer',
                }}
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

      <style>{PET_CSS}</style>
    </div>
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
    <div style={ceremonyMaskStyle}>
      <div className="mp-evo-beam" style={beamStyle} />
      {CONFETTI.map((c, i) => (
        <span
          key={i}
          className="mp-evo-confetti"
          style={{ left: c.x, background: c.color, animationDelay: c.delay }}
        />
      ))}
      <img src={starIcon} alt="" draggable={false} className="mp-evo-orbit" style={{ ...orbitIconStyle, left: '32%', top: '24%' }} />
      <img src={heartIcon} alt="" draggable={false} className="mp-evo-orbit" style={{ ...orbitIconStyle, right: '30%', top: '30%', animationDelay: '.4s' }} />
      <img src={starIcon} alt="" draggable={false} className="mp-evo-orbit" style={{ ...orbitIconStyle, left: '38%', bottom: '26%', animationDelay: '.8s', width: 34, height: 34 }} />

      <div style={ceremonyCardStyle}>
        <span style={ceremonyTitleStyle}>进化成功！</span>
        <img
          src={stageImg(petType, to)} alt={stage.form} draggable={false}
          className="mp-evo-pet"
          style={ceremonyImgStyle}
        />
        <span style={ceremonyFormStyle}>Lv.{to} {stage.form}</span>
        <button type="button" className="mp-btn" onClick={onClose} style={ceremonyBtnStyle}>太棒了</button>
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

/* ---------- 样式（逻辑像素） ---------- */
const PET_CSS = `
@keyframes mp-pet-bounce {
  0%,100% { transform: translateY(0) scaleY(1); }
  30% { transform: translateY(-14px) scaleY(1.02); }
  55% { transform: translateY(0) scaleY(.96); }
  75% { transform: translateY(-6px) scaleY(1); }
}
.mp-pet-bounce { animation: mp-pet-bounce 1.8s ease-in-out infinite; }
@keyframes mp-evo-beam-spin { from { transform: translate(-50%,-50%) rotate(0deg); } to { transform: translate(-50%,-50%) rotate(360deg); } }
.mp-evo-beam { animation: mp-evo-beam-spin 9s linear infinite; }
@keyframes mp-evo-fall {
  0% { top: -6%; transform: rotate(0deg); opacity: 1; }
  90% { opacity: 1; }
  100% { top: 104%; transform: rotate(540deg); opacity: 0; }
}
.mp-evo-confetti {
  position: absolute; top: -6%; width: 12px; height: 20px; border-radius: 3px;
  animation: mp-evo-fall 2.6s ease-in infinite;
}
@keyframes mp-evo-orbit-pop {
  0%,100% { transform: scale(1); }
  50% { transform: scale(1.25); }
}
.mp-evo-orbit { animation: mp-evo-orbit-pop 1.4s ease-in-out infinite; }
@keyframes mp-evo-pet-in {
  0% { transform: scale(.2); opacity: 0; }
  60% { transform: scale(1.12); opacity: 1; }
  100% { transform: scale(1); opacity: 1; }
}
.mp-evo-pet { animation: mp-evo-pet-in .6s cubic-bezier(.2,1.4,.4,1) both; }
`

const sceneStyle: CSSProperties = {
  position: 'absolute', inset: 0, overflow: 'hidden',
  fontFamily: FONT.family,
}
const bgStyle: CSSProperties = {
  position: 'absolute', inset: 0,
  width: '100%', height: '100%', objectFit: 'fill',
}

/* 资源牌数字（牌右半区居中） */
const pillNumPlace = (bbox: [number, number, number, number]): CSSProperties => ({
  left: (bbox[0] + (bbox[2] - bbox[0]) * 0.45) * K,
  top: bbox[1] * K,
  width: (bbox[2] - bbox[0]) * 0.43 * K,
  height: (bbox[3] - bbox[1]) * K,
})
const pillNumStyle: CSSProperties = {
  position: 'absolute',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  fontWeight: 900, fontSize: 24, color: '#9a6a24',
  textShadow: '0 2px 0 rgba(255,255,255,.8)',
}
const pkBtnStyle: CSSProperties = {
  position: 'absolute', right: 40, top: 92,
  height: 34, padding: '0 16px', borderRadius: 999, border: 'none',
  background: 'linear-gradient(180deg,#ffb35c,#ff9f33)',
  color: '#fff', fontWeight: 900, fontSize: 15,
  boxShadow: '0 4px 0 #e07f1a', cursor: 'pointer',
}

const heroBtnStyle: CSSProperties = {
  border: 'none', background: 'transparent', padding: 0, cursor: 'pointer',
}
const cheerStyle: CSSProperties = {
  position: 'absolute', top: -6, right: -30,
  padding: '6px 14px', borderRadius: 999,
  background: '#fff0f5', border: '2px solid #ffb3c8',
  color: '#e0638f', fontWeight: 900, fontSize: 16, whiteSpace: 'nowrap',
}

const nameStyle: CSSProperties = {
  position: 'absolute', left: 224, top: 415, width: 418, // 面板居中（非舞台居中）
  textAlign: 'center',
  fontWeight: 900, fontSize: 22, color: '#8a6d3b',
  pointerEvents: 'none',
}

const lvBadgeStyle: CSSProperties = {
  position: 'absolute',
  padding: '2px 10px', borderRadius: 999,
  background: '#f6b929', color: '#fff', fontWeight: 900, fontSize: 15,
  boxShadow: '0 3px 0 #d4940a',
}
const expTextStyle: CSSProperties = {
  position: 'absolute',
  display: 'flex', alignItems: 'center',
  fontWeight: 900, fontSize: 15, color: '#a08a5a',
}

const evoHintStyle: CSSProperties = {
  position: 'absolute', left: 224, top: 467, width: 418, // 进度条（底 465）与相框（顶 481）之间
  textAlign: 'center',
  fontWeight: 900, fontSize: 13, color: '#e0638f',
  pointerEvents: 'none',
}

const frameLabelStyle: CSSProperties = {
  position: 'absolute', left: 0, right: 0, bottom: '9%',
  textAlign: 'center',
  fontWeight: 900, fontSize: 12, color: '#b08d4a',
  pointerEvents: 'none',
}

const roundBtnStyle: CSSProperties = {
  position: 'absolute', left: 0, top: 0, width: '100%', height: '78%',
  border: 'none', background: 'transparent', padding: 0,
}
const roundBtnImgStyle: CSSProperties = {
  width: '100%', height: '100%', objectFit: 'contain',
}
const foodBubbleStyle: CSSProperties = {
  position: 'absolute', top: -22, left: '50%', transform: 'translateX(-50%)',
  padding: '2px 12px', borderRadius: 999,
  background: '#fff', border: '2px solid #ffd9e6',
  fontWeight: 900, fontSize: 14, color: '#e0638f', whiteSpace: 'nowrap',
  boxShadow: '0 3px 6px rgba(200,100,140,.18)',
  zIndex: 2,
}
/* 按钮名标签：容器内底部（不再负偏移贴面板边） */
const btnLabelStyle: CSSProperties = {
  position: 'absolute', left: 0, right: 0, bottom: 0,
  textAlign: 'center',
  fontWeight: 900, fontSize: 15, color: '#a08a5a',
  pointerEvents: 'none',
}

const gridLockLabelStyle: CSSProperties = {
  position: 'absolute', left: 0, right: 0, bottom: '4%',
  textAlign: 'center',
  fontWeight: 800, fontSize: 12, color: '#9aa6b0',
}
const gridOwnStyle: CSSProperties = {
  position: 'absolute', top: '6%', left: '6%',
  padding: '1px 8px', borderRadius: 999, background: '#7ed957',
  color: '#fff', fontWeight: 800, fontSize: 12,
}

const feedFlyStyle: CSSProperties = {
  position: 'absolute', top: 380, left: '50%', transform: 'translateX(-50%)',
  padding: '8px 20px', borderRadius: 999,
  background: '#e8f5e9', border: '2px solid #7ed957',
  color: '#3e9c4c', fontWeight: 900, fontSize: 18, whiteSpace: 'nowrap',
  zIndex: 30,
}

/* 进化仪式 */
const ceremonyMaskStyle: CSSProperties = {
  position: 'absolute', inset: 0, zIndex: 60, overflow: 'hidden',
  background: 'radial-gradient(circle at 50% 40%, rgba(80,60,160,.55), rgba(20,30,80,.78))',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  fontFamily: FONT.family,
}
const beamStyle: CSSProperties = {
  position: 'absolute', left: '50%', top: '42%',
  width: '160%', aspectRatio: '1',
  background: 'conic-gradient(from 0deg, rgba(255,236,150,.5) 0deg 14deg, transparent 14deg 36deg, rgba(255,236,150,.5) 36deg 50deg, transparent 50deg 72deg, rgba(255,236,150,.5) 72deg 86deg, transparent 86deg 108deg, rgba(255,236,150,.5) 108deg 122deg, transparent 122deg 144deg, rgba(255,236,150,.5) 144deg 158deg, transparent 158deg 180deg, rgba(255,236,150,.5) 180deg 194deg, transparent 194deg 216deg, rgba(255,236,150,.5) 216deg 230deg, transparent 230deg 252deg, rgba(255,236,150,.5) 252deg 266deg, transparent 266deg 288deg, rgba(255,236,150,.5) 288deg 302deg, transparent 302deg 324deg, rgba(255,236,150,.5) 324deg 338deg, transparent 338deg 360deg)',
  maskImage: 'radial-gradient(circle, #000 12%, rgba(0,0,0,.5) 46%, transparent 68%)',
  WebkitMaskImage: 'radial-gradient(circle, #000 12%, rgba(0,0,0,.5) 46%, transparent 68%)',
}
const orbitIconStyle: CSSProperties = {
  position: 'absolute', width: 44, height: 44, objectFit: 'contain',
  filter: 'drop-shadow(0 4px 8px rgba(0,0,0,.3))',
}
const ceremonyCardStyle: CSSProperties = {
  position: 'relative', zIndex: 2,
  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10,
}
const ceremonyTitleStyle: CSSProperties = {
  fontSize: 44, fontWeight: 900, color: '#ffe98a',
  textShadow: '0 3px 0 rgba(150,90,10,.6), 0 8px 18px rgba(0,0,0,.4)',
}
const ceremonyImgStyle: CSSProperties = {
  width: 260, height: 260, objectFit: 'contain',
  filter: 'drop-shadow(0 12px 22px rgba(0,0,0,.45))',
}
const ceremonyFormStyle: CSSProperties = {
  fontSize: 24, fontWeight: 900, color: '#fff',
}
const ceremonyBtnStyle: CSSProperties = {
  marginTop: 8, height: 54, padding: '0 40px', borderRadius: 999, border: 'none',
  background: 'linear-gradient(180deg,#ffd83d,#ffb020)',
  color: '#7a4a12', fontWeight: 900, fontSize: 21,
  boxShadow: '0 6px 0 #e08f00',
  cursor: 'pointer',
}
