import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Color, Matrix4, Sphere, Vector3, type InstancedMesh, type PointLight } from 'three'
import { surfaceY } from '../core/iso'
import type { Vec3 } from '../levels/types'
import type { LevelSim } from '../core/sim'
import type { RenderFeedback } from './feedback'
import {
  material,
  useAnimatedMaterial,
  lanternPostGeometry as postGeometry,
  lanternCapGeometry as capGeometry,
  lanternRibGeometry as ribGeometry,
  lanternCoreGeometry as coreGeometry,
  lanternSparkGeometry as sparkGeometry,
} from './materials'
import { palette } from './palette'

const POST_HEIGHT = 0.5
const LAMP_WIDTH = 0.22
const LAMP_HEIGHT = 0.28
const RIB = LAMP_WIDTH / 2 - 0.018
// 包住散开和环绕两段轨迹，避免每帧重算实例包围球。
const SPARK_BOUNDS = new Sphere(new Vector3(0, 0.25, 0), 1)

function Sparks({ active, count }: { active: boolean; count: number }) {
  const ref = useRef<InstancedMesh>(null)
  const matrix = useMemo(() => new Matrix4(), [])
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
    const sparks = ref.current
    if (!sparks) return
    sparks.visible = active
    if (!active) return
    for (let i = 0; i < count; i++) {
      const base = (i / count) * Math.PI * 2
      if (t < 1) {
        const radius = 0.06 + t * 0.72
        matrix.makeTranslation(Math.cos(base) * radius, t * 0.5, Math.sin(base) * radius)
      } else {
        const orbit = base + (t - 1) * 0.65
        matrix.makeTranslation(Math.cos(orbit) * 0.36, 0.1 + Math.sin(orbit * 2) * 0.05, Math.sin(orbit) * 0.36)
      }
      sparks.setMatrixAt(i, matrix)
    }
    sparks.instanceMatrix.needsUpdate = true
  })
  return (
    <instancedMesh
      ref={ref}
      args={[sparkGeometry, material(palette.glow), count]}
      boundingSphere={SPARK_BOUNDS}
      visible={false}
    />
  )
}

export function Lantern({
  goal,
  reached,
  sparkleScale,
  reducedMotion,
  sim,
  feedback,
}: {
  goal: Vec3
  reached: boolean
  sparkleScale: number
  reducedMotion: boolean
  sim?: LevelSim
  feedback?: { current: RenderFeedback }
}) {
  const [x, y, z] = goal
  const top = surfaceY(y)
  const count = reducedMotion ? 0 : Math.max(1, Math.round(10 * sparkleScale))
  const fill = useAnimatedMaterial(palette.plum, 1, true)
  const lamp = useRef<PointLight>(null)
  const dark = useRef(new Color(palette.plum)),
    bright = useRef(new Color(palette.glow))
  useFrame(() => {
    const progress = sim?.orbProgress()
    const base = reached ? 1 : progress?.required ? progress.requiredCollected / progress.required : 0
    const age = (performance.now() - (feedback?.current.goalLockedAt ?? -10000)) / 1000
    const flash = age >= 0 && age < 0.5 ? Math.max(0, Math.sin((age / 0.5) * Math.PI * 4)) : 0
    const value = Math.max(base, flash)
    fill.color.copy(dark.current).lerp(bright.current, value)
    fill.emissiveIntensity = 0.6 * value
    if (lamp.current) lamp.current.intensity = 1.8 * value
  })
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
        <mesh geometry={coreGeometry} material={fill} />
        <pointLight
          ref={lamp}
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
