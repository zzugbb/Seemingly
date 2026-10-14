import type { LevelDef, Vec3 } from '../levels/types'
import { cellId } from './iso'
import { advanceMover, moverBlocks, moverCursor, rotatorBlocks, type MoverCursor } from './mechanisms'
import { LevelSim, type CommandResult, type SimEvent } from './sim'

const MAX_FRAMES = 800

export interface SolutionWalk {
  positions: Vec3[]
  blocks: Vec3[]
}

export interface SolutionRun {
  ok: boolean
  failedStep?: number
  result?: CommandResult | 'no-tile' | 'stuck' | 'not-won'
  cell?: string
  walks: SolutionWalk[]
  layouts: Vec3[][]
}

interface Gear {
  rotator: Map<string, number>
  mover: Map<string, MoverCursor>
}

const settle = (sim: LevelSim): { events: SimEvent[]; finished: boolean } => {
  const events: SimEvent[] = []
  for (let frame = 0; frame < MAX_FRAMES && !sim.isIdle(); frame++) events.push(...sim.update(1 / 30))
  return { events, finished: sim.isIdle() }
}

const createGear = (level: LevelDef): Gear => {
  const gear: Gear = { rotator: new Map(), mover: new Map() }
  for (const mechanism of level.mechanisms) {
    if (mechanism.type === 'rotator') gear.rotator.set(mechanism.id, mechanism.initialStep ?? 0)
    if (mechanism.type === 'mover') gear.mover.set(mechanism.id, moverCursor(mechanism))
  }
  return gear
}

export function placedBlocks(level: LevelDef, gear: Gear): Vec3[] {
  const positions = level.blocks.map((block) => block.pos)
  for (const mechanism of level.mechanisms) {
    if (mechanism.type === 'rotator') {
      for (const block of rotatorBlocks(mechanism, gear.rotator.get(mechanism.id) ?? mechanism.initialStep ?? 0)) {
        positions.push(block.pos)
      }
    } else if (mechanism.type === 'mover') {
      const stopIndex = gear.mover.get(mechanism.id)?.stopIndex ?? mechanism.initialStop ?? 0
      for (const block of moverBlocks(mechanism, stopIndex)) positions.push(block.pos)
    }
  }
  return positions
}

const applyEnds = (level: LevelDef, gear: Gear, events: SimEvent[]) => {
  for (const event of events) {
    if (event.type !== 'mechanism-end') continue
    const mechanism = level.mechanisms.find((item) => item.id === event.id)
    if (!mechanism) continue
    if (mechanism.type === 'rotator') {
      gear.rotator.set(mechanism.id, (gear.rotator.get(mechanism.id) ?? 0) + 1)
    } else if (mechanism.type === 'mover') {
      const cursor = gear.mover.get(mechanism.id) ?? moverCursor(mechanism)
      gear.mover.set(mechanism.id, advanceMover(mechanism, cursor))
    }
  }
}

export function runSolution(level: LevelDef): SolutionRun {
  const sim = new LevelSim(level)
  const gear = createGear(level)
  const walks: SolutionWalk[] = []
  const layouts: Vec3[][] = [placedBlocks(level, gear)]
  let at = level.start

  for (let index = 0; index < level.solution.length; index++) {
    const step = level.solution[index]
    if (!step) continue
    if (step.type === 'operate') {
      const result = sim.command({ type: 'operate', mechanism: step.mechanism })
      if (result !== 'ok') return { ok: false, failedStep: index, result, cell: step.mechanism, walks, layouts }
      const { events, finished } = settle(sim)
      if (!finished) return { ok: false, failedStep: index, result: 'stuck', cell: step.mechanism, walks, layouts }
      applyEnds(level, gear, events)
      layouts.push(placedBlocks(level, gear))
      continue
    }

    const tile = sim.tileAt(step.to)
    if (!tile) return { ok: false, failedStep: index, result: 'no-tile', cell: cellId(step.to), walks, layouts }
    const result = sim.command({ type: 'walk', tileId: tile.id })
    if (result !== 'ok') return { ok: false, failedStep: index, result, cell: cellId(step.to), walks, layouts }
    const preview = sim.update(0)
    const started = preview.find((event) => event.type === 'walk-start')
    const route = started?.type === 'walk-start' ? started.route : []
    const positions = [at, ...route.map((id) => sim.tiles().get(id)?.pos ?? step.to)]
    walks.push({ positions, blocks: placedBlocks(level, gear) })
    const { events, finished } = settle(sim)
    if (!finished) return { ok: false, failedStep: index, result: 'stuck', cell: cellId(step.to), walks, layouts }
    applyEnds(level, gear, [...preview, ...events])
    layouts.push(placedBlocks(level, gear))
    at = step.to
  }

  if (sim.status !== 'won') {
    return {
      ok: false,
      failedStep: Math.max(0, level.solution.length - 1),
      result: 'not-won',
      cell: cellId(level.goal),
      walks,
      layouts,
    }
  }
  return { ok: true, walks, layouts }
}
