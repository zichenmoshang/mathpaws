import { PaperDoll, type PaperDollBackground } from '@mathpaws/paperdoll'
import {
  TopBar,
  BackBtn,
  Card,
  Btn,
  btn as uiBtn,
} from '@mathpaws/ui'
import { useEffect, useState } from 'react'

import { useRouter } from '../../../app/router'
import {
  SLOT_LABEL,
  OUTFIT_OPTIONS,
  HAT_OPTIONS,
  SHOE_OPTIONS,
  DEFAULT_SELECTION,
  buildLayers,
  randomSelection,
  optionLabel,
  type OutfitSelection,
  type SlotId,
} from '../../../paperdoll/catalog'

import * as s from './PaperDollLookDev.css'

// 开发专用换装验证页（#paperdoll）：不接 IndexedDB / 经济 / 路由业务，
// 只用静态 catalog 喂穿戴组合，验证整身+帽/鞋 3 槽合成、@2x 清晰度与跨套混搭。
// 验证通过后，P16 背包页复用同一个 PaperDoll 组件 + catalog，仅把这里的调试
// 控件换成真实库存与穿戴 store。本页长期保留，作为每套新装扮的回归入口。
// 静态样式已迁入同目录 PaperDollLookDev.css.ts（vanilla-extract）。

const SLOT_ORDER: SlotId[] = ['outfit', 'hat', 'shoe']

/** 每个槽位的可选项（整身 / 帽 / 鞋） */
const SLOT_VIEW: Record<SlotId, { id: string; label: string; icon?: string }[]> = {
  outfit: OUTFIT_OPTIONS,
  hat: HAT_OPTIONS,
  shoe: SHOE_OPTIONS,
}

const BG_OPTIONS: { id: PaperDollBackground; label: string }[] = [
  { id: 'checker', label: '棋盘格' },
  { id: 'white', label: '白底' },
  { id: 'sky', label: '浅蓝' },
  { id: 'transparent', label: '透明' },
]

function OptionButton({
  option,
  active,
  onClick,
}: {
  option: { label: string; icon?: string }
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      className={`${uiBtn} ${s.optionBtn}${option.icon ? ` ${s.optionBtnIcon}` : ''}${active ? ` ${s.optionBtnActive}` : ''}`}
      onClick={onClick}
    >
      {option.icon ? (
        <img
          src={option.icon}
          alt=""
          draggable={false}
          className={s.optionIcon}
        />
      ) : null}
      <span>{option.label}</span>
    </button>
  )
}

export function PaperDollLookDev() {
  const [sel, setSel] = useState<OutfitSelection>(DEFAULT_SELECTION)
  const [bg, setBg] = useState<PaperDollBackground>('checker')
  const [viewport, setViewport] = useState(() => ({
    dpr: typeof window !== 'undefined' ? window.devicePixelRatio : 1,
    w: typeof window !== 'undefined' ? window.innerWidth : 0,
    h: typeof window !== 'undefined' ? window.innerHeight : 0,
  }))

  useEffect(() => {
    const onResize = () =>
      setViewport({
        dpr: window.devicePixelRatio,
        w: window.innerWidth,
        h: window.innerHeight,
      })
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  const layers = buildLayers(sel)
  const combo = SLOT_ORDER.map(s => `${SLOT_LABEL[s]}·${optionLabel(s, sel[s])}`).join('　')

  const choose = (slot: SlotId, id: string) =>
    setSel(prev => ({ ...prev, [slot]: id }))

  return (
    <div className={s.root}>
      <TopBar tone="sky">
        <div className={s.topBarLeft}>
          {/* 返回广场：走正式路由（原 dispatchEvent('go-plaza') 无监听方，是死事件） */}
          <BackBtn onClick={() => { useRouter.getState().go('plaza'); useRouter.getState().clearHash() }} />
          <span className={s.topBarTitle}>
            PaperDoll LookDev · 换装运行时验证
          </span>
        </div>
        <span className={s.topBarHash}>
          #paperdoll
        </span>
      </TopBar>

      <div className={s.main}>
        {/* 左：娃娃舞台 */}
        <div className={s.stage}>
        <div className={s.dollBox}>
          <PaperDoll layers={layers} background={bg} />
        </div>
        </div>

        {/* 右：调试控件 */}
        <div className={s.sideCol}>
          <Card padding={18}>
            {SLOT_ORDER.map(slot => (
              <div key={slot}>
                <div className={s.sectionTitle}>{SLOT_LABEL[slot]}（{slot}）</div>
                <div className={s.row}>
                  {SLOT_VIEW[slot].map(o => (
                    <OptionButton
                      key={o.id}
                      option={o}
                      active={sel[slot] === o.id}
                      onClick={() => choose(slot, o.id)}
                    />
                  ))}
                </div>
              </div>
            ))}

            <div className={s.sectionTitle}>预览背景</div>
            <div className={s.row}>
              {BG_OPTIONS.map(b => (
                <button
                  key={b.id}
                  className={`${uiBtn} ${s.bgBtn}${bg === b.id ? ` ${s.bgBtnActive}` : ''}`}
                  onClick={() => setBg(b.id)}
                >
                  {b.label}
                </button>
              ))}
            </div>

            <div className={s.actions}>
              <Btn variant="sun" onClick={() => setSel(randomSelection())}>
                随机混搭
              </Btn>
              <Btn variant="sky" onClick={() => setSel(DEFAULT_SELECTION)}>
                重置默认
              </Btn>
            </div>
          </Card>

          <Card padding={16} style={{ marginTop: 14 }}>
            <div className={s.comboTitle}>
              当前组合
            </div>
            <div className={s.comboBody}>
              {combo}
            </div>
            <div className={s.comboMeta}>
              视口 {viewport.w}×{viewport.h} · DPR {viewport.dpr}
              <br />
              图层为 2048 全画布透明 WebP（@2x），离屏 canvas 按 整身→鞋→帽 合成单图后整体缩放
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
