// ---------- Switch ----------
import { C } from '../tokens'
import * as s from './Switch.css'

export function Switch({
  checked, onChange, label,
}: {
  checked: boolean
  onChange: (v: boolean) => void
  label?: string
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={s.root}
    >
      <span
        className={s.track}
        style={{
          // 动态值：轨道底色随 checked 变化，保留内联
          background: checked ? C.grass : '#b0bec5',
        }}
      >
        <span
          className={s.knob}
          style={{
            // 动态值：滑块位置随 checked 变化，保留内联
            left: checked ? 29 : 3,
          }}
        />
      </span>
      {label}
    </button>
  )
}
