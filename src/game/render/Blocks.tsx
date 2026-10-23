import { useLayoutEffect, useMemo, useRef } from 'react'
import { useFrame, type ThreeEvent } from '@react-three/fiber'
import { Matrix4, type InstancedMesh, type Mesh } from 'three'
import type { ScreenDir, Vec3 } from '../levels/types'
import { arrowBarGeometry, blockGeometry, material, slabGeometry, useAnimatedMaterial } from './materials'
import { hintStrength, type RenderHint } from './feedback'
import { palette } from './palette'

export const pointer = (on: boolean) => (event: ThreeEvent<PointerEvent>) => {
  event.stopPropagation()
  document.body.style.cursor = on ? 'pointer' : ''
}

export function ActiveBlock({ position, color, activity }: { position?: Vec3; color: string; activity: () => number }) {
  const fill = useAnimatedMaterial(color, 1, true)
  useFrame(() => {
    const value = activity()
    fill.color.set(color).lerp(material(palette.cream).color, value * 0.18)
    fill.emissiveIntensity = value * 0.06
  })
  return <mesh position={position} geometry={blockGeometry} material={fill} castShadow receiveShadow />
}

export function WalkTile({
  position,
  color,
  hovered,
  onHover,
  onSelect,
  cap = true,
  oneWay,
  hint,
  tileId = '',
  canSelect,
  activity,
}: {
  position: Vec3
  color: string
  hovered: boolean
  onHover: (on: boolean) => void
  onSelect: (event: ThreeEvent<MouseEvent>) => void
  cap?: boolean
  oneWay?: ScreenDir
  hint?: RenderHint | null
  tileId?: string
  canSelect?: () => boolean
  activity?: () => number
}) {
  const slab = useRef<Mesh>(null)
  const glow = useAnimatedMaterial(palette.glow, 0.8, true)
  useFrame(() => {
    if (!slab.current) return
    const pulse = hintStrength(hint, 'walk', tileId)
    const active = activity?.() ?? 0
    glow.color.set(pulse ? palette.glow : palette.path)
    if (!pulse) glow.color.lerp(material(palette.cream).color, active)
    glow.opacity = pulse || 1
    glow.emissiveIntensity = pulse ? 0.6 : active * 0.12
    slab.current.material = pulse || active ? glow : material(hovered ? palette.cream : palette.path)
  })
  const hover = (on: boolean) => (event: ThreeEvent<PointerEvent>) => {
    const active = on && (canSelect?.() ?? true)
    pointer(active)(event)
    onHover(active)
  }
  const angle = oneWay === '+a' ? Math.PI / 2 : oneWay === '-a' ? -Math.PI / 2 : oneWay === '-b' ? Math.PI : 0
  return (
    <group
      position={position}
      onClick={(event) => {
        event.stopPropagation()
        if (canSelect?.() ?? true) onSelect(event)
      }}
      onPointerOver={hover(true)}
      onPointerOut={hover(false)}
    >
      {activity ? (
        <ActiveBlock color={color} activity={activity} />
      ) : (
        <mesh geometry={blockGeometry} material={material(color)} castShadow receiveShadow />
      )}
      {cap && (
        <mesh
          ref={slab}
          geometry={slabGeometry}
          position={[0, hovered ? 0.53 : 0.5, 0]}
          material={material(hovered ? palette.cream : palette.path)}
          receiveShadow
        />
      )}
      {oneWay && (
        <group position={[0, hovered ? 0.595 : 0.565, 0]} rotation={[0, angle, 0]}>
          <mesh
            position={[-0.075, 0, -0.025]}
            rotation={[0, 0.65, 0]}
            geometry={arrowBarGeometry}
            material={material(palette.glow)}
          />
          <mesh
            position={[0.075, 0, -0.025]}
            rotation={[0, -0.65, 0]}
            geometry={arrowBarGeometry}
            material={material(palette.glow)}
          />
        </group>
      )}
    </group>
  )
}

interface RenderBlock {
  pos: Vec3
  color: string
  kind: 'path' | 'solid'
  id: string
  lit?: boolean
  oneWay?: ScreenDir
}

function SolidBatch({ blocks }: { blocks: RenderBlock[] }) {
  const ref = useRef<InstancedMesh>(null)
  useLayoutEffect(() => {
    const mesh = ref.current
    if (!mesh) return
    const matrix = new Matrix4()
    blocks.forEach((block, index) => mesh.setMatrixAt(index, matrix.makeTranslation(...block.pos)))
    mesh.instanceMatrix.needsUpdate = true
    mesh.computeBoundingSphere()
  }, [blocks])
  return (
    <instancedMesh
      ref={ref}
      args={[blockGeometry, material(blocks[0].color, { glow: blocks[0].lit }), blocks.length]}
      castShadow
      receiveShadow
    />
  )
}

export function Blocks({
  blocks,
  hovered,
  onHover,
  onSelect,
  bareCaps,
  hint,
  canSelect,
}: {
  blocks: RenderBlock[]
  hovered: string | null
  onHover: (id: string | null) => void
  onSelect: (id: string) => void
  bareCaps?: ReadonlySet<string>
  hint?: RenderHint | null
  canSelect?: (id: string) => boolean
}) {
  const solids = useMemo(() => {
    const groups = new Map<string, RenderBlock[]>()
    for (const block of blocks) {
      if (block.kind !== 'solid') continue
      const key = `${block.color}:${Boolean(block.lit)}`
      const group = groups.get(key)
      if (group) group.push(block)
      else groups.set(key, [block])
    }
    return [...groups]
  }, [blocks])
  return (
    <group>
      {solids.map(([key, group]) => (
        <SolidBatch key={key} blocks={group} />
      ))}
      {blocks.map((block) =>
        block.kind === 'path' ? (
          <WalkTile
            key={block.id}
            position={block.pos}
            color={block.color}
            hovered={hovered === block.id}
            cap={!bareCaps?.has(block.id)}
            oneWay={block.oneWay}
            hint={hint}
            tileId={block.id}
            canSelect={() => canSelect?.(block.id) ?? true}
            onHover={(on) => onHover(on ? block.id : null)}
            onSelect={() => onSelect(block.id)}
          />
        ) : null,
      )}
    </group>
  )
}
