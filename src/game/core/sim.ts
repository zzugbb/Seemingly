import type { Axis, LevelDef, Vec3 } from '../levels/types'
import { cellId, segmentHeading, segmentPoint, surfaceY, type Tile } from './iso'
import {
  applyAction,
  gatesOf,
  initialState,
  patrolTilesOf,
  tilesOf,
  type Action,
  type GameState,
  type Transition,
} from './rules'

const WALK_SPEED = 2.6
const ROTATOR_DURATION = 0.9
const MOVER_CELL_DURATION = 0.45
const MAX_DT = 1 / 30
const ORB_HEIGHT = 0.35
const PUSH_DURATION = 0.35
const GATE_DURATION = 0.4
const PATROL_DURATION = 0.3

const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)

const axisOffset = (axis: Axis, amount: number): Vec3 =>
  axis === 'x' ? [amount + 0, 0, 0] : axis === 'y' ? [0, amount + 0, 0] : [0, 0, amount + 0]

export type Command = Action
export type CommandResult =
  'ok' | 'busy' | 'unreachable' | 'no-handle' | 'unknown-target' | 'handle-used-up' | 'cannot-push'

export type SimEvent =
  | { type: 'walk-start'; route: string[] }
  | { type: 'step'; tileId: string }
  | { type: 'orb'; id: string }
  | { type: 'goal-locked'; missing: number }
  | { type: 'mechanism-start'; id: string }
  | { type: 'mechanism-tick'; id: string }
  | { type: 'mechanism-end'; id: string }
  | { type: 'plate'; id: string; triggered: boolean }
  | { type: 'push'; crate: string }
  | { type: 'gate'; id: string; open: boolean }
  | { type: 'patrol-move'; patrol: string }
  | { type: 'undo' }
  | { type: 'won' }

interface MotionTime {
  id: string
  elapsed: number
  duration: number
  ticks: number
  done: boolean
}

type Motion = MotionTime &
  (
    | { type: 'rotator'; fromStep: number; delta: number }
    | { type: 'mover'; fromValue: number; toValue: number; cells: number }
  )

interface Segment {
  from: Vec3
  to: Vec3
  toId: string
  t: number
}

interface Snapshot {
  state: GameState
  heading: number
  patrolHeadings: Record<string, number>
}

interface GateMotion {
  from: number
  to: number
  elapsed: number
}
interface PushMotion {
  crate: string
  from: Vec3
  to: Vec3
  playerFrom: Vec3
  elapsed: number
  started: boolean
}

export class LevelSim {
  readonly level: LevelDef
  private current: GameState
  private pending: Transition | null = null
  private history: Snapshot[] = []
  private queuedEvents: SimEvent[] = []
  private motions = new Map<string, Motion>()
  private walkState: GameState | null = null
  private previousWalkState: GameState | null = null
  private displayAt: string
  private route: string[] = []
  private announceRoute = false
  private segment: Segment | null = null
  private heading = 0
  private shownOrbs: Set<string>
  private readonly orbTiles: Map<string, string>
  private phase: 'action' | 'mechanisms' | 'held-gates' | 'patrols' | 'final-gates' = 'action'
  private pushMotion: PushMotion | null = null
  private shownGates: Record<string, boolean>
  private gateMotions = new Map<string, GateMotion>()
  private shownPatrols: Record<string, string>
  private patrolHeadings: Record<string, number> = {}
  private patrolQueue: string[] = []
  private patrolMotion: { id: string; from: Vec3; to: Vec3; elapsed: number; moving: boolean } | null = null

  constructor(level: LevelDef) {
    this.level = level
    this.current = initialState(level)
    this.shownGates = gatesOf(level, this.current)
    this.displayAt = this.current.at
    this.shownPatrols = patrolTilesOf(this.level, this.current)
    this.shownOrbs = new Set(this.current.orbs)
    const tiles = this.tiles()
    level.patrols?.forEach((patrol, index) => {
      const from = tiles.get(this.shownPatrols[`patrol-${index}`])
      const ref = patrol.route[1]
      const to = ref && tiles.get('tile' in ref ? cellId(ref.tile) : `${ref.mechanism}#${ref.block}`)
      this.patrolHeadings[`patrol-${index}`] = from && to ? segmentHeading(from.pos, to.pos) : 0
    })
    this.orbTiles = new Map(
      level.orbs.map((orb, index) => [
        `orb-${index}`,
        'tile' in orb ? cellId(orb.tile) : `${orb.mechanism}#${orb.block}`,
      ]),
    )
  }

  get status(): 'playing' | 'won' {
    return this.current.won ? 'won' : 'playing'
  }

  state(): Readonly<GameState> {
    return this.current
  }

  isIdle(): boolean {
    return this.pending === null
  }

  steps(): number {
    return this.history.length
  }

  canUndo(): boolean {
    return this.history.length > 0 && (!this.pending || this.walkState !== null)
  }

  undo(): boolean {
    if (!this.canUndo()) return false
    const snapshot = this.history.pop()!
    this.current = snapshot.state
    this.heading = snapshot.heading
    this.patrolHeadings = { ...snapshot.patrolHeadings }
    this.patrolQueue = []
    this.patrolMotion = null
    this.displayAt = this.current.at
    this.shownPatrols = patrolTilesOf(this.level, this.current)
    this.shownOrbs = new Set(this.current.orbs)
    this.pending = null
    this.walkState = null
    this.previousWalkState = null
    this.route = []
    this.segment = null
    this.announceRoute = false
    this.motions.clear()
    this.pushMotion = null
    this.gateMotions.clear()
    this.shownGates = gatesOf(this.level, this.current)
    this.queuedEvents = [{ type: 'undo' }]
    return true
  }

  command(cmd: Command): CommandResult {
    if (this.current.won) return 'busy'
    if (this.pending) {
      if (cmd.type === 'walk' && this.walkState) return this.redirectWalk(cmd.tileId)
      return 'busy'
    }
    const transition = applyAction(this.level, this.current, cmd)
    if (!transition) {
      if (cmd.type === 'walk') return 'unreachable'
      if (cmd.type === 'push') return this.current.crates[cmd.crate] === undefined ? 'unknown-target' : 'cannot-push'
      const mechanism = this.level.mechanisms.find((item) => item.id === cmd.mechanism)
      if (!mechanism || mechanism.type === 'plate') return 'unknown-target'
      if (!mechanism.handle || (mechanism.type === 'gate' && mechanism.mode === 'hold')) return 'no-handle'
      return 'handle-used-up'
    }
    this.history.push({ state: this.current, heading: this.heading, patrolHeadings: { ...this.patrolHeadings } })
    this.pending = transition
    this.phase = 'action'
    if (cmd.type === 'walk') {
      this.walkState = this.current
      this.previousWalkState = null
      this.route = [...transition.route]
      this.announceRoute = true
    } else if (transition.pushed) {
      const tiles = this.tiles()
      this.pushMotion = {
        crate: transition.pushed.crate,
        from: tiles.get(transition.pushed.from)!.pos,
        to: tiles.get(transition.pushed.to)!.pos,
        playerFrom: tiles.get(this.current.at)!.pos,
        elapsed: 0,
        started: false,
      }
      this.heading = segmentHeading(this.pushMotion.playerFrom, this.pushMotion.from)
    }
    return 'ok'
  }

  update(dt: number): SimEvent[] {
    const events = this.queuedEvents
    this.queuedEvents = []
    if (!this.pending) return events
    const capped = Math.min(Math.max(dt, 0), MAX_DT)
    if (this.walkState) this.stepWalk(capped, events)
    else if (this.pushMotion) this.stepPush(capped, events)
    else {
      if (this.phase === 'action') this.startMotions(events)
      this.stepMotions(capped, events)
      this.stepGates(capped)
      if (this.phase === 'patrols') this.stepPatrols(capped, events)
    }
    this.advancePhase(events)
    return events
  }

  tiles(): Map<string, Tile> {
    return tilesOf(this.level, this.current)
  }

  tileAt(pos: Vec3): Tile | undefined {
    return [...this.tiles().values()].find((tile) => cellId(tile.pos) === cellId(pos))
  }

  characterPose(): { position: Vec3; heading: number; walking: boolean; pushing?: boolean } {
    if (this.pushMotion)
      return {
        position: segmentPoint(
          this.pushMotion.playerFrom,
          this.pushMotion.from,
          Math.min(1, this.pushMotion.elapsed / PUSH_DURATION),
        ),
        heading: this.heading,
        walking: true,
        pushing: true,
      }
    if (this.segment)
      return {
        position: segmentPoint(this.segment.from, this.segment.to, this.segment.t),
        heading: this.heading,
        walking: true,
      }
    const pos = this.tilePosition(this.displayAt)
    const motion = [...this.motions.values()].find((item) => this.displayAt.startsWith(`${item.id}#`))
    const rotation = motion?.type === 'rotator' ? motion.delta * (Math.PI / 2) * this.motionProgress(motion) : 0
    return {
      position: [pos[0], surfaceY(pos[1]), pos[2]],
      heading: this.heading + rotation,
      walking: this.walkState !== null && this.route.length > 0,
    }
  }

  mechanismPose(id: string): { rotationY: number } | { offset: Vec3 } {
    const mechanism = this.level.mechanisms.find((item) => item.id === id)
    const motion = this.motions.get(id)
    if (mechanism?.type === 'rotator') {
      const step =
        motion?.type === 'rotator'
          ? motion.fromStep + motion.delta * this.motionProgress(motion)
          : this.current.rotator[id]
      return { rotationY: step * (Math.PI / 2) + 0 }
    }
    if (mechanism?.type === 'mover') {
      const value =
        motion?.type === 'mover'
          ? motion.fromValue + (motion.toValue - motion.fromValue) * this.motionProgress(motion)
          : mechanism.stops[this.current.mover[id].stopIndex]
      return { offset: axisOffset(mechanism.axis, value) }
    }
    throw new Error(`未知机关 ${id}`)
  }

  orbProgress(): { required: number; requiredCollected: number; total: number; collected: number } {
    const required = this.level.orbs.flatMap((orb, index) => (orb.optional ? [] : [`orb-${index}`]))
    return {
      required: required.length,
      requiredCollected: required.filter((id) => this.shownOrbs.has(id)).length,
      total: this.level.orbs.length,
      collected: this.shownOrbs.size,
    }
  }

  orbPose(id: string): { position: Vec3; collected: boolean } {
    const tile = this.orbTiles.get(id)
    if (!tile) throw new Error(`未知光点 ${id}`)
    const [x, y, z] = this.tilePosition(tile)
    return { position: [x, surfaceY(y) + ORB_HEIGHT, z], collected: this.shownOrbs.has(id) }
  }

  cratePose(id: string): { position: Vec3 } {
    if (this.pushMotion?.crate === id)
      return {
        position: segmentPoint(
          this.pushMotion.from,
          this.pushMotion.to,
          Math.min(1, this.pushMotion.elapsed / PUSH_DURATION),
        ),
      }
    const at = this.pending && this.phase !== 'action' ? this.pending.state.crates[id] : this.current.crates[id]
    if (!at) throw new Error(`未知积木箱 ${id}`)
    const [x, y, z] = this.tilePosition(at)
    return { position: [x, surfaceY(y), z] }
  }

  patrolPose(id: string): { position: Vec3; heading: number; hop: number } {
    const at = this.shownPatrols[id]
    if (!at) throw new Error(`未知巡逻者 ${id}`)
    const motion = this.patrolMotion?.id === id ? this.patrolMotion : null
    if (motion) {
      const t = Math.min(1, motion.elapsed / PATROL_DURATION)
      const position = motion.moving
        ? segmentPoint(motion.from, motion.to, t)
        : ([motion.from[0], surfaceY(motion.from[1]), motion.from[2]] as Vec3)
      return { position, heading: this.patrolHeadings[id], hop: Math.sin(Math.PI * t) * (motion.moving ? 0.09 : 0.035) }
    }
    const [x, y, z] = this.tilePosition(at)
    const carrier = this.motions.get(at.split('#')[0])
    const riding = this.phase !== 'patrols' && this.phase !== 'final-gates'
    const rotation =
      riding && carrier?.type === 'rotator' ? ((carrier.delta * Math.PI) / 2) * this.motionProgress(carrier) : 0
    return { position: [x, surfaceY(y), z], heading: this.patrolHeadings[id] + rotation, hop: 0 }
  }

  gatePose(id: string): { open: number } {
    const motion = this.gateMotions.get(id)
    if (motion)
      return { open: motion.from + (motion.to - motion.from) * easeInOut(Math.min(1, motion.elapsed / GATE_DURATION)) }
    if (!(id in this.shownGates)) throw new Error(`未知开关门 ${id}`)
    return { open: this.shownGates[id] ? 1 : 0 }
  }

  platePose(id: string): { pressed: boolean; spent: boolean } {
    const plate = this.level.mechanisms.find((item) => item.id === id)
    if (plate?.type !== 'plate') throw new Error(`未知压板 ${id}`)
    const at = cellId(plate.tile)
    const shown = this.pending && this.phase !== 'action' ? this.pending.state : this.current
    const player = !this.characterPose().walking && this.displayAt === at
    const crate =
      plate.mode === 'hold' &&
      Object.entries(shown.crates).some(([id, tile]) => tile === at && this.pushMotion?.crate !== id)
    const patrol =
      plate.mode === 'hold' &&
      Object.entries(this.shownPatrols).some(
        ([id, tile]) => tile === at && !(this.patrolMotion?.id === id && this.patrolMotion.moving),
      )
    return { pressed: player || crate || patrol, spent: shown.spentPlates.includes(id) }
  }

  private tilePosition(id: string): Vec3 {
    const motion = [...this.motions.values()].find((item) => id.startsWith(`${item.id}#`))
    if (motion) {
      const mechanism = this.level.mechanisms.find((item) => item.id === motion.id)!
      if (mechanism.type === 'rotator' || mechanism.type === 'mover') {
        const block = mechanism.blocks[Number(id.slice(motion.id.length + 1))]
        const pose = this.mechanismPose(motion.id)
        if ('rotationY' in pose && mechanism.type === 'rotator') {
          const [x, y, z] = block.offset
          const cos = Math.cos(pose.rotationY),
            sin = Math.sin(pose.rotationY)
          return [
            mechanism.pivot[0] + x * cos + z * sin,
            mechanism.pivot[1] + y,
            mechanism.pivot[2] - x * sin + z * cos,
          ]
        }
        if ('offset' in pose && mechanism.type === 'mover') {
          return mechanism.origin.map((value, axis) => value + block.offset[axis] + pose.offset[axis]) as Vec3
        }
      }
    }
    const tile = this.tiles().get(id)
    if (!tile) throw new Error(`未知路面 ${id}`)
    return tile.pos
  }

  private arrivedState(base: GameState, tileId: string): GameState {
    // 规则层已决定收集结果；这里仅按动画到达的格子分配展示时机。
    const reached = this.pending!.state.orbs.filter((id) => this.orbTiles.get(id) === tileId)
    return { ...base, at: tileId, orbs: [...new Set([...base.orbs, ...reached])].sort() }
  }

  private redirectWalk(tileId: string): CommandResult {
    const walkState = this.walkState!
    let transition: Transition | null
    if (this.segment) {
      const origin = tileId === this.segment.toId ? walkState : this.arrivedState(walkState, this.segment.toId)
      transition = applyAction(this.level, origin, { type: 'walk', tileId })
    } else if (tileId === walkState.at && this.previousWalkState) {
      transition = applyAction(this.level, this.previousWalkState, { type: 'walk', tileId })
    } else {
      transition = applyAction(this.level, walkState, { type: 'walk', tileId })
    }
    if (!transition) return 'unreachable'
    this.pending = transition
    this.route =
      this.segment?.toId === tileId || (!this.segment && tileId === walkState.at) ? [] : [...transition.route]
    this.announceRoute = true
    return 'ok'
  }

  private stepWalk(dt: number, events: SimEvent[]) {
    if (!this.segment && this.route.length > 0) {
      if (this.announceRoute) {
        events.push({ type: 'walk-start', route: [...this.route] })
        this.announceRoute = false
      }
      const next = this.route.shift()!
      this.animateGates(gatesOf(this.level, { ...this.walkState!, at: next }, true), events)
      const from = this.tiles().get(this.displayAt)!.pos
      const to = this.tiles().get(next)!.pos
      this.segment = { from, to, toId: next, t: 0 }
      this.heading = segmentHeading(from, to)
    }
    const segment = this.segment
    this.stepGates(dt)
    if (!segment) {
      this.finishWalk(events)
      return
    }
    segment.t = Math.min(1, segment.t + dt * WALK_SPEED)
    if (segment.t < 1) return
    this.previousWalkState = this.walkState
    this.walkState = this.arrivedState(this.walkState!, segment.toId)
    this.displayAt = segment.toId
    this.segment = null
    events.push({ type: 'step', tileId: this.displayAt })
    for (const id of this.walkState.orbs) {
      if (this.shownOrbs.has(id)) continue
      this.shownOrbs.add(id)
      events.push({ type: 'orb', id })
    }
    if (this.route.length === 0) this.finishWalk(events)
  }

  private finishWalk(events: SimEvent[]) {
    const transition = this.pending!
    if (transition.plate) events.push({ type: 'plate', id: transition.plate, triggered: true })
    this.walkState = null
    this.previousWalkState = null
    this.startMotions(events)
  }

  private stepPush(dt: number, events: SimEvent[]) {
    const motion = this.pushMotion!
    if (!motion.started) {
      motion.started = true
      events.push({ type: 'push', crate: motion.crate })
      this.animateGates(gatesOf(this.level, { ...this.current, at: this.pending!.pushed!.from }, true), events)
    }
    this.stepGates(dt)
    motion.elapsed += dt
    if (motion.elapsed + 1e-8 < PUSH_DURATION) return
    this.displayAt = this.pending!.state.at
    events.push({ type: 'step', tileId: this.displayAt })
    for (const id of this.pending!.collected) {
      this.shownOrbs.add(id)
      events.push({ type: 'orb', id })
    }
    this.pushMotion = null
    this.startMotions(events)
  }

  private startMotions(events: SimEvent[]) {
    this.phase = 'mechanisms'
    const next = this.pending!.state
    for (const id of this.pending!.moved) {
      const mechanism = this.level.mechanisms.find((item) => item.id === id)!
      const timing: MotionTime = { id, elapsed: 0, duration: 0, ticks: 0, done: false }
      if (mechanism.type === 'rotator') {
        const fromStep = this.current.rotator[id]
        const delta = (next.rotator[id] - fromStep + 4) % 4 === 3 ? -1 : 1
        this.motions.set(id, { ...timing, type: 'rotator', fromStep, delta, duration: ROTATOR_DURATION })
      } else if (mechanism.type === 'mover') {
        const fromValue = mechanism.stops[this.current.mover[id].stopIndex]
        const toValue = mechanism.stops[next.mover[id].stopIndex]
        const cells = Math.abs(toValue - fromValue)
        this.motions.set(id, {
          ...timing,
          type: 'mover',
          fromValue,
          toValue,
          cells,
          duration: cells * MOVER_CELL_DURATION,
        })
      } else if (mechanism.type === 'gate') {
        if (mechanism.mode === 'toggle') this.animateGates({ [id]: next.gates[id] }, events)
        continue
      }
      events.push({ type: 'mechanism-start', id })
    }
  }

  private stepMotions(dt: number, events: SimEvent[]) {
    for (const motion of this.motions.values()) {
      if (motion.done) continue
      motion.elapsed += dt
      const cells = motion.type === 'rotator' ? 1 : motion.cells
      const done = motion.elapsed + 1e-8 >= motion.duration
      const whole = done ? cells : Math.floor((motion.elapsed / motion.duration) * cells + 1e-8)
      while (motion.ticks < whole) {
        motion.ticks++
        events.push({ type: 'mechanism-tick', id: motion.id })
      }
      if (done) {
        motion.done = true
        events.push({ type: 'mechanism-end', id: motion.id })
      }
    }
  }

  private animateGates(targets: Record<string, boolean>, events: SimEvent[]) {
    for (const [id, open] of Object.entries(targets)) {
      const to = open ? 1 : 0
      const from = this.gatePose(id).open
      const active = this.gateMotions.get(id)
      if (active?.to === to) continue
      if (from === to) {
        if (active) {
          this.gateMotions.delete(id)
          this.shownGates[id] = open
          events.push({ type: 'gate', id, open })
        }
        continue
      }
      this.gateMotions.set(id, { from, to, elapsed: 0 })
      events.push({ type: 'gate', id, open })
    }
  }

  private stepGates(dt: number) {
    for (const [id, motion] of this.gateMotions) {
      motion.elapsed += dt
      if (motion.elapsed + 1e-8 < GATE_DURATION) continue
      this.shownGates[id] = motion.to === 1
      this.gateMotions.delete(id)
    }
  }

  private advancePhase(events: SimEvent[]) {
    if (
      !this.pending ||
      this.phase === 'action' ||
      this.gateMotions.size > 0 ||
      [...this.motions.values()].some((motion) => !motion.done)
    )
      return
    if (this.phase === 'mechanisms') {
      this.phase = 'held-gates'
      this.animateGates(gatesOf(this.level, { ...this.pending.state, patrols: this.current.patrols }), events)
      if (this.gateMotions.size > 0) return
    }
    if (this.phase === 'held-gates') {
      this.phase = 'patrols'
      for (const [id, at] of Object.entries(this.shownPatrols)) {
        const carrier = this.motions.get(at.split('#')[0])
        if (carrier?.type === 'rotator') this.patrolHeadings[id] += (carrier.delta * Math.PI) / 2
      }
      this.patrolQueue = (this.level.patrols ?? []).map((_, index) => `patrol-${index}`)
      this.startPatrol(events)
    }
    if (this.phase === 'patrols') {
      if (this.patrolMotion) return
      this.phase = 'final-gates'
      this.animateGates(gatesOf(this.level, this.pending.state), events)
      if (this.gateMotions.size > 0) return
    }
    this.commit(events)
  }

  private startPatrol(events: SimEvent[]) {
    const id = this.patrolQueue.shift()
    if (!id) return
    const move = this.pending!.patrolMoves.find((move) => move.patrol === id)
    const from = this.tilePosition(this.shownPatrols[id])
    const to = move ? this.tilePosition(move.to) : from
    this.patrolMotion = { id, from, to, elapsed: 0, moving: !!move }
    if (move) {
      this.patrolHeadings[id] = segmentHeading(from, to)
      events.push({ type: 'patrol-move', patrol: id })
    }
  }

  private stepPatrols(dt: number, events: SimEvent[]) {
    const motion = this.patrolMotion
    if (!motion) return
    motion.elapsed += dt
    if (motion.elapsed + 1e-8 < PATROL_DURATION) return
    this.shownPatrols[motion.id] = patrolTilesOf(this.level, this.pending!.state)[motion.id]
    this.patrolMotion = null
    this.startPatrol(events)
  }

  private commit(events: SimEvent[]) {
    const result = this.pending!
    const carrier = [...this.motions.values()].find((motion) => result.state.at.startsWith(`${motion.id}#`))
    if (carrier?.type === 'rotator') this.heading += carrier.delta * (Math.PI / 2)
    this.current = result.state
    this.displayAt = this.current.at
    this.shownPatrols = patrolTilesOf(this.level, this.current)
    this.shownOrbs = new Set(this.current.orbs)
    this.shownGates = gatesOf(this.level, this.current)
    this.pending = null
    this.motions.clear()
    if (result.goalLocked > 0) events.push({ type: 'goal-locked', missing: result.goalLocked })
    if (this.current.won) events.push({ type: 'won' })
  }

  private motionProgress(motion: Motion): number {
    return easeInOut(motion.duration <= 0 ? 1 : Math.min(1, motion.elapsed / motion.duration))
  }
}
