import { forwardRef } from 'react'
import type { Group } from 'three'
import { material } from './materials'
import { palette } from './palette'

export const Character = forwardRef<Group>(function Character(_, ref) {
  return (
    <group ref={ref}>
      <group name="body">
        <mesh position={[0, 0.21, 0]} castShadow material={material(palette.cream)}>
          <cylinderGeometry args={[0.1, 0.2, 0.42, 20]} />
        </mesh>
        <mesh position={[0, 0.52, 0]} castShadow material={material(palette.cream)}>
          <sphereGeometry args={[0.13, 24, 16]} />
        </mesh>
        <mesh position={[0, 0.72, -0.02]} rotation={[-0.18, 0, 0]} castShadow material={material(palette.terracotta)}>
          <coneGeometry args={[0.15, 0.32, 20]} />
        </mesh>
        <mesh position={[0, 0.6, -0.01]} rotation={[Math.PI / 2, 0, 0]} material={material(palette.terracotta)}>
          <torusGeometry args={[0.13, 0.025, 8, 24]} />
        </mesh>
      </group>
    </group>
  )
})
