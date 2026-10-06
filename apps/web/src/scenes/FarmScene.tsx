// P8 农场（M4-P8-01/02、M4-P14+WH）— 按 hifi-ui-extraction-spec 拆层重建：
// 高保真 design/high-fi/farm/farm.png（Seedream 出稿、去水滴）→ layer_decomposition
// 14 层（_tmp/decomp-farm-v2，absolute/normalized 交叉校验 maxdiff≤2，PIL 全层回贴通过）
// → 采用 13 层落 assets/hifi/farm + manifest.json。
// 资源牌/倒计时牌烘焙数字已擦除，数字与 mm:ss 倒计时前端排版；
// 地块热点 = z9 层 4 块土壤实测矩形（PIL 测量，非 bbox 四等分）；一期固定 4 块地（扩地转二期）。
// 自适应：场景内容运行在 1024×768 LogicalStage 内（坐标数值不变），
// 舞台外留边由 BackgroundBleed 以同一背景 cover 出血填充；
// 静态样式已迁移至 FarmScene.module.css，内联仅保留运行时动态值。
import { BackButton, Modal, Tabs, Tag, ProgressBar } from '@mathpaws/ui'
import { useEffect, useMemo, useRef, useState } from 'react'
import type { CSSProperties } from 'react'

import type { RouteId } from '../app/router'
import { BackgroundBleed, LogicalStage } from '../app/viewport'
import bg from '../assets/hifi/farm/bg.jpg'
import btnPlant from '../assets/hifi/farm/btn-plant.webp'
import bushLeft from '../assets/hifi/farm/bush-left.webp'
import bushRight from '../assets/hifi/farm/bush-right.webp'
import fenceLeft from '../assets/hifi/farm/fence-left.webp'
import fenceRight from '../assets/hifi/farm/fence-right.webp'
import fieldFence from '../assets/hifi/farm/field-fence.webp'
import pillFlower from '../assets/hifi/farm/pill-flower.webp'
import sun from '../assets/hifi/farm/sun.webp'
import { GuideTip } from '../components/GuideTip'
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
import styles from './FarmScene.module.css'

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
    <BackgroundBleed background="#8ecdf2">
      {/* 舞台外留边：同一背景 cover 出血填充 */}
      <img src={bg} alt="" draggable={false} className={styles.bleedBg} />
      <LogicalStage>
        <div className={styles.scene}>
          {/* z0 重绘背景（铺满舞台随缩放） */}
          <img src={bg} alt="" draggable={false} className={styles.bg} />

          {/* 静态展示层 */}
          {LAYERS.map(l => (
            <img key={l.z} src={l.src} alt="" draggable={false} style={place(l.bbox)} />
          ))}

          {/* 左上返回（原稿顶部干净区） */}
          <BackButton size={58} onClick={() => go('plaza')} style={{ position: 'absolute', left: 14, top: 10 }} />

          {/* 资源牌 + 前端数字 */}
          <img src={pillFlower} alt="" draggable={false} style={place(PILL_FLOWER_BBOX)} />
          <span className={styles.pillNum} style={pillNumPlace(PILL_FLOWER_BBOX)}>{flowerCoins}</span>
          <img src={pillShell} alt="" draggable={false} style={place(PILL_SHELL_BBOX)} />
          <span className={styles.pillNum} style={pillNumPlace(PILL_SHELL_BBOX)}>{shells}</span>

          {/* 农场等级条（前端，标题横幅下方） */}
          <div className={styles.levelWrap}>
            <span className={styles.lv}>Lv.{level}</span>
            <div className={styles.progressGrow}>
              <ProgressBar ratio={xpRatio} height={14} />
            </div>
            <span className={styles.xpText}>{nextXp ? `${farmExp - prevXp}/${nextXp - prevXp}` : '已满级'}</span>
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
                className={`mp-btn ${styles.plotBtn}`}
                onClick={() => clickPlot(i)}
                style={place(cell)}
              >
                {st.stage === 'empty' && (
                  <img src={btnPlant} alt="种植" draggable={false} className={styles.plantBtnImg} />
                )}
                {st.stage === 'growing' && (
                  <>
                    <img src={sprouts} alt="" draggable={false} className={styles.sproutsImg} />
                    {/* 倒计时小气泡（不挡植物） */}
                    <span className={styles.cdBubble}>{fmt(st.remainSeconds)}</span>
                  </>
                )}
                {st.stage === 'ready' && plot?.seedId && (
                  <>
                    <img
                      src={FRUIT_IMG[plot.seedId]} alt={CROP_MAP[plot.seedId].name} draggable={false}
                      className={`${styles.fruitImg} ${styles.fruitReady}`}
                    />
                    <span className={styles.readyTag}>点击收获</span>
                  </>
                )}
              </button>
            )
          })}

          {/* 仓库入口（右下角，橙色胶囊） */}
          <button
            type="button"
            className={`mp-btn ${styles.warehouseBtn}`}
            onClick={() => { audio.playSfx('click'); setWarehouseOpen(true) }}
          >
            仓库
          </button>

          {/* 冷启动提示气泡 */}
          {showColdHint && <div className={styles.coldHint}>点空地，播下玉米种子吧！</div>}

          {/* 收获飘字 */}
          {fly && <div className={styles.fly}>{fly}</div>}

          {/* 新手引导 B：农场选种提示（可跳过、不重播） */}
          <GuideTip id="farm-seed" text="点空地，选种子播种；成熟了记得回来收获" style={{ left: '50%', transform: 'translateX(-50%)', bottom: 96 }} />

          {/* 种子袋 */}
          {seedBagFor !== null && (
            <SeedBagPanel plotIndex={seedBagFor} onClose={() => setSeedBagFor(null)} onPlanted={showFly} />
          )}

          {/* 仓库 */}
          {warehouseOpen && <WarehousePanel onClose={() => setWarehouseOpen(false)} />}
        </div>
      </LogicalStage>
    </BackgroundBleed>
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
    // 先购买后播音效：失败（余额不足等）不出声
    const ok = useFarmStore.getState().buySeeds(crop, 1, n => useEconomyStore.getState().spendFlowerCoins(n))
    if (ok) audio.playSfx('click')
    return ok
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
      <div className={styles.panel}>
        <div className={styles.panelTitle}>种子袋</div>
        <div className={styles.panelList}>
          {CROPS.map(c => {
            const locked = level < c.unlockLevel
            const owned = seedInventory[c.id] ?? 0
            const affordable = flowerCoins >= c.seedPrice
            return (
              <div key={c.id} className={styles.cropRow} style={{ opacity: locked ? 0.55 : 1 }}>
                <img
                  src={SEED_IMG[c.id]} alt={c.name} draggable={false}
                  className={styles.cropIcon}
                  style={{ filter: locked ? 'grayscale(1)' : 'none' }}
                />
                <div className={styles.cropMeta}>
                  <span className={styles.cropName}>{c.name}</span>
                  <span className={styles.cropSub}>{c.growMinutes} 分钟成熟 · 持有 ×{owned}</span>
                </div>
                {locked && <Tag tone="gray">Lv.{c.unlockLevel} 解锁</Tag>}
                {!locked && (
                  <div className={styles.rowActions}>
                    <button
                      type="button" className={`mp-btn ${styles.smallBuyBtn}`}
                      disabled={!affordable}
                      onClick={() => buy(c.id)}
                      style={{ opacity: affordable ? 1 : 0.5, cursor: affordable ? 'pointer' : 'not-allowed' }}
                    >
                      买1份 {c.seedPrice}
                    </button>
                    <button
                      type="button" className={`mp-btn ${styles.plantBtn}`}
                      disabled={owned < 1 && !affordable}
                      onClick={() => {
                        if (owned >= 1) plant(c.id)
                        else if (buy(c.id)) plant(c.id)
                      }}
                      style={{
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
      <div className={styles.panel}>
        <div className={styles.panelTitle}>仓库</div>
        <Tabs
          tabs={[{ id: 'fruits', label: '果实' }, { id: 'seeds', label: '种子' }]}
          active={tab}
          onChange={setTab}
        />
        {tab === 'seeds' && (
          <div className={styles.seedGrid}>
            {CROPS.map(c => {
              const n = seedInventory[c.id] ?? 0
              return (
                <div key={c.id} className={styles.whCell} style={{ opacity: n > 0 ? 1 : 0.45 }}>
                  <img src={SEED_IMG[c.id]} alt={c.name} draggable={false} className={styles.whIcon} />
                  <span className={styles.cropName}>{c.name}</span>
                  <span className={styles.cropSub}>×{n}</span>
                </div>
              )
            })}
          </div>
        )}
        {tab === 'fruits' && (
          <div className={styles.panelList}>
            {CROPS.map(c => {
              const n = cropInventory[c.id] ?? 0
              return (
                <div key={c.id} className={styles.cropRow} style={{ opacity: n > 0 ? 1 : 0.45 }}>
                  <img src={FRUIT_IMG[c.id]} alt={c.name} draggable={false} className={styles.cropIcon} />
                  <div className={styles.cropMeta}>
                    <span className={styles.cropName}>{c.name}</span>
                    <span className={styles.cropSub}>×{n} · 单价 {c.sellPrice}</span>
                  </div>
                  <div className={styles.rowActions}>
                    <button
                      type="button" className={`mp-btn ${styles.smallBuyBtn}`} disabled={n < 1} onClick={() => sell(c.id, 1)}
                      style={{ opacity: n < 1 ? 0.5 : 1, cursor: n < 1 ? 'not-allowed' : 'pointer' }}
                    >
                      卖1个
                    </button>
                    <button
                      type="button" className={`mp-btn ${styles.plantBtn}`} disabled={n < 1} onClick={() => sell(c.id, n)}
                      style={{ opacity: n < 1 ? 0.5 : 1, cursor: n < 1 ? 'not-allowed' : 'pointer' }}
                    >
                      全卖
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
        <div className={styles.whFoot}>
          <span className={styles.whFlower}>花朵币 {flowerCoins}</span>
          {sellFly && <span className={styles.sellFly}>{sellFly}</span>}
        </div>
      </div>
    </Modal>
  )
}

/* ---------- 动态定位辅助（运行时计算，保留内联） ---------- */

/* 资源牌数字（牌右半区居中） */
const pillNumPlace = (bbox: [number, number, number, number]): CSSProperties => ({
  left: (bbox[0] + (bbox[2] - bbox[0]) * 0.45) * K,
  top: bbox[1] * K,
  width: (bbox[2] - bbox[0]) * 0.43 * K,
  height: (bbox[3] - bbox[1]) * K,
})
