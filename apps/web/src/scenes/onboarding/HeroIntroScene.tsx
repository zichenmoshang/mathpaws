// P2 主角亮相 / 起名（M4-BOOT-03）：中性固定形象，不捏脸、不选性别。
// 主角踩云（云只在脚下），CloudInput 起名在云下方独立行，互不重叠；
// 起名可留空（默认"小朋友"，≤6 字）；下一步进领养页 P3。
import { PaperDoll } from '@mathpaws/paperdoll'
import { CloudInput, PrimaryButton } from '@mathpaws/ui'
import type { CSSProperties } from 'react'
import { useState } from 'react'

import type { RouteId } from '../../app/router'
import { buildLayers, DEFAULT_SELECTION } from '../../paperdoll/catalog'
import { usePlayerStore } from '../../stores/usePlayerStore'
import { audio } from '../../utils/audio'

import { SkyBackdrop } from './SkyBackdrop'

const layers = buildLayers(DEFAULT_SELECTION)

export function HeroIntroScene({ onNavigate }: { onNavigate: (id: RouteId) => void }) {
  const [name, setName] = useState('')

  const goNext = () => {
    usePlayerStore.getState().setHeroName(name)
    audio.playSfx('click')
    onNavigate('adopt')
  }

  return (
    <SkyBackdrop>
      {/* 标题 */}
      <div style={titleWrapStyle}>
        <span style={titleStyle}>你好呀，小朋友</span>
      </div>

      {/* 云上主角（云仅在脚下） */}
      <div style={dollZoneStyle}>
        <PaperDoll layers={layers} background="transparent" style={dollStyle} />
        <div style={cloudStyle} />
      </div>

      {/* 起名（云下方独立区） */}
      <div style={formZoneStyle}>
        <CloudInput
          value={name}
          onChange={setName}
          placeholder="输入你的名字"
          maxLength={6}
          onSubmit={goNext}
          style={{ width: 380, textAlign: 'center' }}
        />
        <span style={hintStyle}>不填也可以，就叫你"小朋友"</span>
      </div>

      {/* 下一步 */}
      <div style={btnZoneStyle}>
        <PrimaryButton style={{ width: 300 }} onClick={goNext}>
          下一步
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
  fontSize: 52, fontWeight: 900, color: '#ffffff',
  textShadow:
    '0 0 0 #4aa8e8, -3px 0 0 #4aa8e8, 3px 0 0 #4aa8e8, 0 -3px 0 #4aa8e8,' +
    ' 0 3px 0 #4aa8e8, -3px -3px 0 #4aa8e8, 3px -3px 0 #4aa8e8,' +
    ' -3px 3px 0 #4aa8e8, 3px 3px 0 #4aa8e8, 0 8px 12px rgba(40,110,180,.3)',
}

// 主角区：从标题下到中部；内部纵向排 主角→脚下云
const dollZoneStyle: CSSProperties = {
  position: 'absolute', top: 130, left: 0, right: 0,
  display: 'flex', flexDirection: 'column', alignItems: 'center',
}

const dollStyle: CSSProperties = {
  width: 300, height: 380,
}

// 仅在主角脚下的一朵蓬松云
const cloudStyle: CSSProperties = {
  width: 380, height: 100, marginTop: -84,
  borderRadius: 999,
  background: 'rgba(255,255,255,.95)',
  boxShadow: '0 12px 22px rgba(70,140,200,.2)',
}

// 输入框区：云下方独立行（top 留出云的位置）
const formZoneStyle: CSSProperties = {
  position: 'absolute', top: 596, left: 0, right: 0,
  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10,
}

const hintStyle: CSSProperties = {
  fontSize: 18, fontWeight: 700, color: '#3f8fd0',
}

const btnZoneStyle: CSSProperties = {
  position: 'absolute', bottom: 36, left: 0, right: 0,
  display: 'flex', justifyContent: 'center',
}
