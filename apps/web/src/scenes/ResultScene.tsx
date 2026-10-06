// 结算场景 P7（M3-P7，独立路由 'result'）：一轮口算结束后的独立结算页。
// 数据读自内存型 useLastRoundStore（刷新后为 null → 显示默认演示值）。
//   - 正式轮（当日前 2 轮）：展示实际贝壳（逐题 + 保底）与食物；
//   - 练习轮：贝壳/食物均为 0，明确提示「本轮为练习轮，无奖励」；
//   - 主按钮「再练一轮」回 quiz（组件重挂载构建新轮），次按钮「回首页」。
import type { CSSProperties } from 'react'

import type { RouteId } from '../app/router'
import resultBanner from '../assets/hifi/result/banner.webp'
import resultBg from '../assets/hifi/result/bg.webp'
import resultBird from '../assets/hifi/result/bird.webp'
import resultBtnPlaza from '../assets/hifi/result/btn-plaza.webp'
import resultIconFlame from '../assets/hifi/result/icon-flame.webp'
import resultIconShell from '../assets/hifi/result/icon-shell.webp'
import resultIconStar from '../assets/hifi/result/icon-star.webp'
import resultTitle from '../assets/hifi/result/title.webp'
import { QUESTIONS_PER_ROUND } from '../config/quiz'
import { useLastRoundStore } from '../stores/useLastRoundStore'
import { useStreakStore } from '../stores/useStreakStore'
import { audio } from '../utils/audio'
import styles from './ResultScene.module.css'

// 结算页舞台 = 全稿 2364×1773
const R = { w: 2364, h: 1773 }
const rbox = (x0: number, y0: number, x1: number, y1: number): CSSProperties => ({
  position: 'absolute',
  left: `${(x0 / R.w) * 100}%`,
  top: `${(y0 / R.h) * 100}%`,
  width: `${((x1 - x0) / R.w) * 100}%`,
  height: `${((y1 - y0) / R.h) * 100}%`,
})

export function ResultScene(
  { onNavigate }: { onNavigate: (id: RouteId) => void },
) {
  // 无结果（如刷新直达）时的演示值
  const result = useLastRoundStore(s => s.result)
  const r = result ?? {
    correctCount: 0, totalCount: QUESTIONS_PER_ROUND, shellsEarned: 0,
    foodEarned: 0, paidRound: false, finishedAt: 0,
  }
  const streak = useStreakStore(s => s.streak)

  const again = () => { audio.playSfx('click'); onNavigate('quiz') }
  const home = () => { audio.playSfx('click'); onNavigate('home') }

  return (
    <div className={styles.scene}>
      <div className={styles.stage}>
        <img src={resultBg} alt="" draggable={false} className={styles.bg} />

        <img src={resultBanner} alt="" draggable={false}
          className={styles.banner} style={rbox(417, 284, 1945, 826)} />
        <img src={resultBird} alt="" draggable={false}
          className={styles.bird} style={rbox(992, 398, 1390, 717)} />
        <img src={resultTitle} alt="太棒啦" draggable={false}
          className={styles.title} style={rbox(639, 671, 1745, 1020)} />

        {/* 三个奖励：图标切图 + 果冻立体字（动态数值前端排版） */}
        <img src={resultIconShell} alt="" draggable={false}
          className={styles.iconShell} style={rbox(770, 1051, 951, 1233)} />
        <div className={styles.rewardLabel}
          style={rewardLabelPos('#8fe3ff', 'rgba(18,102,214,.95)', 735, 983)}>
          贝壳 +{r.shellsEarned}
        </div>

        <img src={resultIconStar} alt="" draggable={false}
          className={styles.iconStar} style={rbox(1102, 1050, 1282, 1232)} />
        <div className={styles.rewardLabel}
          style={rewardLabelPos('#f1a6ff', 'rgba(122,40,178,.95)', 1093, 1282)}>
          食物 +{r.foodEarned}
        </div>

        <img src={resultIconFlame} alt="" draggable={false}
          className={styles.iconFlame} style={rbox(1439, 1052, 1617, 1232)} />
        <div className={styles.rewardLabel}
          style={rewardLabelPos('#ffc27a', 'rgba(178,74,22,.95)', 1429, 1626)}>
          连学{streak}天
        </div>

        {/* 练习轮提示 */}
        {!r.paidRound && (
          <div
            className={styles.practiceTip}
            style={{
              left: `${(639 / R.w) * 100}%`,
              width: `${((1745 - 639) / R.w) * 100}%`,
              top: `${(1300 / R.h) * 100}%`,
            }}
          >
            本轮为练习轮，无奖励
          </div>
        )}

        {/* 按钮：再练一轮（自绘）+ 回首页（切图） */}
        <button type="button" onClick={again}
          className={styles.againBtn} style={rbox(598, 1400, 1147, 1608)}>
          再练一轮
        </button>
        <img src={resultBtnPlaza} alt="回首页" draggable={false}
          className={styles.plazaImg} style={rbox(1217, 1400, 1766, 1608)} />
        <button
          type="button" aria-label="回首页" onClick={home}
          className={styles.homeBtn} style={rbox(1217, 1400, 1766, 1608)}
        />
      </div>
    </div>
  )
}

/* ---------------- 样式（静态部分见 ResultScene.module.css） ---------------- */

/**
 * 果冻立体奖励字的动态部分：原稿行 bbox 换算的坐标 + 随奖励项变化的填充/描边色；
 * 静态排版（flex 居中、字号 clamp 等）在 module.css 的 .rewardLabel
 */
const rewardLabelPos =
  (fill: string, edge: string, x0: number, x1: number): CSSProperties => ({
    left: `${(x0 / R.w) * 100}%`,
    width: `${((x1 - x0) / R.w) * 100}%`,
    top: `${(1242 / R.h) * 100}%`,
    height: `${(58 / R.h) * 100}%`,
    color: fill,
    textShadow:
      `-0.09em -0.05em 0 ${edge}, 0.09em -0.05em 0 ${edge},` +
      `-0.09em 0.05em 0 ${edge}, 0.09em 0.05em 0 ${edge},` +
      `0 -0.09em 0 ${edge}, 0 0.09em 0 ${edge}, 0 0.12em .05em rgba(0,0,0,.25)`,
  })
