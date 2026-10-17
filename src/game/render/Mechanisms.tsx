import { useRef } from 'react'
import { useFrame, type ThreeEvent } from '@react-three/fiber'
import { BoxGeometry, type Group, type Mesh } from 'three'
import { cellId, surfaceY } from '../core/iso'
import type { LevelSim } from '../core/sim'
import type { LevelDef, MoverDef, PlateDef, RotatorDef, Vec3 } from '../levels/types'
import { WalkTile, pointer } from './Blocks'
import { blockGeometry, material, slabGeometry } from './materials'
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
  interactive,
}: {
  rotator: RotatorDef
  sim: LevelSim
  hovered: string | null
  onHover: (id: string | null) => void
  onSelect: (id: string) => void
  interactive: boolean
}) {
  const groupRef = useRef<Group>(null)
  const crankRef = useRef<Group>(null)
  useFrame(() => {
    const pose = sim.mechanismPose(rotator.id)
    if (!('rotationY' in pose)) return
    if (groupRef.current) groupRef.current.rotation.y = pose.rotationY
    const crank = crankRef.current
    if (!crank) return
    crank.rotation.z = -pose.rotationY * 2
  })

  const onCrank = (event: ThreeEvent<MouseEvent>) => {
    event.stopPropagation()
    if (!interactive) return
    sim.command({ type: 'operate', mechanism: rotator.id })
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
      {rotator.handle && (
        <Handle
          position={handlePosition(rotator.handle.block, rotator.handle.face)}
          rotationY={rotator.handle.face === 'x' ? Math.PI / 2 : 0}
          onClick={onCrank}
          crankRef={crankRef}
        />
      )}
    </>
  )
}

const LEVER_REST = 0.15
const LEVER_PULLED = 1.05

const FRAME_SPAN = 0.72
const FRAME_WIDTH = 0.05
const FRAME_OFFSET = FRAME_SPAN / 2 - FRAME_WIDTH / 2
const frameBar = new BoxGeometry(FRAME_SPAN, 0.02, FRAME_WIDTH)
const SINK_TIME = 0.32
const FLASH_TIME = 0.22

export type PlateFx = {
  spent: Set<string>
  flashAt: Map<string, number>
}

function PlateView({
  plate,
  sim,
  hovered,
  plateFx,
}: {
  plate: PlateDef
  sim: LevelSim
  hovered: boolean
  plateFx: { current: PlateFx }
}) {
  const topRef = useRef<Group>(null)
  const frameRef = useRef<Group>(null)
  const slabRef = useRef<Mesh>(null)
  const bars = useRef<Array<Mesh | null>>([])
  const sink = useRef(0)
  const wasOn = useRef(false)
  const [x, y, z] = plate.tile
  useFrame(({ clock }, delta) => {
    const pose = sim.characterPose()
    const on =
      !pose.walking &&
      Math.abs(pose.position[0] - x) < 0.2 &&
      Math.abs(pose.position[2] - z) < 0.2 &&
      Math.abs(pose.position[1] - surfaceY(y)) < 0.25
    if (on && !wasOn.current) sink.current = 1
    wasOn.current = on
    if (sink.current > 0) sink.current = Math.max(0, sink.current - delta / SINK_TIME)
    if (topRef.current) topRef.current.position.y = (hovered ? 0.03 : 0) - Math.sin(sink.current * Math.PI) * 0.03
    const flashAge = clock.elapsedTime - (plateFx.current.flashAt.get(plate.id) ?? -10)
    const flashing = flashAge >= 0 && flashAge < FLASH_TIME
    if (frameRef.current) {
      const pulse = flashing ? 1 + Math.sin((flashAge / FLASH_TIME) * Math.PI) * 0.12 : 1
      frameRef.current.scale.set(pulse, 1, pulse)
    }
    const spent = plate.once === true && plateFx.current.spent.has(plate.id)
    const color = spent ? palette.plum : flashing ? palette.cream : palette.glow
    const mat = material(color)
    for (const bar of bars.current) {
      if (bar) bar.material = mat
    }
    if (slabRef.current) slabRef.current.material = material(hovered ? palette.cream : palette.path)
  })
  const bindBar = (index: number) => (mesh: Mesh | null) => {
    bars.current[index] = mesh
  }
  return (
    <group position={[x, 0, z]}>
      <group ref={topRef}>
        <mesh
          ref={slabRef}
          geometry={slabGeometry}
          position={[0, 0.5, 0]}
          material={material(palette.path)}
          receiveShadow
        />
        <group ref={frameRef} position={[0, 0.57, 0]}>
          <mesh
            ref={bindBar(0)}
            position={[0, 0, FRAME_OFFSET]}
            geometry={frameBar}
            material={material(palette.glow)}
          />
          <mesh
            ref={bindBar(1)}
            position={[0, 0, -FRAME_OFFSET]}
            geometry={frameBar}
            material={material(palette.glow)}
          />
          <mesh
            ref={bindBar(2)}
            position={[FRAME_OFFSET, 0, 0]}
            rotation={[0, Math.PI / 2, 0]}
            geometry={frameBar}
            material={material(palette.glow)}
          />
          <mesh
            ref={bindBar(3)}
            position={[-FRAME_OFFSET, 0, 0]}
            rotation={[0, Math.PI / 2, 0]}
            geometry={frameBar}
            material={material(palette.glow)}
          />
        </group>
      </group>
    </group>
  )
}

function Lever({
  position,
  rotationY,
  sim,
  mechanismId,
  interactive,
}: {
  position: Vec3
  rotationY: number
  sim: LevelSim
  mechanismId: string
  interactive: boolean
}) {
  const barRef = useRef<Group>(null)
  const pulled = useRef(false)
  const angle = useRef(LEVER_REST)
  useFrame((_, delta) => {
    const target = pulled.current ? LEVER_PULLED : LEVER_REST
    angle.current += (target - angle.current) * Math.min(1, delta * 8)
    const bar = barRef.current
    if (!bar) return
    bar.rotation.x = angle.current
  })
  const onClick = (event: ThreeEvent<MouseEvent>) => {
    event.stopPropagation()
    if (!interactive) return
    const result = sim.command({ type: 'operate', mechanism: mechanismId })
    if (result === 'ok') pulled.current = !pulled.current
  }
  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      <mesh position={[0, 0, -0.02]} material={material(palette.terracotta)}>
        <cylinderGeometry args={[0.08, 0.08, 0.06, 12]} />
      </mesh>
      <group ref={barRef} onClick={onClick} onPointerOver={pointer(true)} onPointerOut={pointer(false)}>
        <mesh position={[0, 0.2, 0]} material={material(palette.glow)} castShadow>
          <boxGeometry args={[0.06, 0.4, 0.06]} />
        </mesh>
        <mesh position={[0, 0.42, 0]} material={material(palette.glow)} castShadow>
          <sphereGeometry args={[0.07, 12, 10]} />
        </mesh>
        <mesh>
          <circleGeometry args={[0.32, 16]} />
          <meshBasicMaterial transparent opacity={0} depthWrite={false} />
        </mesh>
      </group>
    </group>
  )
}

function MoverView({
  mover,
  sim,
  hovered,
  onHover,
  onSelect,
  interactive,
}: {
  mover: MoverDef
  sim: LevelSim
  hovered: string | null
  onHover: (id: string | null) => void
  onSelect: (id: string) => void
  interactive: boolean
}) {
  const groupRef = useRef<Group>(null)
  useFrame(() => {
    const pose = sim.mechanismPose(mover.id)
    if (!('offset' in pose) || !groupRef.current) return
    groupRef.current.position.set(
      mover.origin[0] + pose.offset[0],
      mover.origin[1] + pose.offset[1],
      mover.origin[2] + pose.offset[2],
    )
  })

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
      {mover.handle && (
        <Lever
          position={handlePosition(mover.handle.block, mover.handle.face)}
          rotationY={mover.handle.face === 'x' ? Math.PI / 2 : 0}
          sim={sim}
          mechanismId={mover.id}
          interactive={interactive}
        />
      )}
    </>
  )
}

export function Mechanisms({
  level,
  sim,
  hovered,
  onHover,
  onSelect,
  plateFx,
  interactive = true,
}: {
  level: LevelDef
  sim: LevelSim
  hovered: string | null
  onHover: (id: string | null) => void
  onSelect: (id: string) => void
  plateFx: { current: PlateFx }
  interactive?: boolean
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
              interactive={interactive}
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
              interactive={interactive}
            />
          )
        }
        if (mechanism.type !== 'plate') return null
        return (
          <PlateView
            key={mechanism.id}
            plate={mechanism}
            sim={sim}
            hovered={hovered === cellId(mechanism.tile)}
            plateFx={plateFx}
          />
        )
      })}
    </group>
  )
}
