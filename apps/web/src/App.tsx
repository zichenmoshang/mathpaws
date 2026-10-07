import { useCallback, useEffect } from 'react'

import { BootGate } from './app/BootGate'
import { RouteView } from './app/RouteView'
import { useRouter, bindHashRoute } from './app/router'
import { OrientationGate } from './app/viewport'
import { ComingSoonToast } from './components/ComingSoonToast/ComingSoonToast'
import { bootstrapStores } from './stores'
import { useSettingsStore, useEconomyStore, useGachaStore } from './stores'
import { bindAudioUnlock, audio } from './utils/audio'

// dev 调试：注入 window.__mp，便于浏览器控制台造数据（如加贝壳）
if (import.meta.env.DEV) {
  ;(window as unknown as { __mp?: unknown }).__mp = {
    addShells: (n: number) => useEconomyStore.getState().addShells(n),
    useEconomyStore,
    useGachaStore,
  }
}

const boot = () => bootstrapStores()

function Shell() {
  const route = useRouter(s => s.route)
  const go = useRouter(s => s.go)
  const clearHash = useRouter(s => s.clearHash)

  // 路由初始化：dev hash 优先；默认进入 Splash（P1），由其按 onboardingDone 分流
  useEffect(() => {
    useRouter.getState().init('splash')
    const unbindHash = bindHashRoute()
    const unbindAudio = bindAudioUnlock()

    // 设置 → 音频管理器同步
    const unsubSettings = useSettingsStore.subscribe(s => {
      audio.setBgmEnabled(s.bgm)
      audio.setSfxEnabled(s.sfx)
    })
    const initial = useSettingsStore.getState()
    audio.setBgmEnabled(initial.bgm)
    audio.setSfxEnabled(initial.sfx)

    return () => {
      unbindHash()
      unbindAudio()
      unsubSettings()
    }
  }, [])

  // 回到广场时清 dev hash
  const navigate = useCallback(
    (id: Parameters<typeof go>[0]) => {
      go(id)
      if (id === 'plaza') clearHash()
    },
    [go, clearHash],
  )

  return (
    <OrientationGate>
      <RouteView route={route} onNavigate={navigate} />
      <ComingSoonToast />
    </OrientationGate>
  )
}

// 注：ErrorBoundary / CompatGate 已在 main.tsx 包裹一层，此处不再重复，
// 避免能力检测与样式被双重执行。
export default function App() {
  return (
    <BootGate boot={boot}>
      <Shell />
    </BootGate>
  )
}
