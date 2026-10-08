// ============================================================================
// HomeScene —— P4 首页（纯学习枢纽，M2 样板页 / 高保真拆层重建）
//
// 视觉按 design/high-fi/home/home.png 经 layer_decomposition 拆层重建：
//   z0 草地天空背景 / z1 顶栏玻璃底板 / z8 趴兔 / z9 益智乐园钮 /
//   z10 卡蓝底 / z11 玻璃白卡 / z13 闹钟书 —— 见 assets/hifi/home/manifest.json
// 主角仍为 PaperDoll 运行时合成（换装依赖，拆层人物 z7 丢弃，仅取其 bbox 定位）；
// 用户名/天数/卡文等动态内容前端排版；标签/CTA/圆点 CSS（3 卡复用）。
//
// 功能（不变）：顶栏（头像/名/连学/累计/齿轮→P13）；左列主角+兔+益智乐园→P5；
//   右侧 3 卡手动轮播（练口算可进；真题/错题本"即将开放"）；连学卡弹 ChestPanel；
//   已打卡不置灰练口算；滑动与点击不冲突。
// 内容包在 1024×768 LogicalStage 内（原稿 2048×1536，坐标 ×K(0.5) 折算的逻辑像素
//   已固化到 HomeScene.css.ts）；舞台外留边由 BackgroundBleed 以同背景 cover 填充。
// ============================================================================
import { PaperDoll } from '@mathpaws/paperdoll'
import { btn as uiBtn } from '@mathpaws/ui'
import { useEffect, useMemo, useRef, useState, type CSSProperties, type PointerEvent, type ReactNode } from 'react'

import type { RouteId } from '../../app/router'
import { SceneShell } from '../../app/viewport'
import alarmBooks from '../../assets/hifi/home/alarm-books.webp'
import bg from '../../assets/hifi/home/bg.jpg'
import btnPlaza from '../../assets/hifi/home/btn-plaza.webp'
import rabbitLie from '../../assets/hifi/home/rabbit-lie.webp'
import gearIcon from '../../assets/img/icons/gear@2x.webp'
import chestIcon from '../../assets/img/icons/i-chest@2x.webp'
import notebookIcon from '../../assets/img/icons/i-notebook@2x.webp'
import platform from '../../assets/ui/p16-platform.webp'
import { ChestPanel } from '../../components/ChestPanel/ChestPanel'
import { comingSoon, toastMessage } from '../../components/ComingSoonToast/ComingSoonToast'
import { buildLayers, equippedToSelection } from '../../paperdoll/catalog'
import { useEquippedStore } from '../../stores/useEquippedStore'
import { usePlayerStore } from '../../stores/usePlayerStore'
import { useStreakStore } from '../../stores/useStreakStore'
import { dayKey } from '../../utils/id'
import { preloadIdle } from '../../utils/preload'
import { audio } from '../../utils/audio'
import * as s from './HomeScene.css'
// 拆层资产（台账见同目录 manifest.json）
// 注意：topbar.webp / card-panel.webp 被模型重绘成"不透明灰"（alpha≈254），
// 半透明玻璃必须前端 CSS 绘制（spec §2），故两者弃用不入渲染，仅留档。
// 其余

// 卡片叠放几何（逻辑像素，相对卡区视窗左上 = 白卡 z11 左上 553.5,182）
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
    <div className={s.scene}>
      {/* SceneShell：留边以同一背景图 cover 出血（加载前天空蓝兜底），内容进 1024×768 舞台 */}
      <SceneShell bleed="#7dc9f2" bleedImage={bg}>
        <div className={s.stage}>
          {/* z0 舞台内背景：铺满 1024×768 舞台，随舞台等比缩放不变形 */}
          <img src={bg} alt="" draggable={false} className={s.stageBg} />

          {/* 顶栏：z1 玻璃底板（CSS 毛玻璃，重绘灰位图弃用）+ 前端排版内容 */}
          <div aria-hidden className={s.glassTopBar} />
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
        </div>
      </SceneShell>

      {/* 全屏弹层留在舞台外，保持原有覆盖行为 */}
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
      {/* 头像：圆形容器内裁出纸娃娃头肩（z2 位） */}
      <div className={s.avatar}>
        <div className={s.avatarDoll}>
          <PaperDoll layers={layers} background="white" />
        </div>
      </div>

      {/* 用户名（z3 位） */}
      <span className={s.heroName}>
        {heroName}
      </span>

      {/* 连学 / 累计胶囊（z4/z5 位） */}
      <TopPill text={`连学${streak}天`} className={s.topPillStreak} />
      <TopPill text={`累计${totalDays}天`} className={s.topPillTotal} />

      {/* 齿轮（z6 位） */}
      <button
        aria-label="设置"
        className={`${uiBtn} ${s.gearBtn}`}
        onClick={() => { audio.playSfx('click'); onSettings() }}
      >
        <img src={gearIcon} alt="" draggable={false} className={s.gearIcon} />
      </button>
    </>
  )
}

function TopPill({ text, className }: { text: string; className: string }) {
  return (
    <span className={`${s.topPill} ${className}`}>
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
  return (
    <>
      {/* 圆台（旧资产 p16-platform，原稿 z7 底座形态近似） */}
      <img
        src={platform} alt="" aria-hidden draggable={false}
        className={s.platform}
      />

      {/* PaperDoll 主角（可随装扮变） */}
      <div className={s.dollWrap}>
        <PaperDoll layers={layers} background="transparent" />
      </div>

      {/* 趴兔 z8 */}
      <img
        src={rabbitLie} alt="雪球兔" draggable={false}
        className={s.rabbit}
      />

      {/* 益智乐园 z9：位图按钮（固定文案），透明按钮覆盖 */}
      <img src={btnPlaza} alt="" aria-hidden draggable={false} className={s.plazaBtnImg} />
      <button
        type="button" aria-label="进入益智乐园"
        className={`${uiBtn} ${s.plazaBtn}`}
        onClick={() => { audio.playSfx('click'); onEnterPlaza() }}
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

// 各色调的标签 / CTA 样式类（静态渐变，原 TONE 常量迁入 CSS）
const TONE_CLASS: Record<CardTone, { tag: string; cta: string }> = {
  grass: { tag: s.tagTone.grass, cta: s.ctaTone.grass },
  sky: { tag: s.tagTone.sky, cta: s.ctaTone.sky },
  orange: { tag: s.tagTone.orange, cta: s.ctaTone.orange },
}

// 横向卡牌堆叠轮播（horizontal card stack/deck，coverflow 式）：
// 前卡在左前排满，后面的卡在其右侧逐级右移+缩小+渐淡；
// 左滑 → 前卡向左移出淡出，右后方卡逐级"滑"到前排；右滑 → 上一张从左侧滑回。
// 视窗上移到 166（给顶部外凸标签留 16px，标签在卡顶上方 10.5px），右缘留 peek。
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
        className={s.carousel}
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
              className={s.cardFrame}
              style={{
                transform: `translateX(${f.x}px) scale(${f.scale})`,
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

      {/* 圆点指示器（z16 位） */}
      <div className={s.dots}>
        {STUDY_CARDS.map((c, i) => (
          <button
            key={c.id}
            aria-label={`第 ${i + 1} 张卡片`}
            className={`${uiBtn} ${s.dot} ${i === index ? s.dotActive : ''}`}
            onClick={() => { audio.playSfx('click'); setIndex(i) }}
          />
        ))}
      </div>
    </>
  )
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
  const tone = TONE_CLASS[card.tone]

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
      className={`${s.card} ${card.id === 'streak' ? s.cardClickable : ''}`}
    >
      {/* 顶部标签（z12 位） */}
      <div className={`${s.tag} ${tone.tag}`}>
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
        className={`${uiBtn} ${s.cta} ${tone.cta}`}
        onClick={(e) => {
          e.stopPropagation()
          if (!interactive || wasDragging.current) return
          if (!card.target) { comingSoon(); return }
          audio.playSfx('click')
          onNavigate(card.target)
        }}
      >
        {card.cta}
      </button>
    </div>
  )
}

function CardArt({ children }: { children: ReactNode }) {
  return (
    <div className={s.cardArt}>
      {children}
    </div>
  )
}

function CardStreakBody({ claimedToday, studiedToday, streak }: { claimedToday: boolean; studiedToday: boolean; streak: number }) {
  if (claimedToday) {
    return (
      <>
        <CardArt>
          <img src={chestIcon} alt="" draggable={false} className={`${s.artImg} ${s.artImgFloat}`} />
        </CardArt>
        <div className={s.textBlock}>
          <div className={s.doneTitle}>今日已打卡</div>
          <div className={s.doneDesc}>奖励已领取，可以继续练习口算</div>
        </div>
      </>
    )
  }
  return (
    <>
      {/* 闹钟+书 z13（页内 left 71.5 top 66.5 231×220；未学习时半透明） */}
      <img src={alarmBooks} alt="" draggable={false}
        className={s.alarmArt} style={{ opacity: studiedToday ? 1 : 0.7 }} />
      <div className={s.streakText}>
        {studiedToday
          ? (streak > 0 ? `已连续学习${streak}天` : '今天开始连学打卡吧')
          : '完成 1 轮口算后可打卡'}
      </div>
      <div className={s.starsRow}>
        {Array.from({ length: 5 }).map((_, i) => <GoldStar key={i} size={26} filled={studiedToday && i < Math.max(1, streak)} />)}
      </div>
    </>
  )
}

function CardRealBody() {
  return (
    <>
      <CardArt>
        <div className={s.quizArt}>
          {['A', 'B', 'C'].map(letter => (
            <span key={letter} className={s.quizLetter}>
              {letter}
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
        <img src={notebookIcon} alt="" draggable={false} className={s.artImg} />
      </CardArt>
      <CardText title="错题本" desc="做错的题在这里，重做还能赢贝壳" />
    </>
  )
}

function CardText({ title, desc }: { title: string; desc: string }) {
  return (
    <div className={s.textBlock}>
      <div className={s.cardTitle}>{title}</div>
      <div className={s.cardDesc}>{desc}</div>
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
