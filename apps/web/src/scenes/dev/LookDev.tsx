// [P2-3D] 二期 3D 广场预留，一期未接入，勿删
import { RoundedBox, OrbitControls } from '@react-three/drei'
import { Canvas } from '@react-three/fiber'
import { EffectComposer, Bloom, N8AO, Vignette, SMAA } from '@react-three/postprocessing'

import { ClayMaterial } from '../../three/ClayMaterial'

function ClayGround() {
  return (
    <RoundedBox args={[14, 0.6, 14]} radius={0.35} smoothness={4} position={[0, -0.3, 0]} receiveShadow>
      <ClayMaterial color="#8ed35a" roughness={0.95} sheen={0.3} />
    </RoundedBox>
  )
}

function ClayHouse() {
  return (
    <group position={[-2.6, 0, 0]} rotation={[0, 0.35, 0]}>
      {/* walls */}
      <RoundedBox args={[2.4, 2, 2.1]} radius={0.18} smoothness={4} position={[0, 1, 0]} castShadow receiveShadow>
        <ClayMaterial color="#f6e7d2" />
      </RoundedBox>
      {/* grass roof (soft, rounded blob) */}
      <RoundedBox args={[2.9, 0.9, 2.6]} radius={0.4} smoothness={5} position={[0, 2.25, 0]} castShadow>
        <ClayMaterial color="#7cc84c" roughness={0.95} sheen={0.5} />
      </RoundedBox>
      {/* arched door */}
      <RoundedBox args={[0.8, 1.2, 0.15]} radius={0.25} smoothness={4} position={[0, 0.6, 1.05]} castShadow>
        <ClayMaterial color="#c98a5a" roughness={0.7} />
      </RoundedBox>
      {/* round window */}
      <mesh position={[0.75, 1.3, 1.06]} castShadow>
        <sphereGeometry args={[0.32, 20, 20]} />
        <ClayMaterial color="#bfe8f5" roughness={0.4} sheen={0.2} />
      </mesh>
    </group>
  )
}

function CottonTree() {
  const blobs: [number, number, number, number][] = [
    [0, 2.5, 0, 0.95],
    [0.7, 2.2, 0.2, 0.7],
    [-0.7, 2.25, -0.1, 0.72],
    [0.1, 3.1, 0, 0.65],
    [-0.3, 2.4, 0.6, 0.6],
  ]
  return (
    <group position={[2.8, 0, -0.5]}>
      <RoundedBox args={[0.35, 1.6, 0.35]} radius={0.12} smoothness={3} position={[0, 0.8, 0]} castShadow>
        <ClayMaterial color="#b07a4e" roughness={0.9} />
      </RoundedBox>
      {blobs.map(([x, y, z, r], i) => (
        <mesh key={i} position={[x, y, z]} castShadow>
          <sphereGeometry args={[r, 24, 24]} />
          <ClayMaterial color={i % 2 ? '#74c247' : '#83cf52'} roughness={0.95} sheen={0.4} />
        </mesh>
      ))}
    </group>
  )
}

function TinyFlower({ position, color }: { position: [number, number, number]; color: string }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.18, 0]}>
        <cylinderGeometry args={[0.03, 0.03, 0.36, 6]} />
        <ClayMaterial color="#5fae3a" />
      </mesh>
      <mesh position={[0, 0.4, 0]} castShadow>
        <sphereGeometry args={[0.14, 12, 12]} />
        <ClayMaterial color={color} roughness={0.8} />
      </mesh>
    </group>
  )
}

export function LookDev() {
  return (
    <div style={{ position: 'relative', width: '100vw', height: '100vh', overflow: 'hidden' }}>
      <Canvas
        shadows
        dpr={[1, 2]}
        gl={{ antialias: true, toneMappingExposure: 1.1 }}
        camera={{ position: [5.5, 4.2, 7], fov: 42 }}
      >
        <color attach="background" args={['#aee0f7']} />
        <fog attach="fog" args={['#aee0f7', 18, 34]} />

        {/* soft, fill-heavy lighting: no crushed blacks */}
        <ambientLight intensity={0.55} />
        <hemisphereLight args={['#eaf6ff', '#cde8a6', 0.9]} />
        <directionalLight
          position={[6, 9, 4]}
          intensity={1.5}
          color="#fff6e8"
          castShadow
          shadow-mapSize={[2048, 2048]}
          shadow-radius={8}
          shadow-blurSamples={16}
          shadow-camera-left={-9}
          shadow-camera-right={9}
          shadow-camera-top={9}
          shadow-camera-bottom={-9}
          shadow-bias={-0.0002}
        />
        <directionalLight position={[-6, 4, -3]} intensity={0.35} color="#cfe6ff" />

        <ClayGround />
        <ClayHouse />
        <CottonTree />
        <TinyFlower position={[0.5, 0, 2.2]} color="#ff7eb3" />
        <TinyFlower position={[1, 0, 1.6]} color="#ffd34d" />
        <TinyFlower position={[-0.4, 0, 2.6]} color="#c79bff" />
        <TinyFlower position={[3.4, 0, 1.8]} color="#ff9d5c" />

        <EffectComposer multisampling={0}>
          <N8AO aoRadius={1.2} intensity={0.9} distanceFalloff={0.8} />
          <Bloom intensity={0.28} luminanceThreshold={0.82} luminanceSmoothing={0.3} mipmapBlur />
          <Vignette eskil={false} offset={0.25} darkness={0.55} />
          <SMAA />
        </EffectComposer>

        <OrbitControls target={[0, 1.2, 0]} minDistance={4} maxDistance={16} maxPolarAngle={Math.PI / 2.1} />
      </Canvas>
      <div style={{ position: 'absolute', top: 16, left: 16, color: '#2c5e7a', fontWeight: 'bold' }}>
        Look Dev · Soft Clay · drag to orbit
      </div>
    </div>
  )
}
