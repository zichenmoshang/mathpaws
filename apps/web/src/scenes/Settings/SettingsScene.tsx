// P13 设置页（M4-P13+G）— 按 hifi-ui-extraction-spec 拆层重建：
// 高保真 design/high-fi/settings/settings.png（Seedream 出稿、去振动/保存钮）→ layer_decomposition
// 16 层（_tmp/decomp-settings-v2，交叉校验 maxdiff≤2，PIL 回贴通过）
// → 采用 5 层落 assets/hifi/settings + manifest.json（bg/白卡底板/设置标题/白兔/雏鸟）。
// 行文字与图标前端排版（图标库）；开关用前端 Switch（状态可变，不用烘焙层）。
// 清缓存：二次确认，只清 SW/CacheStorage，不删 IndexedDB 存档；无振动/重置/导入导出。
// 自适应接线：内容置于 1024×768 LogicalStage 随舞台等比缩放；
// 舞台外留边由 BackgroundBleed 以同一背景图 cover 出血填充。
import { BackButton, Btn, ConfirmDialog, Modal, Switch } from '@mathpaws/ui'
import type { CSSProperties } from 'react'
import { useState } from 'react'

import { version } from '../../../package.json'
import type { RouteId } from '../../app/router'
import { BackgroundBleed, LogicalStage } from '../../app/viewport'
import { toastMessage } from '../../components/ComingSoonToast/ComingSoonToast'
// 拆层资产（assets/hifi/settings/manifest.json）
import bg from '../../assets/hifi/settings/bg.jpg'
import chick from '../../assets/hifi/settings/chick.webp'
import panelCard from '../../assets/hifi/settings/panel-card.webp'
import rabbit from '../../assets/hifi/settings/rabbit.webp'
import titleText from '../../assets/hifi/settings/title-text.webp'
// 行图标（M1-AST-02 图标库）
import gearIcon from '../../assets/img/icons/gear@2x.webp'
import broomIcon from '../../assets/img/icons/i-broom@2x.webp'
import musicIcon from '../../assets/img/icons/i-music@2x.webp'
import soundIcon from '../../assets/img/icons/i-sound@2x.webp'
import { useSettingsStore } from '../../stores/useSettingsStore'
import { audio } from '../../utils/audio'

import styles from './SettingsScene.module.css'

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

/** 原稿 bbox → 逻辑像素定位（position:absolute 由 styles.layer 提供） */
const place = (bbox: [number, number, number, number]): CSSProperties => {
  const [x0, y0, x1, y1] = bbox
  return {
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
    try {
      await clearAppCaches()
    } catch (err) {
      // caches.keys() / getRegistrations() 可能 reject（隐私模式、权限受限等）：给可见提示
      console.warn('清理缓存失败', err)
      toastMessage('清理失败，请稍后重试', '⚠️')
      return
    }
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
        <button type="button" className={`mp-btn ${styles.rowBtn}`} onClick={() => { audio.playSfx('click'); setConfirmClear(true) }}>
          清理
        </button>
      ),
    },
    {
      icon: gearIcon, label: '关于我们',
      control: (
        <button type="button" className={`mp-btn ${styles.rowBtn} ${styles.rowBtnInfo}`} onClick={() => { audio.playSfx('click'); setAboutOpen(true) }}>
          查看
        </button>
      ),
    },
  ]

  return (
    <>
      {/* 舞台外留边：同一背景图 cover 出血铺满 */}
      <BackgroundBleed background={`url(${bg}) center / cover no-repeat`} />
      <LogicalStage>
        <div className={styles.scene}>
          {/* z0 重绘背景 */}
          <img src={bg} alt="" draggable={false} className={styles.bg} />

          {/* 静态展示层 */}
          {LAYERS.map(l => (
            <img key={l.z} src={l.src} alt="" draggable={false} className={styles.layer} style={place(l.bbox)} />
          ))}

          {/* 左上返回（原稿顶部干净区） */}
          <div className={styles.backBtn}>
            <BackButton size={58} onClick={() => go('home')} />
          </div>

          {/* 4 行设置项（行位置按拆层行 bbox，top 逐行内联） */}
          {rows.map((r, i) => (
            <div key={r.label} className={styles.row} style={{ top: ROWS_Y[i] * K - 34 }}>
              <img src={r.icon} alt="" draggable={false} className={styles.rowIcon} />
              <span className={styles.rowLabel}>{r.label}</span>
              <span className={styles.rowControl}>{r.control}</span>
            </div>
          ))}

          {/* 清理完成提示（白卡内底部） */}
          {cleared && <div className={styles.cleared}>已清理，下次启动生效</div>}

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
              <div className={styles.about}>
                <span className={styles.aboutTitle}>mathpaws</span>
                <span className={styles.aboutText}>版本 v{version}（一期）</span>
                <span className={styles.aboutText}>面向小学生的口算练习小游戏</span>
                <span className={styles.aboutText}>本地离线应用，全部学习数据只保存在本设备</span>
                <Btn variant="grass" onClick={() => { audio.playSfx('click'); setAboutOpen(false) }}>知道了</Btn>
              </div>
            </Modal>
          )}
        </div>
      </LogicalStage>
    </>
  )
}
