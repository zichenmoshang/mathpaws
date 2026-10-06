// [DEV] 测试台：仅开发模式可见（import.meta.env.DEV 路由守卫），生产构建不含
import { useState } from 'react'
import type { CSSProperties, ReactNode } from 'react'

import { useRouter, type RouteId } from '../../app/router'
import { CROPS, CROP_MAP, farmLevelFromExp, getPlotStage, type CropId } from '../../config/farm'
import { PET_SPECIES, petLevelFromExp } from '../../config/pets'
import { chestLevelForStreak } from '../../config/streak'
import { DB_NAME, getDB } from '../../db'
import { useEconomyStore } from '../../stores/useEconomyStore'
import { useFarmStore } from '../../stores/useFarmStore'
import { useGachaStore } from '../../stores/useGachaStore'
import { usePetStore } from '../../stores/usePetStore'
import { usePlayerStore } from '../../stores/usePlayerStore'
import { useStreakStore } from '../../stores/useStreakStore'
import { dayKey } from '../../utils/id'

/** 生产场景清单（与 router.ts 生产 RouteId 对齐；dev 场景不列） */
const PROD_ROUTES: Array<{ id: RouteId; label: string }> = [
  { id: 'splash', label: 'P1 启动页 splash' },
  { id: 'hero-intro', label: 'P2 亮相 hero-intro' },
  { id: 'adopt', label: 'P3 领养 adopt' },
  { id: 'home', label: 'P4 首页 home' },
  { id: 'plaza', label: 'P5 广场 plaza' },
  { id: 'quiz', label: 'P6 答题 quiz' },
  { id: 'result', label: 'P7 结算 result' },
  { id: 'farm', label: 'P8 农场 farm' },
  { id: 'pet-panel', label: 'P9 宠物面板 pet-panel' },
  { id: 'gacha', label: 'P10 抽卡 gacha' },
  { id: 'wrongbook', label: 'P11 错题本 wrongbook' },
  { id: 'settings', label: 'P13 设置 settings' },
  { id: 'backpack', label: 'P16 背包 backpack' },
]

export function DevHomeScene() {
  const go = useRouter(s => s.go)
  return (
    <div style={pageStyle}>
      <div style={wrapStyle}>
        <div style={headerRowStyle}>
          <h1 style={{ margin: 0, fontSize: 20 }}>开发测试台</h1>
          <a
            href="#home"
            style={{ color: '#1e88e5' }}
            onClick={e => {
              e.preventDefault()
              go('home')
            }}
          >
            返回首页
          </a>
          <span style={hintStyle}>仅开发模式可见（#dev）</span>
        </div>
        <NavSection />
        <EconomySection />
        <PetSection />
        <FarmSection />
        <GachaSection />
        <PlayerSection />
        <StreakSection />
        <DangerSection />
      </div>
    </div>
  )
}

function NavSection() {
  const go = useRouter(s => s.go)
  const current = useRouter(s => s.route)
  return (
    <Section title="页面跳转（生产场景）">
      <div style={rowStyle}>
        {PROD_ROUTES.map(r => (
          <button
            key={r.id}
            type="button"
            style={{ ...btnStyle, fontWeight: current === r.id ? 900 : 400 }}
            onClick={() => go(r.id)}
          >
            {r.label}
          </button>
        ))}
      </div>
    </Section>
  )
}

function EconomySection() {
  const shells = useEconomyStore(s => s.shells)
  const flowerCoins = useEconomyStore(s => s.flowerCoins)
  const petFood = useEconomyStore(s => s.petFood)
  return (
    <Section title="经济数值">
      <NumRow
        label="贝壳 shells"
        value={shells}
        onSet={n => useEconomyStore.setState({ shells: Math.max(0, Math.floor(n)) })}
        quick={[{ text: '+500', run: () => useEconomyStore.getState().addShells(500) }]}
      />
      <NumRow
        label="花朵币 flowerCoins"
        value={flowerCoins}
        onSet={n => useEconomyStore.setState({ flowerCoins: Math.max(0, Math.floor(n)) })}
        quick={[{ text: '+500', run: () => useEconomyStore.getState().addFlowerCoins(500) }]}
      />
      <NumRow
        label="宠物食物 petFood"
        value={petFood}
        onSet={n => useEconomyStore.setState({ petFood: Math.max(0, Math.floor(n)) })}
        quick={[{ text: '+500', run: () => useEconomyStore.getState().addPetFood(500) }]}
      />
    </Section>
  )
}

function PetSection() {
  const hasPet = usePetStore(s => s.hasPet)
  const petType = usePetStore(s => s.petType)
  const petName = usePetStore(s => s.petName)
  const petExp = usePetStore(s => s.petExp)
  const setExp = (n: number) =>
    usePetStore.setState({ petExp: Math.max(0, Math.floor(n)) })
  return (
    <Section title="宠物">
      <div style={rowStyle}>
        <span style={labelStyle}>状态</span>
        <span>
          {hasPet
            ? `已领养 ${PET_SPECIES[petType].cnName}（${petName || '未命名'}）`
            : '未领养'}
          ，当前 Lv.{petLevelFromExp(petExp)}（进化阈值 0 / 50 / 1000）
        </span>
      </div>
      <NumRow
        label="累计经验 petExp"
        value={petExp}
        onSet={setExp}
        quick={[0, 50, 1000].map(n => ({ text: String(n), run: () => setExp(n) }))}
      />
    </Section>
  )
}

const PLOT_STAGE_LABEL = { empty: '空地', growing: '生长中', ready: '可收获' } as const

function FarmSection() {
  const farmExp = useFarmStore(s => s.farmExp)
  const seedInventory = useFarmStore(s => s.seedInventory)
  const cropInventory = useFarmStore(s => s.cropInventory)
  const plots = useFarmStore(s => s.plots)

  const addSeeds = (crop: CropId, n: number) => {
    const inv = { ...useFarmStore.getState().seedInventory }
    inv[crop] = (inv[crop] ?? 0) + n
    useFarmStore.setState({ seedInventory: inv })
  }
  /** 把已播种地块的 plantedAt 拨回"生长周期之前"，getPlotStage 派生即为 ready */
  const ripenAll = () => {
    const now = Date.now()
    useFarmStore.setState({
      plots: useFarmStore.getState().plots.map(p =>
        p.seedId
          ? { seedId: p.seedId, plantedAt: now - CROP_MAP[p.seedId].growMinutes * 60_000 }
          : p,
      ),
    })
  }
  const now = Date.now()

  return (
    <Section title="农场">
      <NumRow
        label={`农场经验（Lv.${farmLevelFromExp(farmExp)}）`}
        value={farmExp}
        onSet={n => useFarmStore.setState({ farmExp: Math.max(0, Math.floor(n)) })}
      />
      <div style={rowStyle}>
        <span style={labelStyle}>种子库存</span>
        {CROPS.map(c => (
          <span key={c.id}>
            {c.emoji}
            {c.name}×{seedInventory[c.id] ?? 0}
            <button
              type="button"
              style={{ ...btnStyle, marginLeft: 4 }}
              onClick={() => addSeeds(c.id, 5)}
            >
              +5
            </button>
          </span>
        ))}
      </div>
      <div style={rowStyle}>
        <span style={labelStyle}>果实库存</span>
        <span>{CROPS.map(c => `${c.emoji}×${cropInventory[c.id] ?? 0}`).join('　')}</span>
      </div>
      <div style={rowStyle}>
        <span style={labelStyle}>地块</span>
        {plots.map((p, i) => (
          <span key={i}>
            [{i}]{' '}
            {p.seedId
              ? `${CROP_MAP[p.seedId].name}·${PLOT_STAGE_LABEL[getPlotStage(p, now).stage]}`
              : '空地'}
          </span>
        ))}
        <button type="button" style={btnStyle} onClick={ripenAll}>
          全部地块成熟
        </button>
      </div>
    </Section>
  )
}

function GachaSection() {
  const pityRare = useGachaStore(s => s.pityRare)
  const pityLegend = useGachaStore(s => s.pityLegend)
  const ownedCount = useGachaStore(s => s.owned.length)
  return (
    <Section title="抽卡保底">
      <div style={rowStyle}>
        <span style={labelStyle}>已收集</span>
        <span>{ownedCount} 件装扮（保底：10 稀有 / 100 传说）</span>
      </div>
      <NumRow
        label="稀有保底 pityRare"
        value={pityRare}
        onSet={n => useGachaStore.setState({ pityRare: Math.max(0, Math.floor(n)) })}
        quick={[
          { text: '设 9（下一抽必稀有）', run: () => useGachaStore.setState({ pityRare: 9 }) },
        ]}
      />
      <NumRow
        label="传说保底 pityLegend"
        value={pityLegend}
        onSet={n => useGachaStore.setState({ pityLegend: Math.max(0, Math.floor(n)) })}
        quick={[
          { text: '设 99（下一抽必传说）', run: () => useGachaStore.setState({ pityLegend: 99 }) },
        ]}
      />
    </Section>
  )
}

function PlayerSection() {
  const heroName = usePlayerStore(s => s.heroName)
  const onboardingDone = usePlayerStore(s => s.onboardingDone)
  const guideDone = usePlayerStore(s => s.guideDone)
  const [name, setName] = useState('')
  return (
    <Section title="玩家与引导">
      <div style={rowStyle}>
        <span style={labelStyle}>主角昵称</span>
        <span>
          当前 <b>{heroName}</b>
        </span>
        <input
          style={inputStyle}
          value={name}
          placeholder="≤6 字"
          maxLength={6}
          onChange={e => setName(e.target.value)}
        />
        <button
          type="button"
          style={btnStyle}
          onClick={() => {
            if (name.trim()) usePlayerStore.getState().setHeroName(name)
          }}
        >
          改名
        </button>
      </div>
      <div style={rowStyle}>
        <span style={labelStyle}>首次动线</span>
        <span>onboardingDone = {String(onboardingDone)}</span>
        <button
          type="button"
          style={btnStyle}
          onClick={() => usePlayerStore.setState({ onboardingDone: false })}
        >
          重置（重走启动→领养）
        </button>
        <span style={hintStyle}>刷新后从启动页开始</span>
      </div>
      <div style={rowStyle}>
        <span style={labelStyle}>引导气泡</span>
        <span>guideDone = {String(guideDone)}</span>
        <button
          type="button"
          style={btnStyle}
          onClick={() => {
            usePlayerStore.setState({ guideDone: false })
            localStorage.removeItem('mp_guide_dismissed')
          }}
        >
          清 guideDone + mp_guide_dismissed
        </button>
        <span style={hintStyle}>刷新后重播引导气泡</span>
      </div>
    </Section>
  )
}

function StreakSection() {
  const streak = useStreakStore(s => s.streak)
  const lastStudyDate = useStreakStore(s => s.lastStudyDate)
  const totalDays = useStreakStore(s => s.totalDays)
  const chestLastOpened = useStreakStore(s => s.chestLastOpened)
  const [dateText, setDateText] = useState('')
  const chest = chestLevelForStreak(streak)
  const offsetDay = (offset: number) => {
    const d = new Date()
    d.setDate(d.getDate() + offset)
    return dayKey(d)
  }
  return (
    <Section title="连学 / 宝箱">
      <NumRow
        label="连续天数 streak"
        value={streak}
        onSet={n => useStreakStore.setState({ streak: Math.max(0, Math.floor(n)) })}
        quick={[1, 2, 3, 5, 7].map(n => ({
          text: `${n} 天`,
          run: () => useStreakStore.setState({ streak: n }),
        }))}
      />
      <div style={rowStyle}>
        <span style={labelStyle}>宝箱等级</span>
        <span>
          Lv.{chest.level}（{chest.shells} 贝壳 + {chest.food} 食物）；累计学习 {totalDays} 天
        </span>
      </div>
      <div style={rowStyle}>
        <span style={labelStyle}>上次打卡日期</span>
        <span>
          <b>{lastStudyDate || '（无）'}</b>
        </span>
        <input
          style={{ ...inputStyle, width: 110 }}
          value={dateText}
          placeholder="YYYY-MM-DD"
          onChange={e => setDateText(e.target.value)}
        />
        <button
          type="button"
          style={btnStyle}
          onClick={() => {
            const v = dateText.trim()
            if (/^\d{4}-\d{2}-\d{2}$/.test(v)) useStreakStore.setState({ lastStudyDate: v })
          }}
        >
          设定
        </button>
        <button
          type="button"
          style={btnStyle}
          onClick={() => useStreakStore.setState({ lastStudyDate: offsetDay(0) })}
        >
          今天
        </button>
        <button
          type="button"
          style={btnStyle}
          onClick={() => useStreakStore.setState({ lastStudyDate: offsetDay(-1) })}
        >
          昨天
        </button>
        <span style={hintStyle}>设"昨天"后再完成 1 轮答题即连签 +1</span>
      </div>
      <div style={rowStyle}>
        <span style={labelStyle}>宝箱领取记录</span>
        <span>{chestLastOpened || '（无）'}</span>
        <button
          type="button"
          style={btnStyle}
          onClick={() => useStreakStore.setState({ chestLastOpened: '' })}
        >
          清空（今日可再领）
        </button>
      </div>
    </Section>
  )
}

function DangerSection() {
  const wipe = async () => {
    if (
      !confirm('确定清空全部存档？\n将删除 IndexedDB（mathpaws）与 localStorage，并自动刷新页面。')
    ) {
      return
    }
    try {
      // 先关掉已建立的连接，避免 deleteDatabase 被阻塞
      const d = await getDB()
      d.close()
      await new Promise<void>(resolve => {
        const req = indexedDB.deleteDatabase(DB_NAME)
        req.onsuccess = () => resolve()
        req.onerror = () => resolve()
        req.onblocked = () => resolve()
      })
    } catch {
      // 删库失败也继续清 localStorage 并刷新
    }
    localStorage.clear()
    location.reload()
  }
  return (
    <Section title="危险区">
      <div style={rowStyle}>
        <button type="button" style={dangerBtnStyle} onClick={() => void wipe()}>
          清空全部存档（删 IndexedDB + localStorage + 刷新）
        </button>
      </div>
    </Section>
  )
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section style={sectionStyle}>
      <h2 style={h2Style}>{title}</h2>
      {children}
    </section>
  )
}

function NumRow({
  label,
  value,
  onSet,
  quick,
}: {
  label: string
  value: number
  onSet: (n: number) => void
  quick?: Array<{ text: string; run: () => void }>
}) {
  const [text, setText] = useState('')
  const apply = () => {
    const n = Number(text)
    if (text.trim() !== '' && Number.isFinite(n)) onSet(n)
  }
  return (
    <div style={rowStyle}>
      <span style={labelStyle}>{label}</span>
      <span>
        当前 <b>{value}</b>
      </span>
      <input
        style={inputStyle}
        value={text}
        inputMode="numeric"
        placeholder="数值"
        onChange={e => setText(e.target.value)}
        onKeyDown={e => {
          if (e.key === 'Enter') apply()
        }}
      />
      <button type="button" style={btnStyle} onClick={apply}>
        设定
      </button>
      {quick?.map(q => (
        <button key={q.text} type="button" style={btnStyle} onClick={q.run}>
          {q.text}
        </button>
      ))}
    </div>
  )
}

const pageStyle: CSSProperties = {
  minHeight: '100vh',
  background: '#f5f6f8',
  padding: '24px 16px',
  fontFamily: 'system-ui, sans-serif',
  color: '#263238',
}
const wrapStyle: CSSProperties = {
  maxWidth: 780,
  margin: '0 auto',
  display: 'flex',
  flexDirection: 'column',
  gap: 16,
}
const headerRowStyle: CSSProperties = { display: 'flex', alignItems: 'center', gap: 12 }
const sectionStyle: CSSProperties = {
  background: '#fff',
  border: '1px solid #e0e0e0',
  borderRadius: 12,
  padding: '14px 16px',
}
const h2Style: CSSProperties = { margin: '0 0 10px', fontSize: 16 }
const rowStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  flexWrap: 'wrap',
  margin: '6px 0',
}
const labelStyle: CSSProperties = { minWidth: 120, fontWeight: 700, flexShrink: 0 }
const inputStyle: CSSProperties = {
  width: 90,
  padding: '4px 8px',
  border: '1px solid #ccc',
  borderRadius: 6,
}
const btnStyle: CSSProperties = {
  padding: '4px 12px',
  border: '1px solid #bbb',
  borderRadius: 6,
  background: '#fff',
  cursor: 'pointer',
}
const dangerBtnStyle: CSSProperties = {
  ...btnStyle,
  background: '#d32f2f',
  border: 'none',
  color: '#fff',
  fontWeight: 700,
  padding: '8px 20px',
}
const hintStyle: CSSProperties = { color: '#90a4ae', fontSize: 12 }
