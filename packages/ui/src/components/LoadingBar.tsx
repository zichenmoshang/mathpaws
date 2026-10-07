// 【暂未使用 · 2026-10-06 CR】业务页零引用（hifi 位图路线替代 CSS 绘制组件）；业务代码 CR 后评估删留，暂保留。
// ---------- LoadingBar ----------
import * as s from './LoadingBar.css'

export function LoadingBar({
  progress, height = 12,
}: {
  progress: number
  height?: number
}) {
  return (
    <div className={s.track} style={{ height }}>
      <div
        className={s.fill}
        style={{
          width: `${Math.round(Math.min(1, Math.max(0, progress)) * 100)}%`,
        }}
      />
    </div>
  )
}
