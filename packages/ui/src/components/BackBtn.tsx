// 【仅 dev 场景使用 · 2026-10-06 CR】生产页面未引用；待业务代码 CR 后评估。
// ---------- BackBtn ----------
import type { CSSProperties } from 'react'

import { C, FONT, R } from '../tokens'

export function BackBtn({ onClick, tone = 'onBlue' }: { onClick: () => void; tone?: 'onBlue' | 'plain' }) {
  return (
    <button className="mp-btn" onClick={onClick} style={{
      ...s.root,
      background: tone === 'onBlue' ? 'rgba(255,255,255,.25)' : 'rgba(0,0,0,.08)',
      color: tone === 'onBlue' ? '#fff' : C.ink,
      boxShadow: tone === 'onBlue' ? '0 3px 0 rgba(0,0,0,.15)' : 'none',
    }}>←</button>
  )
}

// ---------- 样式表（静态部分；随 props/状态变化的值留在 JSX 内联） ----------
const s: Record<string, CSSProperties> = {
  root: {
    width: 42, height: 42, borderRadius: R.sm, border: 'none', cursor: 'pointer',
    fontSize: 22, fontWeight: 900,
    fontFamily: FONT.family,
  },
}
