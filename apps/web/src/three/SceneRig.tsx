// [P2-3D] 二期 3D 广场预留，一期未接入，勿删
import { Environment, Lightformer, SoftShadows } from '@react-three/drei'

// 场景光照 / IBL / 软阴影预设 —— 程序化生成，不依赖外部 HDRI 或网络。
// 用法：在场景里用 <SceneRig /> 替换原来的 ambient/hemisphere/Sun 三盏基础灯。
export function SceneRig({ showSun = true }: { showSun?: boolean }) {
  return (
    <>
      {/* 柔和阴影（PCSS） */}
      <SoftShadows size={28} samples={16} focus={0.9} />

      {/* 程序化 IBL：几张灯光卡片烘焙出环境反射，离线可用 */}
      <Environment resolution={256} frames={1}>
        <Lightformer intensity={1.3} position={[0, 6, 0]} rotation-x={Math.PI / 2} scale={[12, 12, 1]} color="#fff6e0" />
        <Lightformer intensity={0.7} position={[-6, 2, -6]} scale={[7, 7, 1]} color="#dff1ff" />
        <Lightformer intensity={0.55} position={[6, 1, 6]} scale={[7, 7, 1]} color="#e9f8ea" />
        <Lightformer intensity={0.45} position={[0, 2, 9]} scale={[9, 4, 1]} color="#ffffff" />
      </Environment>

      {/* 暖色主光（太阳） */}
      <directionalLight
        position={[-8, 12, -4]}
        intensity={1.6}
        color="#fff3d6"
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-bias={-0.0002}
        shadow-camera-left={-14}
        shadow-camera-right={14}
        shadow-camera-top={14}
        shadow-camera-bottom={-14}
        shadow-camera-near={1}
        shadow-camera-far={42}
      />
      {/* 天空/地面补光 */}
      <hemisphereLight args={['#dff0ff', '#8fbf7a', 0.35]} />

      {showSun && (
        <mesh position={[-12, 14, -18]}>
          <sphereGeometry args={[2.2, 20, 20]} />
          <meshBasicMaterial color="#fff59d" />
        </mesh>
      )}
    </>
  )
}
