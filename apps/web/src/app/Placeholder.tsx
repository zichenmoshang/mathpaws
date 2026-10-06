import { Btn } from '@mathpaws/ui'
import { C } from '@mathpaws/ui'

import type { RouteId } from './router'

const PAGE_CN: Record<RouteId, string> = {
  splash: 'P1 启动页 Splash',
  'hero-intro': 'P2 主角亮相 / 起名',
  adopt: 'P3 领养宠物',
  home: 'P4 首页',
  plaza: 'P5 广场',
  quiz: 'P6 答题页',
  result: 'P7 结算页',
  farm: 'P8 农场',
  'pet-panel': 'P9 宠物面板',
  gacha: 'P10 学盒抽卡',
  backpack: 'P16 背包 / 换装',
  wrongbook: 'P11 错题本',
  settings: 'P13 设置页',
  paperdoll: 'PaperDoll 验证',
  'paperdoll-rt': 'PaperDoll 运行时合成回归（dev）',
  'dev-home': '开发测试台（dev）',
}

/**
 * M0 占位页：标注待建页面 id。
 * 提供"回广场"出口，保证路由可往返、不白屏。
 */
export function Placeholder({
  route, onNavigate,
}: {
  route: RouteId
  onNavigate: (id: RouteId) => void
}) {
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 22,
        background: `linear-gradient(180deg,${C.skyBg},#e8f5fe)`,
        fontFamily: 'inherit',
      }}
    >
      <div
        style={{
          fontSize: 34,
          fontWeight: 900,
          color: C.ink,
        }}
      >
        {PAGE_CN[route]}
      </div>
      <div style={{ color: C.inkSoft, fontSize: 16 }}>
        该页面将在对应里程碑施工（M0 占位）
      </div>
      {route !== 'plaza' && (
        <Btn variant="sky" onClick={() => onNavigate('plaza')}>
          回广场
        </Btn>
      )}
    </div>
  )
}
