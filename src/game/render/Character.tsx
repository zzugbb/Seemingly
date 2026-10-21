import { forwardRef } from 'react'
import type { Group } from 'three'
import {
  characterBodyGeometry,
  characterEyeGeometry,
  characterHatGeometry,
  characterHeadGeometry,
  characterMaterial,
  characterOcclusionMaterial,
  characterShadowGeometry,
  material,
} from './materials'
import { palette } from './palette'

export const Character = forwardRef<Group, { occlusion?: boolean }>(function Character({ occlusion = false }, ref) {
  const fill = occlusion ? characterMaterial : material
  return (
    <group ref={ref}>
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0.02, 0]}
        geometry={characterShadowGeometry}
        material={material(palette.plumDeep, { opacity: 0.25 })}
      />
      <group name="body">
        <mesh
          position={[0, 0.24, 0]}
          geometry={characterBodyGeometry}
          renderOrder={1}
          castShadow
          material={fill(palette.plumDeep)}
        />
        <mesh
          position={[0, 0.58, 0]}
          geometry={characterHeadGeometry}
          renderOrder={1}
          castShadow
          material={fill(palette.cream)}
        />
        <mesh
          position={[-0.055, 0.64, 0.14]}
          geometry={characterEyeGeometry}
          renderOrder={1}
          material={fill(palette.plumDeep)}
        />
        <mesh
          position={[0.055, 0.64, 0.14]}
          geometry={characterEyeGeometry}
          renderOrder={1}
          material={fill(palette.plumDeep)}
        />
        <mesh
          position={[0, 0.78, -0.03]}
          rotation={[0.2, 0, 0]}
          geometry={characterHatGeometry}
          renderOrder={1}
          castShadow
          material={fill(palette.terracotta)}
        />
        {occlusion && (
          <>
            <mesh
              position={[0, 0.24, 0]}
              geometry={characterBodyGeometry}
              material={characterOcclusionMaterial}
              renderOrder={2}
            />
            <mesh
              position={[0, 0.58, 0]}
              geometry={characterHeadGeometry}
              material={characterOcclusionMaterial}
              renderOrder={2}
            />
            <mesh
              position={[0, 0.78, -0.03]}
              rotation={[0.2, 0, 0]}
              geometry={characterHatGeometry}
              material={characterOcclusionMaterial}
              renderOrder={2}
            />
          </>
        )}
      </group>
    </group>
  )
})
