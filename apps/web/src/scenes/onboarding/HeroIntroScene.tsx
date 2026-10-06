// P2 主角亮相 / 起名（M4-BOOT-03）：中性固定形象，不捏脸、不选性别。
// 主角踩云（云只在脚下），CloudInput 起名在云下方独立行，互不重叠；
// 起名可留空（默认"小朋友"，≤6 字）；下一步进领养页 P3。
// 自适应接线由 SkyBackdrop 完成（内容已置于其 LogicalStage 内，坐标不变）。
import { PaperDoll } from '@mathpaws/paperdoll'
import { CloudInput, PrimaryButton } from '@mathpaws/ui'
import { useState } from 'react'

import type { RouteId } from '../../app/router'
import { buildLayers, DEFAULT_SELECTION } from '../../paperdoll/catalog'
import { usePlayerStore } from '../../stores/usePlayerStore'
import { audio } from '../../utils/audio'

import styles from './HeroIntroScene.module.css'
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
      <div className={styles.titleWrap}>
        <span className={styles.title}>你好呀，小朋友</span>
      </div>

      {/* 云上主角（云仅在脚下） */}
      <div className={styles.dollZone}>
        {/* PaperDoll 根节点自带内联 width:100% 会覆盖 class，尺寸只能保留 style prop */}
        <PaperDoll layers={layers} background="transparent" style={{ width: 300, height: 380 }} />
        <div className={styles.cloud} />
      </div>

      {/* 起名（云下方独立区） */}
      <div className={styles.formZone}>
        {/* CloudInput 无 className 透传，宽度/对齐保留 style prop */}
        <CloudInput
          value={name}
          onChange={setName}
          placeholder="输入你的名字"
          maxLength={6}
          onSubmit={goNext}
          style={{ width: 380, textAlign: 'center' }}
        />
        <span className={styles.hint}>不填也可以，就叫你"小朋友"</span>
      </div>

      {/* 下一步 */}
      <div className={styles.btnZone}>
        {/* PrimaryButton 透传的 className 会覆盖内部 mp-btn，宽度保留 style prop */}
        <PrimaryButton style={{ width: 300 }} onClick={goNext}>
          下一步
        </PrimaryButton>
      </div>
    </SkyBackdrop>
  )
}
