import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { useFrame, useThree, type ThreeEvent } from '@react-three/fiber'
import { Object3D, Vector3, type DirectionalLight, type Group, type Mesh, type OrthographicCamera } from 'three'
import { level } from '../levels/prototype'
import type { Vec3 } from '../levels/types'
import { palette } from './palette'
import {
  addVec,
  buildGraph,
  cellId,
  findPath,
  rotateOffset,
  segmentHeading,
  segmentPoint,
  surfaceY,
  type Tile,
} from '../core/iso'
import { blockGeometry, material, slabGeometry } from './materials'
import { Character } from './Character'
import { Decor, GoalArch } from './Decor'

const WALK_SPEED = 2.6
const ROTATE_DURATION = 0.9
const startId = cellId(level.start)
const goalId = cellId(level.goal)

const staticTiles: Tile[] = level.blocks
  .filter((b) => b.kind === 'path')
  .map((b) => ({ id: cellId(b.pos), pos: b.pos, onRotator: false }))

const rotatorTiles = (step: number): Tile[] =>
  level.rotator.arms.map((arm, i) => ({
    id: `arm-${i}`,
    pos: addVec(level.rotator.pivot, rotateOffset(arm, step)),
    onRotator: true,
  }))

const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)

interface Walker {
  at: string
  route: string[]
  toId: string | null
  from: Vec3
  to: Vec3
  t: number
}

interface Props {
  onGoal: () => void
  onBlocked: (message: string) => void
}

export function World({ onGoal, onBlocked }: Props) {
  const [step, setStep] = useState(0)
  const [reached, setReached] = useState(false)
  const [hovered, setHovered] = useState<string | null>(null)
  const [marker, setMarker] = useState<{ pos: Vec3; ok: boolean; at: number } | null>(null)

  const tiles = useMemo(() => {
    const map = new Map<string, Tile>()
    for (const tile of [...staticTiles, ...rotatorTiles(step)]) map.set(tile.id, tile)
    return map
  }, [step])

  const graph = useMemo(() => {
    const occupied = new Set(level.blocks.map((b) => cellId(b.pos)))
    for (const tile of rotatorTiles(step)) occupied.add(cellId(tile.pos))
    return buildGraph([...tiles.values()], occupied)
  }, [tiles, step])

  const tilesRef = useRef(tiles)
  const graphRef = useRef(graph)
  tilesRef.current = tiles
  graphRef.current = graph

  const walker = useRef<Walker>({ at: startId, route: [], toId: null, from: level.start, to: level.start, t: 0 })
  const characterRef = useRef<Group>(null)
  const rotatorRef = useRef<Group>(null)
  const crankRef = useRef<Group>(null)
  const rotation = useRef<{ from: number; to: number; t: number } | null>(null)
  const shake = useRef(0)

  const handleTileClick = (id: string) => (event: ThreeEvent<MouseEvent>) => {
    event.stopPropagation()
    if (rotation.current || reached) return
    const w = walker.current
    const origin = w.toId ?? w.at
    const route = origin === id ? [] : findPath(graphRef.current, origin, id)
    const target = tilesRef.current.get(id)!
    setMarker({ pos: target.pos, ok: route !== null, at: performance.now() })
    if (route === null) {
      onBlocked('看起来连不上，换个角度试试')
      return
    }
    w.route = route
  }

  const handleCrankClick = (event: ThreeEvent<MouseEvent>) => {
    event.stopPropagation()
    const w = walker.current
    if (rotation.current || reached) return
    if (w.toId || w.route.length > 0) return
    if (tilesRef.current.get(w.at)?.onRotator) {
      shake.current = 0.5
      onBlocked('站在桥上可转不动')
      return
    }
    const base = (step * Math.PI) / 2
    rotation.current = { from: base, to: base + Math.PI / 2, t: 0 }
  }

  useFrame((state, delta) => {
    const dt = Math.min(delta, 1 / 30)
    const w = walker.current

    if (!w.toId && w.route.length > 0) {
      const next = w.route.shift()!
      w.from = tilesRef.current.get(w.at)!.pos
      w.to = tilesRef.current.get(next)!.pos
      w.toId = next
      w.t = 0
    }

    const character = characterRef.current
    if (character) {
      const body = character.getObjectByName('body')!
      if (w.toId) {
        w.t = Math.min(1, w.t + dt * WALK_SPEED)
        const [x, y, z] = segmentPoint(w.from, w.to, w.t)
        character.position.set(x, y, z)
        character.rotation.y = segmentHeading(w.from, w.to)
        body.position.y = Math.abs(Math.sin(w.t * Math.PI)) * 0.07
        if (w.t >= 1) {
          w.at = w.toId
          w.toId = null
          if (w.at === goalId && w.route.length === 0) {
            setReached(true)
            onGoal()
          }
        }
      } else {
        const [x, y, z] = tilesRef.current.get(w.at)!.pos
        character.position.set(x, surfaceY(y), z)
        body.position.y = 0
        body.scale.y = 1 + Math.sin(state.clock.elapsedTime * 2.4) * 0.02
      }
    }

    const rot = rotation.current
    if (rot && rotatorRef.current) {
      rot.t = Math.min(1, rot.t + dt / ROTATE_DURATION)
      const angle = rot.from + (rot.to - rot.from) * easeInOut(rot.t)
      rotatorRef.current.rotation.y = angle
      if (crankRef.current) crankRef.current.rotation.z = -angle * 2
      if (rot.t >= 1) {
        rotation.current = null
        setStep((s) => s + 1)
      }
    }

    if (crankRef.current) {
      shake.current = Math.max(0, shake.current - dt)
      crankRef.current.position.x = Math.sin(state.clock.elapsedTime * 60) * shake.current * 0.08
    }
  })

  const { pivot, arms, color: rotatorColor, crank } = level.rotator

  return (
    <group>
      <Lights />
      <CameraRig />
      <FloatingWorld>
        {level.blocks.map((block) => {
          const id = cellId(block.pos)
          if (block.kind === 'path') {
            return (
              <WalkTile
                key={id}
                position={block.pos}
                color={block.color}
                hovered={hovered === id}
                onHover={(on) => setHovered(on ? id : null)}
                onSelect={handleTileClick(id)}
              />
            )
          }
          return (
            <mesh key={id} position={block.pos} geometry={blockGeometry} material={material(block.color)} castShadow receiveShadow />
          )
        })}

        <group ref={rotatorRef} position={pivot}>
          <mesh position={[0, -0.55, 0]} receiveShadow material={material(palette.teal)}>
            <cylinderGeometry args={[1.18, 1.18, 0.07, 48]} />
          </mesh>
          <mesh position={[0, -0.55, 0]} rotation={[Math.PI / 2, 0, 0]} material={material(palette.glow)}>
            <torusGeometry args={[1.18, 0.035, 8, 64]} />
          </mesh>
          {arms.map((arm, i) => (
            <WalkTile
              key={i}
              position={arm}
              color={rotatorColor}
              hovered={hovered === `arm-${i}`}
              onHover={(on) => setHovered(on ? `arm-${i}` : null)}
              onSelect={handleTileClick(`arm-${i}`)}
            />
          ))}
        </group>

        <group position={[crank[0], crank[1], crank[2] + 0.56]}>
          <group ref={crankRef} onClick={handleCrankClick} onPointerOver={pointer(true)} onPointerOut={pointer(false)}>
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
            <mesh visible={false}>
              <circleGeometry args={[0.42, 20]} />
            </mesh>
          </group>
        </group>

        <Character ref={characterRef} />
        <Marker marker={marker} />
        <GoalArch reached={reached} />
        <Decor />
      </FloatingWorld>
    </group>
  )
}

const pointer = (on: boolean) => (event: ThreeEvent<PointerEvent>) => {
  event.stopPropagation()
  document.body.style.cursor = on ? 'pointer' : ''
}

interface WalkTileProps {
  position: Vec3
  color: string
  hovered: boolean
  onHover: (on: boolean) => void
  onSelect: (event: ThreeEvent<MouseEvent>) => void
}

function WalkTile({ position, color, hovered, onHover, onSelect }: WalkTileProps) {
  const hover = (on: boolean) => (event: ThreeEvent<PointerEvent>) => {
    pointer(on)(event)
    onHover(on)
  }
  return (
    <group position={position} onClick={onSelect} onPointerOver={hover(true)} onPointerOut={hover(false)}>
      <mesh geometry={blockGeometry} material={material(color)} castShadow receiveShadow />
      <mesh
        geometry={slabGeometry}
        position={[0, hovered ? 0.53 : 0.5, 0]}
        material={material(hovered ? palette.cream : palette.path)}
        receiveShadow
      />
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

const SCENE_CENTER = new Vector3(6, 1.2, 2.4)

function Lights() {
  const lightRef = useRef<DirectionalLight>(null)
  const target = useMemo(() => {
    const obj = new Object3D()
    obj.position.copy(SCENE_CENTER)
    return obj
  }, [])
  useEffect(() => {
    if (lightRef.current) lightRef.current.target = target
  }, [target])
  return (
    <>
      <primitive object={target} />
      <hemisphereLight args={['#fff1df', '#8b6f9c', 0.95]} />
      <ambientLight intensity={0.2} color="#ffe9d6" />
      <directionalLight
        ref={lightRef}
        position={[SCENE_CENTER.x - 7, SCENE_CENTER.y + 14, SCENE_CENTER.z + 5]}
        intensity={2.5}
        color="#fff3e2"
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0004}
        shadow-normalBias={0.02}
        shadow-camera-left={-14}
        shadow-camera-right={14}
        shadow-camera-top={14}
        shadow-camera-bottom={-14}
        shadow-camera-near={1}
        shadow-camera-far={50}
      />
    </>
  )
}

function CameraRig() {
  const camera = useThree((s) => s.camera) as OrthographicCamera
  const size = useThree((s) => s.size)

  const bounds = useMemo(() => {
    const right = new Vector3(1, 0, -1).normalize()
    const up = new Vector3(-1, 2, -1).normalize()
    const points: Vector3[] = []
    for (const b of level.blocks) points.push(new Vector3(...b.pos))
    for (let s = 0; s < 4; s++) for (const t of rotatorTiles(s)) points.push(new Vector3(...t.pos))
    for (const island of level.islands) {
      const cx = (island.x[0] + island.x[1]) / 2
      const cz = (island.z[0] + island.z[1]) / 2
      points.push(new Vector3(cx, island.y - 0.5 - island.depth, cz))
    }
    let minX = Infinity
    let maxX = -Infinity
    let minY = Infinity
    let maxY = -Infinity
    for (const p of points) {
      const sx = p.dot(right)
      const sy = p.dot(up)
      minX = Math.min(minX, sx - 0.9)
      maxX = Math.max(maxX, sx + 0.9)
      minY = Math.min(minY, sy - 0.9)
      maxY = Math.max(maxY, sy + 1.2)
    }
    const center = right
      .clone()
      .multiplyScalar((minX + maxX) / 2)
      .add(up.clone().multiplyScalar((minY + maxY) / 2))
    return { center, width: maxX - minX, height: maxY - minY }
  }, [])

  useEffect(() => {
    const { center, width, height } = bounds
    camera.position.copy(center).add(new Vector3(30, 30, 30))
    camera.up.set(0, 1, 0)
    camera.lookAt(center)
    camera.zoom = Math.min(size.width / (width * 1.15), size.height / (height * 1.2))
    camera.near = 0.1
    camera.far = 200
    camera.updateProjectionMatrix()
  }, [bounds, camera, size])

  return null
}
