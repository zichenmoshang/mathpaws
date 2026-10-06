// [P2-3D] 二期 3D 广场预留，一期未接入，勿删
import { MeshPhysicalMaterial } from 'three'

// Soft-clay / soft-3D material: matte, slightly plush surface with a soft sheen.
export function ClayMaterial({
  color,
  roughness = 0.88,
  sheen = 0.6,
  sheenColor,
}: {
  color: string
  roughness?: number
  sheen?: number
  sheenColor?: string
}) {
  return (
    <meshPhysicalMaterial
      color={color}
      roughness={roughness}
      metalness={0}
      sheen={sheen}
      sheenRoughness={0.85}
      sheenColor={sheenColor ?? color}
      clearcoat={0.08}
      clearcoatRoughness={0.9}
      envMapIntensity={0.5}
    />
  )
}

export type { MeshPhysicalMaterial }
