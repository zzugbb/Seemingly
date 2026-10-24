import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import type { Group } from 'three'
import type { LevelSim } from '../core/sim'
import { characterEyeGeometry, material, patrolGeometry } from './materials'
import { palette } from './palette'

export function Patrols({ sim, reducedMotion }: { sim: LevelSim; reducedMotion: boolean }) {
  return (sim.level.patrols ?? []).map((_, index) => (
    <Patrol key={index} id={`patrol-${index}`} sim={sim} reducedMotion={reducedMotion} />
  ))
}

function Patrol({ id, sim, reducedMotion }: { id: string; sim: LevelSim; reducedMotion: boolean }) {
  const root = useRef<Group>(null)
  useFrame(() => {
    const pose = sim.patrolPose(id)
    if (!root.current) return
    root.current.position.set(pose.position[0], pose.position[1] + (reducedMotion ? 0 : pose.hop), pose.position[2])
    root.current.rotation.y = pose.heading
  })
  return (
    <group ref={root} name={id}>
      <mesh
        position={[0, 0.22, 0]}
        geometry={patrolGeometry}
        material={material(palette.rose)}
        castShadow
        receiveShadow
      />
      {[-0.07, 0.07].map((x) => (
        <mesh
          key={x}
          position={[x, 0.27, 0.198]}
          geometry={characterEyeGeometry}
          material={material(palette.plumDeep)}
        />
      ))}
    </group>
  )
}
