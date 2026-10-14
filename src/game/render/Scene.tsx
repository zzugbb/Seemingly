import { useMemo, useRef, useState, type ReactNode } from 'react'
import { useFrame } from '@react-three/fiber'
import type { Group, Mesh } from 'three'
import { cellId, surfaceY } from '../core/iso'
import type { LevelSim } from '../core/sim'
import type { LevelDef, Vec3 } from '../levels/types'
import { Blocks } from './Blocks'
import { CameraRig } from './CameraRig'
import { Character } from './Character'
import { Decor } from './Decor'
import { Lantern } from './Lantern'
import { Lights } from './Lights'
import { Mechanisms, type PlateFx } from './Mechanisms'
import { palette } from './palette'
import type { QualitySettings } from './quality'

const SWAY = (6 * Math.PI) / 180
const BOB = 0.06
const ARRIVE_TIME = 0.15
const TURN_SPEED = 8

export function Scene({
  level,
  sim,
  onWon,
  onBlocked,
  interactive = true,
  quality,
  reducedMotion,
}: {
  level: LevelDef
  sim: LevelSim
  onWon: () => void
  onBlocked: (message: string) => void
  interactive?: boolean
  quality: QualitySettings
  reducedMotion: boolean
}) {
  const [hovered, setHovered] = useState<string | null>(null)
  const [won, setWon] = useState(false)
  const [marker, setMarker] = useState<{ pos: Vec3; ok: boolean; at: number } | null>(null)
  const characterRef = useRef<Group>(null)
  const plateFx = useRef<PlateFx>({ spent: new Set(), flashAt: new Map() })
  const motion = useRef({ heading: 0, phase: 0, wasWalking: false, arrive: 0 })
  const plateTiles = useMemo(
    () =>
      new Set(level.mechanisms.flatMap((mechanism) => (mechanism.type === 'plate' ? [cellId(mechanism.tile)] : []))),
    [level],
  )

  useFrame(({ clock }, delta) => {
    const events = sim.update(delta)
    for (const event of events) {
      if (event.type === 'won') {
        setWon(true)
        onWon()
      }
      if (event.type === 'plate') {
        if (event.triggered) {
          const plate = level.mechanisms.find((mechanism) => mechanism.id === event.id)
          if (plate?.type === 'plate' && plate.once) plateFx.current.spent.add(event.id)
        } else if (!plateFx.current.spent.has(event.id)) {
          plateFx.current.flashAt.set(event.id, clock.elapsedTime)
        }
      }
    }
    const character = characterRef.current
    if (!character) return
    const pose = sim.characterPose()
    const [x, y, z] = pose.position
    character.position.set(x, y, z)
    const anim = motion.current
    let turn = pose.heading - anim.heading
    if (turn > Math.PI) turn -= Math.PI * 2
    if (turn < -Math.PI) turn += Math.PI * 2
    const step = Math.min(Math.abs(turn), TURN_SPEED * delta)
    anim.heading += Math.sign(turn) * step
    character.rotation.y = anim.heading
    const body = character.getObjectByName('body')
    if (!body) return
    if (pose.walking) {
      anim.phase += delta * Math.PI * 2.6
      anim.arrive = 0
      body.rotation.z = Math.sin(anim.phase) * SWAY
      body.position.y = Math.abs(Math.sin(anim.phase)) * BOB
      body.scale.y = 1
    } else if (anim.wasWalking) {
      anim.arrive = ARRIVE_TIME
      body.rotation.z = 0
      body.position.y = 0
    }
    if (!pose.walking && anim.arrive > 0) {
      anim.arrive = Math.max(0, anim.arrive - delta)
      const t = 1 - anim.arrive / ARRIVE_TIME
      const squash = Math.sin(t * Math.PI)
      body.scale.y = 1 - squash * 0.1
      body.position.y = 0
      body.rotation.z = 0
    } else if (!pose.walking) {
      body.rotation.z = 0
      body.position.y = 0
      body.scale.y = 1 + Math.sin(clock.elapsedTime * 1.6) * 0.02
    }
    anim.wasWalking = pose.walking
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
      <Lights shadows={quality.shadows} />
      <CameraRig level={level} />
      <FloatingWorld still={reducedMotion}>
        <Blocks blocks={blocks} hovered={hovered} onHover={setHovered} onSelect={selectTile} bareCaps={plateTiles} />
        <Mechanisms
          level={level}
          sim={sim}
          hovered={hovered}
          onHover={setHovered}
          onSelect={selectTile}
          onBlocked={onBlocked}
          plateFx={plateFx}
          interactive={interactive}
        />
        <Character ref={characterRef} />
        <Marker marker={marker} />
        <Lantern goal={level.goal} reached={won} sparkleScale={quality.sparkleScale} reducedMotion={reducedMotion} />
        <Decor quality={quality} reducedMotion={reducedMotion} />
      </FloatingWorld>
    </group>
  )
}

function FloatingWorld({ children, still }: { children: ReactNode; still: boolean }) {
  const ref = useRef<Group>(null)
  useFrame(({ clock }) => {
    if (!ref.current) return
    ref.current.position.y = still ? 0 : Math.sin(clock.elapsedTime * 0.8) * 0.06
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
