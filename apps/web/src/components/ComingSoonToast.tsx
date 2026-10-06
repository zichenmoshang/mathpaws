// 全局统一的轻提示（一期口径：未做功能一律保留入口，点击弹"即将开放"）。
// 任意页面调用 comingSoon() 或 toastMessage(msg) 即可，无需自己实现弹层；
// 同一时刻只显示一条。
import { useEffect } from 'react'
import { create } from 'zustand'

import { audio } from '../utils/audio'
import styles from './ComingSoonToast.module.css'

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
    // 全屏背板不拦截指针（1.6s 自动消失期间不吞下层点击）；
    // 点击提示气泡本身仍可提前关闭
    <div className={styles.backdrop}>
      <div className={styles.toast} role="status" onClick={hide}>
        <span className={styles.emoji}>{icon}</span>
        {message}
      </div>
    </div>
  )
}
