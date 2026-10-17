import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import type { Group } from 'three'
import type { LevelSim } from '../core/sim'
import { surfaceY } from '../core/iso'
import type { Vec3 } from '../levels/types'
import { material, orbGeometry, orbRingGeometry, orbSparkGeometry } from './materials'
import { palette } from './palette'

export function Orbs({
  sim,
  reducedMotion,
  sparkleScale,
}: {
  sim: LevelSim
  reducedMotion: boolean
  sparkleScale: number
}) {
  return (
    <group>
      {sim.level.orbs.map((orb, index) => (
        <Orb
          key={index}
          sim={sim}
          id={`orb-${index}`}
          optional={orb.optional ?? false}
          index={index}
          reducedMotion={reducedMotion}
          sparkleScale={sparkleScale}
        />
      ))}
    </group>
  )
}

function Orb({
  sim,
  id,
  optional,
  index,
  reducedMotion,
  sparkleScale,
}: {
  sim: LevelSim
  id: string
  optional: boolean
  index: number
  reducedMotion: boolean
  sparkleScale: number
}) {
  const root = useRef<Group>(null),
    ring = useRef<Group>(null)
  const flight = useRef<{ collected: boolean; elapsed: number; from: Vec3 }>({
    collected: false,
    elapsed: 0,
    from: [0, 0, 0],
  })
  useFrame(({ clock }, delta) => {
    const pose = sim.orbPose(id),
      state = flight.current,
      group = root.current
    if (!group) return
    if (pose.collected && !state.collected) {
      state.elapsed = 0
      state.from = [...pose.position]
    }
    state.collected = pose.collected
    if (!pose.collected) {
      group.visible = true
      group.scale.setScalar(1)
      group.position.set(
        pose.position[0],
        pose.position[1] + (reducedMotion ? 0 : Math.sin((clock.elapsedTime / 1.6) * Math.PI * 2 + index) * 0.05),
        pose.position[2],
      )
    } else {
      state.elapsed += Math.min(delta, 1 / 30)
      const t = Math.min(1, state.elapsed / 0.6),
        goal = sim.level.goal
      group.visible = !reducedMotion && t < 1
      group.scale.setScalar(1 - t)
      group.position.set(
        state.from[0] + (goal[0] - 0.18 - state.from[0]) * t,
        state.from[1] + (surfaceY(goal[1]) + 0.64 - state.from[1]) * t + Math.sin(t * Math.PI) * 0.5,
        state.from[2] + (goal[2] - 0.18 - state.from[2]) * t,
      )
    }
    if (ring.current && !reducedMotion) ring.current.rotation.y = clock.elapsedTime * 0.6
  })
  const count = reducedMotion ? 0 : Math.round(3 * sparkleScale)
  return (
    <group ref={root} name={id}>
      <mesh geometry={orbGeometry} material={material(palette.glow, { glow: true })} />
      {optional && (
        <group ref={ring} rotation={[0.5, 0, 0]}>
          <mesh geometry={orbRingGeometry} material={material(palette.cream)} />
        </group>
      )}
      {Array.from({ length: count }, (_, i) => (
        <mesh
          key={i}
          position={[Math.cos(i * 2.4) * 0.2, Math.sin(i * 1.7) * 0.12, Math.sin(i * 2.4) * 0.2]}
          geometry={orbSparkGeometry}
          material={material(palette.glow)}
        />
      ))}
    </group>
  )
}
