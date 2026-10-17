import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import type { Group } from 'three'
import type { LevelSim } from '../core/sim'
import { pointer } from './Blocks'
import { hintStrength, type RenderFeedback, type RenderHint } from './feedback'
import { crateCornerGeometry, crateGeometry, material, useAnimatedMaterial } from './materials'
import { palette } from './palette'

export function Crates({
  sim,
  feedback,
  hint,
  onPush,
  interactive = true,
}: {
  sim: LevelSim
  feedback: { current: RenderFeedback }
  hint?: RenderHint | null
  onPush: (id: string) => void
  interactive?: boolean
}) {
  return (
    <group>
      {(sim.level.crates ?? []).map((_, index) => (
        <Crate
          key={index}
          id={`crate-${index}`}
          sim={sim}
          feedback={feedback}
          hint={hint}
          onPush={onPush}
          interactive={interactive}
        />
      ))}
    </group>
  )
}

function Crate({
  id,
  sim,
  feedback,
  hint,
  onPush,
  interactive,
}: {
  id: string
  sim: LevelSim
  feedback: { current: RenderFeedback }
  hint?: RenderHint | null
  onPush: (id: string) => void
  interactive: boolean
}) {
  const root = useRef<Group>(null),
    body = useRef<Group>(null)
  const fill = useAnimatedMaterial(palette.cream)
  useFrame(() => {
    const position = sim.cratePose(id).position
    root.current?.position.set(...position)
    const pulse = hintStrength(hint, 'push', id)
    fill.color.set(pulse ? palette.glow : palette.cream)
    if (!body.current) return
    const age = (performance.now() - (feedback.current.blockedCrates.get(id) ?? -10000)) / 1000
    body.current.position.x = age >= 0 && age < 0.3 ? Math.sin(age * Math.PI * 40) * 0.04 * (1 - age / 0.3) : 0
    body.current.scale.setScalar(pulse ? 1 + 0.035 * pulse : 1)
  })
  return (
    <group
      ref={root}
      name={id}
      onClick={(event) => {
        event.stopPropagation()
        if (interactive) onPush(id)
      }}
      onPointerOver={pointer(interactive)}
      onPointerOut={pointer(false)}
    >
      <group ref={body}>
        <mesh position={[0, 0.36, 0]} geometry={crateGeometry} material={fill} castShadow receiveShadow />
        {[-0.3, 0.3].flatMap((x) =>
          [-0.3, 0.3].map((z) => (
            <mesh
              key={`${x},${z}`}
              position={[x, 0.7, z]}
              geometry={crateCornerGeometry}
              material={material(palette.glow)}
            />
          )),
        )}
      </group>
    </group>
  )
}
