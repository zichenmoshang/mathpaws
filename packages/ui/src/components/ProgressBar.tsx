// ---------- 进度条 ----------
import { C } from '../tokens'
import * as s from './ProgressBar.css'

export function ProgressBar({ ratio, base = C.grass, deep = C.grassDeep, height = 14 }: {
  ratio: number
  base?: string
  deep?: string
  height?: number
}) {
  return (
    // 动态值：轨道高度随 props 变化，保留内联
    <div className={s.track} style={{ height }}>
      <div className={s.fill} style={{
        // 动态值：进度宽度与配色随 props 变化，保留内联
        width: `${Math.round(Math.min(1, Math.max(0, ratio)) * 100)}%`,
        background: `linear-gradient(180deg,rgba(255,255,255,.4),rgba(255,255,255,0)), ${base}`,
        boxShadow: `0 0 8px ${deep}`,
      }} />
    </div>
  )
}
