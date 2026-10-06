import './scaffold.css'

// 场景 chunk / 资源懒加载期间的全屏过渡遮罩（React.Suspense fallback）。
export function LoadingOverlay({ hint = '加载中…' }: { hint?: string }) {
  return (
    <div className="mp-overlay" role="status" aria-live="polite">
      <div className="mp-loading">
        <div className="mp-spinner" />
        <div className="mp-loading-title">mathpaws</div>
        <div className="mp-loading-hint">{hint}</div>
      </div>
    </div>
  )
}
