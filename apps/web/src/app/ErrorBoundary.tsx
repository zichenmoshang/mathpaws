import { Component, type ErrorInfo, type ReactNode } from 'react'
import './scaffold.css'

interface Props {
  children: ReactNode
}
interface State {
  error: Error | null
}

// 动态 import 的场景 chunk 加载失败（常见于发布新版本后旧 chunk 失效）。
function isChunkError(e: unknown): boolean {
  const err = e as { name?: string; message?: string } | null
  const msg = String(err?.message ?? '')
  return (
    err?.name === 'ChunkLoadError' ||
    /dynamically imported module|Loading chunk|Failed to fetch/i.test(msg)
  )
}

function WarnIcon() {
  return (
    <svg width="38" height="38" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M12 3 22 20H2L12 3Z" fill="currentColor" opacity="0.18" />
      <path
        d="M12 3 22 20H2L12 3Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path
        d="M12 10v4.5"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
      <circle cx="12" cy="17.4" r="1.4" fill="currentColor" />
    </svg>
  )
}

// 全局渲染错误边界：捕获后不整页白屏，给出可恢复出口。
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[mathpaws] 渲染异常', error, info)
  }

  private reload = () => window.location.reload()

  // 清掉调试 hash 后整页重载，干净地回到默认广场。
  private backToPlaza = () => {
    window.history.replaceState(
      null,
      '',
      window.location.pathname + window.location.search
    )
    window.location.reload()
  }

  render() {
    const { error } = this.state
    if (!error) return this.props.children

    const chunk = isChunkError(error)
    return (
      <div className="mp-overlay">
        <div className="mp-card" role="alert">
          <div className="mp-card-icon mp-card-icon--warn">
            <WarnIcon />
          </div>
          <h1 className="mp-card-title">{chunk ? '发现新版本' : '页面出错了'}</h1>
          <p className="mp-card-text">
            {chunk
              ? '资源已更新，刷新后即可继续。'
              : '程序遇到一点问题，刷新通常即可恢复。'}
          </p>
          <pre className="mp-card-detail">{error.message}</pre>
          <div className="mp-card-actions">
            <button className="mp-btn mp-btn-primary" onClick={this.reload}>
              刷新页面
            </button>
            {!chunk && (
              <button className="mp-btn mp-btn-ghost" onClick={this.backToPlaza}>
                回到广场
              </button>
            )}
          </div>
        </div>
      </div>
    )
  }
}
