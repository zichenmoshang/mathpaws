// 首屏超时检测（M0-ENG-03）
// 应用启动若在限定时间内未完成 bootstrap：给出提示与"重试/刷新"出口，
// 避免无限 pending 白屏。与 ErrorBoundary、CompatGate 协同。
import { useEffect, useRef, useState, type ReactNode } from 'react'
import './scaffold.css'

interface Props {
  /** 启动 Promise（stores bootstrap） */
  boot: () => Promise<void>
  children: ReactNode
  timeoutMs?: number
}

/**
 * 首屏启动门：
 * pending → 启动遮罩；fulfilled → children；reject/timeout → 错误态（可刷新）。
 */
export function BootGate({
  boot,
  children,
  timeoutMs = 8000,
}: Props) {
  const [state, setState] = useState<'pending' | 'done' | 'error'>('pending')
  const mounted = useRef(true)

  useEffect(() => {
    mounted.current = true
    const timer = setTimeout(() => {
      if (mounted.current) setState('error')
    }, timeoutMs)

    boot()
      .then(() => {
        clearTimeout(timer)
        if (mounted.current) setState('done')
      })
      .catch(() => {
        clearTimeout(timer)
        if (mounted.current) setState('error')
      })

    return () => {
      mounted.current = false
      clearTimeout(timer)
    }
  }, [boot, timeoutMs])

  if (state === 'done') return <>{children}</>

  return (
    <div className="mp-overlay">
      <div className="mp-loading">
        {state === 'pending' ? (
          <>
            <div className="mp-spinner" />
            <div className="mp-loading-title">mathpaws</div>
            <div className="mp-loading-hint">正在启动…</div>
          </>
        ) : (
          <>
            <div className="mp-loading-title">启动超时</div>
            <div className="mp-loading-hint">请检查网络后重试</div>
            <button
              className="mp-btn mp-btn-primary"
              onClick={() => window.location.reload()}
            >
              重新加载
            </button>
          </>
        )}
      </div>
    </div>
  )
}
