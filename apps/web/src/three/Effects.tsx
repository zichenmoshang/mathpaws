// [P2-3D] 二期 3D 广场预留，一期未接入，勿删
import { EffectComposer, Bloom, Vignette, SMAA } from '@react-three/postprocessing'

// 后处理预设：轻微辉光 + SMAA 抗锯齿 + 很轻的暗角聚焦。
// 卡通明亮风格，Bloom 要克制，避免整体发糊。
export function Effects({ bloom = 0.22 }: { bloom?: number }) {
  return (
    <EffectComposer multisampling={0}>
      <Bloom
        intensity={bloom}
        luminanceThreshold={0.9}
        luminanceSmoothing={0.25}
        mipmapBlur
        radius={0.6}
      />
      <SMAA />
      <Vignette offset={0.3} darkness={0.4} eskil={false} />
    </EffectComposer>
  )
}
