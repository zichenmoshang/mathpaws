// ChromeTopBar —— 视口级顶栏 chrome 层（2026-10-11 布局规范三层模型之 chrome 层）
//
// 适用：除启动页（splash）与首页（home，自有顶栏设计）外的所有页面顶栏。
// 规范（quiz 页定稿）：
//   - 脱离 1024×768 舞台（放 SceneShell 外），贴视口左右边缘、safe-area 内缩；
//   - 无底色（裸元素）；左槽（返回/标题）与右槽（进度/资源）分居两端，
//     间距随真实屏宽弹性；
//   - 元素尺寸 = 逻辑 px × --stage-scale（**随舞台缩放**，与舞台内容视觉重量一致；
//     2026-10-11 修订：初版"恒定 CSS px"走查否决）。推荐逻辑口径：
//     返回钮 36 / 标题图 29–34 / 资源件高 30（TGR-W10 渲染 ≈ 68 / 54–64 / 56）；
//   - 间距口径（恒定 CSS px）：顶部 24px / 两侧 28px（2026-10-11 走查校准）。
//   - 舞台内对应区域应保留约 84px 逻辑让位带，避免内容顶到 chrome 之下。
import type { ReactNode } from 'react'

import * as s from './ChromeTopBar.css'

export function ChromeTopBar({ left, center, right }: {
  left?: ReactNode
  /** 居中槽（绝对居中，如学盒入口/标题艺术字）；左右槽内容较多时慎用，防重叠 */
  center?: ReactNode
  right?: ReactNode
}) {
  return (
    <div className={s.bar}>
      <div className={s.side}>{left}</div>
      {center && <div className={`${s.side} ${s.center}`}>{center}</div>}
      <div className={s.side}>{right}</div>
    </div>
  )
}
