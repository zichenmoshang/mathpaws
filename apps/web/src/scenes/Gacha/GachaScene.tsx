// P10 学盒抽卡场景（M4-P10-01 / P10-02）
// 正式视觉资产（M1-AST-03 提前落地的道具/背景）：星空背景图 + 透明切图学盒 +
// 四角浮动的中性装扮（整身/头饰）+ 底部单抽/十连。
// 规则对齐 config：单抽 50 / 十连 450；每次必出一件；重复仅提示"已有 XX"、
// 不返还贝壳。结果卡品质色由 RARITY_META 驱动。
// 静态样式已迁入同目录 GachaScene.css.ts（vanilla-extract），稀有度配色走 styleVariants；
// style={{...}} 仅保留运行时动态值（开盒状态、尺寸切换、进度等值通道）。
import {
  BackButton,
  btn as uiBtn,
} from '@mathpaws/ui'
import { assignInlineVars } from '@vanilla-extract/dynamic'
import { useEffect, useMemo, useRef, useState } from 'react'
import type { CSSProperties } from 'react'

import gachaBg from '../../assets/gacha/gacha-bg-starry@2x.webp'
import gachaBoxOpen from '../../assets/gacha/gacha-box-open@2x.webp'
import gachaBox from '../../assets/gacha/gacha-box@2x.webp'
import flagTen from '../../assets/gacha/gacha-flag-ten@2x.webp'
import glowLegendary from '../../assets/gacha/glow-legendary.png'
import {
  RARITY_META, COSMETIC_SLOT_LABEL, type Rarity, type CosmeticSlot,
} from '../../config/cosmetics'
import {
  SINGLE_COST, TEN_COST, RARE_PITY, LEGEND_PITY, GACHA_ITEM_MAP, GACHA_POOL,
} from '../../config/gachaPool'
import { performDraw, type DrawOutcome } from '../../stores'
import { useEconomyStore } from '../../stores/useEconomyStore'
import { useGachaStore } from '../../stores/useGachaStore'
import { audio } from '../../utils/audio'

import * as s from './GachaScene.css'

// 四角浮动展示：从卡池定义派生代表（稀有整身 → 普通帽 → 普通整身 → 稀有帽），不再手抄 id
const pickFloat = (rarity: Rarity, slot: CosmeticSlot): string | undefined =>
  GACHA_POOL.find(i => i.rarity === rarity && i.slot === slot)?.id
const FLOAT_IDS = [
  pickFloat('rare', 'outfit'),
  pickFloat('normal', 'hat'),
  pickFloat('normal', 'outfit'),
  pickFloat('rare', 'hat'),
].filter((id): id is string => !!id)

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
    <div className={s.chest}>
      {/* 传说金色光晕（垫在学盒后） */}
      <img
        src={glowLegendary}
        alt=""
        aria-hidden
        className={s.chestGlow}
      />
      <img
        src={gachaBox}
        alt=""
        aria-hidden
        draggable={false}
        className={s.chestImg}
        style={{ opacity: opening ? 0 : 1 }}
      />
      <img
        src={gachaBoxOpen}
        alt="魔法学盒"
        draggable={false}
        className={`${s.chestImg} ${s.chestImgOpen}`}
        style={{
          opacity: opening ? 1 : 0,
          transform: opening ? 'scale(1.05)' : 'scale(.96)',
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
      className={s.floatRing}
      // 位置与动画延迟为运行时派生值，经 createVar 插槽注入（未给的方向回退 auto）
      style={assignInlineVars({
        [s.floatTop]: pos.top ?? 'auto',
        [s.floatBottom]: pos.bottom ?? 'auto',
        [s.floatLeft]: pos.left ?? 'auto',
        [s.floatRight]: pos.right ?? 'auto',
        [s.floatDelay]: `${delay}s`,
      })}
    >
      <div className={s.floatRingInner}>
        <img src={item.icon} alt={item.name} className={s.floatRingImg} />
      </div>
    </div>
  )
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

// 旋转放射光芒（conic-gradient 底色由稀有度变体类注入，叠在大卡背后）。
function Rays({ toneCls }: { toneCls: string }) {
  return (
    <div
      aria-hidden
      className={`${s.rays} ${toneCls}`}
    />
  )
}

// 中央发光大卡。
function FeaturedCard({ o, compact = false }: { o: DrawOutcome; compact?: boolean }) {
  const tone = o.item.rarity
  const meta = RARITY_META[tone]
  return (
    <div
      className={s.featuredCard}
      style={{ width: compact ? 'min(38vw, 168px)' : 'min(52vw, 220px, 38vh)' }}
    >
      <Rays toneCls={s.raysTone[tone]} />
      {/* 卡框（稀有度色发光） */}
      <div className={`${s.cardFrame} ${s.cardFrameTone[tone]}`}>
        <div className={`${s.cardInner} ${s.cardInnerTone[tone]}`}>
          {/* 内顶高光星点 */}
          <GoldStar size={compact ? 12 : 16} className={s.cardStarA} style={{ top: compact ? 9 : 12, left: compact ? 12 : 16 }} />
          <GoldStar size={compact ? 10 : 12} className={s.cardStarB} style={{ top: compact ? 22 : 30, right: compact ? 13 : 18 }} />
          <img
            src={o.item.icon}
            alt={o.item.name}
            className={`${s.cardImg} ${s.cardImgTone[tone]}`}
          />
          <div
            className={`${s.cardName} ${s.cardNameTone[tone]}`}
            style={{ fontSize: compact ? 15 : 19 }}
          >
            {o.item.name}
          </div>
          <div
            className={s.cardSlot}
            style={{ fontSize: compact ? 10 : 12 }}
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
  const tone = o.item.rarity
  return (
    <div
      className={
        `${s.miniCard} ${s.miniCardTone[tone]}${featured ? ` ${s.miniCardFeaturedTone[tone]}` : ''}`
      }
      // 逐格弹出延迟（随序号递增），经 createVar 插槽注入
      style={assignInlineVars({
        [s.miniDelay]: `${Math.min(i * 0.05, 0.45)}s`,
      })}
    >
      {!o.isNew && (
        <span className={s.miniDup}>
          已有
        </span>
      )}
      <div className={`${s.miniImgWrap} ${s.miniImgWrapTone[tone]}`}>
        <img src={o.item.icon} alt={o.item.name} className={s.miniImg} />
      </div>
      <div className={`${s.miniName} ${s.miniNameTone[tone]}`}>
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
    <div onClick={onClose} className={s.overlay}>
      <div
        onClick={e => e.stopPropagation()}
        className={s.panel}
        style={{ width: isTen ? 'min(96vw, 560px)' : 'min(90vw, 380px)' }}
      >
        {/* 顶部装饰：大星 + 飘带 + 小星 + 两侧金珠 */}
        <div aria-hidden className={s.decoStarMain}>
          <GoldStar size={46} />
        </div>
        <div aria-hidden className={s.decoStarLeft}>
          <GoldStar size={20} className={s.decoStarSmall} />
        </div>
        <div aria-hidden className={s.decoStarRight}>
          <GoldStar size={20} className={s.decoStarSmall} />
        </div>
        {/* 金珠 */}
        <div aria-hidden className={`${s.goldBead} ${s.goldBeadLeft}`} />
        <div aria-hidden className={`${s.goldBead} ${s.goldBeadRight}`} />

        {/* 金色厚边框面板 */}
        <div className={s.panelFrame}>
          <div
            className={s.panelBody}
            style={{
              padding: isTen ? '28px 16px 16px' : '30px 18px 20px',
              gap: isTen ? 10 : 14,
            }}
          >
            {/* 标题金横幅 */}
            <div
              className={s.banner}
              style={{ height: isTen ? 38 : 42 }}
            >
              <span
                className={`${s.bannerText} ${s.strokeGold}`}
                style={{ fontSize: isTen ? 19 : 21 }}
              >
                {anyNew ? '获得新装扮！' : '本次收获'}
              </span>
            </div>

            <FeaturedCard o={featured} compact={isTen} />

            {/* 十连网格 */}
            {isTen && (
              <div className={s.tenGrid}>
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
            <div className={s.actions}>
              {anyNew && onGoBackpack && (
                <button
                  className={`${uiBtn} ${s.goBackpackBtn}`}
                  onClick={() => { audio.playSfx('click'); onGoBackpack() }}
                  style={{ height: isTen ? 50 : 56 }}
                >
                  去背包穿戴
                </button>
              )}
              <button
                className={`${uiBtn} ${s.okBtn}`}
                onClick={() => { audio.playSfx('click'); onClose() }}
                style={{ height: isTen ? 50 : 56 }}
              >
                <span aria-hidden className={s.okBtnLayer1} />
                <span aria-hidden className={s.okBtnLayer2} />
                <span aria-hidden className={s.okBtnLayer3} />
                <GoldStar size={18} className={s.okBtnStarLeft} />
                <GoldStar size={18} className={s.okBtnStarRight} />
                <span className={`${s.okBtnText} ${s.strokeGold}`}>
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

  // 开盒动画计时器：卸载时清理，避免组件销毁后 setState
  const drawTimer = useRef<number | null>(null)
  useEffect(() => () => {
    if (drawTimer.current) clearTimeout(drawTimer.current)
  }, [])

  const draw = (times: 1 | 10) => {
    // 开盒动画期间直接忽略（不单纯依赖按钮 disabled 防连点）
    if (opening) return
    const cost = times === 10 ? TEN_COST : SINGLE_COST
    if (shells < cost) return
    setOpening(true)
    audio.playSfx('open')
    drawTimer.current = window.setTimeout(() => {
      drawTimer.current = null
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
      className={s.root}
      // 星空背景图为打包资产 URL，保留内联注入
      style={{ background: `url(${gachaBg}) center / cover no-repeat, #12276B` }}
    >
      {/* 左上返回：与全站统一的标准返回钮 */}
      <BackButton
        size={58}
        onClick={() => { audio.playSfx('click'); onBack() }}
        style={{ position: 'absolute', top: 14, left: 14, zIndex: 10 }}
      />

      {/* 右上贝壳 */}
      <div className={s.shellPill}>
        <ShellIcon size={26} />
        <span className={s.shellCount}>{shells}</span>
      </div>

      {/* 顶部保底进度 */}
      <div className={s.pityRow}>
        <PityText label="稀有" cur={pityRare} total={RARE_PITY} />
        <PityText label="传说" cur={pityLegend} total={LEGEND_PITY} />
      </div>

      {/* 四角浮动装扮 */}
      {FLOAT_IDS.map((id, i) => (
        <FloatRing key={id} id={id} pos={FLOAT_POS[i]} delay={i * 0.5} />
      ))}

      {/* 中央学盒 */}
      <div className={s.chestWrap}>
        <Chest opening={opening} />
      </div>

      {/* 底部抽卡按钮 */}
      <div className={s.bottomBar}>
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
    <div className={s.pity}>
      <GoldStar size={14} />
      <span className={s.pityLabel}>
        {label}保底 {cur}/{total}
      </span>
      {/* 底部内凹轨道 + 金色进度填充 */}
      <span aria-hidden className={s.pityTrack}>
        <span
          className={s.pityFill}
          style={{ width: `${pct * 100}%` }}
        />
      </span>
    </div>  )
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
  const toneCls = isSky ? s.drawBtnSky : s.drawBtnSun
  const strokeCls = isSky ? s.strokeSky : s.strokeSun

  const label = (
    <span className={s.drawLabel}>
      <span className={`${s.drawTitle} ${strokeCls}`}>
        {title}
      </span>
      <span className={`${s.drawCost} ${strokeCls}`}>
        {cost}贝壳
      </span>
    </span>
  )

  if (isSky) {
    return (
      <button
        className={`${uiBtn} ${s.drawBtn} ${toneCls}`}
        disabled={disabled}
        onClick={onClick}
        // 禁用态透明度/指针为运行时状态，保留内联
        style={{ cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.55 : 1 }}
      >
        {/* 金边蓝飘旗位图（左尖右燕尾） */}
        <img
          src={flagTen}
          alt=""
          aria-hidden
          draggable={false}
          className={s.flagImg}
        />
        <span className={s.shellWrap}>
          <ShellIcon size={34} variant="warm" />
        </span>
        {label}
      </button>
    )
  }

  return (
    <button
      className={`${uiBtn} ${s.drawBtn} ${toneCls}`}
      disabled={disabled}
      onClick={onClick}
      style={{ cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.55 : 1 }}
    >
      {/* 亮金边（顶亮底暗斜面） */}
      <span aria-hidden className={s.sunLayer1} />
      {/* 金色牌面 */}
      <span aria-hidden className={s.sunLayer2} />
      {/* 顶部内高光 */}
      <span aria-hidden className={s.sunLayer3} />
      <span className={s.shellWrap}>
        <ShellIcon size={34} variant="warm" />
      </span>
      {label}
    </button>
  )
}
