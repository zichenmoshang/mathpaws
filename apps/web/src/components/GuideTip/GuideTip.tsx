// 新手引导 B（M4-P13+G，简化版）：仅两个点——答题手写区（quiz）、农场选种（farm）。
// 可跳过、不重播（guideDone 持久化于 profile 表）；3D 摇杆/转视角引导已随广场 2D 化删除。
import { btn as uiBtn } from '@mathpaws/ui'
import { useEffect, useState } from 'react'
import type { CSSProperties } from 'react'

import { usePlayerStore } from '../../stores/usePlayerStore'
import * as s from './GuideTip.css'

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
  const guideDone = usePlayerStore(st => st.guideDone)
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
    // 定位由调用方经 style prop 内联传入（覆盖 css.ts 中的静态样式）
    <div className={s.wrap} style={style}>
      <span className={s.text}>{text}</span>
      <div className={s.actions}>
        <button type="button" className={`${uiBtn} ${s.okBtn}`} onClick={() => close(false)}>知道了</button>
        <button type="button" className={`${uiBtn} ${s.skipBtn}`} onClick={() => close(true)}>跳过引导</button>
      </div>
    </div>
  )
}
