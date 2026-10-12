// 视觉场景表（visual-qa P1：splash；P2 首例扩展：home，2026-10-10 P18 原稿重生成后接入；
// P19 广场 2026-10-12 接入）。
// 扩展时按 docs/internal/visual-qa.md §4.2 清单逐页接入；
// 含运行时随机/时间依赖的场景在这里登记固定手段（freezeClock/mask/settle），
// 此处的"随机"指应用运行时随机数，与 AI 生图 seed 无关。
export interface VisualScenario {
  /** 场景 id = 截图基线文件名（<id>.png） */
  id: string
  /** hash 深链（'' 表示根路径） */
  hash: string
  /** 冻结时钟：rAF/setTimeout 停止。splash 用它防进度条缓动与加载后自动跳转 */
  freezeClock?: boolean
  /** 截图前额外等待（ms，fonts.ready 之后） */
  settleMs?: number
  /** mask 选择器列表（区域打码，预留：3D canvas、动态区域） */
  mask?: string[]
}

export const SCENARIOS: VisualScenario[] = [
  { id: 'splash', hash: '', freezeClock: true },
  // home：深链 #home 直达；数据为全新上下文默认值（连学0天/累计0天，确定性）；
  // 无限循环 CSS 动画由 toHaveScreenshot animations:'disabled' 冻结，无需 freezeClock
  { id: 'home', hash: '#home', settleMs: 500 },
  // plaza：深链 #plaza（2026-10-12 注册）；经济数值为全新上下文默认值（确定性）；
  // 场景全静态位图，无运行时随机
  { id: 'plaza', hash: '#plaza', settleMs: 500 },
]
