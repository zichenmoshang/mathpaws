// 正式路由定义（M0-ENG-01）
// 轻量 history 路由：不引入第三方路由库；状态由 RouterStore 持有。
// dev hash 契约保留：#quiz / #gacha 等页面直达；#paperdoll 系 dev 场景仅开发构建可达
//（3D lookdev 已随广场 2D 化移出）。
import { create } from 'zustand'

/** 一期页面（P0–P16，无 P15） */
export type RouteId =
  | 'splash' // P1
  | 'hero-intro' // P2
  | 'adopt' // P3
  | 'home' // P4
  | 'plaza' // P5
  | 'quiz' // P6
  | 'result' // P7
  | 'farm' // P8
  | 'pet-panel' // P9
  | 'gacha' // P10
  | 'backpack' // P16
  | 'wrongbook' // P11
  | 'settings' // P13
  | 'paperdoll' // dev：换装验证
  | 'paperdoll-rt' // dev：换装运行时合成回归页（常驻）
  | 'dev-home' // dev：测试台（#dev）

/** dev 场景 hash（仅开发构建注册；生产构建 import.meta.env.DEV=false，整块被裁剪） */
const DEV_HASH_MAP: Record<string, RouteId> = {
  dev: 'dev-home',
  paperdoll: 'paperdoll',
  'paperdoll-rt': 'paperdoll-rt',
}

/** dev hash → 路由（hash 仅为调试/直达入口） */
const HASH_MAP: Record<string, RouteId> = {
  quiz: 'quiz',
  // dev：直达独立结算页
  'quiz-result': 'result',
  farm: 'farm',
  gacha: 'gacha',
  backpack: 'backpack',
  pet: 'pet-panel',
  home: 'home',
  // dev 场景路由：生产构建完全不含
  ...(import.meta.env.DEV ? DEV_HASH_MAP : {}),
}

function routeFromHash(): RouteId | null {
  if (typeof window === 'undefined') return null
  const raw = window.location.hash.replace(/^#/, '').split(/[?&]/)[0].toLowerCase()
  return HASH_MAP[raw] ?? null
}

interface RouterState {
  route: RouteId
  /** 上一路由（用于返回"从哪来回哪去"） */
  previous: RouteId | null
  go: (id: RouteId) => void
  back: () => void
  /** 应用启动：以 hash 优先，否则默认页（一期首页为学习枢纽入口） */
  init: (fallback: RouteId) => void
  /** 回到广场时清 dev hash */
  clearHash: () => void
}

export const useRouter = create<RouterState>((set, get) => ({
  route: 'home',
  previous: null,

  go: (id) =>
    set(s => (s.route === id ? s : { route: id, previous: s.route })),

  back: () => {
    const s = get()
    if (s.previous) set({ route: s.previous, previous: null })
  },

  init: (fallback) => {
    const fromHash = routeFromHash()
    set({ route: fromHash ?? fallback, previous: null })
  },

  clearHash: () => {
    if (window.location.hash) {
      window.history.replaceState(
        null,
        '',
        window.location.pathname + window.location.search,
      )
    }
  },
}))

/** dev hashchange：不刷新直达 */
export function bindHashRoute(): () => void {
  const onChange = () => {
    const r = routeFromHash()
    if (r) useRouter.getState().go(r)
  }
  window.addEventListener('hashchange', onChange)
  return () => window.removeEventListener('hashchange', onChange)
}
