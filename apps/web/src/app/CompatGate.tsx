import { useMemo, type ReactNode } from 'react'

import { detectCompat } from './compat'
import './scaffold.css'

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

// 启动能力门禁：关键能力缺失时不渲染应用，给出缺失项与升级建议。
export function CompatGate({ children }: { children: ReactNode }) {
  const report = useMemo(detectCompat, [])

  if (report.supported) return <>{children}</>

  return (
    <div className="mp-overlay">
      <div className="mp-card" role="alert">
        <div className="mp-card-icon mp-card-icon--warn">
          <WarnIcon />
        </div>
        <h1 className="mp-card-title">当前设备暂不支持</h1>
        <p className="mp-card-text">
          mathpaws 需要以下能力，请使用最新版华为浏览器或 Chrome / Edge
          打开：
        </p>
        <ul className="mp-card-list">
          {report.missing.map(item => (
            <li key={item}>{item}</li>
          ))}
        </ul>
        <div className="mp-card-actions">
          <button
            className="mp-btn mp-btn-primary"
            onClick={() => window.location.reload()}
          >
            重新检测
          </button>
        </div>
      </div>
    </div>
  )
}
