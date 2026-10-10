// ResourcePill（顶部货币/资源胶囊）
// 2026-10-10 B2 增强（方案 style-anchor-ui-convergence §3.4）：新增 asset 位图底模式，
// 收编全站 5 套并存实现——CSS 模式服务 Plaza/Gacha/Home，asset 模式服务 Farm/PetPanel
// 位图牌（图标已烘焙、数字前端覆盖）。
import type { CSSProperties, ReactNode } from 'react'

import { C } from '../tokens'
import * as s from './ResourcePill.css'

interface ResourcePillProps {
  /** CSS 模式的图标（位图/文本/节点）；asset 模式忽略（图标已烘焙在底图） */
  icon?: ReactNode
  /** 数值/文本 */
  value: ReactNode
  tone?: 'shell' | 'flower'
  /** 位图底模式：页面切图 pill 资产（图标烘焙、数字擦除前端覆盖） */
  asset?: string
  className?: string
  /** asset 模式下数字层额外 className（字体样式） */
  valueClassName?: string
  /** asset 模式下数字层定位覆盖（如"牌右半区居中"：left/width/right:auto） */
  valueStyle?: CSSProperties
  /** 根元素内联样式（场景定位，如 place(BBOX)） */
  style?: CSSProperties
}

export function ResourcePill({
  icon, value, tone = 'shell', asset, className, valueClassName, valueStyle, style,
}: ResourcePillProps) {
  if (asset) {
    return (
      <div className={`${s.assetRoot}${className ? ` ${className}` : ''}`} style={style}>
        <img src={asset} alt="" draggable={false} className={s.assetImg} />
        <span
          className={`${s.assetValue}${valueClassName ? ` ${valueClassName}` : ''}`}
          style={valueStyle}
        >
          {value}
        </span>
      </div>
    )
  }
  const map = {
    shell: { bg: '#ffffff', fg: C.ink, border: '#e0e0e0' },
    flower: { bg: '#fff8e1', fg: '#ad6800', border: '#ffe082' },
  }[tone]
  return (
    <div
      className={`${s.root}${className ? ` ${className}` : ''}`}
      style={{
        // 动态值：底色/字色/描边随 tone 变化，保留内联
        background: map.bg, color: map.fg, border: `2px solid ${map.border}`,
        ...style,
      }}
    >
      <span className={s.icon}>{icon}</span>
      {value}
    </div>
  )
}
