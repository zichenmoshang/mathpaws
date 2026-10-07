import { PaperDoll } from '@mathpaws/paperdoll'
import { BackButton, PrimaryButton, BitmapTabs, btn as uiBtn } from '@mathpaws/ui'
import { useMemo, useState, type ReactNode } from 'react'

import dressingTitle from '../../assets/ui/p16-dressing-title.webp'
import platform from '../../assets/ui/p16-platform.webp'
import {
  OUTFIT_OPTIONS,
  HAT_OPTIONS,
  SHOE_OPTIONS,
  buildLayers,
  equippedToSelection,
  type OutfitSelection,
  type SlotId,
} from '../../paperdoll/catalog'
import { useEquippedStore } from '../../stores/useEquippedStore'
import { useGachaStore } from '../../stores/useGachaStore'
import { audio } from '../../utils/audio'

import * as s from './BackpackScene.css'

// ============================================================================
// BackpackScene —— P16 背包 / 换装页（对齐 design/high-fi/backpack/backpack.png）
//
// 顶部「换装书房」位图艺术字；左：小岛立绘舞台（无货币 / 无套装名）；
// 右：位图 Tab（套装/头饰/鞋子）+ 半透明磨砂面板内的圆形物品格；
// 底部标准主按钮「穿戴」确认返回；左上标准返回钮。
// 格状态：已选 = 右上金✓；已拥有未选 = 右下金+（点击选择）；
//         未拥有 = 灰+（点击去学盒）。
// 默认套装 / 默认鞋是基线装扮（不进池、owned 为空也始终可穿）。
//
// 静态样式已迁入同目录 BackpackScene.css.ts（vanilla-extract）；
// style={{...}} 仅保留 ui 组件 style prop 等无法以类表达的部分。
// ============================================================================

const SLOT_ORDER: SlotId[] = ['outfit', 'hat', 'shoe']

interface CatalogEntry {
  id: string
  label: string
  icon?: string
}
// 头饰含「不戴」项（none）：参照鞋子 SLOT 已有的 none 模式，
// commit / buildLayers 已支持 hat=none（不提交 gacha id、不合成 gear 层）
const HAT_NONE: CatalogEntry = { id: 'none', label: '不戴' }
const SLOT_VIEW: Record<SlotId, CatalogEntry[]> = {
  outfit: OUTFIT_OPTIONS,
  hat: [HAT_NONE, ...HAT_OPTIONS],
  shoe: SHOE_OPTIONS,
}

const SLOT_TABS = [
  { id: 'outfit' as SlotId, label: '套装' },
  { id: 'hat' as SlotId, label: '头饰' },
  { id: 'shoe' as SlotId, label: '鞋子' },
]

/** catalog 短 id → gacha 同构 id（none 无 gacha id） */
function toGachaId(slot: SlotId, shortId: string): string | null {
  if (shortId === 'none') return null
  return `${shortId}-${slot}`
}

export function BackpackScene({
  onBack,
  onGoGacha,
}: {
  onBack: () => void
  onGoGacha: () => void
}) {
  const [tab, setTab] = useState<SlotId>('outfit')
  const equipped = useEquippedStore(s => s.equipped)
  const owned = useGachaStore(s => s.owned)

  // 待确认的穿戴选择（短 id）；初始 = 当前已穿戴。点击物品只改它（立绘即时预览），
  // 点底部「穿戴」才统一提交到 equipped store。
  const [pending, setPending] = useState<OutfitSelection>(() =>
    equippedToSelection(useEquippedStore.getState().equipped),
  )

  const current = useMemo(() => equippedToSelection(equipped), [equipped])
  const layers = useMemo(() => buildLayers(pending), [pending])
  const dirty =
    pending.outfit !== current.outfit ||
    pending.hat !== current.hat ||
    pending.shoe !== current.shoe

  // 已抽拥有（owned 数组）或基线装扮
  const isWearable = useMemo(
    () => (gid: string) =>
      owned.includes(gid) || gid === 'default-outfit' || gid === 'default-shoe',
    [owned],
  )

  const choose = (slot: SlotId, shortId: string) =>
    setPending(prev => ({ ...prev, [slot]: shortId }))

  const commit = () => {
    SLOT_ORDER.forEach(slot => {
      const gid = pending[slot] === 'none' ? null : toGachaId(slot, pending[slot])
      useEquippedStore.getState().equip(slot, gid, isWearable)
    })
  }

  return (
    <div className={s.root}>
      <Clouds />
      <Decorations />

      {/* 左上标准返回 */}
      <BackButton
        onClick={() => { audio.playSfx('click'); onBack() }}
        style={{ position: 'absolute', top: 16, left: 18, zIndex: 10 }}
      />

      {/* 右上 去学盒 */}
      <button
        onClick={() => { audio.playSfx('click'); onGoGacha() }}
        className={`${uiBtn} ${s.gachaEntry}`}
      >
        <span className={s.gachaEntryIcon}>📖</span>
        去学盒
      </button>

      {/* 顶部标题艺术字 */}
      <img
        src={dressingTitle}
        alt="换装书房"
        draggable={false}
        className={s.title}
      />

      <div className={s.layout}>
        {/* 左：立绘舞台（人物垂直居中） */}
        <div className={s.stage}>
          <div className={s.dollWrap}>
            {/* 脚下平台位图 */}
            <img
              src={platform}
              alt=""
              aria-hidden
              draggable={false}
              className={s.platform}
            />

            {/* 立绘 */}
            <div className={s.doll}>
              <PaperDoll layers={layers} background="transparent" />
            </div>
          </div>
        </div>

        {/* 右：槽位 + 库存（整列垂直居中；面板固定高度，切 Tab 不抖动） */}
        <div className={s.sideCol}>
          {/* 位图 Tab */}
          <div className={s.tabsWrap}>
            <BitmapTabs
              tabs={SLOT_TABS}
              active={tab}
              onChange={s => { audio.playSfx('click'); setTab(s) }}
              height={56}
            />
          </div>

          {/* 磨砂面板：固定较短高度，内容从顶部开始排列 */}
          <div className={s.panel}>
            <div className={s.grid}>
              {SLOT_VIEW[tab].map(o => {
                const gid = toGachaId(tab, o.id)
                const canWear = gid === null || (gid ? isWearable(gid) : false)
                const selected = pending[tab] === o.id
                return (
                  <CircleCell
                    key={o.id}
                    entry={o}
                    state={selected ? 'equipped' : canWear ? 'owned' : 'locked'}
                    onClick={() => {
                      audio.playSfx('click')
                      if (canWear) choose(tab, o.id)
                      else onGoGacha()
                    }}
                  />
                )
              })}
            </div>
          </div>
        </div>
      </div>

      {/* 底部标准主按钮「穿戴」 */}
      <div className={s.bottomBar}>
        <PrimaryButton
          disabled={!dirty}
          style={{ width: 240 }}
          height={64}
          onClick={() => {
            audio.playSfx('click')
            commit()
            onBack()
          }}
        >
          穿戴
        </PrimaryButton>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// 背景：柔白云朵
// ---------------------------------------------------------------------------
const CLOUD_CLASSES = [s.cloud1, s.cloud2, s.cloud3, s.cloud4, s.cloud5]

function Clouds() {
  return (
    <div aria-hidden className={s.cloudsWrap}>
      {CLOUD_CLASSES.map((c, i) => (
        <div key={i} className={`${s.cloud} ${c}`} />
      ))}
    </div>
  )
}

// ---------------------------------------------------------------------------
// 背景：星星 / 爱心 / 小方块等装饰
// ---------------------------------------------------------------------------
function GoldStar({ size, className }: { size: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} aria-hidden>
      <path
        d="M12 2.2l2.9 5.9 6.5.95-4.7 4.58 1.11 6.47L12 17.1l-5.81 3.06 1.11-6.47L2.6 9.05l6.5-.95z"
        fill="#FFD24A"
        stroke="#E69A24"
        strokeWidth="1"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function Decorations() {
  const items: ReactNode[] = [
    <GoldStar key="s1" size={30} className={s.decoStar1} />,
    <GoldStar key="s2" size={22} className={s.decoStar2} />,
    <GoldStar key="s3" size={26} className={s.decoStar3} />,
    <GoldStar key="s4" size={18} className={s.decoStar4} />,
    <span key="h1" className={s.decoHeart1}>💗</span>,
    <span key="h2" className={s.decoHeart2}>💗</span>,
    <span key="b1" className={s.decoBlock} />,
    <span key="d1" className={s.decoDot1} />,
    <span key="d2" className={s.decoDot2} />,
    <GoldStar key="s5" size={18} className={s.decoStar5} />,
  ]
  return <div aria-hidden className={s.decoWrap}>{items}</div>
}

// ---------------------------------------------------------------------------
// 圆形物品格
// ---------------------------------------------------------------------------
function CircleCell({
  entry, state, onClick,
}: {
  entry: CatalogEntry
  state: 'equipped' | 'owned' | 'locked'
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      title={entry.label}
      className={`${uiBtn} ${s.cell}${state === 'locked' ? ` ${s.cellLocked}` : ''}`}
    >
      {entry.icon ? (
        <img
          src={entry.icon}
          alt={entry.label}
          draggable={false}
          className={s.cellImg}
        />
      ) : (
        <span className={s.cellNone}>➖</span>
      )}

      {/* 角标徽章：badge 基类 + 金/灰变体（对应原 badgeCheck / badgePlusLocked 继承） */}
      {state === 'equipped' && (
        <span className={`${s.badge} ${s.badgeGold}`}>✓</span>
      )}
      {state !== 'equipped' && (
        <span className={`${s.badge} ${state === 'locked' ? s.badgeLocked : s.badgeGold}`}>+</span>
      )}
    </button>
  )
}
