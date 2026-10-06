// P3 领养（M4-BOOT-04）：展示 3 只宠物，仅雪球兔可领（选中卡实心蓝底白字，高保真风格）；
// 犬猫未解锁更淡、加"即将开放"浮层；不给宠物取名。领养后直接进入广场 P5。
import { PrimaryButton } from '@mathpaws/ui'
import { useState } from 'react'
import type { CSSProperties } from 'react'

import type { RouteId } from '../../app/router'
import catImg from '../../assets/img/core/pet-cat-core@2x.png'
import dogImg from '../../assets/img/core/pet-dog-core@2x.png'
import rabbitImg from '../../assets/img/core/pet-rabbit@2x.png'
import { comingSoon } from '../../components/ComingSoonToast'
import { PET_SPECIES, type PetTypeId } from '../../config/pets'
import { usePetStore } from '../../stores/usePetStore'
import { usePlayerStore } from '../../stores/usePlayerStore'
import { audio } from '../../utils/audio'

import { SkyBackdrop } from './SkyBackdrop'

const IMG: Record<PetTypeId, string> = {
  rabbit: rabbitImg,
  dog: dogImg,
  cat: catImg,
}

const ORDER: PetTypeId[] = ['rabbit', 'dog', 'cat']

export function AdoptScene({ onNavigate }: { onNavigate: (id: RouteId) => void }) {
  const [selected, setSelected] = useState<PetTypeId>('rabbit')

  const start = () => {
    const spec = PET_SPECIES[selected]
    if (!spec.available) return
    usePetStore.getState().adopt(selected)
    usePlayerStore.getState().markOnboardingDone()
    audio.playSfx('click')
    onNavigate('plaza')
  }

  return (
    <SkyBackdrop>
      {/* 标题 */}
      <div style={titleWrapStyle}>
        <span style={titleStyle}>选择你的小伙伴</span>
      </div>

      {/* 三张宠物卡 */}
      <div style={cardsWrapStyle}>
        {ORDER.map(id => {
          const spec = PET_SPECIES[id]
          const active = selected === id && spec.available
          return (
            <button
              key={id}
              type="button"
              className="mp-btn"
              onClick={() =>
                spec.available ? (setSelected(id), audio.playSfx('click')) : comingSoon()
              }
              style={{
                ...cardStyle,
                // 选中：实心蓝底白字；未选：白卡
                background: active ? '#4aa8f0' : '#ffffff',
                boxShadow: active
                  ? '0 14px 26px rgba(40,130,220,.4), 0 0 0 6px rgba(140,200,255,.45)'
                  : '0 10px 20px rgba(60,130,190,.16)',
                opacity: spec.available ? 1 : 0.66,
                cursor: spec.available ? 'pointer' : 'default',
              }}
            >
              <img
                src={IMG[id]}
                alt={spec.cnName}
                draggable={false}
                style={{
                  ...petImgStyle,
                  filter: spec.available ? 'none' : 'grayscale(1) opacity(.85)',
                }}
              />
              <span
                style={{
                  ...nameBarStyle,
                  // 选中卡：名字为白色底蓝色字胶囊；未解锁：灰底
                  background: active ? '#ffffff' : spec.available ? '#4aa8f0' : '#b6c2cc',
                  color: active ? '#4aa8f0' : '#ffffff',
                }}
              >
                {spec.cnName}
              </span>
              {/* 未解锁：即将开放浮层盖在卡面 */}
              {!spec.available && (
                <div style={lockOverlayStyle}>
                  <span style={lockTagStyle}>即将开放</span>
                </div>
              )}
            </button>
          )
        })}
      </div>

      {/* 开始冒险 */}
      <div style={btnZoneStyle}>
        <PrimaryButton style={{ width: 340 }} onClick={start}>
          开始冒险
        </PrimaryButton>
      </div>
    </SkyBackdrop>
  )
}

const titleWrapStyle: CSSProperties = {
  position: 'absolute', top: 56, left: 0, right: 0,
  display: 'flex', justifyContent: 'center',
}

const titleStyle: CSSProperties = {
  fontSize: 50, fontWeight: 900, color: '#ffffff',
  textShadow:
    '0 0 0 #4aa8e8, -3px 0 0 #4aa8e8, 3px 0 0 #4aa8e8, 0 -3px 0 #4aa8e8,' +
    ' 0 3px 0 #4aa8e8, -3px -3px 0 #4aa8e8, 3px -3px 0 #4aa8e8,' +
    ' -3px 3px 0 #4aa8e8, 3px 3px 0 #4aa8e8, 0 8px 12px rgba(40,110,180,.3)',
}

const cardsWrapStyle: CSSProperties = {
  position: 'absolute', top: 170, left: 0, right: 0,
  display: 'flex', justifyContent: 'center', gap: 36,
}

const cardStyle: CSSProperties = {
  position: 'relative',
  width: 252, height: 372,
  borderRadius: 30,
  border: 'none',
  padding: 0,
  display: 'flex', flexDirection: 'column', alignItems: 'center',
  overflow: 'hidden',
  transition: 'background .15s ease',
}

const petImgStyle: CSSProperties = {
  width: 214, height: 262, objectFit: 'contain',
  marginTop: 26,
}

const nameBarStyle: CSSProperties = {
  marginTop: 10,
  width: 176, height: 54, borderRadius: 999,
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
  fontSize: 24, fontWeight: 900,
  boxShadow: '0 5px 0 rgba(0,0,0,.12)',
}

const lockOverlayStyle: CSSProperties = {
  position: 'absolute', inset: 0,
  display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
  paddingTop: 22,
  pointerEvents: 'none',
}

const lockTagStyle: CSSProperties = {
  padding: '6px 18px', borderRadius: 999,
  background: 'rgba(84,110,122,.92)', color: '#ffffff',
  fontWeight: 800, fontSize: 17,
  boxShadow: '0 3px 6px rgba(0,0,0,.18)',
}

const btnZoneStyle: CSSProperties = {
  position: 'absolute', bottom: 44, left: 0, right: 0,
  display: 'flex', justifyContent: 'center',
}
