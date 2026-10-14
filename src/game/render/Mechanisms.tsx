import { useRef } from 'react'
import { useFrame, type ThreeEvent } from '@react-three/fiber'
import type { Group } from 'three'
import type { LevelSim } from '../core/sim'
import type { LevelDef, MoverDef, RotatorDef, Vec3 } from '../levels/types'
import { WalkTile, pointer } from './Blocks'
import { blockGeometry, material } from './materials'
import { palette } from './palette'

const HANDLE_CLEARANCE = 0.56

const handlePosition = (block: Vec3, face: 'x' | 'z'): Vec3 => {
  const [x, y, z] = block
  return face === 'x' ? [x + HANDLE_CLEARANCE, y, z] : [x, y, z + HANDLE_CLEARANCE]
}

function Handle({
  position,
  rotationY,
  onClick,
  crankRef,
}: {
  position: Vec3
  rotationY: number
  onClick: (event: ThreeEvent<MouseEvent>) => void
  crankRef: { current: Group | null }
}) {
  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      <group ref={crankRef} onClick={onClick} onPointerOver={pointer(true)} onPointerOut={pointer(false)}>
        <mesh material={material(palette.glow)} castShadow>
          <torusGeometry args={[0.3, 0.055, 12, 32]} />
        </mesh>
        <mesh rotation={[0, 0, Math.PI / 4]} material={material(palette.glow)}>
          <boxGeometry args={[0.6, 0.06, 0.05]} />
        </mesh>
        <mesh rotation={[0, 0, -Math.PI / 4]} material={material(palette.glow)}>
          <boxGeometry args={[0.6, 0.06, 0.05]} />
        </mesh>
        <mesh rotation={[Math.PI / 2, 0, 0]} material={material(palette.terracotta)}>
          <cylinderGeometry args={[0.09, 0.09, 0.12, 16]} />
        </mesh>
        <mesh position={[0.3, 0, 0.08]} material={material(palette.terracotta)}>
          <sphereGeometry args={[0.07, 12, 10]} />
        </mesh>
        <mesh>
          <circleGeometry args={[0.42, 20]} />
          <meshBasicMaterial transparent opacity={0} depthWrite={false} />
        </mesh>
      </group>
    </group>
  )
}

function MechBlocks({
  id,
  blocks,
  hovered,
  onHover,
  onSelect,
}: {
  id: string
  blocks: { offset: Vec3; color?: string; kind?: 'path' | 'solid' }[]
  hovered: string | null
  onHover: (id: string | null) => void
  onSelect: (id: string) => void
}) {
  return (
    <>
      {blocks.map((block, index) => {
        const tileId = `${id}#${index}`
        const color = block.color ?? palette.tealLight
        if ((block.kind ?? 'path') === 'path') {
          return (
            <WalkTile
              key={tileId}
              position={block.offset}
              color={color}
              hovered={hovered === tileId}
              onHover={(on) => onHover(on ? tileId : null)}
              onSelect={(event) => {
                event.stopPropagation()
                onSelect(tileId)
              }}
            />
          )
        }
        return (
          <mesh
            key={tileId}
            position={block.offset}
            geometry={blockGeometry}
            material={material(color)}
            castShadow
            receiveShadow
          />
        )
      })}
    </>
  )
}

function RotatorView({
  rotator,
  sim,
  hovered,
  onHover,
  onSelect,
  onBlocked,
}: {
  rotator: RotatorDef
  sim: LevelSim
  hovered: string | null
  onHover: (id: string | null) => void
  onSelect: (id: string) => void
  onBlocked: (message: string) => void
}) {
  const groupRef = useRef<Group>(null)
  const crankRef = useRef<Group>(null)
  const shake = useRef(0)
  useFrame(({ clock }, delta) => {
    const pose = sim.mechanismPose(rotator.id)
    if (!('rotationY' in pose)) return
    if (groupRef.current) groupRef.current.rotation.y = pose.rotationY
    const crank = crankRef.current
    if (!crank) return
    crank.rotation.z = -pose.rotationY * 2
    shake.current = Math.max(0, shake.current - delta)
    crank.position.x = Math.sin(clock.elapsedTime * 60) * shake.current * 0.08
  })

  const onCrank = (event: ThreeEvent<MouseEvent>) => {
    event.stopPropagation()
    const result = sim.command({ type: 'operate', mechanism: rotator.id })
    if (result === 'standing-on-mechanism') {
      shake.current = 0.5
      onBlocked('站在桥上可转不动')
    }
  }

  return (
    <>
      <group ref={groupRef} position={rotator.pivot}>
        <mesh position={[0, -0.55, 0]} receiveShadow material={material(palette.teal)}>
          <cylinderGeometry args={[1.18, 1.18, 0.07, 48]} />
        </mesh>
        <mesh position={[0, -0.55, 0]} rotation={[Math.PI / 2, 0, 0]} material={material(palette.glow)}>
          <torusGeometry args={[1.18, 0.035, 8, 64]} />
        </mesh>
        <MechBlocks
          id={rotator.id}
          blocks={rotator.blocks.map((block) => ({
            offset: block.offset,
            color: block.color ? palette[block.color] : undefined,
            kind: block.kind,
          }))}
          hovered={hovered}
          onHover={onHover}
          onSelect={onSelect}
        />
      </group>
      <Handle
        position={handlePosition(rotator.handle.block, rotator.handle.face)}
        rotationY={rotator.handle.face === 'x' ? Math.PI / 2 : 0}
        onClick={onCrank}
        crankRef={crankRef}
      />
    </>
  )
}

function MoverView({
  mover,
  sim,
  hovered,
  onHover,
  onSelect,
  onBlocked,
}: {
  mover: MoverDef
  sim: LevelSim
  hovered: string | null
  onHover: (id: string | null) => void
  onSelect: (id: string) => void
  onBlocked: (message: string) => void
}) {
  const groupRef = useRef<Group>(null)
  const crankRef = useRef<Group>(null)
  const shake = useRef(0)
  useFrame(({ clock }, delta) => {
    const pose = sim.mechanismPose(mover.id)
    if (!('offset' in pose) || !groupRef.current) return
    groupRef.current.position.set(
      mover.origin[0] + pose.offset[0],
      mover.origin[1] + pose.offset[1],
      mover.origin[2] + pose.offset[2],
    )
    const crank = crankRef.current
    if (!crank) return
    shake.current = Math.max(0, shake.current - delta)
    crank.position.x = Math.sin(clock.elapsedTime * 60) * shake.current * 0.08
  })

  const onCrank = (event: ThreeEvent<MouseEvent>) => {
    event.stopPropagation()
    const result = sim.command({ type: 'operate', mechanism: mover.id })
    if (result === 'standing-on-mechanism') {
      shake.current = 0.5
      onBlocked('站在桥上可转不动')
    }
  }

  return (
    <>
      <group ref={groupRef} position={mover.origin}>
        <MechBlocks
          id={mover.id}
          blocks={mover.blocks.map((block) => ({
            offset: block.offset,
            color: block.color ? palette[block.color] : undefined,
            kind: block.kind,
          }))}
          hovered={hovered}
          onHover={onHover}
          onSelect={onSelect}
        />
      </group>
      <Handle
        position={handlePosition(mover.handle.block, mover.handle.face)}
        rotationY={mover.handle.face === 'x' ? Math.PI / 2 : 0}
        onClick={onCrank}
        crankRef={crankRef}
      />
    </>
  )
}

export function Mechanisms({
  level,
  sim,
  hovered,
  onHover,
  onSelect,
  onBlocked,
}: {
  level: LevelDef
  sim: LevelSim
  hovered: string | null
  onHover: (id: string | null) => void
  onSelect: (id: string) => void
  onBlocked: (message: string) => void
}) {
  return (
    <group>
      {level.mechanisms.map((mechanism) => {
        if (mechanism.type === 'rotator') {
          return (
            <RotatorView
              key={mechanism.id}
              rotator={mechanism}
              sim={sim}
              hovered={hovered}
              onHover={onHover}
              onSelect={onSelect}
              onBlocked={onBlocked}
            />
          )
        }
        if (mechanism.type === 'mover') {
          return (
            <MoverView
              key={mechanism.id}
              mover={mechanism}
              sim={sim}
              hovered={hovered}
              onHover={onHover}
              onSelect={onSelect}
              onBlocked={onBlocked}
            />
          )
        }
        const [x, y, z] = mechanism.tile
        return (
          <mesh
            key={mechanism.id}
            position={[x, y + 0.57, z]}
            rotation={[-Math.PI / 2, 0, 0]}
            material={material(palette.glow)}
          >
            <torusGeometry args={[0.42, 0.03, 8, 32]} />
          </mesh>
        )
      })}
    </group>
  )
}
