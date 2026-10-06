// ============================================================================
// HomeScene —— P4 首页（纯学习枢纽，M2 样板页 / 高保真拆层重建）
//
// 视觉按 design/high-fi/home.png 经 layer_decomposition 拆层重建：
//   z0 草地天空背景 / z1 顶栏玻璃底板 / z8 趴兔 / z9 益智乐园钮 /
//   z10 卡蓝底 / z11 玻璃白卡 / z13 闹钟书 —— 见 assets/hifi/home/manifest.json
// 主角仍为 PaperDoll 运行时合成（换装依赖，拆层人物 z7 丢弃，仅取其 bbox 定位）；
// 用户名/天数/卡文等动态内容前端排版；标签/CTA/圆点 CSS（3 卡复用）。
//
// 功能（不变）：顶栏（头像/名/连学/累计/齿轮→P13）；左列主角+兔+益智乐园→P5；
//   右侧 3 卡手动轮播（练口算可进；真题/错题本"即将开放"）；连学卡弹 ChestPanel；
//   已打卡不置灰练口算；滑动与点击不冲突。
// 场景运行在 1024×768 逻辑舞台，原稿 2048×1536，坐标 ×K（K=.5）定位。
// ============================================================================
import { PaperDoll } from '@mathpaws/paperdoll'
import { FONT } from '@mathpaws/ui'
import { useEffect, useMemo, useRef, useState, type CSSProperties, type PointerEvent, type ReactNode } from 'react'

import type { RouteId } from '../app/router'
import alarmBooks from '../assets/hifi/home/alarm-books.webp'
import bg from '../assets/hifi/home/bg.jpg'
import btnPlaza from '../assets/hifi/home/btn-plaza.webp'
import rabbitLie from '../assets/hifi/home/rabbit-lie.webp'
import gearIcon from '../assets/img/icons/gear@2x.webp'
import chestIcon from '../assets/img/icons/i-chest@2x.webp'
import notebookIcon from '../assets/img/icons/i-notebook@2x.webp'
import platform from '../assets/ui/p16-platform.webp'
import { ChestPanel } from '../components/ChestPanel'
import { comingSoon, toastMessage } from '../components/ComingSoonToast'
import { buildLayers, equippedToSelection } from '../paperdoll/catalog'
import { useEquippedStore } from '../stores/useEquippedStore'
import { usePlayerStore } from '../stores/usePlayerStore'
import { useStreakStore } from '../stores/useStreakStore'
import { dayKey } from '../utils/id'
import { preloadIdle } from '../utils/preload'
import { audio } from '../utils/audio'
// 拆层资产（台账见同目录 manifest.json）
// 注意：topbar.webp / card-panel.webp 被模型重绘成"不透明灰"（alpha≈254），
// 半透明玻璃必须前端 CSS 绘制（spec §2），故两者弃用不入渲染，仅留档。
// 其余

const K = 0.5
/** 原稿绝对 bbox → 逻辑像素定位 */
const place = (bbox: [number, number, number, number]): CSSProperties => {
  const [x0, y0, x1, y1] = bbox
  return { position: 'absolute', left: x0 * K, top: y0 * K, width: (x1 - x0) * K, height: (y1 - y0) * K }
}

// 顶栏毛玻璃（z1 形态：白色半透明 + 白边 + blur；模型重绘的灰位图弃用）
const glassTopBarStyle: CSSProperties = {
  borderRadius: 999,
  background: 'linear-gradient(180deg,rgba(255,255,255,.72),rgba(232,246,255,.55))',
  border: '3px solid rgba(255,255,255,.75)',
  boxShadow: '0 8px 20px rgba(50,110,170,.18), inset 0 2px 6px rgba(255,255,255,.7)',
  backdropFilter: 'blur(4px)',
  pointerEvents: 'none',
}

// 学习卡毛玻璃（z11 形态：白色磨砂 + 白边高光；灰位图弃用）
const glassCardStyle: CSSProperties = {
  borderRadius: 30,
  background: 'linear-gradient(180deg,rgba(255,255,255,.82),rgba(240,249,255,.66))',
  border: '4px solid rgba(255,255,255,.85)',
  boxShadow: '0 18px 36px rgba(50,100,160,.22), inset 0 2px 10px rgba(255,255,255,.8)',
  backdropFilter: 'blur(3px)',
}

// 卡片叠放几何（逻辑像素，相对卡区视窗左上 = 白卡 z11 左上 553.5,182）
const CARD_W = 368.5
const CARD_H = 504.5
// 堆叠参数在下方 VIEW/STACK_* 常量定义（纵向 deck，后方卡向下错位缩小）

export function HomeScene({ onNavigate }: { onNavigate: (id: RouteId) => void }) {
  const equipped = useEquippedStore(s => s.equipped)
  const heroName = usePlayerStore(s => s.heroName)
  const streak = useStreakStore(s => s.streak)
  const totalDays = useStreakStore(s => s.totalDays)
  const chestLastOpened = useStreakStore(s => s.chestLastOpened)
  const lastStudyDate = useStreakStore(s => s.lastStudyDate)

  const [chestOpen, setChestOpen] = useState(false)

  // 停留首页期间后台预取广场等非关键 2D 资源
  useEffect(() => preloadIdle(), [])

  const layers = useMemo(() => buildLayers(equippedToSelection(equipped)), [equipped])
  const claimedToday = chestLastOpened === dayKey()
  const studiedToday = lastStudyDate === dayKey()

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', fontFamily: FONT.family }}>
      {/* z0 背景 */}
      <img src={bg} alt="" draggable={false} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'fill' }} />

      {/* 顶栏：z1 玻璃底板（CSS 毛玻璃，重绘灰位图弃用）+ 前端排版内容 */}
      <div aria-hidden style={{ ...place([80, 70, 1968, 261]), ...glassTopBarStyle }} />
      <HomeTopBar
        layers={layers}
        heroName={heroName || '小朋友'}
        streak={streak}
        totalDays={totalDays}
        onSettings={() => onNavigate('settings')}
      />

      {/* 左列：圆台 + PaperDoll 主角 + 脚边趴兔（不可点） */}
      <HeroStage layers={layers} onEnterPlaza={() => onNavigate('plaza')} />

      {/* 右侧：3 卡手动轮播 + 圆点 */}
      <StudyCardCarousel
        streak={streak}
        claimedToday={claimedToday}
        studiedToday={studiedToday}
        onOpenChest={() => setChestOpen(true)}
        onNavigate={onNavigate}
      />

      {chestOpen && <ChestPanel onClose={() => setChestOpen(false)} />}
    </div>
  )
}

// ---------------------------------------------------------------------------
// 顶栏：头像 / 昵称 / 连学 / 累计 / 齿轮（坐标取自拆层 bbox z2-z6）
// ---------------------------------------------------------------------------
function HomeTopBar({
  layers, heroName, streak, totalDays, onSettings,
}: {
  layers: ReturnType<typeof buildLayers>
  heroName: string
  streak: number
  totalDays: number
  onSettings: () => void
}) {
  return (
    <>
      {/* 头像：圆形容器内裁出纸娃娃头肩（z2 bbox） */}
      <div
        style={{
          ...place([113, 98, 247, 232]),
          borderRadius: '50%', overflow: 'hidden',
          background: '#eaf6ff', border: '3px solid #fff',
          boxShadow: '0 3px 8px rgba(60,120,180,.25)',
          pointerEvents: 'none',
        }}
      >
        <div style={{ position: 'relative', width: '300%', aspectRatio: '1 / 1', top: '-48%', left: '-100%' }}>
          <PaperDoll layers={layers} background="white" />
        </div>
      </div>

      {/* 用户名（z3 bbox） */}
      <span
        style={{
          position: 'absolute', left: 273 * K, top: 139 * K,
          fontWeight: 900, color: '#3d3833', fontSize: 27, lineHeight: 1.2,
          maxWidth: 200, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}
      >
        {heroName}
      </span>

      {/* 连学 / 累计胶囊（z4/z5 bbox） */}
      <TopPill text={`连学${streak}天`} bbox={[1236, 123, 1474, 210]} />
      <TopPill text={`累计${totalDays}天`} bbox={[1516, 123, 1770, 210]} />

      {/* 齿轮（z6 bbox） */}
      <button
        aria-label="设置"
        className="mp-btn"
        onClick={() => { audio.playSfx('click'); onSettings() }}
        style={{ ...place([1828, 119, 1918, 212]), border: 'none', background: 'transparent', padding: 0, cursor: 'pointer' }}
      >
        <img src={gearIcon} alt="" draggable={false} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
      </button>
    </>
  )
}

function TopPill({ text, bbox }: { text: string; bbox: [number, number, number, number] }) {
  return (
    <span
      style={{
        ...place(bbox),
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        borderRadius: 999, background: 'rgba(255,255,255,.92)',
        color: '#4a5a6a', fontWeight: 800, fontSize: 21,
        boxShadow: '0 2px 6px rgba(60,110,160,.12)',
      }}
    >
      {text}
    </span>
  )
}

// ---------------------------------------------------------------------------
// 左列：圆台 + PaperDoll 立绘 + 趴兔 + 益智乐园位图大按钮（z9）
// 人物定位锚点取拆层 z7 bbox [329,343,804,1163]（图层丢弃）。
// ---------------------------------------------------------------------------
function HeroStage({
  layers, onEnterPlaza,
}: {
  layers: ReturnType<typeof buildLayers>
  onEnterPlaza: () => void
}) {
  // PaperDoll 为 1:1 canvas；容器覆盖 z7 bbox（逻辑 237.5×410），取正方形边长 410 居中
  const box = 410
  const centerX = ((329 + 804) / 2) * K // 283.25
  return (
    <>
      {/* 圆台（旧资产 p16-platform，原稿 z7 底座形态近似） */}
      <img
        src={platform} alt="" aria-hidden draggable={false}
        style={{
          position: 'absolute', left: centerX - 119, top: 518,
          width: 238, height: 'auto', zIndex: 1, pointerEvents: 'none',
        }}
      />

      {/* PaperDoll 主角（可随装扮变） */}
      <div
        className="mp-doll-bob-wrap"
        style={{
          position: 'absolute', left: centerX - box / 2, top: 168,
          width: box, height: box, zIndex: 2, pointerEvents: 'none',
          animation: 'mp-doll-bob 3.4s ease-in-out infinite',
        }}
      >
        <PaperDoll layers={layers} background="transparent" />
      </div>

      {/* 趴兔 z8 */}
      <img
        src={rabbitLie} alt="雪球兔" draggable={false}
        style={{ ...place([127, 863, 410, 1173]), zIndex: 3, pointerEvents: 'none', animation: 'mp-float 3.8s ease-in-out infinite' }}
      />

      {/* 益智乐园 z9：位图按钮（固定文案），透明按钮覆盖 */}
      <img src={btnPlaza} alt="" aria-hidden draggable={false} style={{ ...place([178, 1163, 941, 1393]), zIndex: 4, pointerEvents: 'none' }} />
      <button
        type="button" aria-label="进入益智乐园"
        className="mp-btn"
        onClick={() => { audio.playSfx('click'); onEnterPlaza() }}
        style={{ ...place([178, 1163, 941, 1393]), zIndex: 5, border: 'none', background: 'transparent', padding: 0, cursor: 'pointer' }}
      />
    </>
  )
}

// ---------------------------------------------------------------------------
// 右侧：3 卡手动轮播（pointer 拖拽；不自动轮播）
// 视窗对齐白卡 z11 + 蓝底 z10 的并集；每页自带白卡/蓝底位图随轨道一起横滑。
// ---------------------------------------------------------------------------
type CardTone = 'grass' | 'sky' | 'orange'

interface StudyCardDef {
  id: string
  tag: string
  tone: CardTone
  cta: string
  /** 点击跳转目标；null = 本期未开放，弹统一"即将开放"提示 */
  target: RouteId | null
}

const STUDY_CARDS: StudyCardDef[] = [
  { id: 'streak', tag: '连学打卡', tone: 'grass', cta: '练口算', target: 'quiz' },
  { id: 'real', tag: '真题大挑战', tone: 'sky', cta: '开始挑战', target: null },
  { id: 'wrong', tag: '错题本', tone: 'orange', cta: '去复习', target: null },
]

// 横向卡牌堆叠轮播（horizontal card stack/deck，coverflow 式）：
// 前卡在左前排满，后面的卡在其右侧逐级右移+缩小+渐淡；
// 左滑 → 前卡向左移出淡出，右后方卡逐级"滑"到前排；右滑 → 上一张从左侧滑回。
// 视窗上移到 166（给顶部外凸标签留 16px，标签在卡顶上方 10.5px），右缘留 peek。
const VIEW = { left: 553.5, top: 166, width: 417.5, height: 592 }
const CARD_TOP = 16 // 卡在视窗内的 top（使卡顶仍在逻辑 182）
const STACK_X = 46 // 后方每张卡向右错位（< 卡宽，形成叠压）
const STACK_SCALE = 0.06 // 后方每张缩小
const SWIPE_X = 96 // 横向左/右滑触发距离
const clamp01 = (v: number) => Math.min(1, Math.max(0, v))

function StudyCardCarousel({
  streak, claimedToday, studiedToday, onOpenChest, onNavigate,
}: {
  streak: number
  claimedToday: boolean
  studiedToday: boolean
  onOpenChest: () => void
  onNavigate: (id: RouteId) => void
}) {
  const [index, setIndex] = useState(0)
  const [drag, setDrag] = useState(0)
  const startX = useRef<number | null>(null)
  const capturedId = useRef<number | null>(null)
  const draggedRef = useRef(false)
  const DRAG_START = 8

  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    startX.current = e.clientX
    capturedId.current = null
    draggedRef.current = false
  }
  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    if (startX.current === null) return
    const delta = e.clientX - startX.current
    if (capturedId.current === null && Math.abs(delta) > DRAG_START) {
      capturedId.current = e.pointerId
      draggedRef.current = true
      try { e.currentTarget.setPointerCapture(e.pointerId) } catch { /* 已释放 */ }
    }
    if (capturedId.current !== null) {
      let d = delta
      // 边界阻尼：首卡不能再向右拉出上一张、末卡不能再向左
      if ((index === 0 && d > 0) || (index === STUDY_CARDS.length - 1 && d < 0)) d *= 0.35
      setDrag(d)
    }
  }
  const finishDrag = () => {
    if (startX.current === null) return
    if (capturedId.current !== null) {
      if (drag <= -SWIPE_X && index < STUDY_CARDS.length - 1) {
        setIndex(i => i + 1)
        audio.playSfx('open')
      } else if (drag >= SWIPE_X && index > 0) {
        setIndex(i => i - 1)
        audio.playSfx('open')
      }
    }
    startX.current = null
    capturedId.current = null
    setDrag(0)
  }

  const qLeft = clamp01(-drag / SWIPE_X) // 左滑切下一张进度
  const qRight = clamp01(drag / SWIPE_X) // 右滑回上一张进度
  const moving = drag !== 0

  /**
   * 第 i 张卡的堆叠变换。
   * 静止：d=0 前排；d≥1 在右侧错位缩小；d<0 隐于左侧。
   */
  const frameOf = (i: number): { x: number; scale: number; opacity: number } => {
    const d = i - index
    // —— 左滑：前卡左移淡出；d≥1 后方卡向各自前一级位置插值 ——
    if (qLeft > 0 && d >= 0) {
      if (d === 0) return { x: drag, scale: 1, opacity: 1 - qLeft * 0.9 }
      const x0 = d * STACK_X
      const x1 = (d - 1) * STACK_X
      const s0 = Math.max(1 - d * STACK_SCALE, 0.72)
      const s1 = Math.max(1 - (d - 1) * STACK_SCALE, 0.72)
      const op0 = d === 1 ? 1 : d === 2 ? 0.7 : 0
      const op1 = d <= 2 ? 1 : 0.7
      return { x: x0 + (x1 - x0) * qLeft, scale: s0 + (s1 - s0) * qLeft, opacity: op0 + (op1 - op0) * qLeft }
    }
    // —— 右滑：前卡右缩退到后排；d=-1 从左侧滑回 ——
    if (qRight > 0) {
      if (d === 0) return { x: STACK_X * qRight, scale: 1 - STACK_SCALE * qRight, opacity: 1 }
      if (d === -1) return { x: -96 * (1 - qRight), scale: 1 - STACK_SCALE * (1 - qRight), opacity: qRight }
      if (d >= 1) {
        return { x: d * STACK_X, scale: Math.max(1 - d * STACK_SCALE, 0.72), opacity: d === 1 ? 1 : 0.7 }
      }
      return { x: -96, scale: 0.94, opacity: 0 }
    }
    // —— 静止态 ——
    if (d === 0) return { x: 0, scale: 1, opacity: 1 }
    if (d >= 1) {
      return {
        x: d * STACK_X,
        scale: Math.max(1 - d * STACK_SCALE, 0.72),
        opacity: d === 1 ? 1 : d === 2 ? 0.7 : 0,
      }
    }
    return { x: -96, scale: 0.94, opacity: 0 }
  }

  return (
    <>
      <div
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={finishDrag}
        onPointerCancel={finishDrag}
        style={{
          position: 'absolute', left: VIEW.left, top: VIEW.top, width: VIEW.width, height: VIEW.height,
          overflow: 'hidden', touchAction: 'pan-y', userSelect: 'none',
          cursor: 'grab',
        }}
      >
        {STUDY_CARDS.map((card, i) => {
          const d = i - index
          if (d < -1 || d > 2) return null
          const f = frameOf(i)
          // 回退中的上一张(d=-1)盖最上；前卡其次；越靠后层级越低
          const z = d === -1 ? 11 : 10 - d
          return (
            <div
              key={card.id}
              style={{
                position: 'absolute', left: 0, top: CARD_TOP, width: CARD_W, height: CARD_H,
                transform: `translateX(${f.x}px) scale(${f.scale})`,
                transformOrigin: 'left center',
                transition: moving ? 'none' : 'transform .34s cubic-bezier(.22,.9,.3,1), opacity .3s ease',
                opacity: f.opacity, zIndex: z,
                visibility: f.opacity <= 0.02 ? 'hidden' : 'visible',
              }}
            >
              <StudyCard
                card={card}
                streak={streak}
                claimedToday={claimedToday}
                studiedToday={studiedToday}
                interactive={d === 0}
                wasDragging={draggedRef}
                onOpenChest={onOpenChest}
                onNavigate={onNavigate}
              />
            </div>
          )
        })}
      </div>

      {/* 圆点指示器（z16 bbox：逻辑 left 688 / top 708 / 宽 91.5） */}
      <div style={{ position: 'absolute', left: 688, top: 712, width: 91.5, display: 'flex', gap: 12, justifyContent: 'center' }}>
        {STUDY_CARDS.map((c, i) => (
          <button
            key={c.id}
            aria-label={`第 ${i + 1} 张卡片`}
            className="mp-btn"
            onClick={() => { audio.playSfx('click'); setIndex(i) }}
            style={{
              width: i === index ? 24 : 12, height: 12, borderRadius: 999,
              border: 'none', cursor: 'pointer', padding: 0,
              background: i === index
                ? 'linear-gradient(180deg,#86db6c,#46ac33)'
                : 'rgba(255,255,255,.85)',
              boxShadow: i === index ? '0 2px 5px rgba(60,140,50,.4)' : 'inset 0 0 0 2px rgba(180,210,235,.6)',
            }}
          />
        ))}
      </div>
    </>
  )
}

const TONE: Record<CardTone, { tagBg: string; btnBg: string; btnShadow: string }> = {
  grass: {
    tagBg: 'linear-gradient(180deg,#ffe9a8,#ffd35e 60%,#f0b23a)',
    btnBg: 'linear-gradient(180deg,#9be37c 0%,#70cc52 42%,#4cb838 72%,#3ba02c 100%)',
    btnShadow: '0 7px 16px rgba(45,130,35,.34), inset 0 3px 6px rgba(255,255,255,.65), inset 0 -6px 10px rgba(30,110,20,.26)',
  },
  sky: {
    tagBg: 'linear-gradient(180deg,#bfe8ff,#7cc4f2 60%,#4ea9e8)',
    btnBg: 'linear-gradient(180deg,#8ed7fb 0%,#5cb6ee 42%,#40a2e4 72%,#3190d2 100%)',
    btnShadow: '0 7px 16px rgba(40,120,180,.34), inset 0 3px 6px rgba(255,255,255,.65), inset 0 -6px 10px rgba(20,85,140,.26)',
  },
  orange: {
    tagBg: 'linear-gradient(180deg,#ffd8a6,#ffa84d 60%,#f08a1e)',
    btnBg: 'linear-gradient(180deg,#ffc890 0%,#ff9f55 42%,#fb8328 72%,#ec7017 100%)',
    btnShadow: '0 7px 16px rgba(200,110,25,.34), inset 0 3px 6px rgba(255,255,255,.65), inset 0 -6px 10px rgba(150,70,10,.26)',
  },
}

// 单卡以视窗左上为原点（白卡 0,0 368.5×504.5；底板为 CSS 毛玻璃，蓝边由轮播容器固定绘制）
function StudyCard({
  card, streak, claimedToday, studiedToday, interactive, wasDragging, onOpenChest, onNavigate,
}: {
  card: StudyCardDef
  streak: number
  claimedToday: boolean
  /** 当天是否已完成 ≥1 轮答题（打卡入口门控） */
  studiedToday: boolean
  /** 仅当前卡可交互（邻卡滑动中不响应点击） */
  interactive: boolean
  /** 本次按下是否发生了拖动（拖动结束的残余 click 不触发） */
  wasDragging: { current: boolean }
  onOpenChest: () => void
  onNavigate: (id: RouteId) => void
}) {
  const tone = TONE[card.tone]

  const bodyClick = () => {
    if (!interactive || wasDragging.current) return
    if (card.id === 'streak') {
      // 未学习：入口硬拦截，直接提示，不打开宝箱弹框
      if (!studiedToday) {
        toastMessage('先完成 1 轮口算，再来打卡领奖', '⏰')
        return
      }
      // 已领取：也拦截，避免空弹框
      if (claimedToday) {
        toastMessage('今日已领取，明天再来打卡哦', '🎁')
        return
      }
      audio.playSfx('open')
      onOpenChest()
    }
  }

  return (
    <div
      onClick={bodyClick}
      role={card.id === 'streak' ? 'button' : undefined}
      style={{
        ...glassCardStyle,
        position: 'absolute', left: 0, top: 0, width: CARD_W, height: CARD_H,
        boxSizing: 'border-box',
        cursor: card.id === 'streak' ? 'pointer' : 'default',
      }}
    >
      {/* 顶部标签（z12 位） */}
      <div
        style={{
          position: 'absolute', top: -10.5, left: '50%', transform: 'translateX(-50%)',
          padding: '7px 24px', borderRadius: 999, whiteSpace: 'nowrap',
          fontWeight: 900, fontSize: 21, color: '#7a5410',
          background: tone.tagBg,
          boxShadow: '0 4px 8px rgba(150,110,20,.25), inset 0 2px 3px rgba(255,255,255,.7)',
        }}
      >
        {card.tag}
      </div>

      {card.id === 'streak'
        ? <CardStreakBody claimedToday={claimedToday} studiedToday={studiedToday} streak={streak} />
        : card.id === 'real'
          ? <CardRealBody />
          : <CardWrongBody />}

      {/* CTA（z15 位，CSS 渐变钮，3 卡文案不同） */}
      <button
        type="button"
        className="mp-btn"
        onClick={(e) => {
          e.stopPropagation()
          if (!interactive || wasDragging.current) return
          if (!card.target) { comingSoon(); return }
          audio.playSfx('click')
          onNavigate(card.target)
        }}
        style={{
          position: 'absolute', left: 106, top: 405.5, width: 154, height: 62,
          border: 'none', borderRadius: 999, cursor: 'pointer',
          fontFamily: FONT.family, fontWeight: 900, fontSize: 24, color: '#fff',
          textShadow: '0 1px 2px rgba(0,0,0,.2)',
          background: tone.btnBg, boxShadow: tone.btnShadow, padding: 0,
        }}
      >
        {card.cta}
      </button>
    </div>
  )
}

function CardArt({ children }: { children: ReactNode }) {
  return (
    <div style={{ position: 'absolute', left: 0, top: 66, width: 368.5, height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      {children}
    </div>
  )
}

function CardStreakBody({ claimedToday, studiedToday, streak }: { claimedToday: boolean; studiedToday: boolean; streak: number }) {
  if (claimedToday) {
    return (
      <>
        <CardArt>
          <img src={chestIcon} alt="" draggable={false} style={{ height: 200, objectFit: 'contain', animation: 'mp-float 3s ease-in-out infinite' }} />
        </CardArt>
        <div style={{ position: 'absolute', top: 300, left: 0, width: 368.5, textAlign: 'center' }}>
          <div style={{ fontWeight: 900, fontSize: 24, color: '#5a4a3a' }}>今日已打卡</div>
          <div style={{ fontSize: 15, color: '#8a98a5', marginTop: 6 }}>奖励已领取，可以继续练习口算</div>
        </div>
      </>
    )
  }
  return (
    <>
      {/* 闹钟+书 z13（页内 bbox：left 71.5 top 66.5 231×220） */}
      <img src={alarmBooks} alt="" draggable={false}
        style={{ position: 'absolute', left: 71.5, top: 66.5, width: 231, height: 220, objectFit: 'contain', pointerEvents: 'none', opacity: studiedToday ? 1 : 0.7 }} />
      <div style={{ position: 'absolute', top: 315, left: 0, width: 368.5, textAlign: 'center', fontWeight: 900, fontSize: 24, color: '#5a4a3a' }}>
        {studiedToday
          ? (streak > 0 ? `已连续学习${streak}天` : '今天开始连学打卡吧')
          : '完成 1 轮口算后可打卡'}
      </div>
      <div style={{ position: 'absolute', top: 352, left: 0, width: 368.5, display: 'flex', gap: 6, justifyContent: 'center' }}>
        {Array.from({ length: 5 }).map((_, i) => <GoldStar key={i} size={26} filled={studiedToday && i < Math.max(1, streak)} />)}
      </div>
    </>
  )
}

function CardRealBody() {
  return (
    <>
      <CardArt>
        <div
          style={{
            position: 'relative', width: 168, height: 112,
            background: '#fff', borderRadius: 18,
            boxShadow: '0 10px 20px rgba(80,120,170,.22), inset 0 0 0 3px #e8f1f8',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            transform: 'rotate(-3deg)',
          }}
        >
          {['#7cc96a', '#59b2ec', '#ff9d4d'].map((c, i) => (
            <span
              key={c}
              style={{
                width: 42, height: 42, borderRadius: '50%',
                background: c, color: '#fff', fontWeight: 900, fontSize: 22,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 3px 6px rgba(0,0,0,.15)',
              }}
            >
              {['A', 'B', 'C'][i]}
            </span>
          ))}
        </div>
      </CardArt>
      <CardText title="真题大挑战" desc="选择 ABC，巩固课堂知识" />
    </>
  )
}

function CardWrongBody() {
  return (
    <>
      <CardArt>
        <img src={notebookIcon} alt="" draggable={false} style={{ height: 200, objectFit: 'contain' }} />
      </CardArt>
      <CardText title="错题本" desc="做错的题在这里，重做还能赢贝壳" />
    </>
  )
}

function CardText({ title, desc }: { title: string; desc: string }) {
  return (
    <div style={{ position: 'absolute', top: 300, left: 0, width: 368.5, textAlign: 'center' }}>
      <div style={{ fontWeight: 900, fontSize: 24, color: '#3d4a57', marginBottom: 6 }}>{title}</div>
      <div style={{ fontSize: 15, color: '#7c8b99' }}>{desc}</div>
    </div>
  )
}

function GoldStar({ size, filled, style }: { size: number; filled: boolean; style?: CSSProperties }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden style={{ opacity: filled ? 1 : 0.35, ...style }}>
      <path
        d="M12 2.2l2.9 5.9 6.5.95-4.7 4.58 1.11 6.47L12 17.1l-5.81 3.06 1.11-6.47L2.6 9.05l6.5-.95z"
        fill="#FFD24A" stroke="#E69A24" strokeWidth="1" strokeLinejoin="round"
      />
    </svg>
  )
}
