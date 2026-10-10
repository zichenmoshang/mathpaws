// 位图按钮（2026-10-10 B2 收编，方案 style-anchor-ui-convergence §3.4）
// 页面切图按钮的统一组件包装：含烘焙文字的切图属页面资产，但**交互必经本组件**——
// 按压态复用 btn（uiBtn 下压 4px），disabled 用 CSS 灰化+降透明。
// 布局/尺寸由场景经 className 控制；img 填满 button；children 为文字覆盖层
// （图标钮 + 前端文字模式，如 pet 的"喂食"/"改名"）。
import type { ButtonHTMLAttributes, ReactNode } from 'react'

import { btn } from '../styles.css'
import * as s from './ImageButton.css'

interface ImageButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** 位图资产（页面切图或库资产，import 后传入） */
  asset: string
  /** 图片 alt（无障碍；含烘焙文字时写按钮文案） */
  alt: string
  /** img 层额外 className（需要微调图形尺寸/位置时用） */
  imgClassName?: string
  /** 文字覆盖层（居中绝对定位；无文字整钮不传） */
  children?: ReactNode
}

export function ImageButton({
  asset, alt, imgClassName, disabled, children, className, style, ...rest
}: ImageButtonProps) {
  return (
    <button
      type="button"
      disabled={disabled}
      className={`${btn} ${s.root}${className ? ` ${className}` : ''}`}
      style={{ cursor: disabled ? 'not-allowed' : 'pointer', ...style }}
      {...rest}
    >
      <img
        src={asset}
        alt={alt}
        draggable={false}
        className={`${s.img}${imgClassName ? ` ${imgClassName}` : ''}`}
      />
      {children != null && <span className={s.label}>{children}</span>}
    </button>
  )
}
