// 【暂未使用 · 2026-10-06 CR】业务页零引用（hifi 位图路线替代 CSS 绘制组件）；业务代码 CR 后评估删留，暂保留。
// ---------- CountdownRing（浮题 5s） ----------
import { C, FONT } from '../tokens'

export function CountdownRing({
  seconds, total, size = 44,
}: {
  seconds: number
  total: number
  size?: number
}) {
  const r = (size - 8) / 2
  const c = 2 * Math.PI * r
  const ratio = Math.max(0, Math.min(1, seconds / total))
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#e0e0e0" strokeWidth={4} />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke={seconds <= 2 ? C.red : C.sky}
        strokeWidth={4}
        strokeLinecap="round"
        strokeDasharray={c}
        strokeDashoffset={c * (1 - ratio)}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
      <text
        x="50%" y="56%" textAnchor="middle"
        fontSize={size * 0.42} fontWeight={900} fill={C.ink}
        fontFamily={FONT.family}
      >
        {seconds}
      </text>
    </svg>
  )
}
