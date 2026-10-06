// P8 农场（M4-P8-01/02、M4-P14+WH）— 按 hifi-ui-extraction-spec 拆层重建：
// 高保真 design/high-fi/farm/farm.png（Seedream 出稿、去水滴）→ layer_decomposition
// 14 层（_tmp/decomp-farm-v2，absolute/normalized 交叉校验 maxdiff≤2，PIL 全层回贴通过）
// → 采用 13 层落 assets/hifi/farm + manifest.json。
// 资源牌/倒计时牌烘焙数字已擦除，数字与 mm:ss 倒计时前端排版；
// 地块热点 = z9 层 4 块土壤实测矩形（PIL 测量，非 bbox 四等分）；一期固定 4 块地（扩地转二期）。
import { FONT, BackButton, Modal, Tabs, Tag, ProgressBar } from '@mathpaws/ui'
import { useEffect, useMemo, useRef, useState } from 'react'
import type { CSSProperties } from 'react'

import type { RouteId } from '../app/router'
import bg from '../assets/hifi/farm/bg.jpg'
import btnPlant from '../assets/hifi/farm/btn-plant.webp'
import bushLeft from '../assets/hifi/farm/bush-left.webp'
import bushRight from '../assets/hifi/farm/bush-right.webp'
import fenceLeft from '../assets/hifi/farm/fence-left.webp'
import fenceRight from '../assets/hifi/farm/fence-right.webp'
import fieldFence from '../assets/hifi/farm/field-fence.webp'
import pillFlower from '../assets/hifi/farm/pill-flower.webp'
import sun from '../assets/hifi/farm/sun.webp'
import { GuideTip } from '../components/GuideB'
import {
  CROPS, CROP_MAP, farmLevelFromExp, nextFarmLevelXp,
  getPlotStage, type CropId,
} from '../config/farm'
import { useFarmStore } from '../stores/useFarmStore'
import { useEconomyStore } from '../stores/useEconomyStore'
import { audio } from '../utils/audio'
// 拆层资产（assets/hifi/farm/manifest.json）
import titleBar from '../assets/hifi/farm/title-bar.webp'
import pillShell from '../assets/hifi/farm/pill-shell.webp'
import sprouts from '../assets/hifi/farm/sprouts.webp'
// 作物种子/果实图标（M1-AST-02）
import seedCorn from '../assets/img/farm/seed-corn@2x.webp'
import seedPumpkin from '../assets/img/farm/seed-pumpkin@2x.webp'
import seedPotato from '../assets/img/farm/seed-potato@2x.webp'
import seedCarrot from '../assets/img/farm/seed-carrot@2x.webp'
import seedTomato from '../assets/img/farm/seed-tomato@2x.webp'
import seedStrawberry from '../assets/img/farm/seed-strawberry@2x.webp'
import fruitCorn from '../assets/img/farm/fruit-corn@2x.webp'
import fruitPumpkin from '../assets/img/farm/fruit-pumpkin@2x.webp'
import fruitPotato from '../assets/img/farm/fruit-potato@2x.webp'
import fruitCarrot from '../assets/img/farm/fruit-carrot@2x.webp'
import fruitTomato from '../assets/img/farm/fruit-tomato@2x.webp'
import fruitStrawberry from '../assets/img/farm/fruit-strawberry@2x.webp'

const SEED_IMG: Record<CropId, string> = {
  corn: seedCorn, pumpkin: seedPumpkin, potato: seedPotato,
  carrot: seedCarrot, tomato: seedTomato, strawberry: seedStrawberry,
}
const FRUIT_IMG: Record<CropId, string> = {
  corn: fruitCorn, pumpkin: fruitPumpkin, potato: fruitPotato,
  carrot: fruitCarrot, tomato: fruitTomato, strawberry: fruitStrawberry,
}

/** 原稿 2364×1773 → 1024×768 逻辑像素 */
const K = 1024 / 2364

interface LayerDef { z: number; src: string; bbox: [number, number, number, number] }

// 静态展示层（按 z 序回贴；z9 中心农田之下、装饰之上）
const LAYERS: LayerDef[] = [
  { z: 1, src: sun, bbox: [191, 74, 523, 404] },
  { z: 2, src: titleBar, bbox: [682, 280, 1682, 525] },
  { z: 5, src: bushLeft, bbox: [0, 683, 325, 1101] },
  { z: 6, src: fenceLeft, bbox: [58, 860, 410, 1306] },
  { z: 7, src: bushRight, bbox: [2122, 809, 2364, 1114] },
  { z: 8, src: fenceRight, bbox: [1999, 865, 2345, 1307] },
  { z: 9, src: fieldFence, bbox: [397, 782, 2006, 1614] },
]

// 资源牌（烘焙数字已擦除，数字前端排版）
const PILL_FLOWER_BBOX: [number, number, number, number] = [1539, 70, 1898, 230]
const PILL_SHELL_BBOX: [number, number, number, number] = [1939, 70, 2298, 231]

// z9 中心农田：4 块土壤实测矩形（_tmp/measure_farm_soil.py，原稿坐标；
// 直接四等分 z9 bbox 会把外框/中栏算入导致内容偏移）
const SOIL_RECTS: Array<[number, number, number, number]> = [
  [580, 879, 1127, 1117],   // 左上
  [1203, 879, 1861, 1117],  // 右上
  [580, 1180, 1127, 1583],  // 左下
  [1203, 1180, 1861, 1583], // 右下
]
const cellOf = (i: number): [number, number, number, number] => SOIL_RECTS[i]

/** 原稿 bbox → 逻辑像素定位 */
const place = (bbox: [number, number, number, number]): CSSProperties => {
  const [x0, y0, x1, y1] = bbox
  return {
    position: 'absolute',
    left: x0 * K, top: y0 * K,
    width: (x1 - x0) * K, height: (y1 - y0) * K,
  }
}

/** 秒 → mm:ss */
function fmt(sec: number): string {
  const m = Math.floor(sec / 60)
  const s = sec % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

export function FarmScene({ onNavigate }: { onNavigate: (id: RouteId) => void }) {
  const farmExp = useFarmStore(s => s.farmExp)
  const plots = useFarmStore(s => s.plots)
  const seedInventory = useFarmStore(s => s.seedInventory)
  const flowerCoins = useEconomyStore(s => s.flowerCoins)
  const shells = useEconomyStore(s => s.shells)

  const level = farmLevelFromExp(farmExp)
  const nextXp = nextFarmLevelXp(level)
  const prevXp = level > 1 ? nextFarmLevelXp(level - 1) ?? 0 : 0
  const xpRatio = nextXp ? Math.min(1, (farmExp - prevXp) / (nextXp - prevXp)) : 1

  // 秒级倒计时驱动
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(t)
  }, [])

  const [seedBagFor, setSeedBagFor] = useState<number | null>(null)
  const [warehouseOpen, setWarehouseOpen] = useState(false)
  const [fly, setFly] = useState<string | null>(null)
  // 飘字定时器：卸载时清理，避免组件销毁后 setState
  const flyTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(() => () => {
    if (flyTimer.current) clearTimeout(flyTimer.current)
  }, [])

  const showFly = (text: string) => {
    setFly(text)
    if (flyTimer.current) clearTimeout(flyTimer.current)
    flyTimer.current = window.setTimeout(() => setFly(null), 1600)
  }

  const go = (id: RouteId) => { audio.playSfx('click'); onNavigate(id) }

  const clickPlot = (i: number) => {
    const plot = plots[i]
    if (!plot) return
    const st = getPlotStage(plot, now)
    if (st.stage === 'empty') {
      audio.playSfx('click')
      setSeedBagFor(i)
    } else if (st.stage === 'ready') {
      const results = useFarmStore.getState().harvest(i)
      if (results.length > 0) {
        audio.playSfx('reward')
        const r = results[0]
        showFly(r.leveled
          ? `+${r.gained} ${CROP_MAP[r.crop].name}　农场升到 Lv.${farmLevelFromExp(useFarmStore.getState().farmExp)}！`
          : `+${r.gained} ${CROP_MAP[r.crop].name}`)
      }
    }
  }

  // 冷启动提示：未种过且持有玉米种子
  const showColdHint = useMemo(() => (
    farmExp === 0
    && (seedInventory.corn ?? 0) >= 1
    && plots.every(p => !p.seedId)
  ), [farmExp, seedInventory, plots])

  return (
    <div style={sceneStyle}>
      {/* z0 重绘背景 */}
      <img src={bg} alt="" draggable={false} style={bgStyle} />

      {/* 静态展示层 */}
      {LAYERS.map(l => (
        <img key={l.z} src={l.src} alt="" draggable={false} style={place(l.bbox)} />
      ))}

      {/* 左上返回（原稿顶部干净区） */}
      <BackButton size={58} onClick={() => go('plaza')} style={{ position: 'absolute', left: 14, top: 10 }} />

      {/* 资源牌 + 前端数字 */}
      <img src={pillFlower} alt="" draggable={false} style={place(PILL_FLOWER_BBOX)} />
      <span style={{ ...pillNumStyle, ...pillNumPlace(PILL_FLOWER_BBOX) }}>{flowerCoins}</span>
      <img src={pillShell} alt="" draggable={false} style={place(PILL_SHELL_BBOX)} />
      <span style={{ ...pillNumStyle, ...pillNumPlace(PILL_SHELL_BBOX) }}>{shells}</span>

      {/* 农场等级条（前端，标题横幅下方） */}
      <div style={levelWrapStyle}>
        <span style={lvStyle}>Lv.{level}</span>
        <div style={{ flex: 1 }}>
          <ProgressBar ratio={xpRatio} height={14} />
        </div>
        <span style={xpTextStyle}>{nextXp ? `${farmExp - prevXp}/${nextXp - prevXp}` : '已满级'}</span>
      </div>

      {/* 4 块地：z9 bbox 四等分热点 */}
      {[0, 1, 2, 3].map(i => {
        const cell = cellOf(i)
        const plot = plots[i]
        const st = plot ? getPlotStage(plot, now) : { stage: 'empty' as const, remainSeconds: 0 }
        return (
          <button
            key={i}
            type="button"
            className="mp-btn"
            onClick={() => clickPlot(i)}
            style={{ ...place(cell), border: 'none', background: 'transparent', padding: 0, cursor: 'pointer' }}
          >
            {st.stage === 'empty' && (
              <img src={btnPlant} alt="种植" draggable={false} style={plantBtnImgStyle} />
            )}
            {st.stage === 'growing' && (
              <>
                <img src={sprouts} alt="" draggable={false} style={sproutsImgStyle} />
                {/* 倒计时小气泡（不挡植物） */}
                <span style={cdBubbleStyle}>{fmt(st.remainSeconds)}</span>
              </>
            )}
            {st.stage === 'ready' && plot?.seedId && (
              <>
                <img
                  src={FRUIT_IMG[plot.seedId]} alt={CROP_MAP[plot.seedId].name} draggable={false}
                  className="mp-farm-ready"
                  style={fruitImgStyle}
                />
                <span style={readyTagStyle}>点击收获</span>
              </>
            )}
          </button>
        )
      })}

      {/* 仓库入口（右下角，橙色胶囊） */}
      <button
        type="button" className="mp-btn"
        onClick={() => { audio.playSfx('click'); setWarehouseOpen(true) }}
        style={warehouseBtnStyle}
      >
        仓库
      </button>

      {/* 冷启动提示气泡 */}
      {showColdHint && <div style={coldHintStyle}>点空地，播下玉米种子吧！</div>}

      {/* 收获飘字 */}
      {fly && <div style={flyStyle}>{fly}</div>}

      {/* 新手引导 B：农场选种提示（可跳过、不重播） */}
      <GuideTip id="farm-seed" text="点空地，选种子播种；成熟了记得回来收获" style={{ left: '50%', transform: 'translateX(-50%)', bottom: 96 }} />

      {/* 种子袋 */}
      {seedBagFor !== null && (
        <SeedBagPanel plotIndex={seedBagFor} onClose={() => setSeedBagFor(null)} onPlanted={showFly} />
      )}

      {/* 仓库 */}
      {warehouseOpen && <WarehousePanel onClose={() => setWarehouseOpen(false)} />}

      <style>{FARM_CSS}</style>
    </div>
  )
}

/* ---------- 种子袋面板（P14） ---------- */
function SeedBagPanel({
  plotIndex, onClose, onPlanted,
}: {
  plotIndex: number
  onClose: () => void
  onPlanted: (text: string) => void
}) {
  const farmExp = useFarmStore(s => s.farmExp)
  const seedInventory = useFarmStore(s => s.seedInventory)
  const flowerCoins = useEconomyStore(s => s.flowerCoins)
  const level = farmLevelFromExp(farmExp)

  const buy = (crop: CropId): boolean => {
    audio.playSfx('click')
    return useFarmStore.getState().buySeeds(crop, 1, n => useEconomyStore.getState().spendFlowerCoins(n))
  }

  const plant = (crop: CropId) => {
    const ok = useFarmStore.getState().plant(plotIndex, crop)
    if (ok) {
      audio.playSfx('pickup')
      onPlanted(`种下了${CROP_MAP[crop].name}`)
      onClose()
    }
  }

  return (
    <Modal onClose={onClose} width={620}>
      <div style={panelStyle}>
        <div style={panelTitleStyle}>种子袋</div>
        <div style={panelListStyle}>
          {CROPS.map(c => {
            const locked = level < c.unlockLevel
            const owned = seedInventory[c.id] ?? 0
            const affordable = flowerCoins >= c.seedPrice
            return (
              <div key={c.id} style={{ ...cropRowStyle, opacity: locked ? 0.55 : 1 }}>
                <img
                  src={SEED_IMG[c.id]} alt={c.name} draggable={false}
                  style={{ width: 52, height: 52, objectFit: 'contain', filter: locked ? 'grayscale(1)' : 'none' }}
                />
                <div style={cropMetaStyle}>
                  <span style={cropNameStyle}>{c.name}</span>
                  <span style={cropSubStyle}>{c.growMinutes} 分钟成熟 · 持有 ×{owned}</span>
                </div>
                {locked && <Tag tone="gray">Lv.{c.unlockLevel} 解锁</Tag>}
                {!locked && (
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      type="button" className="mp-btn"
                      disabled={!affordable}
                      onClick={() => buy(c.id)}
                      style={{ ...smallBuyBtnStyle, opacity: affordable ? 1 : 0.5, cursor: affordable ? 'pointer' : 'not-allowed' }}
                    >
                      买1份 {c.seedPrice}
                    </button>
                    <button
                      type="button" className="mp-btn"
                      disabled={owned < 1 && !affordable}
                      onClick={() => {
                        if (owned >= 1) plant(c.id)
                        else if (buy(c.id)) plant(c.id)
                      }}
                      style={{
                        ...plantBtnStyle,
                        opacity: owned < 1 && !affordable ? 0.5 : 1,
                        cursor: owned < 1 && !affordable ? 'not-allowed' : 'pointer',
                      }}
                    >
                      {owned >= 1 ? '播种' : `购买并播种`}
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </Modal>
  )
}

/* ---------- 仓库面板（P14+WH：种子 / 果实两 tab） ---------- */
function WarehousePanel({ onClose }: { onClose: () => void }) {
  const [tab, setTab] = useState<'seeds' | 'fruits'>('fruits')
  const seedInventory = useFarmStore(s => s.seedInventory)
  const cropInventory = useFarmStore(s => s.cropInventory)
  const flowerCoins = useEconomyStore(s => s.flowerCoins)
  const [sellFly, setSellFly] = useState<string | null>(null)
  // 售出飘字定时器：面板关闭（卸载）时清理
  const sellTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(() => () => {
    if (sellTimer.current) clearTimeout(sellTimer.current)
  }, [])

  const sell = (crop: CropId, qty: number) => {
    const sold = useFarmStore.getState().removeCropForSell(crop, qty)
    if (sold > 0) {
      audio.playSfx('reward')
      const gain = sold * CROP_MAP[crop].sellPrice
      useEconomyStore.getState().addFlowerCoins(gain)
      setSellFly(`+${gain} 花朵币`)
      if (sellTimer.current) clearTimeout(sellTimer.current)
      sellTimer.current = window.setTimeout(() => setSellFly(null), 1200)
    }
  }

  return (
    <Modal onClose={onClose} width={620}>
      <div style={panelStyle}>
        <div style={panelTitleStyle}>仓库</div>
        <Tabs
          tabs={[{ id: 'fruits', label: '果实' }, { id: 'seeds', label: '种子' }]}
          active={tab}
          onChange={setTab}
        />
        {tab === 'seeds' && (
          <div style={seedGridStyle}>
            {CROPS.map(c => {
              const n = seedInventory[c.id] ?? 0
              return (
                <div key={c.id} style={{ ...whCellStyle, opacity: n > 0 ? 1 : 0.45 }}>
                  <img src={SEED_IMG[c.id]} alt={c.name} draggable={false} style={{ width: 48, height: 48, objectFit: 'contain' }} />
                  <span style={cropNameStyle}>{c.name}</span>
                  <span style={cropSubStyle}>×{n}</span>
                </div>
              )
            })}
          </div>
        )}
        {tab === 'fruits' && (
          <div style={panelListStyle}>
            {CROPS.map(c => {
              const n = cropInventory[c.id] ?? 0
              return (
                <div key={c.id} style={{ ...cropRowStyle, opacity: n > 0 ? 1 : 0.45 }}>
                  <img src={FRUIT_IMG[c.id]} alt={c.name} draggable={false} style={{ width: 52, height: 52, objectFit: 'contain' }} />
                  <div style={cropMetaStyle}>
                    <span style={cropNameStyle}>{c.name}</span>
                    <span style={cropSubStyle}>×{n} · 单价 {c.sellPrice}</span>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      type="button" className="mp-btn" disabled={n < 1} onClick={() => sell(c.id, 1)}
                      style={{ ...smallBuyBtnStyle, opacity: n < 1 ? 0.5 : 1, cursor: n < 1 ? 'not-allowed' : 'pointer' }}
                    >
                      卖1个
                    </button>
                    <button
                      type="button" className="mp-btn" disabled={n < 1} onClick={() => sell(c.id, n)}
                      style={{ ...plantBtnStyle, opacity: n < 1 ? 0.5 : 1, cursor: n < 1 ? 'not-allowed' : 'pointer' }}
                    >
                      全卖
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
        <div style={whFootStyle}>
          <span style={whFlowerStyle}>花朵币 {flowerCoins}</span>
          {sellFly && <span style={sellFlyStyle}>{sellFly}</span>}
        </div>
      </div>
    </Modal>
  )
}

/* ---------- 样式（逻辑像素） ---------- */
/* 注意：mp-farm-ready 动画的 transform 会覆盖内联 transform，
   必须把 translate(-50%,-50%) 写进 keyframes，否则果实锚点失效向右下偏移 */
const FARM_CSS = `
@keyframes mp-farm-ready {
  0%,100% { transform: translate(-50%,-50%) scale(1); }
  50% { transform: translate(-50%,-50%) scale(1.08); }
}
.mp-farm-ready { animation: mp-farm-ready 1.2s ease-in-out infinite; }
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
  fontWeight: 900, fontSize: 28, color: '#9a6a24',
  textShadow: '0 2px 0 rgba(255,255,255,.8)',
}

/* 等级条：标题横幅（z2 y280-525）下方 */
const levelWrapStyle: CSSProperties = {
  position: 'absolute', top: 236, left: '50%', transform: 'translateX(-50%)',
  width: 380, display: 'flex', alignItems: 'center', gap: 10,
}
const lvStyle: CSSProperties = {
  padding: '3px 12px', borderRadius: 999,
  background: '#7ed957', color: '#fff', fontWeight: 900, fontSize: 17,
  boxShadow: '0 3px 0 #4e9c33',
}
const xpTextStyle: CSSProperties = {
  fontWeight: 900, fontSize: 14, color: '#fff',
  textShadow: '0 1px 2px rgba(60,110,180,.6)',
}

/* 地块内容（相对地块热点定位） */
const plantBtnImgStyle: CSSProperties = {
  position: 'absolute', left: '50%', top: '50%',
  width: '42%', transform: 'translate(-50%,-50%)',
  objectFit: 'contain',
}
const sproutsImgStyle: CSSProperties = {
  position: 'absolute', left: '50%', top: '14%',
  width: '58%', transform: 'translateX(-50%)',
  objectFit: 'contain',
}
/* 倒计时小气泡：地块右上角，不挡植物 */
const cdBubbleStyle: CSSProperties = {
  position: 'absolute', top: '10%', right: '8%',
  padding: '3px 12px', borderRadius: 999,
  background: 'rgba(255,255,255,.95)', border: '2px solid #6fb3e8',
  color: '#2b6cb0', fontWeight: 900, fontSize: 14,
  boxShadow: '0 3px 6px rgba(40,90,160,.25)',
  whiteSpace: 'nowrap',
}
const fruitImgStyle: CSSProperties = {
  position: 'absolute', left: '50%', top: '46%',
  width: '52%', transform: 'translate(-50%,-50%)',
  objectFit: 'contain',
  filter: 'drop-shadow(0 6px 8px rgba(60,30,10,.35))',
}
const readyTagStyle: CSSProperties = {
  position: 'absolute', left: '50%', bottom: '6%', transform: 'translateX(-50%)',
  padding: '2px 14px', borderRadius: 999,
  background: '#ffec99', color: '#8a6d1d',
  fontWeight: 900, fontSize: 14, whiteSpace: 'nowrap',
  boxShadow: '0 3px 6px rgba(60,30,10,.25)',
}

/* 仓库按钮：右下角橙色胶囊 */
const warehouseBtnStyle: CSSProperties = {
  position: 'absolute', right: 28, bottom: 24,
  height: 60, padding: '0 34px', borderRadius: 999, border: 'none',
  background: 'linear-gradient(180deg,#ffd83d,#ffb020)',
  color: '#7a4a12', fontWeight: 900, fontSize: 22,
  boxShadow: '0 5px 0 #e08f00',
  fontFamily: FONT.family, cursor: 'pointer',
}

const coldHintStyle: CSSProperties = {
  position: 'absolute', bottom: 118, left: '50%', transform: 'translateX(-50%)',
  padding: '8px 22px', borderRadius: 999,
  background: '#fff', border: '3px solid #cdeab6',
  color: '#5da23f', fontWeight: 900, fontSize: 17,
  boxShadow: '0 6px 12px rgba(90,150,80,.2)',
  fontFamily: FONT.family, whiteSpace: 'nowrap',
}
const flyStyle: CSSProperties = {
  position: 'absolute', top: 240, left: '50%', transform: 'translateX(-50%)',
  padding: '8px 20px', borderRadius: 999,
  background: '#e8f5e9', border: '2px solid #7ed957',
  color: '#3e9c4c', fontWeight: 900, fontSize: 19, whiteSpace: 'nowrap',
  fontFamily: FONT.family, zIndex: 30,
}

/* 面板内部 */
const panelStyle: CSSProperties = {
  display: 'flex', flexDirection: 'column', gap: 14, alignItems: 'center',
  width: '100%', fontFamily: FONT.family,
}
const panelTitleStyle: CSSProperties = { fontSize: 24, fontWeight: 900, color: '#3f4d5c' }
const panelListStyle: CSSProperties = {
  display: 'flex', flexDirection: 'column', gap: 10,
  width: '100%', maxHeight: 440, overflowY: 'auto', padding: 2,
}
const cropRowStyle: CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 12,
  padding: '8px 12px', borderRadius: 16,
  background: '#f7faf4', border: '2px solid #e3eee0',
}
const cropMetaStyle: CSSProperties = {
  flex: 1, display: 'flex', flexDirection: 'column', gap: 2,
}
const cropNameStyle: CSSProperties = { fontWeight: 900, fontSize: 18, color: '#3f4d5c' }
const cropSubStyle: CSSProperties = { fontWeight: 800, fontSize: 13, color: '#8a97a3' }
const smallBuyBtnStyle: CSSProperties = {
  height: 40, padding: '0 14px', borderRadius: 999, border: 'none',
  background: '#fff3e0', color: '#ad6800', fontWeight: 900, fontSize: 14,
  fontFamily: FONT.family,
}
const plantBtnStyle: CSSProperties = {
  height: 40, padding: '0 18px', borderRadius: 999, border: 'none',
  background: 'linear-gradient(180deg,#9be15d,#6cc24a)',
  color: '#fff', fontWeight: 900, fontSize: 15,
  boxShadow: '0 4px 0 #4e9c33',
  fontFamily: FONT.family,
}
const seedGridStyle: CSSProperties = {
  display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, width: '100%',
}
const whCellStyle: CSSProperties = {
  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
  padding: 12, borderRadius: 16,
  background: '#f7faf4', border: '2px solid #e3eee0',
}
const whFootStyle: CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 14, justifyContent: 'center',
}
const whFlowerStyle: CSSProperties = {
  fontWeight: 900, fontSize: 18, color: '#ad6800',
}
const sellFlyStyle: CSSProperties = {
  fontWeight: 900, fontSize: 17, color: '#3e9c4c',
}
