// ============================================================================
// ChestPanel —— 每日连学宝箱（P12，首页 / 广场共用同一组件与状态）
//
// 视觉：高保真 daily-chest 经 layer_decomposition 拆层，按 bbox 归一化回贴，
//       分辨率无关（百分比定位）；奖励卡烘焙数字用小条遮盖后前端排版，
//       保证与 config/streak 的真实数值一致。
// 状态：
//   - 未完成打卡（当天未答题）→ 领取钮置灰，提示先完成 1 轮答题；
//   - 可领取 → 领取奖励（贝壳 + 食物），提示后自动关闭弹框；
//   - 已领取（chestLastOpened===今天）再次打开 → 置灰「明日再来」。
// 样式：静态部分已迁移至 ChestPanel.css.ts（vanilla-extract，含 cqw 容器查询），
//       内联仅保留 bbox / props 驱动的动态值。
// ============================================================================
import { btn as uiBtn } from '@mathpaws/ui'
import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'

import bg from '../../assets/hifi/daily-chest/bg.jpg'
import buttonImg from '../../assets/hifi/daily-chest/button.png'
import cardFood from '../../assets/hifi/daily-chest/card-food.png'
import cardShell from '../../assets/hifi/daily-chest/card-shell.png'
import chest from '../../assets/hifi/daily-chest/chest.png'
import ribbonLeft from '../../assets/hifi/daily-chest/ribbon-left.png'
import ribbonRight from '../../assets/hifi/daily-chest/ribbon-right.png'
import { chestLevelForStreak } from '../../config/streak'
import { useEconomyStore } from '../../stores/useEconomyStore'
import { useStreakStore } from '../../stores/useStreakStore'
import { audio } from '../../utils/audio'
import { dayKey } from '../../utils/id'
import stage from '../../assets/hifi/daily-chest/stage.png'
import scroll from '../../assets/hifi/daily-chest/scroll.png'
import stars from '../../assets/hifi/daily-chest/stars.png'
import title from '../../assets/hifi/daily-chest/title.png'
import * as s from './ChestPanel.css'

// 各层在原稿(2364×1773)中的 bbox 与图层原生尺寸
const SCROLL_BBOX: BBox = [775, 833, 1590, 1038]
const SCROLL_SIZE: Size = [1155, 291]
const SHELL_BBOX: BBox = [473, 1095, 1113, 1331]
const SHELL_SIZE: Size = [982, 362]
const FOOD_BBOX: BBox = [1250, 1095, 1890, 1331]
const FOOD_SIZE: Size = [1026, 378]

// 已擦除烘焙文字的干净区域（图层内像素坐标）
const SCROLL_TEXT: BBox = [250, 40, 892, 226]
const SHELL_TEXT: BBox = [398, 92, 940, 284]
const FOOD_TEXT: BBox = [368, 96, 1000, 288]

export function ChestPanel({ onClose }: { onClose: () => void }) {
  const streak = useStreakStore(st => st.streak)
  const chestLastOpened = useStreakStore(st => st.chestLastOpened)
  const lastStudyDate = useStreakStore(st => st.lastStudyDate)
  const markChestOpened = useStreakStore(st => st.markChestOpened)
  const [justOpened, setJustOpened] = useState(false)

  const level = chestLevelForStreak(Math.max(1, streak))
  const claimedToday = chestLastOpened === dayKey()
  const studiedToday = lastStudyDate === dayKey()
  const done = claimedToday || justOpened
  const canClaim = !done && studiedToday

  // onClose 每次渲染都可能是新引用：用 ref 持有最新值，
  // 避免父组件重渲染导致 900ms 自动关闭计时器被反复重启
  const onCloseRef = useRef(onClose)
  useEffect(() => {
    onCloseRef.current = onClose
  }, [onClose])

  // 领取成功：短暂提示后自动关闭弹框
  useEffect(() => {
    if (!justOpened) return
    const t = setTimeout(() => onCloseRef.current(), 900)
    return () => clearTimeout(t)
  }, [justOpened])

  const claim = () => {
    if (!canClaim) return
    useEconomyStore.getState().addShells(level.shells)
    useEconomyStore.getState().addPetFood(level.food)
    markChestOpened()
    setJustOpened(true)
    audio.playSfx('reward')
  }

  return (
    <div className={s.backdrop} onClick={onClose} role="dialog" aria-modal="true">
      <div className={s.frame} onClick={e => e.stopPropagation()}>
        {/* 背景 */}
        <img src={bg} alt="" draggable={false} className={s.fill} />

        {/* 拆层回贴（bbox 归一化为百分比，2364×1773） */}
        <Layer src={ribbonLeft} bbox={[168, 79, 645, 727]} />
        <Layer src={ribbonRight} bbox={[1624, 172, 2364, 1074]} />
        <Layer src={stage} bbox={[474, 903, 1893, 1264]} />
        <Layer src={chest} bbox={[831, 411, 1567, 1041]} />
        <Layer src={scroll} bbox={SCROLL_BBOX} />
        <Layer src={cardShell} bbox={SHELL_BBOX} />
        <Layer src={cardFood} bbox={FOOD_BBOX} />
        <Layer src={stars} bbox={[430, 1329, 1928, 1522]} />
        <Layer src={title} bbox={[618, 104, 1754, 423]} />

        {/* 真实文案，排在已擦净的区域上 */}
        <TextZone
          bbox={SCROLL_BBOX} layerSize={SCROLL_SIZE} inner={SCROLL_TEXT}
          color="#9A6230" weight={800} fontScale={0.62}
        >
          连续学习 {Math.max(1, streak)} 天
        </TextZone>
        <TextZone
          bbox={SHELL_BBOX} layerSize={SHELL_SIZE} inner={SHELL_TEXT}
          color="#B06A2E" weight={900} fontScale={0.68}
        >
          x{level.shells}
        </TextZone>
        <TextZone
          bbox={FOOD_BBOX} layerSize={FOOD_SIZE} inner={FOOD_TEXT}
          color="#B06A2E" weight={900} fontScale={0.68}
        >
          x{level.food}
        </TextZone>

        {/* 关闭 */}
        <button
          aria-label="关闭"
          className={`${uiBtn} ${s.closeBtn}`}
          onClick={() => { audio.playSfx('click'); onClose() }}
        >
          <svg viewBox="0 0 24 24" width="58%" height="58%" aria-hidden>
            <path d="M6 6L18 18M18 6L6 18" stroke="#6B7C90" strokeWidth="3.2" strokeLinecap="round" />
          </svg>
        </button>

        {/* 领取按钮：用图层底板，未满足条件时置灰并盖提示 */}
        <button
          type="button"
          className={`${uiBtn} ${s.claimBtn}`}
          disabled={!canClaim}
          onClick={claim}
          style={{ cursor: canClaim ? 'pointer' : 'not-allowed' }}
        >
          <img src={buttonImg} alt="" draggable={false} className={s.fill} />
          {!canClaim && !justOpened && (
            <span className={s.btnHint}>
              {claimedToday ? '已领取，明日再来' : '完成 1 轮答题后领取'}
            </span>
          )}
        </button>

        {/* 领取成功短暂提示（随后弹框自动关闭） */}
        {justOpened && (
          <div className={s.claimedOverlay}>
            <div className={s.claimedText}>领取成功</div>
          </div>
        )}
      </div>
    </div>
  )
}

type BBox = [number, number, number, number]
type Size = [number, number]

/** 单层按 bbox 归一化绝对定位（bbox 为 2364×1773 原稿坐标）。 */
function Layer({ src, bbox }: { src: string; bbox: BBox }) {
  const [x0, y0, x1, y1] = bbox
  const style: CSSProperties = {
    left: `${(x0 / 2364) * 100}%`,
    top: `${(y0 / 1773) * 100}%`,
    width: `${((x1 - x0) / 2364) * 100}%`,
    height: `${((y1 - y0) / 1773) * 100}%`,
  }
  return <img src={src} alt="" draggable={false} className={s.layer} style={style} />
}

/**
 * 在图层内部某个已擦净区域上排版文字。
 * 图层按 bbox 非等比缩放到画面，内部区域需先换算回原稿坐标再归一化。
 */
function TextZone({
  bbox, layerSize, inner, children, color, weight, fontScale,
}: {
  bbox: BBox
  layerSize: Size
  inner: BBox
  children: ReactNode
  color: string
  weight: number
  fontScale: number
}) {
  const [x0, y0, x1, y1] = bbox
  const [lw, lh] = layerSize
  const [ix0, iy0, ix1, iy1] = inner

  // 内部区域换算到原稿坐标
  const fx0 = x0 + (ix0 / lw) * (x1 - x0)
  const fx1 = x0 + (ix1 / lw) * (x1 - x0)
  const fy0 = y0 + (iy0 / lh) * (y1 - y0)
  const fy1 = y0 + (iy1 / lh) * (y1 - y0)

  return (
    <div
      className={s.textZone}
      style={{
        left: `${(fx0 / 2364) * 100}%`,
        top: `${(fy0 / 1773) * 100}%`,
        width: `${((fx1 - fx0) / 2364) * 100}%`,
        height: `${((fy1 - fy0) / 1773) * 100}%`,
        color, fontWeight: weight,
        fontSize: `${((fy1 - fy0) / 2364) * 100 * fontScale}cqw`,
      }}
    >
      {children}
    </div>
  )
}
