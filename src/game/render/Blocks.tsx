import { useRef } from 'react'
import { useFrame, type ThreeEvent } from '@react-three/fiber'
import type { Mesh } from 'three'
import type { ScreenDir, Vec3 } from '../levels/types'
import { arrowBarGeometry, blockGeometry, material, slabGeometry, useAnimatedMaterial } from './materials'
import { hintStrength, type RenderHint } from './feedback'
import { palette } from './palette'

export const pointer = (on: boolean) => (event: ThreeEvent<PointerEvent>) => {
  event.stopPropagation()
  document.body.style.cursor = on ? 'pointer' : ''
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
}) {
  const slab = useRef<Mesh>(null)
  const glow = useAnimatedMaterial(palette.glow, 0.8, true)
  useFrame(() => {
    if (!slab.current) return
    const pulse = hintStrength(hint, 'walk', tileId)
    glow.opacity = pulse
    slab.current.material = pulse ? glow : material(hovered ? palette.cream : palette.path)
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
      <mesh geometry={blockGeometry} material={material(color)} castShadow receiveShadow />
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

export function Blocks({
  blocks,
  hovered,
  onHover,
  onSelect,
  bareCaps,
  hint,
  canSelect,
}: {
  blocks: { pos: Vec3; color: string; kind: 'path' | 'solid'; id: string; lit?: boolean; oneWay?: ScreenDir }[]
  hovered: string | null
  onHover: (id: string | null) => void
  onSelect: (id: string) => void
  bareCaps?: ReadonlySet<string>
  hint?: RenderHint | null
  canSelect?: (id: string) => boolean
}) {
  return (
    <group>
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
        ) : (
          <mesh
            key={block.id}
            position={block.pos}
            geometry={blockGeometry}
            material={material(block.color, { glow: block.lit })}
            castShadow
            receiveShadow
          />
        ),
      )}
    </group>
  )
}
