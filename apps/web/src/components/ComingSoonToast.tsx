// 全局统一的轻提示（一期口径：未做功能一律保留入口，点击弹"即将开放"）。
// 任意页面调用 comingSoon() 或 toastMessage(msg) 即可，无需自己实现弹层；
// 同一时刻只显示一条。
import { FONT } from '@mathpaws/ui'
import { useEffect } from 'react'
import type { CSSProperties } from 'react'
import { create } from 'zustand'

import { audio } from '../utils/audio'

interface ToastState {
  visible: boolean
  /** 提示文案（默认"即将开放，敬请期待"） */
  message: string
  /** 前缀图标（emoji；默认施工） */
  icon: string
  show: (message?: string, icon?: string) => void
  hide: () => void
}

const DEFAULT_MSG = '即将开放，敬请期待'

export const useComingSoonStore = create<ToastState>((set) => ({
  visible: false,
  message: DEFAULT_MSG,
  icon: '🚧',
  show: (message, icon) => {
    audio.playSfx('click')
    set({ visible: true, message: message ?? DEFAULT_MSG, icon: icon ?? '🚧' })
  },
  hide: () => set({ visible: false }),
}))

/** 便捷调用：弹"即将开放，敬请期待" */
export function comingSoon(): void {
  useComingSoonStore.getState().show()
}

/** 便捷调用：弹任意提示文案 */
export function toastMessage(message: string, icon?: string): void {
  useComingSoonStore.getState().show(message, icon)
}

export function ComingSoonToast() {
  const visible = useComingSoonStore(s => s.visible)
  const message = useComingSoonStore(s => s.message)
  const icon = useComingSoonStore(s => s.icon)
  const hide = useComingSoonStore(s => s.hide)

  useEffect(() => {
    if (!visible) return
    const t = setTimeout(hide, 1600)
    return () => clearTimeout(t)
  }, [visible, hide])

  if (!visible) return null

  return (
    <div style={backdropStyle} onClick={hide}>
      <div style={toastStyle} role="status">
        <span style={emojiStyle}>{icon}</span>
        {message}
      </div>
    </div>
  )
}

const backdropStyle: CSSProperties = {
  position: 'fixed', inset: 0, zIndex: 200,
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  background: 'rgba(30,60,100,.18)',
  fontFamily: FONT.family,
  animation: 'mp-pop-in .18s ease-out',
}

const toastStyle: CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: 10,
  padding: '18px 34px', borderRadius: 999,
  background: 'linear-gradient(180deg,#ffffff,#eef6ff)',
  border: '4px solid rgba(255,255,255,.9)',
  boxShadow: '0 14px 34px rgba(30,70,130,.3)',
  fontWeight: 900, fontSize: 'clamp(18px,2.6vh,26px)', color: '#3f6ea3',
}

const emojiStyle: CSSProperties = { fontSize: '1.2em' }
