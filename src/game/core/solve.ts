import type { LevelDef, Vec3 } from '../levels/types'
import { cellId } from './iso'
import { moverBlocks, rotatorBlocks, type MoverCursor } from './mechanisms'
import { applyAction, type GameState, type Action } from './rules'
import { LevelSim, type CommandResult } from './sim'

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

const settle = (sim: LevelSim): boolean => {
  for (let frame = 0; frame < MAX_FRAMES && !sim.isIdle(); frame++) sim.update(1 / 30)
  return sim.isIdle()
}

const gearOf = (state: Readonly<GameState>): Gear => ({
  rotator: new Map(Object.entries(state.rotator)),
  mover: new Map(Object.entries(state.mover)),
})

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

export function runSolution(level: LevelDef): SolutionRun {
  const sim = new LevelSim(level)
  const walks: SolutionWalk[] = []
  const layouts: Vec3[][] = [placedBlocks(level, gearOf(sim.state()))]

  for (let index = 0; index < level.solution.length; index++) {
    const step = level.solution[index]
    if (!step) continue
    const tile = step.type === 'walk' ? sim.tileAt(step.to) : undefined
    const cell = step.type === 'walk' ? cellId(step.to) : step.type === 'push' ? step.crate : step.mechanism
    if (step.type === 'walk' && !tile) return { ok: false, failedStep: index, result: 'no-tile', cell, walks, layouts }
    const command: Action = step.type === 'walk' ? { type: 'walk', tileId: tile!.id } : step
    const state = sim.state()
    const transition = applyAction(level, state, command)
    const result = sim.command(command)
    if (result !== 'ok') return { ok: false, failedStep: index, result, cell, walks, layouts }
    if (transition!.route.length > 0) {
      const tiles = sim.tiles()
      const blocks = placedBlocks(level, gearOf(state))
      walks.push({
        positions: [tiles.get(state.at)!.pos, ...transition!.route.map((id) => tiles.get(id)!.pos)],
        blocks,
      })
      if (transition!.pushed)
        walks.push({
          positions: [tiles.get(transition!.pushed.from)!.pos, tiles.get(transition!.pushed.to)!.pos],
          blocks,
        })
    }
    if (!settle(sim)) return { ok: false, failedStep: index, result: 'stuck', cell, walks, layouts }
    layouts.push(placedBlocks(level, gearOf(sim.state())))
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
