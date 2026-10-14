import { useRef, useState, type ReactNode } from 'react'
import { useFrame } from '@react-three/fiber'
import type { Group, Mesh } from 'three'
import { cellId, surfaceY } from '../core/iso'
import type { LevelSim } from '../core/sim'
import type { LevelDef, Vec3 } from '../levels/types'
import { Blocks } from './Blocks'
import { CameraRig } from './CameraRig'
import { Character } from './Character'
import { Decor, GoalArch } from './Decor'
import { Lights } from './Lights'
import { Mechanisms } from './Mechanisms'
import { palette } from './palette'

export function Scene({
  level,
  sim,
  onWon,
  onBlocked,
  interactive = true,
}: {
  level: LevelDef
  sim: LevelSim
  onWon: () => void
  onBlocked: (message: string) => void
  interactive?: boolean
}) {
  const [hovered, setHovered] = useState<string | null>(null)
  const [won, setWon] = useState(false)
  const [marker, setMarker] = useState<{ pos: Vec3; ok: boolean; at: number } | null>(null)
  const characterRef = useRef<Group>(null)

  useFrame(({ clock }, delta) => {
    const events = sim.update(delta)
    for (const event of events) {
      if (event.type === 'won') {
        setWon(true)
        onWon()
      }
    }
    const character = characterRef.current
    if (!character) return
    const pose = sim.characterPose()
    const [x, y, z] = pose.position
    character.position.set(x, y, z)
    character.rotation.y = pose.heading
    const body = character.getObjectByName('body')
    if (!body) return
    if (pose.walking) {
      body.position.y = Math.abs(Math.sin(clock.elapsedTime * Math.PI * 2.6)) * 0.07
      body.scale.y = 1
    } else {
      body.position.y = 0
      body.scale.y = 1 + Math.sin(clock.elapsedTime * 2.4) * 0.02
    }
  })

  const selectTile = (id: string) => {
    if (!interactive) return
    const tile = sim.tiles().get(id)
    if (!tile) return
    const result = sim.command({ type: 'walk', tileId: id })
    if (result === 'busy') return
    setMarker({ pos: tile.pos, ok: result === 'ok', at: performance.now() })
    if (result === 'unreachable') onBlocked('看起来连不上，换个角度试试')
  }

  const blocks = level.blocks.map((block) => ({
    id: cellId(block.pos),
    pos: block.pos,
    color: palette[block.color],
    kind: block.kind,
  }))

  return (
    <group>
      <Lights />
      <CameraRig level={level} />
      <FloatingWorld>
        <Blocks blocks={blocks} hovered={hovered} onHover={setHovered} onSelect={selectTile} />
        <Mechanisms
          level={level}
          sim={sim}
          hovered={hovered}
          onHover={setHovered}
          onSelect={selectTile}
          onBlocked={onBlocked}
          interactive={interactive}
        />
        <Character ref={characterRef} />
        <Marker marker={marker} />
        <GoalArch reached={won} />
        <Decor />
      </FloatingWorld>
    </group>
  )
}

function FloatingWorld({ children }: { children: ReactNode }) {
  const ref = useRef<Group>(null)
  useFrame(({ clock }) => {
    if (ref.current) ref.current.position.y = Math.sin(clock.elapsedTime * 0.8) * 0.06
  })
  return <group ref={ref}>{children}</group>
}

function Marker({ marker }: { marker: { pos: Vec3; ok: boolean; at: number } | null }) {
  const ref = useRef<Mesh>(null)
  useFrame(() => {
    const mesh = ref.current
    if (!mesh || !marker) return
    const age = (performance.now() - marker.at) / 1000
    const life = Math.max(0, 1 - age / 0.8)
    mesh.visible = life > 0
    mesh.scale.setScalar(0.6 + (1 - life) * 0.6)
    ;(mesh.material as { opacity: number }).opacity = life * 0.9
  })
  if (!marker) return null
  const [x, y, z] = marker.pos
  return (
    <mesh ref={ref} position={[x, surfaceY(y) + 0.01, z]} rotation={[-Math.PI / 2, 0, 0]}>
      <ringGeometry args={[0.28, 0.38, 32]} />
      <meshBasicMaterial color={marker.ok ? '#ffffff' : '#e46d5f'} transparent depthWrite={false} />
    </mesh>
  )
}
