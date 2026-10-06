// SceneTransition 资源门禁（M0-ENG-02）
// 进广场等重资源场景前：显式加载、资源未就绪不切场景、失败可重试。
import { useEffect, useRef, useState, type ReactNode } from 'react'
import './scaffold.css'

export type GateStatus = 'loading' | 'ready' | 'error'

interface Props {
  /** 资源准备函数：resolve = 就绪；reject = 失败 */
  prepare: () => Promise<void>
  /** 就绪后渲染目标场景 */
  children: ReactNode
  /** 超时上限（ms），默认 15s */
  timeoutMs?: number
  /** 加载文案 */
  hint?: string
}

/**
 * 资源门禁容器：
 * loading → 显示进度遮罩；ready → 渲染 children；error → 重试按钮。
 * prepare 每次进入/重试重新执行；组件卸载取消超时。
 */
export function SceneTransition({
  prepare,
  children,
  timeoutMs = 15000,
  hint = '正在打开场景…',
}: Props) {
  const [status, setStatus] = useState<GateStatus>('loading')
  const seq = useRef(0)

  const run = () => {
    const id = ++seq.current
    setStatus('loading')

    let timer: ReturnType<typeof setTimeout> | null = setTimeout(() => {
      timer = null
      if (seq.current === id) setStatus('error')
    }, timeoutMs)

    prepare()
      .then(() => {
        if (timer) clearTimeout(timer)
        if (seq.current === id) setStatus('ready')
      })
      .catch(() => {
        if (timer) clearTimeout(timer)
        if (seq.current === id) setStatus('error')
      })
  }

  useEffect(() => {
    run()
    return () => {
      seq.current += 1
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (status === 'ready') return <>{children}</>

  return (
    <div className="mp-overlay">
      <div className="mp-loading">
        {status === 'loading' ? (
          <>
            <div className="mp-spinner" />
            <div className="mp-loading-hint">{hint}</div>
          </>
        ) : (
          <>
            <div className="mp-loading-title">场景加载失败</div>
            <button className="mp-btn mp-btn-primary" onClick={run}>
              重试
            </button>
          </>
        )}
      </div>
    </div>
  )
}
