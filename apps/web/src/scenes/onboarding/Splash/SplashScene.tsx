// P1 Splash（M4-BOOT-02，高保真拆层重建）
// 资产由 seedream-5.0-pro layer_decomposition 从 design/high-fi/splash/splash.png 拆出
// （z0 背景 + 数字符号 3 组 + 彩虹进度条 + logo + 白雏鸟），
// 层在 1024×768 逻辑舞台内按 bbox×K 定位（K=1024/2364），回贴已与原稿比对验收。
// 进度条为满格位图，按加载进度用 clipPath 从左揭示；其下垫 CSS 空轨道。
// 自适应接线：内容置于 1024×768 LogicalStage 随舞台等比缩放；
// 舞台外留边由 BackgroundBleed 以同一背景图 cover 出血填充。
import { useEffect, useRef, useState } from 'react'
import type { CSSProperties } from 'react'

import type { RouteId } from '../../../app/router'
import { BackgroundBleed, LogicalStage } from '../../../app/viewport'
import bg from '../../../assets/hifi/splash/bg.jpg'
import bird from '../../../assets/hifi/splash/bird.webp'
import logo from '../../../assets/hifi/splash/logo.webp'
import numsCenter from '../../../assets/hifi/splash/nums-center.webp'
import numsLeft from '../../../assets/hifi/splash/nums-left.webp'
import numsRight from '../../../assets/hifi/splash/nums-right.webp'
import bar from '../../../assets/hifi/splash/progress-bar.webp'
import { usePlayerStore } from '../../../stores/usePlayerStore'
import { audio } from '../../../utils/audio'
// 资产台账：assets/hifi/splash/manifest.json
import { preloadCritical } from '../../../utils/preload'

import * as s from './SplashScene.css'

const K = 1024 / 2364
const MIN_VISIBLE_MS = 1400

interface LayerDef { z: number; src: string; bbox: [number, number, number, number] }

// 纯展示层（按 z 序回贴，bbox 为原稿绝对像素）
const LAYERS: LayerDef[] = [
  { z: 1, src: numsLeft, bbox: [160, 1397, 682, 1682] },
  { z: 2, src: numsCenter, bbox: [696, 1385, 1182, 1684] },
  { z: 3, src: numsRight, bbox: [1325, 1387, 2151, 1685] },
  { z: 5, src: logo, bbox: [556, 981, 1811, 1272] },
  { z: 6, src: bird, bbox: [868, 269, 1575, 1042] },
]

// 彩虹进度条 bbox（z4，单独按进度裁剪渲染）
// 注意：服务返回的 absolute bbox x0=100 与 normalized 203(=480px) 矛盾，
// 且该层 PNG 原生宽 1408 与 normalized 宽度 1407 吻合 —— 采用 normalized
// 换算值 [480,1488,1887,1595]（x0=480），否则进度条偏左遮挡数字"1"。
const BAR_BBOX: [number, number, number, number] = [480, 1488, 1887, 1595]

/** 原稿 bbox → 逻辑像素定位（position:absolute 由 s.layer 提供） */
const place = (bbox: [number, number, number, number]): CSSProperties => {
  const [x0, y0, x1, y1] = bbox
  return {
    left: x0 * K, top: y0 * K,
    width: (x1 - x0) * K, height: (y1 - y0) * K,
  }
}

export function SplashScene({ onNavigate }: { onNavigate: (id: RouteId) => void }) {
  // target：资源真实加载进度；shown：rAF 缓动追赶后的展示进度。
  // 资源本地秒载时 target 会瞬间到 1，靠缓动让进度条仍然平滑播放一遍。
  const [target, setTarget] = useState(0)
  const [shown, setShown] = useState(0)
  const shownRef = useRef(0)
  const doneRef = useRef(false)

  useEffect(() => {
    let raf = 0
    let alive = true
    const tick = () => {
      if (!alive) return
      const prev = shownRef.current
      // 指数缓动追赶（系数小一些，全程约 1.2s，加载效果可见）
      const next = Math.abs(target - prev) < 0.003
        ? target
        : prev + (target - prev) * 0.06
      shownRef.current = next
      setShown(next)
      if (next !== target) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => {
      alive = false
      cancelAnimationFrame(raf)
    }
  }, [target])

  useEffect(() => {
    let finished = false
    const startedAt = performance.now()

    const finish = async () => {
      if (finished) return
      finished = true
      // 保证进度条有可见的播放时长
      const elapsed = performance.now() - startedAt
      if (elapsed < MIN_VISIBLE_MS) {
        await new Promise(r => setTimeout(r, MIN_VISIBLE_MS - elapsed))
      }
      if (doneRef.current) return
      doneRef.current = true
      audio.playSfx('click')
      // 首次 → 亮相起名（P2）；已完成启动动线 → 首页（P4）
      onNavigate(usePlayerStore.getState().onboardingDone ? 'home' : 'hero-intro')
    }

    void preloadCritical(setTarget).then(finish)
    return () => {
      finished = true
    }
  }, [onNavigate])

  return (
    <>
      {/* 舞台外留边：同一背景图 cover 出血铺满 */}
      <BackgroundBleed background={`url(${bg}) center / cover no-repeat`} />
      <LogicalStage>
        <div className={s.scene}>
          {/* z0 重绘背景 */}
          <img src={bg} alt="" draggable={false} className={s.bg} />

          {/* 数字符号组 → logo → 雏鸟（z 序） */}
          {LAYERS.map(l => (
            <img key={l.z} src={l.src} alt="" draggable={false} className={s.layer} style={place(l.bbox)} />
          ))}

          {/* 进度条：CSS 空轨道垫底，满格位图按进度从左揭示 */}
          <div className={s.layer} style={place(BAR_BBOX)}>
            <div className={s.barTrack}>
              <div className={s.barSlot} />
            </div>
            <img
              src={bar} alt="" draggable={false}
              className={s.barFill}
              style={{ clipPath: `inset(0 ${(1 - shown) * 100}% 0 0)` }}
            />
          </div>
        </div>
      </LogicalStage>
    </>
  )
}
