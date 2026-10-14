import type { ThreeEvent } from '@react-three/fiber'
import type { Vec3 } from '../levels/types'
import { blockGeometry, material, slabGeometry } from './materials'
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
}: {
  position: Vec3
  color: string
  hovered: boolean
  onHover: (on: boolean) => void
  onSelect: (event: ThreeEvent<MouseEvent>) => void
}) {
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

export function Blocks({
  blocks,
  hovered,
  onHover,
  onSelect,
}: {
  blocks: { pos: Vec3; color: string; kind: 'path' | 'solid'; id: string }[]
  hovered: string | null
  onHover: (id: string | null) => void
  onSelect: (id: string) => void
}) {
  return (
    <group>
      {blocks.map((block) => {
        if (block.kind === 'path') {
          return (
            <WalkTile
              key={block.id}
              position={block.pos}
              color={block.color}
              hovered={hovered === block.id}
              onHover={(on) => onHover(on ? block.id : null)}
              onSelect={(event) => {
                event.stopPropagation()
                onSelect(block.id)
              }}
            />
          )
        }
        return (
          <mesh
            key={block.id}
            position={block.pos}
            geometry={blockGeometry}
            material={material(block.color)}
            castShadow
            receiveShadow
          />
        )
      })}
    </group>
  )
}
