// 结算场景 P7（M3-P7，独立路由 'result'）：一轮口算结束后的独立结算页。
// 数据读自内存型 useLastRoundStore（刷新后为 null → 显示默认演示值）。
//   - 正式轮（当日前 2 轮）：展示实际贝壳（逐题 + 保底）与食物；
//   - 练习轮：贝壳/食物均为 0，明确提示「本轮为练习轮，无奖励」；
//   - 主按钮「再练一轮」回 quiz（组件重挂载构建新轮），次按钮「回首页」。
import { FONT } from '@mathpaws/ui'
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
import { useLastRoundStore } from '../stores/useLastRoundStore'
import { useStreakStore } from '../stores/useStreakStore'
import { audio } from '../utils/audio'

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
    correctCount: 0, totalCount: 20, shellsEarned: 0,
    foodEarned: 0, paidRound: false, finishedAt: 0,
  }
  const streak = useStreakStore(s => s.streak)

  const again = () => { audio.playSfx('click'); onNavigate('quiz') }
  const home = () => { audio.playSfx('click'); onNavigate('home') }

  return (
    <div style={resultSceneStyle}>
      <div style={resultStageStyle}>
        <img src={resultBg} alt="" draggable={false}
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} />

        <img src={resultBanner} alt="" draggable={false}
          style={{ ...rbox(417, 284, 1945, 826), animation: 'mp-pop-in .5s ease-out both' }} />
        <img src={resultBird} alt="" draggable={false}
          style={{ ...rbox(992, 398, 1390, 717), transformOrigin: '50% 90%',
            animation: 'mp-pop-in .55s ease-out .08s both' }} />
        <img src={resultTitle} alt="太棒啦" draggable={false}
          style={{ ...rbox(639, 671, 1745, 1020),
            animation: 'mp-pop-in .5s ease-out .18s both' }} />

        {/* 三个奖励：图标切图 + 果冻立体字（动态数值前端排版） */}
        <img src={resultIconShell} alt="" draggable={false}
          style={{ ...rbox(770, 1051, 951, 1233), animation: 'mp-pop-in .45s ease-out .3s both' }} />
        <div style={rewardLabelStyle('#8fe3ff', 'rgba(18,102,214,.95)', 735, 983)}>
          贝壳 +{r.shellsEarned}
        </div>

        <img src={resultIconStar} alt="" draggable={false}
          style={{ ...rbox(1102, 1050, 1282, 1232), animation: 'mp-pop-in .45s ease-out .4s both' }} />
        <div style={rewardLabelStyle('#f1a6ff', 'rgba(122,40,178,.95)', 1093, 1282)}>
          食物 +{r.foodEarned}
        </div>

        <img src={resultIconFlame} alt="" draggable={false}
          style={{ ...rbox(1439, 1052, 1617, 1232), animation: 'mp-pop-in .45s ease-out .5s both' }} />
        <div style={rewardLabelStyle('#ffc27a', 'rgba(178,74,22,.95)', 1429, 1626)}>
          连学{streak}天
        </div>

        {/* 练习轮提示 */}
        {!r.paidRound && (
          <div style={practiceTipStyle}>本轮为练习轮，无奖励</div>
        )}

        {/* 按钮：再练一轮（自绘）+ 回首页（切图） */}
        <button type="button" onClick={again} style={againBtnStyle}>
          再练一轮
        </button>
        <img src={resultBtnPlaza} alt="回首页" draggable={false}
          style={{ ...rbox(1217, 1400, 1766, 1608), animation: 'mp-pop-in .45s ease-out .6s both' }} />
        <button
          type="button" aria-label="回首页" onClick={home}
          style={{ ...rbox(1217, 1400, 1766, 1608), padding: 0, border: 'none',
            background: 'transparent', cursor: 'pointer' }}
        />
      </div>
    </div>
  )
}

/* ---------------- 样式 ---------------- */

const resultSceneStyle: CSSProperties = {
  position: 'absolute', inset: 0, overflow: 'hidden',
  background: '#1f4fb0',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  fontFamily: FONT.family,
}

const resultStageStyle: CSSProperties = {
  position: 'relative',
  aspectRatio: '2364 / 1773',
  height: 'min(100%, calc(100vw * 1773 / 2364))',
}

const practiceTipStyle: CSSProperties = {
  position: 'absolute',
  left: `${(639 / R.w) * 100}%`,
  width: `${((1745 - 639) / R.w) * 100}%`,
  top: `${(1300 / R.h) * 100}%`,
  display: 'flex', justifyContent: 'center',
  fontSize: 'clamp(15px, 2.4vh, 30px)', fontWeight: 900,
  color: '#fff', textShadow: '0 2px 0 rgba(150,60,10,.55)',
}

/** 果冻立体奖励字：亮面填充 + 深色多层描边，坐标为原稿行 bbox */
const rewardLabelStyle =
  (fill: string, edge: string, x0: number, x1: number): CSSProperties => ({
    position: 'absolute',
    left: `${(x0 / R.w) * 100}%`,
    width: `${((x1 - x0) / R.w) * 100}%`,
    top: `${(1242 / R.h) * 100}%`,
    height: `${(58 / R.h) * 100}%`,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    whiteSpace: 'nowrap', fontWeight: 900, color: fill,
    fontSize: 'clamp(15px, 2.75vh, 34px)', lineHeight: 1,
    textShadow:
      `-0.09em -0.05em 0 ${edge}, 0.09em -0.05em 0 ${edge},` +
      `-0.09em 0.05em 0 ${edge}, 0.09em 0.05em 0 ${edge},` +
      `0 -0.09em 0 ${edge}, 0 0.09em 0 ${edge}, 0 0.12em .05em rgba(0,0,0,.25)`,
  })

const againBtnStyle: CSSProperties = {
  ...rbox(598, 1400, 1147, 1608),
  border: 'none', borderRadius: 999, cursor: 'pointer',
  fontFamily: FONT.family, fontWeight: 900,
  fontSize: 'clamp(18px, 3vh, 36px)', color: '#fff',
  background: 'linear-gradient(180deg,#83d96b 0%,#4fb83b 55%,#379b27 100%)',
  boxShadow: '0 6px 0 #2c7d1f, 0 10px 18px rgba(50,140,40,.35), inset 0 2px 4px rgba(255,255,255,.5)',
  animation: 'mp-pop-in .45s ease-out .6s both',
}
