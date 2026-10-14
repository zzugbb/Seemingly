import { forwardRef } from 'react'
import type { Group } from 'three'
import { material } from './materials'
import { palette } from './palette'

export const Character = forwardRef<Group>(function Character(_, ref) {
  return (
    <group ref={ref}>
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0.02, 0]}
        material={material(palette.plumDeep, { opacity: 0.25 })}
      >
        <circleGeometry args={[0.28, 24]} />
      </mesh>
      <group name="body">
        <mesh position={[0, 0.24, 0]} castShadow material={material(palette.plumDeep)}>
          <cylinderGeometry args={[0.12, 0.24, 0.48, 20]} />
        </mesh>
        <mesh position={[0, 0.58, 0]} castShadow material={material(palette.cream)}>
          <sphereGeometry args={[0.16, 24, 16]} />
        </mesh>
        <mesh position={[-0.055, 0.64, 0.14]} material={material(palette.plumDeep)}>
          <sphereGeometry args={[0.025, 12, 8]} />
        </mesh>
        <mesh position={[0.055, 0.64, 0.14]} material={material(palette.plumDeep)}>
          <sphereGeometry args={[0.025, 12, 8]} />
        </mesh>
        <mesh position={[0, 0.78, -0.03]} rotation={[0.2, 0, 0]} castShadow material={material(palette.terracotta)}>
          <coneGeometry args={[0.17, 0.34, 20]} />
        </mesh>
      </group>
    </group>
  )
})
