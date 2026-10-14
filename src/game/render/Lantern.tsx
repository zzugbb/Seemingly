import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { CylinderGeometry, SphereGeometry, type Mesh } from 'three'
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js'
import { surfaceY } from '../core/iso'
import type { Vec3 } from '../levels/types'
import { material } from './materials'
import { palette } from './palette'

const POST_HEIGHT = 0.5
const LAMP_WIDTH = 0.22
const LAMP_HEIGHT = 0.28
const postGeometry = new CylinderGeometry(0.035, 0.04, POST_HEIGHT, 10)
const capGeometry = new RoundedBoxGeometry(LAMP_WIDTH, 0.045, LAMP_WIDTH, 2, 0.02)
const ribGeometry = new RoundedBoxGeometry(0.035, LAMP_HEIGHT - 0.07, 0.035, 1, 0.01)
const coreGeometry = new RoundedBoxGeometry(0.13, 0.17, 0.13, 3, 0.04)
const sparkGeometry = new SphereGeometry(0.028, 8, 6)
const RIB = LAMP_WIDTH / 2 - 0.018

function Sparks({ active, count }: { active: boolean; count: number }) {
  const refs = useRef<Array<Mesh | null>>([])
  const elapsed = useRef(0)
  const started = useRef(false)
  useFrame((_, delta) => {
    if (!active) {
      started.current = false
      elapsed.current = 0
    } else if (!started.current) {
      started.current = true
      elapsed.current = 0
    } else {
      elapsed.current += delta
    }
    const t = elapsed.current
    for (let i = 0; i < count; i++) {
      const spark = refs.current[i]
      if (!spark) continue
      spark.visible = active
      if (!active) continue
      const base = (i / count) * Math.PI * 2
      if (t < 1) {
        const radius = 0.06 + t * 0.72
        spark.position.set(Math.cos(base) * radius, t * 0.5, Math.sin(base) * radius)
      } else {
        const orbit = base + (t - 1) * 0.65
        spark.position.set(Math.cos(orbit) * 0.36, 0.1 + Math.sin(orbit * 2) * 0.05, Math.sin(orbit) * 0.36)
      }
    }
  })
  return (
    <group>
      {Array.from({ length: count }, (_, index) => (
        <mesh
          key={index}
          ref={(mesh) => {
            refs.current[index] = mesh
          }}
          geometry={sparkGeometry}
          material={material(palette.glow)}
          visible={false}
        />
      ))}
    </group>
  )
}

export function Lantern({
  goal,
  reached,
  sparkleScale,
  reducedMotion,
}: {
  goal: Vec3
  reached: boolean
  sparkleScale: number
  reducedMotion: boolean
}) {
  const [x, y, z] = goal
  const top = surfaceY(y)
  const count = reducedMotion ? 0 : Math.max(1, Math.round(10 * sparkleScale))
  return (
    <group position={[x - 0.18, top, z - 0.18]}>
      <mesh
        position={[0, POST_HEIGHT / 2, 0]}
        geometry={postGeometry}
        material={material(palette.terracotta)}
        castShadow
      />
      <group position={[0, POST_HEIGHT + LAMP_HEIGHT / 2, 0]}>
        <mesh
          position={[0, LAMP_HEIGHT / 2 - 0.02, 0]}
          geometry={capGeometry}
          material={material(palette.cream)}
          castShadow
        />
        <mesh position={[0, -LAMP_HEIGHT / 2 + 0.02, 0]} geometry={capGeometry} material={material(palette.cream)} />
        {[
          [RIB, RIB],
          [RIB, -RIB],
          [-RIB, RIB],
          [-RIB, -RIB],
        ].map(([px, pz]) => (
          <mesh key={`${px},${pz}`} position={[px, 0, pz]} geometry={ribGeometry} material={material(palette.cream)} />
        ))}
        <mesh geometry={coreGeometry} material={material(reached ? palette.glow : palette.plum)} />
        <pointLight
          position={[0.05, 0, 0.05]}
          color={palette.glow}
          intensity={reached ? 1.8 : 0}
          distance={3.4}
          decay={2}
        />
        {count > 0 && <Sparks active={reached} count={count} />}
      </group>
    </group>
  )
}
