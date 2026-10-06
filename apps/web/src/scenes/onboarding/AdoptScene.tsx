// P3 领养（M4-BOOT-04）：展示 3 只宠物，仅雪球兔可领（选中卡实心蓝底白字，高保真风格）；
// 犬猫未解锁更淡、加"即将开放"浮层；不给宠物取名。领养后直接进入广场 P5。
// 自适应接线由 SkyBackdrop 完成（内容已置于其 LogicalStage 内，坐标不变）。
import { PrimaryButton } from '@mathpaws/ui'
import { useState } from 'react'

import type { RouteId } from '../../app/router'
import catImg from '../../assets/img/core/pet-cat-core@2x.png'
import dogImg from '../../assets/img/core/pet-dog-core@2x.png'
import rabbitImg from '../../assets/img/core/pet-rabbit@2x.png'
import { comingSoon } from '../../components/ComingSoonToast'
import { PET_SPECIES, type PetTypeId } from '../../config/pets'
import { usePetStore } from '../../stores/usePetStore'
import { usePlayerStore } from '../../stores/usePlayerStore'
import { audio } from '../../utils/audio'

import styles from './AdoptScene.module.css'
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
      <div className={styles.titleWrap}>
        <span className={styles.title}>选择你的小伙伴</span>
      </div>

      {/* 三张宠物卡 */}
      <div className={styles.cardsWrap}>
        {ORDER.map(id => {
          const spec = PET_SPECIES[id]
          const active = selected === id && spec.available
          // 基线 .card 为未选白卡；选中叠加 .cardActive，未解锁叠加 .cardLocked
          const cardCls = [
            'mp-btn',
            styles.card,
            active ? styles.cardActive : null,
            spec.available ? null : styles.cardLocked,
          ].filter(Boolean).join(' ')
          // 基线 .nameBar 为可领未选（蓝底白字）；选中白底蓝字，未解锁灰底
          const nameBarCls = [
            styles.nameBar,
            active ? styles.nameBarActive : null,
            spec.available ? null : styles.nameBarLocked,
          ].filter(Boolean).join(' ')
          return (
            <button
              key={id}
              type="button"
              className={cardCls}
              onClick={() =>
                spec.available ? (setSelected(id), audio.playSfx('click')) : comingSoon()
              }
            >
              <img
                src={IMG[id]}
                alt={spec.cnName}
                draggable={false}
                className={spec.available ? styles.petImg : `${styles.petImg} ${styles.petImgLocked}`}
              />
              <span className={nameBarCls}>
                {spec.cnName}
              </span>
              {/* 未解锁：即将开放浮层盖在卡面 */}
              {!spec.available && (
                <div className={styles.lockOverlay}>
                  <span className={styles.lockTag}>即将开放</span>
                </div>
              )}
            </button>
          )
        })}
      </div>

      {/* 开始冒险 */}
      <div className={styles.btnZone}>
        {/* PrimaryButton 透传的 className 会覆盖内部 mp-btn，宽度保留 style prop */}
        <PrimaryButton style={{ width: 340 }} onClick={start}>
          开始冒险
        </PrimaryButton>
      </div>
    </SkyBackdrop>
  )
}
