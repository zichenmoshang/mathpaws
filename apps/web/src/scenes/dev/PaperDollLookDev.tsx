import { PaperDoll, type PaperDollBackground } from '@mathpaws/paperdoll'
import {
  TopBar,
  BackBtn,
  Card,
  Btn,
  FONT,
} from '@mathpaws/ui'
import { useEffect, useState, type CSSProperties } from 'react'

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
} from '../../paperdoll/catalog'

// 开发专用换装验证页（#paperdoll）：不接 IndexedDB / 经济 / 路由业务，
// 只用静态 catalog 喂穿戴组合，验证整身+帽/鞋 3 槽合成、@2x 清晰度与跨套混搭。
// 验证通过后，P16 背包页复用同一个 PaperDoll 组件 + catalog，仅把这里的调试
// 控件换成真实库存与穿戴 store。本页长期保留，作为每套新装扮的回归入口。

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
      className="mp-btn"
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        padding: option.icon ? '4px 12px 4px 6px' : '0 14px',
        height: 44,
        borderRadius: 999,
        border: active ? '3px solid #1565C0' : '3px solid rgba(0,0,0,.08)',
        background: active ? '#fff8e1' : 'rgba(255,255,255,.82)',
        boxShadow: '0 3px 0 rgba(0,0,0,.12)',
        fontFamily: FONT.family,
        fontWeight: 900,
        fontSize: 15,
        color: '#263238',
        cursor: 'pointer',
      }}
    >
      {option.icon ? (
        <img
          src={option.icon}
          alt=""
          draggable={false}
          style={{ width: 34, height: 34, objectFit: 'contain' }}
        />
      ) : null}
      <span>{option.label}</span>
    </button>
  )
}

const sectionTitle: CSSProperties = {
  fontSize: 16,
  fontWeight: 900,
  color: '#1565C0',
  margin: '14px 0 8px',
}
const row: CSSProperties = { display: 'flex', flexWrap: 'wrap', gap: 8 }

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
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'linear-gradient(180deg,#bfe3f5,#9ccfec)',
        fontFamily: FONT.family,
        overflow: 'hidden',
      }}
    >
      <TopBar tone="sky">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <BackBtn onClick={() => window.dispatchEvent(new Event('go-plaza'))} />
          <span style={{ color: '#fff', fontWeight: 900, fontSize: 20 }}>
            PaperDoll LookDev · 换装运行时验证
          </span>
        </div>
        <span style={{ color: 'rgba(255,255,255,.9)', fontSize: 14, fontWeight: 700 }}>
          #paperdoll
        </span>
      </TopBar>

      <div style={{ position: 'absolute', inset: 0, top: 76, display: 'flex', gap: 20, padding: 20 }}>
        {/* 左：娃娃舞台 */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minWidth: 0,
          }}
        >
        <div style={{ width: 'min(100%, 78vh)', aspectRatio: '1 / 1' }}>
          <PaperDoll layers={layers} background={bg} />
        </div>
        </div>

        {/* 右：调试控件 */}
        <div style={{ width: 'min(380px, 46vw)', flexShrink: 0, overflowY: 'auto' }}>
          <Card padding={18}>
            {SLOT_ORDER.map(slot => (
              <div key={slot}>
                <div style={sectionTitle}>{SLOT_LABEL[slot]}（{slot}）</div>
                <div style={row}>
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

            <div style={sectionTitle}>预览背景</div>
            <div style={row}>
              {BG_OPTIONS.map(b => (
                <button
                  key={b.id}
                  className="mp-btn"
                  onClick={() => setBg(b.id)}
                  style={{
                    padding: '0 14px',
                    height: 38,
                    borderRadius: 999,
                    border: bg === b.id ? '3px solid #1565C0' : '3px solid rgba(0,0,0,.08)',
                    background: bg === b.id ? '#fff8e1' : 'rgba(255,255,255,.82)',
                    fontFamily: FONT.family,
                    fontWeight: 900,
                    fontSize: 14,
                    color: '#263238',
                    cursor: 'pointer',
                  }}
                >
                  {b.label}
                </button>
              ))}
            </div>

            <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
              <Btn variant="sun" onClick={() => setSel(randomSelection())}>
                随机混搭
              </Btn>
              <Btn variant="sky" onClick={() => setSel(DEFAULT_SELECTION)}>
                重置默认
              </Btn>
            </div>
          </Card>

          <Card padding={16} style={{ marginTop: 14 }}>
            <div style={{ fontSize: 14, fontWeight: 900, color: '#263238', lineHeight: 1.6 }}>
              当前组合
            </div>
            <div style={{ fontSize: 13, color: '#455a64', lineHeight: 1.7, marginTop: 4 }}>
              {combo}
            </div>
            <div
              style={{
                fontSize: 12,
                color: '#78909C',
                marginTop: 10,
                borderTop: '1px dashed #cfd8dc',
                paddingTop: 8,
                lineHeight: 1.6,
              }}
            >
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
