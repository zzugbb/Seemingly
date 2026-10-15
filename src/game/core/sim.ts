import type { Axis, LevelDef, MoverDef, PlateDef, RotatorDef, Vec3 } from '../levels/types'
import { buildGraph, cellId, findPath, segmentHeading, segmentPoint, surfaceY, type Tile } from './iso'
import { advanceMover, judgePlate, moverBlocks, moverCursor, rotatorBlocks, type MoverCursor } from './mechanisms'

const WALK_SPEED = 2.6
const ROTATOR_DURATION = 0.9
const MOVER_CELL_DURATION = 0.45
const MAX_DT = 1 / 30

const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)

const sameVec = (a: Vec3, b: Vec3) => a[0] + 0 === b[0] + 0 && a[1] + 0 === b[1] + 0 && a[2] + 0 === b[2] + 0

const axisOffset = (axis: Axis, amount: number): Vec3 => {
  const offset: Vec3 = axis === 'x' ? [amount, 0, 0] : axis === 'y' ? [0, amount, 0] : [0, 0, amount]
  return [offset[0] + 0, offset[1] + 0, offset[2] + 0]
}

export type Command = { type: 'walk'; tileId: string } | { type: 'operate'; mechanism: string }

export type CommandResult = 'ok' | 'busy' | 'unreachable' | 'standing-on-mechanism' | 'unknown-target'

export type SimEvent =
  | { type: 'walk-start'; route: string[] }
  | { type: 'step'; tileId: string }
  | { type: 'mechanism-start'; id: string }
  | { type: 'mechanism-tick'; id: string }
  | { type: 'mechanism-end'; id: string }
  | { type: 'plate'; id: string; triggered: boolean }
  | { type: 'won' }

type RotatorMotion = {
  type: 'rotator'
  id: string
  fromStep: number
  elapsed: number
  duration: number
  ticks: number
}

type MoverMotion = {
  type: 'mover'
  id: string
  fromValue: number
  toValue: number
  cells: number
  elapsed: number
  duration: number
  ticks: number
  next: MoverCursor
}

type Motion = RotatorMotion | MoverMotion

interface Segment {
  from: Vec3
  to: Vec3
  toId: string
  t: number
}

export class LevelSim {
  readonly level: LevelDef
  private phase: 'playing' | 'won' = 'playing'
  private at: string
  private route: string[] = []
  private routeEpoch = 0
  private announcedEpoch = -1
  private segment: Segment | null = null
  private heading = 0
  private queuedOperate: string | null = null
  private motion: Motion | null = null
  private readonly rotatorStep = new Map<string, number>()
  private readonly moverState = new Map<string, MoverCursor>()
  private readonly spentPlates = new Set<string>()

  constructor(level: LevelDef) {
    this.level = level
    this.at = cellId(level.start)
    for (const mechanism of level.mechanisms) {
      if (mechanism.type === 'rotator') this.rotatorStep.set(mechanism.id, mechanism.initialStep ?? 0)
      if (mechanism.type === 'mover') this.moverState.set(mechanism.id, moverCursor(mechanism))
    }
  }

  get status(): 'playing' | 'won' {
    return this.phase
  }

  isIdle(): boolean {
    return !this.segment && this.route.length === 0 && !this.queuedOperate && !this.motion
  }

  command(cmd: Command): CommandResult {
    if (this.phase === 'won') return 'busy'
    if (cmd.type === 'walk') return this.commandWalk(cmd.tileId)
    return this.commandOperate(cmd.mechanism)
  }

  update(dt: number): SimEvent[] {
    const capped = Math.min(Math.max(dt, 0), MAX_DT)
    const events: SimEvent[] = []
    const queuedAtStart = this.queuedOperate
    this.stepWalk(capped, events)
    if (this.queuedOperate && this.queuedOperate !== queuedAtStart) {
      this.startMotion(this.queuedOperate, events)
      this.queuedOperate = null
    } else {
      this.stepMotion(capped, events)
    }
    return events
  }

  tiles(): Map<string, Tile> {
    const map = new Map<string, Tile>()
    for (const block of this.level.blocks) {
      if (block.kind !== 'path') continue
      const id = cellId(block.pos)
      map.set(id, { id, pos: block.pos })
    }
    for (const mechanism of this.level.mechanisms) {
      if (mechanism.type === 'rotator') {
        for (const block of rotatorBlocks(mechanism, this.rotatorStep.get(mechanism.id) ?? 0)) {
          if (block.kind !== 'path') continue
          map.set(block.id, { id: block.id, pos: block.pos })
        }
      } else if (mechanism.type === 'mover') {
        const stopIndex = this.moverState.get(mechanism.id)?.stopIndex ?? 0
        for (const block of moverBlocks(mechanism, stopIndex)) {
          if (block.kind !== 'path') continue
          map.set(block.id, { id: block.id, pos: block.pos })
        }
      }
    }
    return map
  }

  tileAt(pos: Vec3): Tile | undefined {
    for (const tile of this.tiles().values()) {
      if (sameVec(tile.pos, pos)) return tile
    }
    return undefined
  }

  characterPose(): { position: Vec3; heading: number; walking: boolean } {
    if (this.segment) {
      return {
        position: segmentPoint(this.segment.from, this.segment.to, this.segment.t),
        heading: this.heading,
        walking: true,
      }
    }
    const pos = this.tiles().get(this.at)?.pos ?? this.level.start
    return {
      position: [pos[0], surfaceY(pos[1]), pos[2]],
      heading: this.heading,
      walking: this.route.length > 0,
    }
  }

  mechanismPose(id: string): { rotationY: number } | { offset: Vec3 } {
    const rotator = this.rotators().find((mechanism) => mechanism.id === id)
    if (rotator) {
      const step = this.rotatorStep.get(id) ?? 0
      const motion = this.motion?.type === 'rotator' && this.motion.id === id ? this.motion : null
      const eased = motion ? easeInOut(this.motionProgress(motion)) : 0
      const angle = (motion ? motion.fromStep + eased : step) * (Math.PI / 2)
      return { rotationY: angle + 0 }
    }
    const mover = this.movers().find((mechanism) => mechanism.id === id)
    if (!mover) throw new Error(`未知机关 ${id}`)
    const cursor = this.moverState.get(id) ?? moverCursor(mover)
    const motion = this.motion?.type === 'mover' && this.motion.id === id ? this.motion : null
    const settled = mover.stops[cursor.stopIndex] ?? 0
    const value = motion
      ? motion.fromValue + (motion.toValue - motion.fromValue) * easeInOut(this.motionProgress(motion))
      : settled
    return { offset: axisOffset(mover.axis, value) }
  }

  private commandWalk(tileId: string): CommandResult {
    if (this.motion || this.queuedOperate) return 'busy'
    const origin = this.segment?.toId ?? this.at
    if (origin === tileId) {
      this.route = []
      return 'ok'
    }
    const path = findPath(buildGraph([...this.tiles().values()], this.occupied()), origin, tileId)
    if (!path) return 'unreachable'
    this.route = path
    this.routeEpoch += 1
    return 'ok'
  }

  private commandOperate(id: string): CommandResult {
    if (this.segment || this.route.length > 0 || this.motion || this.queuedOperate) return 'busy'
    const mechanism = this.level.mechanisms.find((item) => item.id === id)
    if (!mechanism || mechanism.type === 'plate') return 'unknown-target'
    if (this.at.startsWith(`${id}#`)) return 'standing-on-mechanism'
    this.queuedOperate = id
    return 'ok'
  }

  private stepWalk(dt: number, events: SimEvent[]) {
    if (this.motion || this.queuedOperate) return
    if (!this.segment && this.route.length > 0) {
      const full = [...this.route]
      const next = this.route.shift()
      const fromTile = this.tiles().get(this.at)
      const toTile = next ? this.tiles().get(next) : undefined
      if (!next || !fromTile || !toTile) {
        this.route = []
        return
      }
      this.segment = { from: fromTile.pos, to: toTile.pos, toId: next, t: 0 }
      this.heading = segmentHeading(fromTile.pos, toTile.pos)
      if (this.announcedEpoch !== this.routeEpoch) {
        events.push({ type: 'walk-start', route: full })
        this.announcedEpoch = this.routeEpoch
      }
    }
    if (!this.segment) return
    this.segment.t = Math.min(1, this.segment.t + dt * WALK_SPEED)
    if (this.segment.t < 1) return
    this.at = this.segment.toId
    this.segment = null
    events.push({ type: 'step', tileId: this.at })
    if (this.route.length > 0) return
    const tile = this.tiles().get(this.at)
    if (!tile) return
    if (sameVec(tile.pos, this.level.goal)) {
      this.phase = 'won'
      events.push({ type: 'won' })
      return
    }
    this.firePlates(tile.pos, events)
  }

  private firePlates(at: Vec3, events: SimEvent[]) {
    for (const plate of this.plates()) {
      if (!sameVec(plate.tile, at)) continue
      const verdict = judgePlate({
        plate,
        at,
        stopped: true,
        spent: this.spentPlates.has(plate.id),
        targetBusy: this.motion !== null || this.queuedOperate !== null,
        standingOnTarget: this.at.startsWith(`${plate.target}#`),
      })
      if (plate.once && verdict.spent) this.spentPlates.add(plate.id)
      events.push({ type: 'plate', id: plate.id, triggered: verdict.trigger })
      if (verdict.trigger) this.queuedOperate = plate.target
    }
  }

  private stepMotion(dt: number, events: SimEvent[]) {
    if (this.queuedOperate && !this.motion) {
      this.startMotion(this.queuedOperate, events)
      this.queuedOperate = null
    }
    const motion = this.motion
    if (!motion) return
    motion.elapsed += dt
    const cells = motion.type === 'rotator' ? 1 : motion.cells
    const done = motion.duration <= 0 || motion.elapsed + 1e-8 >= motion.duration
    const progressed = motion.duration <= 0 ? cells : Math.min(cells, (motion.elapsed / motion.duration) * cells)
    let whole = Math.floor(progressed + 1e-8)
    if (done) whole = cells
    while (motion.ticks < whole) {
      motion.ticks += 1
      events.push({ type: 'mechanism-tick', id: motion.id })
    }
    if (!done) return
    this.commitMotion(motion)
    this.motion = null
    events.push({ type: 'mechanism-end', id: motion.id })
  }

  private startMotion(id: string, events: SimEvent[]) {
    const rotator = this.rotators().find((mechanism) => mechanism.id === id)
    if (rotator) {
      this.motion = {
        type: 'rotator',
        id,
        fromStep: this.rotatorStep.get(id) ?? 0,
        elapsed: 0,
        duration: ROTATOR_DURATION,
        ticks: 0,
      }
      events.push({ type: 'mechanism-start', id })
      return
    }
    const mover = this.movers().find((mechanism) => mechanism.id === id)
    if (!mover) return
    const cursor = this.moverState.get(id) ?? moverCursor(mover)
    const next = advanceMover(mover, cursor)
    const fromValue = mover.stops[cursor.stopIndex] ?? 0
    const toValue = mover.stops[next.stopIndex] ?? 0
    const cells = Math.abs(toValue - fromValue)
    this.motion = {
      type: 'mover',
      id,
      fromValue,
      toValue,
      cells,
      elapsed: 0,
      duration: cells * MOVER_CELL_DURATION,
      ticks: 0,
      next,
    }
    events.push({ type: 'mechanism-start', id })
  }

  private commitMotion(motion: Motion) {
    if (motion.type === 'rotator') {
      this.rotatorStep.set(motion.id, motion.fromStep + 1)
      return
    }
    this.moverState.set(motion.id, motion.next)
  }

  private motionProgress(motion: Motion): number {
    if (motion.duration <= 0) return 1
    return Math.min(1, Math.max(0, motion.elapsed / motion.duration))
  }

  private occupied(): Set<string> {
    const cells = new Set<string>()
    for (const block of this.level.blocks) cells.add(cellId(block.pos))
    for (const mechanism of this.level.mechanisms) {
      if (mechanism.type === 'rotator') {
        for (const block of rotatorBlocks(mechanism, this.rotatorStep.get(mechanism.id) ?? 0)) {
          cells.add(cellId(block.pos))
        }
      } else if (mechanism.type === 'mover') {
        for (const block of moverBlocks(mechanism, this.moverState.get(mechanism.id)?.stopIndex ?? 0)) {
          cells.add(cellId(block.pos))
        }
      }
    }
    return cells
  }

  private rotators(): RotatorDef[] {
    return this.level.mechanisms.filter((mechanism): mechanism is RotatorDef => mechanism.type === 'rotator')
  }

  private movers(): MoverDef[] {
    return this.level.mechanisms.filter((mechanism): mechanism is MoverDef => mechanism.type === 'mover')
  }

  private plates(): PlateDef[] {
    return this.level.mechanisms.filter((mechanism): mechanism is PlateDef => mechanism.type === 'plate')
  }
}
