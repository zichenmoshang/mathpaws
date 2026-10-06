// 新手引导 B（M4-P13+G，简化版）：仅两个点——答题手写区（quiz）、农场选种（farm）。
// 可跳过、不重播（guideDone 持久化于 profile 表）；3D 摇杆/转视角引导已随广场 2D 化删除。
import { FONT } from '@mathpaws/ui'
import { useEffect, useState } from 'react'
import type { CSSProperties } from 'react'

import { usePlayerStore } from '../stores/usePlayerStore'

/** 会话内已展示的引导点（两个点都看过即收尾） */
const shown = new Set<string>()
const TOTAL_STEPS = 2

/** 点"知道了"明确关闭的点位：localStorage 持久化，跨会话不重播 */
const DISMISS_KEY = 'mp_guide_dismissed'
const dismissed: Set<string> = (() => {
  try {
    return new Set(JSON.parse(localStorage.getItem(DISMISS_KEY) ?? '[]') as string[])
  } catch { return new Set() }
})()
const saveDismissed = () => {
  try { localStorage.setItem(DISMISS_KEY, JSON.stringify([...dismissed])) } catch { /* 存储不可用时仅本次会话有效 */ }
}

export function GuideTip({
  id, text, style,
}: {
  /** 引导点 id：quiz-writing / farm-seed */
  id: string
  text: string
  style?: CSSProperties
}) {
  const guideDone = usePlayerStore(s => s.guideDone)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (!guideDone && !shown.has(id) && !dismissed.has(id)) {
      shown.add(id)
      setVisible(true)
    }
  }, [guideDone, id])

  if (!visible) return null

  const close = (persist: boolean) => {
    setVisible(false)
    // "知道了"也算明确关闭：该点位记入持久化已关闭口径，跨会话不再重播
    dismissed.add(id)
    saveDismissed()
    // 主动跳过，或两点都处理过 → 持久化整体收尾，不再重播
    if (persist || shown.size >= TOTAL_STEPS || dismissed.size >= TOTAL_STEPS) {
      usePlayerStore.getState().markGuideDone()
    }
  }

  return (
    <div style={{ ...wrapStyle, ...style }}>
      <span style={textStyle}>{text}</span>
      <div style={{ display: 'flex', gap: 8 }}>
        <button type="button" className="mp-btn" onClick={() => close(false)} style={okBtnStyle}>知道了</button>
        <button type="button" className="mp-btn" onClick={() => close(true)} style={skipBtnStyle}>跳过引导</button>
      </div>
    </div>
  )
}

const wrapStyle: CSSProperties = {
  position: 'absolute', zIndex: 70,
  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10,
  padding: '14px 18px', borderRadius: 20,
  background: 'rgba(255,255,255,.98)', border: '3px solid #ffd9e6',
  boxShadow: '0 10px 24px rgba(60,120,180,.3)',
  fontFamily: FONT.family,
}
const textStyle: CSSProperties = {
  fontWeight: 900, fontSize: 17, color: '#3f4d5c', whiteSpace: 'nowrap',
}
const okBtnStyle: CSSProperties = {
  height: 38, padding: '0 20px', borderRadius: 999, border: 'none',
  background: 'linear-gradient(180deg,#ffd83d,#ffb020)',
  color: '#7a4a12', fontWeight: 900, fontSize: 15,
  boxShadow: '0 4px 0 #e08f00', cursor: 'pointer',
}
const skipBtnStyle: CSSProperties = {
  height: 38, padding: '0 16px', borderRadius: 999, border: 'none',
  background: '#eceff1', color: '#78909c', fontWeight: 800, fontSize: 14,
  cursor: 'pointer',
}
