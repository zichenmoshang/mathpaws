import { lazy, Suspense } from 'react'

import { LoadingOverlay } from './LoadingOverlay'
import { Placeholder } from './Placeholder'
import type { RouteId } from './router'

/**
 * 路由 → 页面分发。
 * 已接入真实页面：home / plaza(2D) / quiz / result / gacha / backpack / paperdoll(dev)；
 * 其余页面渲染占位（标注页面 id，便于施工定位）。
 */
export function RouteView({
  route, onNavigate,
}: {
  route: RouteId
  onNavigate: (id: RouteId) => void
}) {
  switch (route) {
    case 'splash':
      return <SplashLazy onNavigate={onNavigate} />
    case 'hero-intro':
      return <HeroIntroLazy onNavigate={onNavigate} />
    case 'adopt':
      return <AdoptLazy onNavigate={onNavigate} />
    case 'paperdoll':
      return <LazyPaperDoll />
    case 'paperdoll-rt':
      return <LazyPaperDollRt />
    case 'dev-home':
      return <LazyDevHome />
    case 'home':
      return <HomeLazy onNavigate={onNavigate} />
    case 'plaza':
      return <PlazaLazy onNavigate={onNavigate} />
    case 'quiz':
      return <QuizLazy onNavigate={onNavigate} />
    case 'result':
      return <ResultLazy onNavigate={onNavigate} />
    case 'pet-panel':
      return <PetPanelLazy onNavigate={onNavigate} />
    case 'farm':
      return <FarmLazy onNavigate={onNavigate} />
    case 'settings':
      return <SettingsLazy onNavigate={onNavigate} />
    case 'gacha':
      return (
        <GachaLazy
          onBack={() => onNavigate('plaza')}
          onGoBackpack={() => onNavigate('backpack')}
        />
      )
    case 'backpack':
      return (
        <BackpackLazy
          onBack={() => onNavigate('plaza')}
          onGoGacha={() => onNavigate('gacha')}
        />
      )
    default:
      return <Placeholder route={route} onNavigate={onNavigate} />
  }
}

const LazyPlazaRaw = lazy(() =>
  import('../scenes/PlazaScene').then(m => ({ default: m.PlazaScene })),
)
// dev 场景（scenes/dev/）：仅开发构建打包；生产构建 import.meta.env.DEV=false，
// lazy 动态 import 位于死分支被 tree-shake，dev chunk 完全不进生产产物。
const LazyPaperDollRaw = import.meta.env.DEV
  ? lazy(() => import('../scenes/dev/PaperDollLookDev').then(m => ({ default: m.PaperDollLookDev })))
  : null
const LazyPaperDollRtRaw = import.meta.env.DEV
  ? lazy(() => import('../scenes/dev/PaperDollCompositeDev').then(m => ({ default: m.PaperDollCompositeDev })))
  : null
const LazyDevHomeRaw = import.meta.env.DEV
  ? lazy(() => import('../scenes/dev/DevHomeScene').then(m => ({ default: m.DevHomeScene })))
  : null
const LazyHomeRaw = lazy(() =>
  import('../scenes/HomeScene').then(m => ({ default: m.HomeScene })),
)
const LazyQuizRaw = lazy(() =>
  import('../scenes/QuizScene').then(m => ({ default: m.QuizScene })),
)
const LazyResultRaw = lazy(() =>
  import('../scenes/ResultScene').then(m => ({ default: m.ResultScene })),
)
const LazyGachaRaw = lazy(() =>
  import('../scenes/GachaScene').then(m => ({ default: m.GachaScene })),
)
const LazyBackpackRaw = lazy(() =>
  import('../scenes/BackpackScene').then(m => ({ default: m.BackpackScene })),
)
const LazySplashRaw = lazy(() =>
  import('../scenes/onboarding/SplashScene').then(m => ({ default: m.SplashScene })),
)
const LazyHeroIntroRaw = lazy(() =>
  import('../scenes/onboarding/HeroIntroScene').then(m => ({ default: m.HeroIntroScene })),
)
const LazyAdoptRaw = lazy(() =>
  import('../scenes/onboarding/AdoptScene').then(m => ({ default: m.AdoptScene })),
)
const LazyPetPanelRaw = lazy(() =>
  import('../scenes/PetPanelScene').then(m => ({ default: m.PetPanelScene })),
)
const LazyFarmRaw = lazy(() =>
  import('../scenes/FarmScene').then(m => ({ default: m.FarmScene })),
)
const LazySettingsRaw = lazy(() =>
  import('../scenes/SettingsScene').then(m => ({ default: m.SettingsScene })),
)

function SplashLazy({ onNavigate }: { onNavigate: (id: RouteId) => void }) {
  return (
    <Suspense fallback={<LoadingOverlay />}>
      <LazySplashRaw onNavigate={onNavigate} />
    </Suspense>
  )
}
function HeroIntroLazy({ onNavigate }: { onNavigate: (id: RouteId) => void }) {
  return (
    <Suspense fallback={<LoadingOverlay />}>
      <LazyHeroIntroRaw onNavigate={onNavigate} />
    </Suspense>
  )
}
function AdoptLazy({ onNavigate }: { onNavigate: (id: RouteId) => void }) {
  return (
    <Suspense fallback={<LoadingOverlay />}>
      <LazyAdoptRaw onNavigate={onNavigate} />
    </Suspense>
  )
}
function PetPanelLazy({ onNavigate }: { onNavigate: (id: RouteId) => void }) {
  return (
    <Suspense fallback={<LoadingOverlay />}>
      <LazyPetPanelRaw onNavigate={onNavigate} />
    </Suspense>
  )
}
function FarmLazy({ onNavigate }: { onNavigate: (id: RouteId) => void }) {
  return (
    <Suspense fallback={<LoadingOverlay />}>
      <LazyFarmRaw onNavigate={onNavigate} />
    </Suspense>
  )
}
function SettingsLazy({ onNavigate }: { onNavigate: (id: RouteId) => void }) {
  return (
    <Suspense fallback={<LoadingOverlay />}>
      <LazySettingsRaw onNavigate={onNavigate} />
    </Suspense>
  )
}
function PlazaLazy({ onNavigate }: { onNavigate: (id: RouteId) => void }) {
  return (
    <Suspense fallback={<LoadingOverlay />}>
      <LazyPlazaRaw onNavigate={onNavigate} />
    </Suspense>
  )
}
function LazyPaperDoll() {
  if (!LazyPaperDollRaw) return null // 生产构建：dev 路由不可达（hash 未注册）
  return (
    <Suspense fallback={<LoadingOverlay />}>
      <LazyPaperDollRaw />
    </Suspense>
  )
}
function LazyPaperDollRt() {
  if (!LazyPaperDollRtRaw) return null // 生产构建：dev 路由不可达（hash 未注册）
  return (
    <Suspense fallback={<LoadingOverlay />}>
      <LazyPaperDollRtRaw />
    </Suspense>
  )
}
function LazyDevHome() {
  if (!LazyDevHomeRaw) return null // 生产构建：dev 路由不可达（hash 未注册）
  return (
    <Suspense fallback={<LoadingOverlay />}>
      <LazyDevHomeRaw />
    </Suspense>
  )
}
function HomeLazy({ onNavigate }: { onNavigate: (id: RouteId) => void }) {
  return (
    <Suspense fallback={<LoadingOverlay />}>
      <LazyHomeRaw onNavigate={onNavigate} />
    </Suspense>
  )
}
function QuizLazy({ onNavigate }: { onNavigate: (id: RouteId) => void }) {
  return (
    <Suspense fallback={<LoadingOverlay />}>
      <LazyQuizRaw onNavigate={onNavigate} />
    </Suspense>
  )
}
function ResultLazy({ onNavigate }: { onNavigate: (id: RouteId) => void }) {
  return (
    <Suspense fallback={<LoadingOverlay />}>
      <LazyResultRaw onNavigate={onNavigate} />
    </Suspense>
  )
}
function GachaLazy({ onBack, onGoBackpack }: { onBack: () => void; onGoBackpack: () => void }) {
  return (
    <Suspense fallback={<LoadingOverlay />}>
      <LazyGachaRaw onBack={onBack} onGoBackpack={onGoBackpack} />
    </Suspense>
  )
}
function BackpackLazy({ onBack, onGoGacha }: { onBack: () => void; onGoGacha: () => void }) {
  return (
    <Suspense fallback={<LoadingOverlay />}>
      <LazyBackpackRaw onBack={onBack} onGoGacha={onGoGacha} />
    </Suspense>
  )
}
