import { PaperDoll } from '@mathpaws/paperdoll'
import { FONT, BackButton, PrimaryButton, BitmapTabs } from '@mathpaws/ui'
import { useMemo, useState, type CSSProperties, type ReactNode } from 'react'

import dressingTitle from '../assets/ui/p16-dressing-title.webp'
import platform from '../assets/ui/p16-platform.webp'
import {
  OUTFIT_OPTIONS,
  HAT_OPTIONS,
  SHOE_OPTIONS,
  buildLayers,
  equippedToSelection,
  type OutfitSelection,
  type SlotId,
} from '../paperdoll/catalog'
import { useEquippedStore } from '../stores/useEquippedStore'
import { useGachaStore } from '../stores/useGachaStore'
import { audio } from '../utils/audio'

// ============================================================================
// BackpackScene —— P16 背包 / 换装页（对齐 design/high-fi/backpack/backpack.png）
//
// 顶部「换装书房」位图艺术字；左：小岛立绘舞台（无货币 / 无套装名）；
// 右：位图 Tab（套装/头饰/鞋子）+ 半透明磨砂面板内的圆形物品格；
// 底部标准主按钮「穿戴」确认返回；左上标准返回钮。
// 格状态：已选 = 右上金✓；已拥有未选 = 右下金+（点击选择）；
//         未拥有 = 灰+（点击去学盒）。
// 默认套装 / 默认鞋是基线装扮（不进池、owned 为空也始终可穿）。
// ============================================================================

const SLOT_ORDER: SlotId[] = ['outfit', 'hat', 'shoe']

interface CatalogEntry {
  id: string
  label: string
  icon?: string
}
const SLOT_VIEW: Record<SlotId, CatalogEntry[]> = {
  outfit: OUTFIT_OPTIONS,
  hat: HAT_OPTIONS,
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
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'linear-gradient(180deg,#67bcf2 0%,#4ea9e8 55%,#3d97dd 100%)',
        fontFamily: FONT.family,
        overflow: 'hidden',
      }}
    >
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
        className="mp-btn"
        style={gachaEntryStyle}
      >
        <span style={{ position: 'relative', top: -2, fontSize: 20, lineHeight: 1 }}>📖</span>
        去学盒
      </button>

      {/* 顶部标题艺术字 */}
      <img
        src={dressingTitle}
        alt="换装书房"
        draggable={false}
        style={{
          position: 'absolute', top: 14, left: '50%',
          transform: 'translateX(-50%)',
          height: 'clamp(48px, 9vh, 78px)', zIndex: 9,
        }}
      />

      <div
        style={{
          position: 'absolute', inset: 0,
          display: 'flex', alignItems: 'center',
          padding: '86px 28px 96px',
          gap: 12,
        }}
      >
        {/* 左：立绘舞台（人物垂直居中） */}
        <div
          style={{
            flex: 1, alignSelf: 'stretch', minWidth: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          <div
            style={{
              position: 'relative',
              width: 'clamp(240px, 40vh, 400px)',
            }}
          >
            {/* 脚下平台位图 */}
            <img
              src={platform}
              alt=""
              aria-hidden
              draggable={false}
              style={platformStyle}
            />

            {/* 立绘 */}
            <div style={{ position: 'relative', animation: 'mp-doll-bob 3.2s ease-in-out infinite' }}>
              <PaperDoll layers={layers} background="transparent" />
            </div>
          </div>
        </div>

        {/* 右：槽位 + 库存（整列垂直居中；面板固定高度，切 Tab 不抖动） */}
        <div
          style={{
            width: 'clamp(380px, 46vw, 600px)', flexShrink: 0,
            alignSelf: 'stretch', minHeight: 0,
            display: 'flex', flexDirection: 'column', justifyContent: 'center',
          }}
        >
          {/* 位图 Tab */}
          <div
            style={{
              position: 'relative', zIndex: 2,
              display: 'flex', justifyContent: 'center',
              marginBottom: 8, flexShrink: 0,
            }}
          >
            <BitmapTabs
              tabs={SLOT_TABS}
              active={tab}
              onChange={s => { audio.playSfx('click'); setTab(s) }}
              height={56}
            />
          </div>

          {/* 磨砂面板：固定较短高度，内容从顶部开始排列 */}
          <div style={panelStyle}>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, minmax(0,1fr))',
                gap: 'clamp(10px, 2.2vmin, 18px)',
              }}
            >
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
      <div
        style={{
          position: 'absolute', bottom: 20, left: 0, right: 0,
          display: 'flex', justifyContent: 'center',
        }}
      >
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
function Clouds() {
  const clouds: CSSProperties[] = [
    { width: 220, height: 90, top: 40, left: '4%' },
    { width: 160, height: 66, top: 120, left: '30%' },
    { width: 260, height: 100, bottom: 90, left: '2%' },
    { width: 300, height: 110, bottom: -30, right: '-3%' },
    { width: 150, height: 60, top: '8%', right: '12%' },
  ]
  return (
    <div aria-hidden style={{ position: 'absolute', inset: 0 }}>
      {clouds.map((s, i) => (
        <div
          key={i}
          style={{
            position: 'absolute', ...s,
            borderRadius: '50%',
            background: 'radial-gradient(ellipse at center,rgba(255,255,255,.55),rgba(255,255,255,0) 72%)',
          }}
        />
      ))}
    </div>
  )
}

// ---------------------------------------------------------------------------
// 背景：星星 / 爱心 / 小方块等装饰
// ---------------------------------------------------------------------------
function GoldStar({ size, style }: { size: number; style?: CSSProperties }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" style={style} aria-hidden>
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
    <GoldStar key="s1" size={30} style={{ position: 'absolute', top: '34%', left: '6%', animation: 'mp-float 3.6s ease-in-out infinite' }} />,
    <GoldStar key="s2" size={22} style={{ position: 'absolute', top: '64%', left: '9%', animation: 'mp-float 4.2s ease-in-out .5s infinite' }} />,
    <GoldStar key="s3" size={26} style={{ position: 'absolute', bottom: '16%', left: '24%', animation: 'mp-float 3.9s ease-in-out 1s infinite' }} />,
    <GoldStar key="s4" size={18} style={{ position: 'absolute', top: '52%', left: '28%', animation: 'mp-twinkle 3s ease-in-out infinite' }} />,
    <span key="h1" style={{ position: 'absolute', top: '58%', left: '7%', fontSize: 22, animation: 'mp-float 4s ease-in-out .8s infinite' }}>💗</span>,
    <span key="h2" style={{ position: 'absolute', top: '44%', left: '30%', fontSize: 18, animation: 'mp-float 4.4s ease-in-out .2s infinite' }}>💗</span>,
    <span key="b1" style={{ position: 'absolute', top: '60%', left: '19%', width: 18, height: 18, borderRadius: 5, background: 'linear-gradient(135deg,#7ed0ff,#3d97dd)', transform: 'rotate(25deg)', animation: 'mp-float 3.8s ease-in-out 1.2s infinite' }} />,
    <span key="d1" style={{ position: 'absolute', top: '30%', left: '16%', width: 8, height: 8, borderRadius: '50%', background: '#FFD24A', opacity: .8, animation: 'mp-twinkle 2.6s ease-in-out infinite' }} />,
    <span key="d2" style={{ position: 'absolute', top: '40%', left: '24%', width: 6, height: 6, borderRadius: '50%', background: '#fff', opacity: .8, animation: 'mp-twinkle 3.4s ease-in-out .6s infinite' }} />,
    <GoldStar key="s5" size={18} style={{ position: 'absolute', bottom: '14%', right: '30%', animation: 'mp-twinkle 3s ease-in-out .3s infinite' }} />,
  ]
  return <div aria-hidden style={{ position: 'absolute', inset: 0 }}>{items}</div>
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
      className="mp-btn"
      style={{
        position: 'relative', aspectRatio: '1 / 1',
        borderRadius: '50%', border: 'none', cursor: 'pointer',
        background: 'radial-gradient(circle at 50% 38%,#ffffff 0%,#f2f8fd 100%)',
        boxShadow: '0 4px 10px rgba(30,90,160,.22), inset 0 0 0 2px rgba(255,255,255,.9)',
        opacity: state === 'locked' ? 0.62 : 1,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 0,
      }}
    >
      {entry.icon ? (
        <img
          src={entry.icon}
          alt={entry.label}
          draggable={false}
          style={{ width: '72%', height: '72%', objectFit: 'contain' }}
        />
      ) : (
        <span style={{ fontSize: 30, opacity: .5 }}>➖</span>
      )}

      {state === 'equipped' && (
        <span style={badgeCheck}>✓</span>
      )}
      {state !== 'equipped' && (
        <span style={state === 'locked' ? badgePlusLocked : badgePlus}>+</span>
      )}
    </button>
  )
}

// ---------------------------------------------------------------------------
// 样式常量
// ---------------------------------------------------------------------------
const gachaEntryStyle: CSSProperties = {
  position: 'absolute', top: 16, right: 18, zIndex: 10,
  height: 46, padding: '0 18px',
  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
  border: 'none', borderRadius: 999, cursor: 'pointer',
  fontFamily: FONT.family, fontWeight: 900, fontSize: 20, color: '#8a5a08',
  background: 'linear-gradient(180deg,#FFF3B0 0%,#FFD25A 42%,#E69A24 78%,#C47E16 100%)',
  boxShadow: '0 4px 8px rgba(0,0,0,.28), inset 0 2px 3px rgba(255,255,255,.85), inset 0 -3px 5px rgba(120,70,0,.5)',
}

// 脚下平台位图：横向椭圆，居中略压在立绘脚底
const platformStyle: CSSProperties = {
  position: 'absolute', left: '50%', bottom: '-8%',
  transform: 'translateX(-50%)',
  width: '118%', height: 'auto',
  pointerEvents: 'none',
}

const panelStyle: CSSProperties = {
  position: 'relative', zIndex: 1,
  height: 'clamp(230px, 42vh, 320px)',
  borderRadius: 34,
  padding: '22px 24px',
  background: 'linear-gradient(180deg,rgba(180,226,250,.55),rgba(140,205,242,.45))',
  border: '5px solid rgba(255,255,255,.65)',
  boxShadow: '0 14px 30px rgba(20,80,140,.25), inset 0 2px 8px rgba(255,255,255,.5)',
  backdropFilter: 'blur(3px)',
  overflow: 'hidden',
  boxSizing: 'border-box',
}

const badgeBase: CSSProperties = {
  position: 'absolute', width: 26, height: 26,
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  fontWeight: 900, fontSize: 16, color: '#fff', lineHeight: 1,
  borderRadius: '50%',
}

const badgeCheck: CSSProperties = {
  ...badgeBase,
  top: -3, right: -3,
  background: 'radial-gradient(circle at 38% 30%,#FFE27A,#FFC531 60%,#F0A31B)',
  border: '2px solid #fff',
  boxShadow: '0 2px 4px rgba(150,90,0,.35)',
}

const badgePlus: CSSProperties = {
  ...badgeBase,
  top: -3, right: -3,
  background: 'radial-gradient(circle at 38% 30%,#FFE27A,#FFC531 60%,#F0A31B)',
  border: '2px solid #fff',
  boxShadow: '0 2px 4px rgba(150,90,0,.35)',
}

const badgePlusLocked: CSSProperties = {
  ...badgePlus,
  background: 'radial-gradient(circle at 38% 30%,#eef3f7,#c3d0da 70%,#a8b8c4)',
  boxShadow: '0 2px 4px rgba(80,100,120,.3)',
}
