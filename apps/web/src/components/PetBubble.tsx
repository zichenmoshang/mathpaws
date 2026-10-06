// PetBubble（M4-P9-01 / M5-P5-02）：宠物悬浮气泡面板。
// 广场固定位与 P9 面板共用规则：蹦跳 CSS 动画、一键全部喂食、进 P9 面板、
// 食物数量在按钮上方气泡展示。
import { FONT } from '@mathpaws/ui'
import type { CSSProperties } from 'react'

import foodIcon from '../assets/img/icons/i-food@2x.webp'
import { RABBIT_STAGE_IMG } from '../config/petArt'
import { PET_STAGES, petLevelFromExp } from '../config/pets'
import { useEconomyStore } from '../stores/useEconomyStore'
import { usePetStore } from '../stores/usePetStore'
import { audio } from '../utils/audio'

export interface PetBubbleProps {
  /** 进入 P9 宠物面板 */
  onGoPanel: () => void
  /** 喂食完成后的提示回调（用于飘字/动画） */
  onFed?: (fed: number, leveledTo: 1 | 2 | 3 | null) => void
}

export function PetBubble({ onGoPanel, onFed }: PetBubbleProps) {
  const petFood = useEconomyStore(s => s.petFood)
  const hasPet = usePetStore(s => s.hasPet)
  const petExp = usePetStore(s => s.petExp)
  const level = petLevelFromExp(petExp)
  const stage = PET_STAGES[level - 1]

  const feedAll = () => {
    if (!hasPet || petFood <= 0) return
    audio.playSfx('click')
    const count = petFood
    // 先扣食物，再结算经验（经验一次结算，跨级只报最终形态）
    useEconomyStore.getState().addPetFood(-count)
    const res = usePetStore.getState().feedAll(count)
    onFed?.(res.fed, res.leveledTo)
  }

  if (!hasPet) return null

  return (
    <div style={wrapStyle}>
      {/* 蹦跳宠物形象（CSS 动画；按进化阶段切图） */}
      <img src={RABBIT_STAGE_IMG[level]} alt="雪球兔" draggable={false} className="mp-pet-bounce" style={petStyle} />

      {/* 信息行：等级 / 形态 */}
      <div style={infoRowStyle}>
        <span style={lvStyle}>Lv.{level}</span>
        <span style={formStyle}>{stage.form}</span>
      </div>

      {/* 一键全部喂食：食物数在按钮上方气泡 */}
      <div style={feedWrapStyle}>
        <div style={foodBubbleStyle}>
          <img src={foodIcon} alt="" draggable={false} style={foodIconStyle} />
          <span>×{petFood}</span>
        </div>
        <button
          type="button"
          className="mp-btn"
          onClick={feedAll}
          disabled={petFood <= 0}
          style={{ ...feedBtnStyle, opacity: petFood <= 0 ? 0.5 : 1, cursor: petFood <= 0 ? 'not-allowed' : 'pointer' }}
        >
          一键喂食
        </button>
      </div>

      {/* 进 P9 面板 */}
      <button type="button" className="mp-btn" onClick={() => { audio.playSfx('click'); onGoPanel() }} style={panelBtnStyle}>
        宠物面板
      </button>

      <style>{BOUNCE_CSS}</style>
    </div>
  )
}

const BOUNCE_CSS = `
@keyframes mp-pet-bounce {
  0%,100% { transform: translateY(0) scaleY(1); }
  30% { transform: translateY(-14px) scaleY(1.02); }
  55% { transform: translateY(0) scaleY(.96); }
  75% { transform: translateY(-6px) scaleY(1); }
}
.mp-pet-bounce { animation: mp-pet-bounce 1.8s ease-in-out infinite; }
`

const wrapStyle: CSSProperties = {
  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
  fontFamily: FONT.family,
}

const petStyle: CSSProperties = {
  width: 120, height: 120, objectFit: 'contain',
  filter: 'drop-shadow(0 6px 8px rgba(60,120,180,.25))',
}

const infoRowStyle: CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 8,
}

const lvStyle: CSSProperties = {
  padding: '2px 10px', borderRadius: 999,
  background: '#f6b929', color: '#fff',
  fontWeight: 900, fontSize: 15,
}

const formStyle: CSSProperties = {
  fontWeight: 800, fontSize: 15, color: '#4a7ba6',
}

const feedWrapStyle: CSSProperties = {
  position: 'relative',
  display: 'flex', flexDirection: 'column', alignItems: 'center',
  marginTop: 4,
}

const foodBubbleStyle: CSSProperties = {
  position: 'absolute', top: -30, left: '50%', transform: 'translateX(-50%)',
  display: 'inline-flex', alignItems: 'center', gap: 4,
  padding: '3px 12px', borderRadius: 999,
  background: '#fff', border: '2px solid #ffd9e6',
  fontWeight: 900, fontSize: 15, color: '#e0638f',
  boxShadow: '0 3px 6px rgba(200,100,140,.18)',
  whiteSpace: 'nowrap',
}

const foodIconStyle: CSSProperties = { width: 18, height: 18, objectFit: 'contain' }

const feedBtnStyle: CSSProperties = {
  marginTop: 14,
  height: 46, padding: '0 24px', borderRadius: 999,
  border: 'none',
  background: 'linear-gradient(180deg,#ffb3c8,#ff8fae)',
  color: '#fff', fontWeight: 900, fontSize: 18,
  boxShadow: '0 5px 0 #e06a90',
}

const panelBtnStyle: CSSProperties = {
  height: 40, padding: '0 20px', borderRadius: 999,
  border: 'none',
  background: 'linear-gradient(180deg,#9fd0f5,#6fb3e8)',
  color: '#fff', fontWeight: 900, fontSize: 16,
  boxShadow: '0 4px 0 #4a8fc4',
}
