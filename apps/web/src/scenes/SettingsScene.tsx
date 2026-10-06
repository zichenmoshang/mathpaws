// P13 设置页（M4-P13+G）— 按 hifi-ui-extraction-spec 拆层重建：
// 高保真 design/high-fi/settings/settings.png（Seedream 出稿、去振动/保存钮）→ layer_decomposition
// 16 层（_tmp/decomp-settings-v2，交叉校验 maxdiff≤2，PIL 回贴通过）
// → 采用 5 层落 assets/hifi/settings + manifest.json（bg/白卡底板/设置标题/白兔/雏鸟）。
// 行文字与图标前端排版（图标库）；开关用前端 Switch（状态可变，不用烘焙层）。
// 清缓存：二次确认，只清 SW/CacheStorage，不删 IndexedDB 存档；无振动/重置/导入导出。
import { FONT, BackButton, Switch, ConfirmDialog, Modal, Btn } from '@mathpaws/ui'
import type { CSSProperties } from 'react'
import { useState } from 'react'

import type { RouteId } from '../app/router'
// 拆层资产（assets/hifi/settings/manifest.json）
import bg from '../assets/hifi/settings/bg.jpg'
import chick from '../assets/hifi/settings/chick.webp'
import panelCard from '../assets/hifi/settings/panel-card.webp'
import rabbit from '../assets/hifi/settings/rabbit.webp'
import titleText from '../assets/hifi/settings/title-text.webp'
// 行图标（M1-AST-02 图标库）
import gearIcon from '../assets/img/icons/gear@2x.webp'
import broomIcon from '../assets/img/icons/i-broom@2x.webp'
import musicIcon from '../assets/img/icons/i-music@2x.webp'
import soundIcon from '../assets/img/icons/i-sound@2x.webp'
import { useSettingsStore } from '../stores/useSettingsStore'
import { audio } from '../utils/audio'

/** 原稿 2364×1773 → 1024×768 逻辑像素 */
const K = 1024 / 2364

interface LayerDef { z: number; src: string; bbox: [number, number, number, number] }

// 静态展示层（按 z 序回贴）
const LAYERS: LayerDef[] = [
  { z: 1, src: panelCard, bbox: [376, 472, 1989, 1513] },
  { z: 14, src: titleText, bbox: [934, 153, 1430, 395] },
  { z: 15, src: chick, bbox: [1477, 201, 1704, 423] },
  { z: 16, src: rabbit, bbox: [629, 86, 902, 447] },
]

/** 原稿 bbox → 逻辑像素定位 */
const place = (bbox: [number, number, number, number]): CSSProperties => {
  const [x0, y0, x1, y1] = bbox
  return {
    position: 'absolute',
    left: x0 * K, top: y0 * K,
    width: (x1 - x0) * K, height: (y1 - y0) * K,
  }
}

// 行几何（取自拆层行 bbox：图标 x491-650，标签 x695，开关 x1673-1872）
const ROWS_Y = [630, 863, 1099, 1333] // 各行垂直中心（原稿坐标）

/** 只清 SW 与 CacheStorage（存档 IndexedDB 不动） */
async function clearAppCaches(): Promise<void> {
  if ('caches' in window) {
    const keys = await caches.keys()
    await Promise.all(keys.map(k => caches.delete(k)))
  }
  if ('serviceWorker' in navigator) {
    const regs = await navigator.serviceWorker.getRegistrations()
    await Promise.all(regs.map(r => r.unregister()))
  }
}

export function SettingsScene({ onNavigate }: { onNavigate: (id: RouteId) => void }) {
  const bgm = useSettingsStore(s => s.bgm)
  const sfx = useSettingsStore(s => s.sfx)

  const [confirmClear, setConfirmClear] = useState(false)
  const [cleared, setCleared] = useState(false)
  const [aboutOpen, setAboutOpen] = useState(false)

  const go = (id: RouteId) => { audio.playSfx('click'); onNavigate(id) }

  const doClear = async () => {
    setConfirmClear(false)
    await clearAppCaches()
    audio.playSfx('click')
    setCleared(true)
    window.setTimeout(() => setCleared(false), 2000)
  }

  const rows = [
    {
      icon: musicIcon, label: '背景音乐',
      control: <Switch checked={bgm} onChange={v => { audio.playSfx('click'); useSettingsStore.getState().setBgm(v) }} />,
    },
    {
      icon: soundIcon, label: '音效',
      control: <Switch checked={sfx} onChange={v => useSettingsStore.getState().setSfx(v)} />,
    },
    {
      icon: broomIcon, label: '清理缓存',
      control: (
        <button type="button" className="mp-btn" onClick={() => { audio.playSfx('click'); setConfirmClear(true) }} style={rowBtnStyle}>
          清理
        </button>
      ),
    },
    {
      icon: gearIcon, label: '关于我们',
      control: (
        <button type="button" className="mp-btn" onClick={() => { audio.playSfx('click'); setAboutOpen(true) }} style={{ ...rowBtnStyle, background: '#e3f2fd', color: '#3f8fd0' }}>
          查看
        </button>
      ),
    },
  ]

  return (
    <div style={sceneStyle}>
      {/* z0 重绘背景 */}
      <img src={bg} alt="" draggable={false} style={bgStyle} />

      {/* 静态展示层 */}
      {LAYERS.map(l => (
        <img key={l.z} src={l.src} alt="" draggable={false} style={place(l.bbox)} />
      ))}

      {/* 左上返回（原稿顶部干净区） */}
      <BackButton size={58} onClick={() => go('home')} style={{ position: 'absolute', left: 14, top: 10 }} />

      {/* 4 行设置项（行位置按拆层行 bbox） */}
      {rows.map((r, i) => (
        <div key={r.label} style={{ ...rowStyle, top: ROWS_Y[i] * K - 34 }}>
          <img src={r.icon} alt="" draggable={false} style={rowIconStyle} />
          <span style={rowLabelStyle}>{r.label}</span>
          <span style={rowControlStyle}>{r.control}</span>
        </div>
      ))}

      {/* 清理完成提示（白卡内底部） */}
      {cleared && <div style={clearedStyle}>已清理，下次启动生效</div>}

      {/* 清缓存二次确认 */}
      {confirmClear && (
        <ConfirmDialog
          title="清理缓存？"
          message="只清理离线缓存文件，学习存档不会丢失。清理后下次启动会重新下载资源。"
          confirmText="清理"
          cancelText="取消"
          danger
          onConfirm={() => void doClear()}
          onCancel={() => setConfirmClear(false)}
        />
      )}

      {/* 关于我们 */}
      {aboutOpen && (
        <Modal onClose={() => setAboutOpen(false)}>
          <div style={aboutStyle}>
            <span style={aboutTitleStyle}>mathpaws</span>
            <span style={aboutTextStyle}>版本 v0.1.0（一期）</span>
            <span style={aboutTextStyle}>面向小学生的口算练习小游戏</span>
            <span style={aboutTextStyle}>本地离线应用，全部学习数据只保存在本设备</span>
            <Btn variant="grass" onClick={() => { audio.playSfx('click'); setAboutOpen(false) }}>知道了</Btn>
          </div>
        </Modal>
      )}
    </div>
  )
}

/* ---------- 样式（逻辑像素） ---------- */
const sceneStyle: CSSProperties = {
  position: 'absolute', inset: 0, overflow: 'hidden',
  fontFamily: FONT.family,
}
const bgStyle: CSSProperties = {
  position: 'absolute', inset: 0,
  width: '100%', height: '100%', objectFit: 'fill',
}

/* 行：图标 x213 / 标签 x301 / 控件区 x725-811（原稿 bbox ×K） */
const rowStyle: CSSProperties = {
  position: 'absolute', left: 213,
  width: 598, height: 68,
  display: 'flex', alignItems: 'center', gap: 20,
}
const rowIconStyle: CSSProperties = {
  width: 62, height: 62, objectFit: 'contain',
}
const rowLabelStyle: CSSProperties = {
  flex: 1, fontWeight: 900, fontSize: 27, color: '#4a5560',
}
const rowControlStyle: CSSProperties = {
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
  minWidth: 86,
}
const rowBtnStyle: CSSProperties = {
  height: 46, padding: '0 24px', borderRadius: 999, border: 'none',
  background: '#fff3e0', color: '#ad6800', fontWeight: 900, fontSize: 18,
  fontFamily: FONT.family, cursor: 'pointer',
}

const clearedStyle: CSSProperties = {
  position: 'absolute', left: '50%', top: 640, transform: 'translateX(-50%)',
  padding: '6px 18px', borderRadius: 999,
  background: '#e8f5e9', border: '2px solid #7ed957',
  fontWeight: 900, fontSize: 15, color: '#3e9c4c',
}

const aboutStyle: CSSProperties = {
  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10,
  minWidth: 320, fontFamily: FONT.family,
}
const aboutTitleStyle: CSSProperties = {
  fontSize: 30, fontWeight: 900, color: '#4a8fc4',
}
const aboutTextStyle: CSSProperties = {
  fontSize: 16, fontWeight: 800, color: '#7a8794',
}
