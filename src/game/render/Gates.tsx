import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import type { Group } from 'three'
import { surfaceY } from '../core/iso'
import type { LevelSim } from '../core/sim'
import type { GateDef } from '../levels/types'
import { HandleControl } from './Mechanisms'
import type { RenderFeedback, RenderHint } from './feedback'
import { gateBarGeometry, gateDotGeometry, gatePostGeometry, material } from './materials'
import { palette } from './palette'

export function Gates({
  sim,
  feedback,
  hint,
  interactive = true,
}: {
  sim: LevelSim
  feedback: { current: RenderFeedback }
  hint?: RenderHint | null
  interactive?: boolean
}) {
  return (
    <group>
      {sim.level.mechanisms.map((gate) =>
        gate.type === 'gate' ? (
          <Gate key={gate.id} gate={gate} sim={sim} feedback={feedback} hint={hint} interactive={interactive} />
        ) : null,
      )}
    </group>
  )
}
function Gate({
  gate,
  sim,
  feedback,
  hint,
  interactive,
}: {
  gate: GateDef
  sim: LevelSim
  feedback: { current: RenderFeedback }
  hint?: RenderHint | null
  interactive: boolean
}) {
  const root = useRef<Group>(null)
  useFrame(() => {
    if (root.current) root.current.position.y = surfaceY(gate.tile[1]) - sim.gatePose(gate.id).open * 0.62
  })
  return (
    <>
      <group ref={root} position={[gate.tile[0], surfaceY(gate.tile[1]), gate.tile[2]]} name={`gate-${gate.id}`}>
        <mesh position={[-0.3, 0.275, 0]} geometry={gatePostGeometry} material={material(palette.plum)} castShadow />
        <mesh position={[0.3, 0.275, 0]} geometry={gatePostGeometry} material={material(palette.plum)} castShadow />
        <mesh position={[0, 0.48, 0]} geometry={gateBarGeometry} material={material(palette.plum)} castShadow />
        {gate.mode === 'hold' && (
          <mesh position={[0, 0.48, 0.05]} geometry={gateDotGeometry} material={material(palette.glow)} />
        )}
      </group>
      {gate.handle && (
        <HandleControl
          handle={gate.handle}
          sim={sim}
          id={gate.id}
          feedback={feedback}
          hint={hint}
          interactive={interactive}
        />
      )}
    </>
  )
}
