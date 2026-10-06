// P10 学盒抽卡场景（M4-P10-01 / P10-02）
// 正式视觉资产（M1-AST-03 提前落地的道具/背景）：星空背景图 + 透明切图学盒 +
// 四角浮动的中性装扮（整身/头饰）+ 底部单抽/十连。
// 规则对齐 config：单抽 50 / 十连 450；每次必出一件；重复仅提示"已有 XX"、
// 不返还贝壳。结果卡品质色由 RARITY_META 驱动。
import {
  C, FONT, R, BackButton,
} from '@mathpaws/ui'
import { useMemo, useState } from 'react'
import type { CSSProperties } from 'react'

import gachaBg from '../assets/gacha/gacha-bg-starry@2x.webp'
import gachaBoxOpen from '../assets/gacha/gacha-box-open@2x.webp'
import gachaBox from '../assets/gacha/gacha-box@2x.webp'
import flagTen from '../assets/gacha/gacha-flag-ten@2x.webp'
import glowLegendary from '../assets/gacha/glow-legendary.png'
import { RARITY_META, COSMETIC_SLOT_LABEL, type Rarity } from '../config/cosmetics'
import {
  SINGLE_COST, TEN_COST, RARE_PITY, LEGEND_PITY, GACHA_ITEM_MAP,
} from '../config/gachaPool'
import { performDraw, type DrawOutcome } from '../stores'
import { useEconomyStore } from '../stores/useEconomyStore'
import { useGachaStore } from '../stores/useGachaStore'
import { audio } from '../utils/audio'

// 四角浮动展示（池中代表：稀有整身/帽 + 普通整身/帽）
const FLOAT_IDS = ['explorer-outfit', 'frog-hat', 'frog-outfit', 'explorer-hat'] as const

// 四周金角位置：刻意打破严格四角对称，做轻微随机偏移。
const FLOAT_POS: Array<{ top?: string; bottom?: string; left?: string; right?: string }> = [
  { top: '9%', left: '13%' },
  { top: '15%', right: '6%' },
  { bottom: '27%', left: '5%' },
  { bottom: '20%', right: '14%' },
]

// 高保真金色扇贝：扇形放射圆瓣、金色渐变、橙色脊线、顶部高光、底部双铰链凸点。
const SHELL_PATH =
  'M24 44 L2.7 32.3 Q0.6 29.3 2.7 26.2 Q3 21.8 6.6 18.9 Q6.3 14.2 11 12.6 Q12.5 8.2 17.5 7.9 Q19.6 4.5 24 4.5 Q28.4 4.5 30.5 7.9 Q35.5 8.2 37 12.6 Q41.7 14.2 41.4 18.9 Q45 21.8 45.3 26.2 Q47.4 29.3 45.3 32.3 Z'

function ShellIcon({ size = 26, variant = 'gold' }: { size?: number; variant?: 'gold' | 'warm' }) {
  // 脊线从底部铰链放射至各圆瓣，止于边缘内一点。
  const ribs = [
    [6.2, 30.2], [9.6, 21.9], [15.1, 15.4], [24, 11.8],
    [32.9, 15.4], [38.4, 21.9], [41.8, 30.2],
  ]
  // gold：顶栏亮金扇贝；warm：按钮内橙金色扇贝（贴合高保真）。
  const g = variant === 'warm'
    ? { id: 'mp-shell-warm', stops: ['#FFCE4D', '#F5A023', '#E67E0C'], edge: '#BE5A00', rib: '#D96E08', knob: '#F7A830' }
    : { id: 'mp-shell-gold', stops: ['#FFF1A8', '#FFD24A', '#F39C12'], edge: '#E07B00', rib: '#E8830C', knob: '#FFD24A' }
  return (
    <svg width={size * (48 / 52)} height={size} viewBox="0 0 48 52" aria-hidden>
      <defs>
        <linearGradient id={g.id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={g.stops[0]} />
          <stop offset="0.45" stopColor={g.stops[1]} />
          <stop offset="1" stopColor={g.stops[2]} />
        </linearGradient>
      </defs>
      <path
        d={SHELL_PATH}
        fill={`url(#${g.id})`}
        stroke={g.edge}
        strokeWidth="2.4"
        strokeLinejoin="round"
      />
      {ribs.map(([x, y], i) => (
        <line
          key={i}
          x1="24" y1="43" x2={x} y2={y}
          stroke={g.rib} strokeWidth="1.7" strokeLinecap="round" opacity="0.75"
        />
      ))}
      {/* 底部铰链双凸点 */}
      <circle cx="20.6" cy="44.4" r="2.5" fill={g.knob} stroke={g.edge} strokeWidth="1.4" />
      <circle cx="27.4" cy="44.4" r="2.5" fill={g.knob} stroke={g.edge} strokeWidth="1.4" />
      {/* 顶部弧形高光 */}
      <path
        d="M15 9.5 Q24 4 33 9.5"
        fill="none" stroke="#FFF8DC" strokeWidth="2" strokeLinecap="round" opacity="0.9"
      />
    </svg>
  )
}

/** 中央学盒（透明切图；开启时关闭态淡出、开盒溢光态淡入 + 轻微回弹） */
function Chest({ opening }: { opening: boolean }) {
  return (
    <div
      style={{
        position: 'relative',
        width: 'clamp(210px,34vmin,330px)',
        aspectRatio: '640 / 660',
        animation: 'mp-chest-bob 3s ease-in-out infinite',
      }}
    >
      {/* 传说金色光晕（垫在学盒后） */}
      <img
        src={glowLegendary}
        alt=""
        aria-hidden
        style={{
          position: 'absolute', inset: '-30%',
          width: '160%', height: '160%',
          animation: 'mp-glow-pulse 2.6s ease-in-out infinite',
        }}
      />
      <img
        src={gachaBox}
        alt=""
        aria-hidden
        draggable={false}
        style={{
          position: 'absolute', inset: 0,
          width: '100%', height: '100%', objectFit: 'contain',
          opacity: opening ? 0 : 1,
          transition: 'opacity .28s',
        }}
      />
      <img
        src={gachaBoxOpen}
        alt="魔法学盒"
        draggable={false}
        style={{
          position: 'absolute', inset: 0,
          width: '100%', height: '100%', objectFit: 'contain',
          opacity: opening ? 1 : 0,
          transform: opening ? 'scale(1.05)' : 'scale(.96)',
          transition: 'opacity .28s, transform .28s',
        }}
      />
    </div>
  )
}

function FloatRing({
  id, pos, delay,
}: {
  id: string
  pos: { top?: string; bottom?: string; left?: string; right?: string }
  delay: number
}) {
  const item = GACHA_ITEM_MAP[id]
  if (!item) return null
  return (
    <div
      style={{
        position: 'absolute', ...pos,
        width: 'clamp(88px,13vmin,130px)',
        aspectRatio: '1',
        borderRadius: '50%',
        padding: 'clamp(9px,1.4vmin,13px)',
        // 立体金环：顶亮 -> 中部金 -> 底部深金
        background: 'linear-gradient(160deg,#FFF6C4 0%,#FFD968 30%,#F2A51C 62%,#B9760A 100%)',
        boxShadow: [
          '0 10px 22px rgba(0,0,0,.38)',
          '0 0 14px rgba(255,214,90,.45)',
          'inset 0 2px 3px rgba(255,255,255,.85)',
          'inset 0 -3px 6px rgba(120,70,0,.55)',
        ].join(','),
        animation: `mp-float 3.4s ease-in-out ${delay}s infinite`,
      }}
    >
      <div
        style={{
          position: 'relative',
          width: '100%', height: '100%', borderRadius: '50%',
          overflow: 'hidden',
          // 内圈透明，透出深蓝星空背景；仅加内阴影与极淡径向暗角增加凹陷感
          background: 'radial-gradient(circle at 50% 45%, rgba(20,46,120,0), rgba(8,20,64,.28))',
          boxShadow: [
            'inset 0 2px 4px rgba(255,240,180,.35)',
            'inset 0 -4px 8px rgba(6,14,46,.55)',
          ].join(','),
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
      >
        <img src={item.icon} alt={item.name} style={{ width: '84%', height: '84%', objectFit: 'contain' }} />
      </div>
    </div>
  )
}

// 稀有度发光配色（用于结果弹框的大卡与小格）。
const GLOW: Record<Rarity, { edge: string; glow: string; soft: string }> = {
  normal: { edge: '#4EA8F5', glow: 'rgba(90,176,255,.65)', soft: '#EAF4FE' },
  rare: { edge: '#A85CF5', glow: 'rgba(177,92,245,.72)', soft: '#F6ECFD' },
  legendary: { edge: '#FFB300', glow: 'rgba(255,206,61,.82)', soft: '#FFF8E3' },
}

const RARITY_RANK: Record<Rarity, number> = { normal: 0, rare: 1, legendary: 2 }

// 金色五角星（SVG）。
function GoldStar({
  size = 24, className, style,
}: { size?: number; className?: string; style?: CSSProperties }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} style={style} aria-hidden>
      <defs>
        <linearGradient id={`mp-star-${size}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#FFF6BF" />
          <stop offset="0.5" stopColor="#FFD24A" />
          <stop offset="1" stopColor="#E69A24" />
        </linearGradient>
      </defs>
      <path
        d="M12 2.2l2.9 5.9 6.5.95-4.7 4.58 1.11 6.47L12 17.1l-5.81 3.06 1.11-6.47L2.6 9.05l6.5-.95z"
        fill={`url(#mp-star-${size})`}
        stroke="#C98212"
        strokeWidth="1.1"
        strokeLinejoin="round"
      />
    </svg>
  )
}

// 旋转放射光芒（conic-gradient 实现，叠在大卡背后）。
function Rays({ color }: { color: string }) {
  return (
    <div
      aria-hidden
      style={{
        position: 'absolute', top: '50%', left: '50%',
        width: '135%', aspectRatio: '1', translate: '-50% -50%',
        borderRadius: '50%',
        background: `conic-gradient(from 0deg, ${color} 0deg 12deg, transparent 12deg 30deg, ${color} 30deg 42deg, transparent 42deg 60deg, ${color} 60deg 72deg, transparent 72deg 90deg, ${color} 90deg 102deg, transparent 102deg 120deg, ${color} 120deg 132deg, transparent 132deg 150deg, ${color} 150deg 162deg, transparent 162deg 180deg)`,
        maskImage: 'radial-gradient(circle, #000 18%, rgba(0,0,0,.55) 52%, transparent 72%)',
        WebkitMaskImage: 'radial-gradient(circle, #000 18%, rgba(0,0,0,.55) 52%, transparent 72%)',
        opacity: 0.5,
        animation: 'mp-rays-spin 22s linear infinite',
      }}
    />
  )
}

// 中央发光大卡。
function FeaturedCard({ o, compact = false }: { o: DrawOutcome; compact?: boolean }) {
  const g = GLOW[o.item.rarity]
  const meta = RARITY_META[o.item.rarity]
  return (
    <div
      style={{
        position: 'relative',
        width: compact ? 'min(38vw, 168px)' : 'min(52vw, 220px, 38vh)',
        aspectRatio: '3 / 4',
        animation: 'mp-card-float 3.6s ease-in-out infinite',
      }}
    >
      <Rays color={g.edge} />
      {/* 卡框（稀有度色发光） */}
      <div
        style={{
          position: 'absolute', inset: 0, borderRadius: 22,
          background: `linear-gradient(160deg, ${g.edge}, #fff 40%, ${g.edge})`,
          padding: 6,
          boxShadow: `0 0 26px ${g.glow}, 0 16px 30px rgba(0,0,0,.28)`,
        }}
      >
        <div
          style={{
            position: 'relative', width: '100%', height: '100%', borderRadius: 17,
            overflow: 'hidden',
            background: `radial-gradient(circle at 50% 32%, #fff, ${g.soft} 78%)`,
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'flex-end',
            padding: '14px 10px 12px',
          }}
        >
          {/* 内顶高光星点 */}
          <GoldStar size={compact ? 12 : 16} style={{ position: 'absolute', top: compact ? 9 : 12, left: compact ? 12 : 16, opacity: .9 }} />
          <GoldStar size={compact ? 10 : 12} style={{ position: 'absolute', top: compact ? 22 : 30, right: compact ? 13 : 18, opacity: .8 }} />
          <img
            src={o.item.icon}
            alt={o.item.name}
            style={{
              position: 'absolute', top: '16%', left: 0, right: 0, margin: 'auto',
              width: '72%', aspectRatio: '1', objectFit: 'contain',
              filter: `drop-shadow(0 8px 10px ${g.glow})`,
            }}
          />
          <div
            style={{
              color: meta.color, fontWeight: 900, fontSize: compact ? 15 : 19, lineHeight: 1.15,
              fontFamily: FONT.family, textAlign: 'center',
            }}
          >
            {o.item.name}
          </div>
          <div
            style={{
              color: C.inkSoft, fontWeight: 800, fontSize: compact ? 10 : 12, fontFamily: FONT.family,
            }}
          >
            {COSMETIC_SLOT_LABEL[o.item.slot]}·{meta.label}
          </div>
        </div>
      </div>
    </div>
  )
}

// 十连小格奖励卡。
function MiniRewardCard({ o, i, featured }: { o: DrawOutcome; i: number; featured: boolean }) {
  const g = GLOW[o.item.rarity]
  return (
    <div
      style={{
        position: 'relative',
        borderRadius: 13, padding: 3,
        background: `linear-gradient(160deg, ${g.edge}, ${g.soft})`,
        boxShadow: featured ? `0 0 0 2px #fff, 0 0 10px ${g.glow}` : '0 3px 6px rgba(0,0,0,.18)',
        animation: `mp-pop-in .35s ${Math.min(i * 0.05, 0.45)}s both`,
      }}
    >
      {!o.isNew && (
        <span
          style={{
            position: 'absolute', top: 3, left: 3, zIndex: 2,
            background: '#eceff1', color: '#546e7a',
            fontSize: 9, fontWeight: 800, lineHeight: 1,
            padding: '2px 5px', borderRadius: R.pill, whiteSpace: 'nowrap',
            fontFamily: FONT.family,
          }}
        >
          已有
        </span>
      )}
      <div
        style={{
          width: '100%', aspectRatio: '1', borderRadius: 10, overflow: 'hidden',
          background: `radial-gradient(circle at 50% 38%, #fff, ${g.soft} 80%)`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
      >
        <img src={o.item.icon} alt={o.item.name} style={{ width: '78%', height: '78%', objectFit: 'contain' }} />
      </div>
      <div
        style={{
          color: RARITY_META[o.item.rarity].color, fontWeight: 900,
          fontSize: 10, lineHeight: 1.1, textAlign: 'center',
          fontFamily: FONT.family,
          padding: '2px 1px 3px',
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}
      >
        {o.item.name}
      </div>
    </div>
  )
}

// 抽卡奖励结果弹窗（贴合高保真：金拱顶面板 + 标题金横幅 + 发光大卡 + 十连格 + 金胶囊按钮）。
// P10-03：抽到新装扮时给"去背包穿戴"引导入口。
function ResultModal({
  outcomes, anyNew, onClose, onGoBackpack,
}: {
  outcomes: DrawOutcome[]
  anyNew: boolean
  onClose: () => void
  onGoBackpack?: () => void
}) {
  const isTen = outcomes.length === 10
  // 最佳奖励：稀有度优先，新品优先。
  const featured = outcomes.reduce((best, o) => {
    if (RARITY_RANK[o.item.rarity] > RARITY_RANK[best.item.rarity]) return o
    if (o.item.rarity === best.item.rarity && o.isNew && !best.isNew) return o
    return best
  })

  return (
    <div
      onClick={onClose}
      style={{
        position: 'absolute', inset: 0, zIndex: 40,
        background: 'radial-gradient(circle at 50% 30%, rgba(60,40,120,.66), rgba(6,12,42,.8))',
        backdropFilter: 'blur(2px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
        animation: 'mp-fade-in .25s both',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          position: 'relative',
          width: isTen ? 'min(96vw, 560px)' : 'min(90vw, 380px)',
          maxHeight: '94vh',
          animation: 'mp-panel-in .42s cubic-bezier(.2,1.2,.4,1) both',
        }}
      >
        {/* 顶部装饰：大星 + 飘带 + 小星 + 两侧金珠 */}
        <div aria-hidden style={{ position: 'absolute', top: -18, left: '50%', translate: '-50% 0', zIndex: 3, filter: 'drop-shadow(0 4px 6px rgba(0,0,0,.3))' }}>
          <GoldStar size={46} />
        </div>
        <div aria-hidden style={{ position: 'absolute', top: -6, left: 'calc(50% - 64px)', zIndex: 2 }}>
          <GoldStar size={20} style={{ opacity: .95 }} />
        </div>
        <div aria-hidden style={{ position: 'absolute', top: -6, left: 'calc(50% + 44px)', zIndex: 2 }}>
          <GoldStar size={20} style={{ opacity: .95 }} />
        </div>
        {/* 金珠 */}
        <div aria-hidden style={{ position: 'absolute', top: 30, left: -8, zIndex: 3, width: 26, height: 26, borderRadius: '50%', background: 'radial-gradient(circle at 35% 30%,#FFF6BF,#E6A23C)', boxShadow: '0 3px 6px rgba(0,0,0,.3)' }} />
        <div aria-hidden style={{ position: 'absolute', top: 30, right: -8, zIndex: 3, width: 26, height: 26, borderRadius: '50%', background: 'radial-gradient(circle at 35% 30%,#FFF6BF,#E6A23C)', boxShadow: '0 3px 6px rgba(0,0,0,.3)' }} />

        {/* 金色厚边框面板 */}
        <div
          style={{
            borderRadius: 30, padding: 7,
            background: 'linear-gradient(180deg,#FFF3B0 0%,#FFD25A 40%,#E69A24 80%,#C47E16 100%)',
            boxShadow: [
              '0 0 26px rgba(255,210,90,.5)',
              '0 22px 50px rgba(0,0,0,.5)',
              'inset 0 2px 3px rgba(255,255,255,.8)',
            ].join(','),
          }}
        >
          <div
            style={{
              borderRadius: 24,
              maxHeight: 'calc(94vh - 14px)', overflowY: 'auto', overflowX: 'hidden',
              background: 'linear-gradient(180deg,#FFFDF6 0%,#FFF6E2 60%,#FFF1D4 100%)',
              padding: isTen ? '28px 16px 16px' : '30px 18px 20px',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: isTen ? 10 : 14,
            }}
          >
            {/* 标题金横幅 */}
            <div
              style={{
                position: 'relative',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                minWidth: '62%', height: isTen ? 38 : 42, padding: '0 28px',
                borderRadius: R.pill,
                background: 'linear-gradient(180deg,#FFD866 0%,#F5A623 100%)',
                boxShadow: '0 4px 8px rgba(180,110,10,.4), inset 0 2px 2px rgba(255,255,255,.7)',
              }}
            >
              <span
                style={{
                  color: '#fff', fontWeight: 900, fontSize: isTen ? 19 : 21, fontFamily: FONT.family,
                  textShadow: textStroke('#B06A0C'),
                  whiteSpace: 'nowrap',
                }}
              >
                {anyNew ? '获得新装扮！' : '本次收获'}
              </span>
            </div>

            <FeaturedCard o={featured} compact={isTen} />

            {/* 十连网格 */}
            {isTen && (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(5, minmax(0,1fr))',
                  gap: 7, width: '100%',
                }}
              >
                {outcomes.map((o, i) => (
                  <MiniRewardCard
                    key={`${o.item.id}-${i}`}
                    o={o} i={i}
                    featured={o.item.id === featured.item.id && o.isNew === featured.isNew}
                  />
                ))}
              </div>
            )}

            {/* 金胶囊确认按钮 + 新装扮引导去背包 */}
            <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginTop: 2 }}>
              {anyNew && onGoBackpack && (
                <button
                  className="mp-btn"
                  onClick={() => { audio.playSfx('click'); onGoBackpack() }}
                  style={{
                    height: isTen ? 50 : 56, minWidth: 150, border: 'none', borderRadius: R.pill,
                    background: 'linear-gradient(180deg,#9fd0f5,#6fb3e8)',
                    color: '#fff', fontWeight: 900, fontSize: 19, fontFamily: FONT.family,
                    boxShadow: '0 4px 0 #4a8fc4', cursor: 'pointer',
                    textShadow: '0 1px 2px rgba(40,90,140,.5)',
                  }}
                >
                  去背包穿戴
                </button>
              )}
              <button
                className="mp-btn"
                onClick={() => { audio.playSfx('click'); onClose() }}
                style={{ position: 'relative', height: isTen ? 50 : 56, minWidth: 190, border: 'none', background: 'transparent' }}
              >
                <span aria-hidden style={{ position: 'absolute', inset: 0, borderRadius: R.pill, background: 'linear-gradient(180deg,#FFF3B0 0%,#FFD25A 42%,#E69A24 80%,#C47E16 100%)' }} />
                <span aria-hidden style={{ position: 'absolute', inset: 5, borderRadius: R.pill, background: 'linear-gradient(180deg,#FFD866 0%,#F5A623 100%)' }} />
                <span aria-hidden style={{ position: 'absolute', inset: 5, borderRadius: R.pill, background: 'linear-gradient(180deg,rgba(255,255,255,.65),rgba(255,255,255,0) 45%)' }} />
                <GoldStar size={18} style={{ position: 'absolute', left: 18, top: '50%', translate: '0 -50%', zIndex: 2 }} />
                <GoldStar size={18} style={{ position: 'absolute', right: 18, top: '50%', translate: '0 -50%', zIndex: 2 }} />
                <span style={{ position: 'relative', zIndex: 2, color: '#fff', fontWeight: 900, fontSize: 22, fontFamily: FONT.family, textShadow: textStroke('#B06A0C') }}>
                  好的
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export function GachaScene({ onBack, onGoBackpack }: { onBack: () => void; onGoBackpack?: () => void }) {
  const [outcomes, setOutcomes] = useState<DrawOutcome[] | null>(null)
  const [opening, setOpening] = useState(false)
  const shells = useEconomyStore(s => s.shells)
  const pityRare = useGachaStore(s => s.pityRare)
  const pityLegend = useGachaStore(s => s.pityLegend)

  const anyNew = useMemo(() => outcomes?.some(o => o.isNew), [outcomes])

  const draw = (times: 1 | 10) => {
    const cost = times === 10 ? TEN_COST : SINGLE_COST
    if (shells < cost) return
    setOpening(true)
    audio.playSfx('open')
    window.setTimeout(() => {
      const result = performDraw(times)
      if (result) {
        setOutcomes(result)
        if (result.some(o => o.isNew)) audio.playSfx('reward')
      }
      setOpening(false)
    }, 1500)
  }

  // 开盒动画期间禁抽：防止 1.5s 窗口内连点并发扣费
  const singleDisabled = opening || shells < SINGLE_COST
  const tenDisabled = opening || shells < TEN_COST

  return (
    <div
      style={{
        position: 'absolute', inset: 0, overflow: 'hidden',
        background: `url(${gachaBg}) center / cover no-repeat, #12276B`,
        fontFamily: FONT.family,
      }}
    >
      {/* 左上返回：与全站统一的标准返回钮 */}
      <BackButton
        size={58}
        onClick={() => { audio.playSfx('click'); onBack() }}
        style={{ position: 'absolute', top: 14, left: 14, zIndex: 10 }}
      />

      {/* 右上贝壳 */}
      <div
        style={{
          position: 'absolute', top: 14, right: 14, zIndex: 10,
          display: 'inline-flex', alignItems: 'center', gap: 8,
          height: 44, padding: '0 16px', borderRadius: R.pill,
          background: 'rgba(0,0,0,.28)', border: '2px solid rgba(255,255,255,.25)',
        }}
      >
        <ShellIcon size={26} />
        <span style={{ color: '#fff', fontWeight: 900, fontSize: 22 }}>{shells}</span>
      </div>

      {/* 顶部保底进度 */}
      <div
        style={{
          position: 'absolute', top: 14, left: '50%', translate: '-50% 0',
          display: 'flex', gap: 12, zIndex: 9,
        }}
      >
        <PityText label="稀有" cur={pityRare} total={RARE_PITY} />
        <PityText label="传说" cur={pityLegend} total={LEGEND_PITY} />
      </div>

      {/* 四角浮动装扮 */}
      {FLOAT_IDS.map((id, i) => (
        <FloatRing key={id} id={id} pos={FLOAT_POS[i]} delay={i * 0.5} />
      ))}

      {/* 中央学盒 */}
      <div
        style={{
          position: 'absolute', top: '46%', left: '50%', translate: '-50% -50%',
        }}
      >
        <Chest opening={opening} />
      </div>

      {/* 底部抽卡按钮 */}
      <div
        style={{
          position: 'absolute', bottom: 24, left: 0, right: 0,
          display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 24,
          padding: '0 20px',
        }}
      >
        <DrawButton
          tone="sun"
          title="抽一次"
          cost={SINGLE_COST}
          disabled={singleDisabled}
          onClick={() => draw(1)}
        />
        <DrawButton
          tone="sky"
          title="10连抽"
          cost={TEN_COST}
          disabled={tenDisabled}
          onClick={() => draw(10)}
        />
      </div>

      {/* 结果弹窗 */}
      {outcomes && (
        <ResultModal
          outcomes={outcomes}
          anyNew={!!anyNew}
          onClose={() => setOutcomes(null)}
          onGoBackpack={onGoBackpack}
        />
      )}
    </div>
  )
}

/** 顶部保底进度：金边小胶囊，内含小星 + 文案 + 底部进度条。 */
function PityText({ label, cur, total }: { label: string; cur: number; total: number }) {
  const pct = Math.min(1, cur / total)
  return (
    <div
      style={{
        position: 'relative',
        display: 'inline-flex', alignItems: 'center', gap: 6,
        height: 36, padding: '0 14px 9px',
        borderRadius: R.pill, overflow: 'hidden',
        background: 'linear-gradient(180deg,#3E9BEF 0%,#2E86DE 52%,#1F63B8 100%)',
        boxShadow: [
          '0 0 0 2px #E8A93A',
          '0 3px 6px rgba(0,0,0,.3)',
          'inset 0 1px 2px rgba(255,255,255,.5)',
        ].join(','),
        whiteSpace: 'nowrap',
      }}
    >
      <GoldStar size={14} />
      <span style={{ color: '#fff', fontWeight: 800, fontSize: 13, textShadow: '0 1px 1px rgba(0,0,0,.35)' }}>
        {label}保底 {cur}/{total}
      </span>
      {/* 底部内凹轨道 + 金色进度填充 */}
      <span
        aria-hidden
        style={{
          position: 'absolute', left: 8, right: 8, bottom: 4, height: 5,
          borderRadius: R.pill,
          background: 'rgba(9,40,92,.55)',
          boxShadow: 'inset 0 1px 2px rgba(0,0,0,.45)',
        }}
      >
        <span
          style={{
            display: 'block', height: '100%', width: `${pct * 100}%`,
            borderRadius: R.pill,
            background: 'linear-gradient(180deg,#FFF3B0,#FFD24A 55%,#F0A824)',
            boxShadow: '0 0 5px rgba(255,210,80,.8)',
          }}
        />
      </span>
    </div>  )
}

// 高保真按钮文字：白字 + 粗深色描边（多方向 text-shadow 模拟描边）。
function textStroke(color: string, shadow?: string) {
  const dirs = [
    [-2, -1], [2, -1], [-2, 1], [2, 1],
    [-1, -2], [1, -2], [-1, 2], [1, 2],
    [0, -2], [0, 2], [-2, 0], [2, 0],
  ]
  return [
    ...dirs.map(([x, y]) => `${x}px ${y}px 0 ${color}`),
    shadow || '0 3px 3px rgba(0,0,0,.28)',
  ].join(',')
}

function DrawButton({
  tone, title, cost, disabled, onClick,
}: {
  tone: 'sun' | 'sky'
  title: string
  cost: number
  disabled: boolean
  onClick: () => void
}) {
  const isSky = tone === 'sky'
  const base: CSSProperties = {
    position: 'relative',
    height: 80, minWidth: 212, padding: isSky ? '0 34px 0 32px' : '0 30px',
    border: 'none',
    borderRadius: isSky ? 0 : R.pill,
    color: '#fff',
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.55 : 1,
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12,
    fontFamily: FONT.family, userSelect: 'none',
    background: 'transparent',
    filter: isSky
      ? 'drop-shadow(0 6px 8px rgba(0,0,0,.38))'
      : undefined,
  }

  const label = (
    <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', lineHeight: 1.12, position: 'relative', zIndex: 2 }}>
      <span
        style={{
          fontSize: 25, fontWeight: 900, color: '#fff',
          textShadow: textStroke(isSky ? '#1759A8' : '#A8620A'),
        }}
      >
        {title}
      </span>
      <span
        style={{
          fontSize: 18, fontWeight: 800, color: '#fff',
          textShadow: textStroke(isSky ? '#1759A8' : '#A8620A'),
        }}
      >
        {cost}贝壳
      </span>
    </span>
  )

  if (isSky) {
    return (
      <button className="mp-btn" disabled={disabled} onClick={onClick} style={base}>
        {/* 金边蓝飘旗位图（左尖右燕尾） */}
        <img
          src={flagTen}
          alt=""
          aria-hidden
          draggable={false}
          style={{
            position: 'absolute', inset: 0, width: '100%', height: '100%',
            objectFit: 'fill', pointerEvents: 'none',
          }}
        />
        <span style={{ position: 'relative', zIndex: 2, display: 'flex' }}>
          <ShellIcon size={34} variant="warm" />
        </span>
        {label}
      </button>
    )
  }

  return (
    <button className="mp-btn" disabled={disabled} onClick={onClick} style={base}>
      {/* 亮金边（顶亮底暗斜面） */}
      <span
        aria-hidden
        style={{
          position: 'absolute', inset: 0, borderRadius: R.pill,
          background: 'linear-gradient(180deg,#FFF3B0 0%,#FFD25A 42%,#E69A24 78%,#C47E16 100%)',
        }}
      />
      {/* 金色牌面 */}
      <span
        aria-hidden
        style={{
          position: 'absolute', inset: 6, borderRadius: R.pill,
          background: 'linear-gradient(180deg,#FFE88F 0%,#FFCE3D 48%,#F5A623 100%)',
        }}
      />
      {/* 顶部内高光 */}
      <span
        aria-hidden
        style={{
          position: 'absolute', inset: 6, borderRadius: R.pill,
          background: 'linear-gradient(180deg,rgba(255,255,255,.6),rgba(255,255,255,0) 40%)',
        }}
      />
      <span style={{ position: 'relative', zIndex: 2, display: 'flex' }}>
        <ShellIcon size={34} variant="warm" />
      </span>
      {label}
    </button>
  )
}

