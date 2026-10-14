import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Sparkles } from '@react-three/drei'
import type { Group } from 'three'
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js'
import { level } from '../levels/prototype'
import type { IslandDef, Vec3 } from '../levels/types'
import { material } from './materials'
import { palette } from './palette'
import type { QualitySettings } from './quality'

const STRATA = ['#dcae84', '#cf9372', '#b77a73', '#93677d', '#735479', '#5d4569']
const LAYER_HEIGHT = 0.62

function Island({ island }: { island: IslandDef }) {
  const w = island.x[1] - island.x[0] + 1
  const d = island.z[1] - island.z[0] + 1
  const cx = (island.x[0] + island.x[1]) / 2
  const cz = (island.z[0] + island.z[1]) / 2
  const top = island.y - 0.5

  const layers = useMemo(() => {
    const count = Math.max(2, Math.round(island.depth / LAYER_HEIGHT))
    return Array.from({ length: count }, (_, i) => {
      const t = (i + 1) / (count + 0.6)
      const lw = Math.max(0.5, w * (1 - t) + 0.1)
      const ld = Math.max(0.5, d * (1 - t) + 0.1)
      const sway = ((i * 37) % 5) / 10 - 0.2
      const color = STRATA[Math.min(STRATA.length - 1, Math.round((i / Math.max(1, count - 1)) * (STRATA.length - 1)))]
      return {
        geometry: new RoundedBoxGeometry(lw, LAYER_HEIGHT, ld, 2, 0.08),
        position: [sway * (1 - t), -LAYER_HEIGHT * (i + 0.5) + 0.02, -sway * 0.6 * (1 - t)] as Vec3,
        color,
      }
    })
  }, [island.depth, w, d])

  return (
    <group position={[cx, top, cz]}>
      {layers.map((layer, i) => (
        <mesh
          key={i}
          geometry={layer.geometry}
          position={layer.position}
          material={material(layer.color)}
          receiveShadow
        />
      ))}
    </group>
  )
}

function Tree({ pos, seed }: { pos: Vec3; seed: number }) {
  const ref = useRef<Group>(null)
  useFrame(({ clock }) => {
    if (ref.current) ref.current.rotation.z = Math.sin(clock.elapsedTime * 0.9 + seed) * 0.04
  })
  const base = pos[1] + 0.5
  const scale = 0.85 + (seed % 3) * 0.12
  return (
    <group position={[pos[0], base, pos[2]]} scale={scale}>
      <group ref={ref}>
        <mesh position={[0, 0.16, 0]} castShadow material={material(palette.trunk)}>
          <cylinderGeometry args={[0.05, 0.07, 0.32, 8]} />
        </mesh>
        <mesh position={[0, 0.48, 0]} castShadow material={material(palette.leaf, { flat: true })}>
          <icosahedronGeometry args={[0.3, 0]} />
        </mesh>
        <mesh position={[0.12, 0.72, 0.06]} castShadow material={material(palette.leafDeep, { flat: true })}>
          <icosahedronGeometry args={[0.18, 0]} />
        </mesh>
      </group>
    </group>
  )
}

function Flower({ pos, index }: { pos: Vec3; index: number }) {
  const color = [palette.cream, palette.rose, palette.glow][index % 3]
  return (
    <group position={[pos[0], pos[1] + 0.5, pos[2]]}>
      <mesh position={[0, 0.06, 0]} material={material(palette.leafDeep)}>
        <cylinderGeometry args={[0.012, 0.012, 0.12, 4]} />
      </mesh>
      <mesh position={[0, 0.13, 0]} castShadow material={material(color)}>
        <sphereGeometry args={[0.05, 10, 8]} />
      </mesh>
    </group>
  )
}

function Window({ pos, face }: { pos: Vec3; face: 'x' | 'z' }) {
  const offset = 0.495
  const position: Vec3 =
    face === 'z' ? [pos[0], pos[1] - 0.04, pos[2] + offset] : [pos[0] + offset, pos[1] - 0.04, pos[2]]
  return (
    <group position={position} rotation={[0, face === 'x' ? Math.PI / 2 : 0, 0]}>
      <mesh material={material(palette.plumDeep)}>
        <boxGeometry args={[0.2, 0.34, 0.02]} />
      </mesh>
      <mesh position={[0, 0.17, 0]} rotation={[Math.PI / 2, 0, 0]} material={material(palette.plumDeep)}>
        <cylinderGeometry args={[0.1, 0.1, 0.02, 16, 1, false, 0, Math.PI]} />
      </mesh>
    </group>
  )
}

function Cloud({ start, speed, scale, still }: { start: Vec3; speed: number; scale: number; still: boolean }) {
  const ref = useRef<Group>(null)
  const puffs = useMemo(
    () => [
      [0, 0, 0, 0.6],
      [0.65, 0.08, 0.1, 0.45],
      [-0.6, -0.04, -0.05, 0.42],
      [0.25, 0.3, 0, 0.4],
    ],
    [],
  )
  useFrame(({ clock }) => {
    if (!ref.current || still) return
    const travel = ((clock.elapsedTime * speed + start[0]) % 36) - 18
    ref.current.position.set(travel, start[1], start[2] - travel * 0.4)
  })
  return (
    <group ref={ref} position={still ? start : undefined} scale={[scale, scale * 0.62, scale]}>
      {puffs.map(([x, y, z, r], i) => (
        <mesh key={i} position={[x, y, z]}>
          <sphereGeometry args={[r, 20, 14]} />
          <meshLambertMaterial color="#fff6ec" emissive="#ffe9dc" emissiveIntensity={0.55} transparent opacity={0.88} />
        </mesh>
      ))}
    </group>
  )
}

const CLOUDS: { start: Vec3; speed: number; scale: number }[] = [
  { start: [3, 8, -6], speed: 0.22, scale: 1.1 },
  { start: [24, 2, -10], speed: 0.16, scale: 1.4 },
  { start: [14, 10, -9], speed: 0.15, scale: 0.8 },
]

export function Decor({ quality, reducedMotion }: { quality: QualitySettings; reducedMotion: boolean }) {
  return (
    <group>
      {level.decor.islands.map((island, i) => (
        <Island key={i} island={island} />
      ))}
      {level.decor.trees.map((pos, i) => (
        <Tree key={i} pos={pos} seed={i * 1.7} />
      ))}
      {level.decor.flowers.map((pos, i) => (
        <Flower key={i} pos={pos} index={i} />
      ))}
      {level.decor.windows.map((w, i) => (
        <Window key={i} pos={w.pos} face={w.face} />
      ))}
      {CLOUDS.slice(0, quality.cloudCount).map((cloud) => (
        <Cloud
          key={cloud.start.join(',')}
          start={cloud.start}
          speed={cloud.speed}
          scale={cloud.scale}
          still={reducedMotion}
        />
      ))}
      {!reducedMotion && (
        <Sparkles
          position={[6, 2, 3]}
          count={Math.max(1, Math.round(50 * quality.sparkleScale))}
          scale={[22, 12, 22]}
          size={2.2}
          speed={0.2}
          opacity={0.55}
          color="#fff4dd"
        />
      )}
    </group>
  )
}
