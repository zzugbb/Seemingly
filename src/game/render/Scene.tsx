import { useMemo, useRef, useState, type ReactNode } from 'react'
import { useFrame } from '@react-three/fiber'
import type { Group, Mesh } from 'three'
import { cellId, surfaceY } from '../core/iso'
import { visibleTilesOf } from '../core/rules'
import { advanceBrace, braceScale } from '../core/shapes'
import type { LevelSim, SimEvent } from '../core/sim'
import type { LevelDef, Vec3 } from '../levels/types'
import { Blocks } from './Blocks'
import { Crates } from './Crates'
import { Patrols } from './Patrols'
import { Gates } from './Gates'
import { Orbs } from './Orbs'
import type { RenderFeedback, RenderHint } from './feedback'
import { markerGeometry, useAnimatedMaterial } from './materials'
import { CameraRig } from './CameraRig'
import { Character } from './Character'
import { Decor } from './Decor'
import { Finale } from './Finale'
import { Lantern } from './Lantern'
import { Lights } from './Lights'
import { Mechanisms, type PlateFx } from './Mechanisms'
import { palette } from './palette'
import type { QualitySettings } from './quality'

const SWAY = (6 * Math.PI) / 180
const BOB = 0.06
const ARRIVE_TIME = 0.15
const TURN_SPEED = 8

export function Scene({
  level,
  sim,
  onWon,
  onBlocked,
  interactive = true,
  quality,
  reducedMotion,
  onEndingReady,
  onEvent,
  onStateChange,
  onUnreachable,
  onLanternLit,
  hint,
  tactile = false,
}: {
  level: LevelDef
  sim: LevelSim
  onWon: () => void
  onBlocked: (message: string) => void
  interactive?: boolean
  quality: QualitySettings
  reducedMotion: boolean
  onEndingReady?: () => void
  onEvent?: (event: SimEvent) => void
  onStateChange?: () => void
  onUnreachable?: () => void
  onLanternLit?: () => void
  hint?: RenderHint | null
  tactile?: boolean
}) {
  const [hovered, setHovered] = useState<string | null>(null)
  const [won, setWon] = useState(false)
  const [towerLit, setTowerLit] = useState(false)
  const [marker, setMarker] = useState<{ pos: Vec3; ok: boolean; at: number } | null>(null)
  const characterRef = useRef<Group>(null)
  const plateFx = useRef<PlateFx>({ spent: new Set(), flashAt: new Map() })
  const feedback = useRef<RenderFeedback>({
    blockedCrates: new Map(),
    blockedHandles: new Map(),
    goalLockedAt: -10000,
    mechanisms: new Map(),
  })
  const view = useRef({ state: sim.state(), visible: visibleTilesOf(level, sim.state()) })
  const motion = useRef({ heading: 0, phase: 0, wasWalking: false, arrive: 0, brace: 0 })
  const plateTiles = useMemo(
    () =>
      new Set(level.mechanisms.flatMap((mechanism) => (mechanism.type === 'plate' ? [cellId(mechanism.tile)] : []))),
    [level],
  )

  const towerTiles = useMemo(() => new Set(level.ending?.tower.map(cellId)), [level])

  const idle = useRef(sim.isIdle())
  useFrame(({ clock }, delta) => {
    const events = sim.update(delta)
    for (const event of events) {
      onEvent?.(event)
      if (event.type === 'goal-locked') feedback.current.goalLockedAt = performance.now()
      if (tactile && event.type === 'mechanism-start') {
        feedback.current.mechanisms.set(event.id, { startedAt: performance.now(), settledAt: null })
        setMarker(null)
      }
      if (tactile && event.type === 'mechanism-end') {
        const motion = feedback.current.mechanisms.get(event.id)
        if (motion) motion.settledAt = performance.now()
      }
      if (event.type === 'undo') {
        setWon(false)
        plateFx.current.spent = new Set(sim.state().spentPlates)
        plateFx.current.flashAt.clear()
        feedback.current.goalLockedAt = -10000
        feedback.current.blockedCrates.clear()
        feedback.current.blockedHandles.clear()
        feedback.current.mechanisms.clear()
        if (tactile) setMarker(null)
        motion.current.heading = sim.characterPose().heading
        motion.current.brace = 0
      }
      if (event.type === 'won') {
        setWon(true)
        onWon()
      }
      if (event.type === 'plate') {
        if (event.triggered) {
          const plate = level.mechanisms.find((mechanism) => mechanism.id === event.id)
          if (plate?.type === 'plate' && plate.once) plateFx.current.spent.add(event.id)
        } else if (!plateFx.current.spent.has(event.id)) {
          plateFx.current.flashAt.set(event.id, clock.elapsedTime)
        }
      }
    }
    if (view.current.state !== sim.state() || idle.current !== sim.isIdle()) {
      view.current = { state: sim.state(), visible: visibleTilesOf(level, sim.state()) }
      idle.current = sim.isIdle()
      onStateChange?.()
    }
    const character = characterRef.current
    if (!character) return
    const pose = sim.characterPose()
    const [x, y, z] = pose.position
    character.position.set(x, y, z)
    const anim = motion.current
    let turn = pose.heading - anim.heading
    if (turn > Math.PI) turn -= Math.PI * 2
    if (turn < -Math.PI) turn += Math.PI * 2
    const step = Math.min(Math.abs(turn), TURN_SPEED * delta)
    anim.heading += Math.sign(turn) * step
    character.rotation.y = anim.heading
    const body = character.getObjectByName('body')
    if (!body) return
    body.rotation.x = pose.pushing ? 0.12 : 0
    if (pose.walking) {
      anim.phase += delta * Math.PI * 2.6
      anim.arrive = 0
      body.rotation.z = pose.pushing ? 0 : Math.sin(anim.phase) * SWAY
      body.position.y = pose.pushing ? 0 : Math.abs(Math.sin(anim.phase)) * BOB
      body.scale.y = 1
    } else if (anim.wasWalking) {
      anim.arrive = ARRIVE_TIME
      body.rotation.z = 0
      body.position.y = 0
    }
    if (!pose.walking && anim.arrive > 0) {
      anim.arrive = Math.max(0, anim.arrive - delta)
      const t = 1 - anim.arrive / ARRIVE_TIME
      const squash = Math.sin(t * Math.PI)
      body.scale.y = 1 - squash * 0.1
      body.position.y = 0
      body.rotation.z = 0
    } else if (!pose.walking) {
      body.rotation.z = 0
      body.position.y = 0
      body.scale.y = 1 + Math.sin(clock.elapsedTime * 1.6) * 0.02
    }
    anim.brace = advanceBrace(anim.brace, !sim.isIdle() && !pose.walking, Math.min(delta, 1 / 30))
    body.scale.y *= braceScale(anim.brace)
    anim.wasWalking = pose.walking
  }, -1)

  const selectTile = (id: string) => {
    if (!interactive || (tactile && sim.status === 'won') || !view.current.visible.has(id)) return
    const tile = sim.tiles().get(id)
    if (!tile) return
    const result = sim.command({ type: 'walk', tileId: id })
    if (result === 'busy') {
      if (tactile) onBlocked('建筑正在移动，请稍候')
      return
    }
    setMarker({ pos: tile.pos, ok: result === 'ok', at: performance.now() })
    if (result === 'unreachable') {
      const oneWay = level.blocks.some((block) => cellId(block.pos) === id && block.oneWay)
      onBlocked(oneWay ? '只能从箭头方向进来' : '看起来连不上，换个角度试试')
      onUnreachable?.()
    }
  }

  const pushCrate = (id: string) => {
    if (!interactive) return
    const result = sim.command({ type: 'push', crate: id })
    if (result === 'cannot-push') {
      feedback.current.blockedCrates.set(id, performance.now())
      onBlocked('前面过不去')
      onUnreachable?.()
    }
  }
  const canSelect = (id: string) => interactive && view.current.visible.has(id)
  const blocks = level.blocks.map((block) => ({
    id: cellId(block.pos),
    pos: block.pos,
    color: palette[block.color],
    kind: block.kind,
    oneWay: block.oneWay,
    lit: towerLit && towerTiles.has(cellId(block.pos)),
  }))

  return (
    <group>
      <Lights shadows={quality.shadows} />
      <CameraRig level={level} />
      <FloatingWorld still={reducedMotion} frozen={won && Boolean(level.ending)}>
        <Blocks
          blocks={blocks}
          hovered={hovered}
          onHover={setHovered}
          onSelect={selectTile}
          bareCaps={plateTiles}
          hint={hint}
          canSelect={canSelect}
        />
        <Mechanisms
          level={level}
          sim={sim}
          hovered={hovered}
          onHover={setHovered}
          onSelect={selectTile}
          plateFx={plateFx}
          interactive={interactive}
          feedback={feedback}
          onBlocked={onBlocked}
          hint={hint}
          canSelect={canSelect}
          tactile={tactile}
          reducedMotion={reducedMotion}
        />
        <Orbs sim={sim} reducedMotion={reducedMotion} sparkleScale={quality.sparkleScale} />
        <Crates sim={sim} feedback={feedback} hint={hint} onPush={pushCrate} interactive={interactive} />
        <Gates sim={sim} onBlocked={onBlocked} feedback={feedback} hint={hint} interactive={interactive} />
        <Patrols sim={sim} reducedMotion={reducedMotion} />
        <Character ref={characterRef} occlusion={interactive} />
        <Marker marker={marker} sim={tactile ? sim : undefined} reducedMotion={tactile && reducedMotion} />
        <Lantern
          goal={level.goal}
          reached={won}
          sparkleScale={quality.sparkleScale}
          reducedMotion={reducedMotion}
          sim={sim}
          feedback={feedback}
        />
        {won && level.ending && (
          <Finale
            ending={level.ending}
            sparkleScale={quality.sparkleScale}
            reducedMotion={reducedMotion}
            onTowerLit={() => setTowerLit(true)}
            onReady={() => onEndingReady?.()}
            onLanternLit={() => onLanternLit?.()}
          />
        )}
        <Decor decor={level.decor} quality={quality} reducedMotion={reducedMotion} />
        {level.decor.lanterns?.map((position) => (
          <Lantern
            key={position.join(',')}
            goal={position}
            reached={won}
            sparkleScale={quality.sparkleScale}
            reducedMotion={reducedMotion}
          />
        ))}
      </FloatingWorld>
    </group>
  )
}

function FloatingWorld({ children, still, frozen }: { children: ReactNode; still: boolean; frozen: boolean }) {
  const ref = useRef<Group>(null)
  useFrame(({ clock }) => {
    if (!ref.current || frozen) return
    ref.current.position.y = still ? 0 : Math.sin(clock.elapsedTime * 0.8) * 0.06
  })
  return <group ref={ref}>{children}</group>
}

function Marker({
  marker,
  sim,
  reducedMotion,
}: {
  marker: { pos: Vec3; ok: boolean; at: number } | null
  sim?: LevelSim
  reducedMotion: boolean
}) {
  const ref = useRef<Mesh>(null)
  const fill = useAnimatedMaterial(palette.markerSuccess, 0.8)
  const outline = useAnimatedMaterial(palette.plumDeep, 0.42)
  const arrival = useRef({ markerAt: -1, at: 0 })
  useFrame(() => {
    const mesh = ref.current
    if (!mesh || !marker) return
    const now = performance.now()
    if (arrival.current.markerAt !== marker.at) arrival.current = { markerAt: marker.at, at: now }
    if (sim?.characterPose().walking && marker.ok) arrival.current.at = now
    const age = (now - marker.at) / 1000
    const life = sim && marker.ok ? Math.max(0, 1 - (now - arrival.current.at) / 600) : Math.max(0, 1 - age / 0.8)
    mesh.visible = life > 0
    fill.color.set(marker.ok ? palette.markerSuccess : palette.markerError)
    fill.opacity = life * 0.9
    outline.opacity = life * 0.42
    mesh.scale.setScalar(reducedMotion || (sim && marker.ok) ? 0.85 : 0.6 + (1 - life) * 0.6)
  })
  if (!marker) return null
  const [x, y, z] = marker.pos
  // 触觉反馈的目标圆圈须高于抬起 0.03 的悬停顶板，避免点击时被顶板盖住。
  return (
    <mesh
      ref={ref}
      position={[x, surfaceY(y) + (sim ? 0.05 : 0.01), z]}
      rotation={[-Math.PI / 2, 0, 0]}
      geometry={markerGeometry}
      material={fill}
    >
      {sim && marker.ok && <mesh geometry={markerGeometry} material={outline} scale={1.18} position={[0, 0, -0.002]} />}
    </mesh>
  )
}
