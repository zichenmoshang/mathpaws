// 【仅 dev 场景使用 · 2026-10-06 CR】生产页面未引用；待业务代码 CR 后评估。
// ---------- BackBtn ----------
import { C } from '../tokens'
import { btn } from '../styles.css'
import * as s from './BackBtn.css'

export function BackBtn({ onClick, tone = 'onBlue' }: { onClick: () => void; tone?: 'onBlue' | 'plain' }) {
  return (
    <button className={`${btn} ${s.root}`} onClick={onClick} style={{
      background: tone === 'onBlue' ? 'rgba(255,255,255,.25)' : 'rgba(0,0,0,.08)',
      color: tone === 'onBlue' ? '#fff' : C.ink,
      boxShadow: tone === 'onBlue' ? '0 3px 0 rgba(0,0,0,.15)' : 'none',
    }}>←</button>
  )
}
