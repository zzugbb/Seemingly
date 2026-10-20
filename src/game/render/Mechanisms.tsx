import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import type { Group, Mesh } from 'three'
import { cellId } from '../core/iso'
import type { LevelSim } from '../core/sim'
import type { HandleDef, LevelDef, MechBlockDef, MoverDef, PlateDef, RotatorDef } from '../levels/types'
import { ActiveBlock, WalkTile, pointer } from './Blocks'
import { hintStrength, mechanismStrength, type RenderFeedback, type RenderHint } from './feedback'
import {
  blockGeometry,
  handleDotGeometry,
  handleHitGeometry,
  handleHubGeometry,
  handleKnobGeometry,
  handleRingGeometry,
  handleSpokeGeometry,
  hitMaterial,
  leverBarGeometry,
  leverBaseGeometry,
  material,
  plateBarGeometry,
  plateInnerBarGeometry,
  plateInnerGeometry,
  rotatorBaseGeometry,
  rotatorRimGeometry,
  slabGeometry,
  useAnimatedMaterial,
} from './materials'
import { palette } from './palette'

export type PlateFx = { spent: Set<string>; flashAt: Map<string, number> }
type FeedbackRef = { current: RenderFeedback }

export function HandleControl({
  handle,
  sim,
  id,
  feedback,
  onBlocked,
  hint,
  interactive = true,
  tactile = false,
  reducedMotion = false,
}: {
  handle: HandleDef
  sim: LevelSim
  id: string
  feedback: FeedbackRef
  onBlocked?: (message: string) => void
  hint?: RenderHint | null
  interactive?: boolean
  tactile?: boolean
  reducedMotion?: boolean
}) {
  const root = useRef<Group>(null),
    moving = useRef<Group>(null),
    dots = useRef<Array<Mesh | null>>([])
  const fill = useAnimatedMaterial(palette.glow, 0.999)
  const mechanism = sim.level.mechanisms.find((item) => item.id === id)!
  const lever = mechanism.type === 'mover'
  const position = [...handle.block] as [number, number, number]
  position[handle.face === 'x' ? 0 : 2] += 0.56
  useFrame(() => {
    const used = sim.state().handleUses[id] ?? 0
    const exhausted = handle.uses !== undefined && used >= handle.uses
    const pulse = hintStrength(hint, 'operate', id)
    const active = tactile ? mechanismStrength(feedback.current, id) : 0
    fill.color.set(exhausted ? palette.plum : palette.glow)
    if (!exhausted && active) fill.color.lerp(material(palette.cream).color, active * 0.3)
    if (tactile) {
      fill.emissive.set(palette.glow)
      fill.emissiveIntensity = active * 0.18
    }
    fill.opacity = pulse || 1
    if (root.current) {
      const age = (performance.now() - (feedback.current.blockedHandles.get(id) ?? -10000)) / 1000
      root.current.position.x = age >= 0 && age < 0.5 ? Math.sin(age * Math.PI * 40) * 0.04 * (1 - age / 0.5) : 0
      const motion = tactile ? feedback.current.mechanisms.get(id) : undefined
      const pressAge = (performance.now() - (motion?.startedAt ?? -10000)) / 180
      const press = !reducedMotion && pressAge >= 0 && pressAge < 1 ? Math.sin(pressAge * Math.PI) * 0.08 : 0
      root.current.scale.setScalar(pulse ? 1.15 : 1 - press)
    }
    dots.current.forEach((dot, index) => {
      if (dot) dot.material = material(index < (handle.uses ?? 0) - used ? palette.glow : palette.plum)
    })
    if (!moving.current) return
    if (mechanism.type === 'rotator') {
      const pose = sim.mechanismPose(id)
      if ('rotationY' in pose) moving.current.rotation.z = -pose.rotationY * 2
    } else if (mechanism.type === 'mover') {
      const pose = sim.mechanismPose(id)
      if (!('offset' in pose)) return
      const value = pose.offset[mechanism.axis === 'x' ? 0 : mechanism.axis === 'y' ? 1 : 2]
      let station = 0
      for (let index = 0; index < mechanism.stops.length - 1; index++) {
        const lo = mechanism.stops[index],
          hi = mechanism.stops[index + 1]
        if (value >= lo) station = index + Math.min(1, Math.max(0, (value - lo) / (hi - lo)))
      }
      moving.current.rotation.x = 0.15 + 0.9 * (0.5 - 0.5 * Math.cos(station * Math.PI))
    } else if (mechanism.type === 'gate') moving.current.rotation.z = (-sim.gatePose(id).open * Math.PI) / 2
  })
  return (
    <group position={position} rotation={[0, handle.face === 'x' ? Math.PI / 2 : 0, 0]}>
      <group
        ref={root}
        name={`handle-${id}`}
        onClick={(event) => {
          event.stopPropagation()
          if (!interactive || (tactile && sim.status === 'won')) return
          const result = sim.command({ type: 'operate', mechanism: id })
          if (tactile && result === 'busy')
            onBlocked?.(sim.characterPose().walking ? '小人正在行走，请稍候' : '建筑正在移动，请稍候')
          if (result === 'handle-used-up') {
            feedback.current.blockedHandles.set(id, performance.now())
            onBlocked?.('已经用完了')
          }
        }}
        onPointerOver={pointer(interactive)}
        onPointerOut={pointer(false)}
      >
        {lever && (
          <mesh position={[0, 0, -0.02]} geometry={leverBaseGeometry} material={material(palette.terracotta)} />
        )}
        <group ref={moving}>
          {lever ? (
            <>
              <mesh position={[0, 0.2, 0]} geometry={leverBarGeometry} material={fill} castShadow />
              <mesh position={[0, 0.42, 0]} geometry={handleKnobGeometry} material={fill} castShadow />
            </>
          ) : (
            <>
              <mesh geometry={handleRingGeometry} material={fill} castShadow />
              <mesh rotation={[0, 0, Math.PI / 4]} geometry={handleSpokeGeometry} material={fill} />
              <mesh rotation={[0, 0, -Math.PI / 4]} geometry={handleSpokeGeometry} material={fill} />
              <mesh
                rotation={[Math.PI / 2, 0, 0]}
                geometry={handleHubGeometry}
                material={material(palette.terracotta)}
              />
              <mesh position={[0.3, 0, 0.08]} geometry={handleKnobGeometry} material={material(palette.terracotta)} />
            </>
          )}
        </group>
        <mesh geometry={handleHitGeometry} material={hitMaterial} />
        {Array.from({ length: handle.uses ?? 0 }, (_, index) => (
          <mesh
            key={index}
            ref={(mesh) => {
              dots.current[index] = mesh
            }}
            position={[(index - ((handle.uses ?? 0) - 1) / 2) * 0.09, -0.47, 0.03]}
            geometry={handleDotGeometry}
            material={material(palette.glow)}
          />
        ))}
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
  hint,
  canSelect,
  activity,
}: {
  id: string
  blocks: MechBlockDef[]
  hovered: string | null
  onHover: (id: string | null) => void
  onSelect: (id: string) => void
  hint?: RenderHint | null
  canSelect: (id: string) => boolean
  activity?: () => number
}) {
  return (
    <>
      {blocks.map((block, index) => {
        const tileId = `${id}#${index}`,
          color = block.color ? palette[block.color] : palette.tealLight
        return (block.kind ?? 'path') === 'path' ? (
          <WalkTile
            key={tileId}
            position={block.offset}
            color={color}
            hovered={hovered === tileId}
            hint={hint}
            tileId={tileId}
            canSelect={() => canSelect(tileId)}
            onHover={(on) => onHover(on ? tileId : null)}
            onSelect={() => onSelect(tileId)}
            activity={activity}
          />
        ) : activity ? (
          <ActiveBlock key={tileId} position={block.offset} color={color} activity={activity} />
        ) : (
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

type MechProps = {
  sim: LevelSim
  hovered: string | null
  onHover: (id: string | null) => void
  onSelect: (id: string) => void
  hint?: RenderHint | null
  feedback: FeedbackRef
  onBlocked?: (message: string) => void
  interactive: boolean
  canSelect: (id: string) => boolean
  tactile: boolean
  reducedMotion: boolean
}
function MovingView({ definition, ...props }: MechProps & { definition: RotatorDef | MoverDef }) {
  const group = useRef<Group>(null)
  useFrame(() => {
    const pose = props.sim.mechanismPose(definition.id)
    if (!group.current) return
    if ('rotationY' in pose) group.current.rotation.y = pose.rotationY
    else if (definition.type === 'mover')
      group.current.position.set(
        definition.origin[0] + pose.offset[0],
        definition.origin[1] + pose.offset[1],
        definition.origin[2] + pose.offset[2],
      )
  })
  return (
    <>
      <group ref={group} position={definition.type === 'rotator' ? definition.pivot : definition.origin}>
        {definition.type === 'rotator' && (
          <>
            <mesh
              position={[0, -0.55, 0]}
              geometry={rotatorBaseGeometry}
              material={material(palette.teal)}
              receiveShadow
            />
            <mesh
              position={[0, -0.55, 0]}
              rotation={[Math.PI / 2, 0, 0]}
              geometry={rotatorRimGeometry}
              material={material(palette.glow)}
            />
          </>
        )}
        <MechBlocks
          id={definition.id}
          blocks={definition.blocks}
          hovered={props.hovered}
          onHover={props.onHover}
          onSelect={props.onSelect}
          hint={props.hint}
          canSelect={props.canSelect}
          activity={props.tactile ? () => mechanismStrength(props.feedback.current, definition.id) : undefined}
        />
      </group>
      {definition.handle && (
        <HandleControl
          handle={definition.handle}
          id={definition.id}
          sim={props.sim}
          onBlocked={props.onBlocked}
          feedback={props.feedback}
          hint={props.hint}
          interactive={props.interactive}
          tactile={props.tactile}
          reducedMotion={props.reducedMotion}
        />
      )}
    </>
  )
}

function PlateView({
  plate,
  sim,
  hovered,
  plateFx,
  hint,
}: {
  plate: PlateDef
  sim: LevelSim
  hovered: boolean
  plateFx: { current: PlateFx }
  hint?: RenderHint | null
}) {
  const top = useRef<Group>(null),
    inner = useRef<Group>(null),
    bars = useRef<Array<Mesh | null>>([]),
    slab = useRef<Mesh>(null)
  const sink = useRef(0),
    wasOn = useRef(false),
    glow = useAnimatedMaterial(palette.glow, 0.8, true)
  const hold = plate.mode === 'hold'
  useFrame(({ clock }, delta) => {
    const pose = sim.platePose(plate.id)
    if (pose.pressed && !wasOn.current) sink.current = 1
    wasOn.current = pose.pressed
    sink.current = Math.max(0, sink.current - delta / 0.32)
    if (top.current)
      top.current.position.y = (hovered ? 0.03 : 0) - (hold ? 0 : Math.sin(sink.current * Math.PI) * 0.03)
    if (inner.current) inner.current.position.y = hold && pose.pressed ? -0.04 : 0
    const age = clock.elapsedTime - (plateFx.current.flashAt.get(plate.id) ?? -10)
    const color = pose.spent ? palette.plum : age >= 0 && age < 0.22 ? palette.cream : palette.glow
    for (const bar of bars.current) if (bar) bar.material = material(color)
    const pulse = hintStrength(hint, 'walk', cellId(plate.tile))
    glow.opacity = pulse
    if (slab.current) slab.current.material = pulse ? glow : material(hovered ? palette.cream : palette.path)
  })
  const frame = (span: number, small: boolean) => (
    <group position={[0, 0.57, 0]}>
      {[0, 1, 2, 3].map((index) => (
        <mesh
          key={index}
          ref={(mesh) => {
            bars.current[(small ? 4 : 0) + index] = mesh
          }}
          position={
            index < 2
              ? [0, 0, (index === 0 ? 1 : -1) * (span / 2 - 0.025)]
              : [(index === 2 ? 1 : -1) * (span / 2 - 0.025), 0, 0]
          }
          rotation={[0, index < 2 ? 0 : Math.PI / 2, 0]}
          geometry={small ? plateInnerBarGeometry : plateBarGeometry}
          material={material(palette.glow)}
        />
      ))}
    </group>
  )
  return (
    <group position={plate.tile} name={`plate-${plate.id}`}>
      <group ref={top}>
        <mesh
          ref={slab}
          position={[0, 0.5, 0]}
          geometry={slabGeometry}
          material={material(palette.path)}
          receiveShadow
        />
        {frame(0.72, false)}
        {hold && (
          <group ref={inner}>
            {frame(0.5, true)}
            <mesh
              position={[0, 0.57, 0]}
              geometry={plateInnerGeometry}
              material={material(palette.path)}
              receiveShadow
            />
          </group>
        )}
      </group>
    </group>
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
  feedback,
  onBlocked,
  hint,
  canSelect,
  tactile = false,
  reducedMotion = false,
}: {
  level: LevelDef
  sim: LevelSim
  hovered: string | null
  onHover: (id: string | null) => void
  onSelect: (id: string) => void
  plateFx: { current: PlateFx }
  interactive?: boolean
  feedback: FeedbackRef
  onBlocked?: (message: string) => void
  hint?: RenderHint | null
  canSelect: (id: string) => boolean
  tactile?: boolean
  reducedMotion?: boolean
}) {
  return (
    <group>
      {level.mechanisms.map((mechanism) =>
        mechanism.type === 'rotator' || mechanism.type === 'mover' ? (
          <MovingView
            key={mechanism.id}
            definition={mechanism}
            sim={sim}
            hovered={hovered}
            onHover={onHover}
            onSelect={onSelect}
            interactive={interactive}
            onBlocked={onBlocked}
            feedback={feedback}
            hint={hint}
            canSelect={canSelect}
            tactile={tactile}
            reducedMotion={reducedMotion}
          />
        ) : mechanism.type === 'plate' ? (
          <PlateView
            key={mechanism.id}
            plate={mechanism}
            sim={sim}
            hovered={hovered === cellId(mechanism.tile)}
            plateFx={plateFx}
            hint={hint}
          />
        ) : null,
      )}
    </group>
  )
}
