import type { LevelDef, MoverDef, RotatorDef } from '../levels/types'
import { buildGraph, cellId, type Tile } from './iso'
import { advanceMover, moverBlocks, moverCursor, rotatorBlocks, type MoverCursor } from './mechanisms'

export interface GameState {
  at: string
  rotator: Record<string, number>
  mover: Record<string, MoverCursor>
  orbs: string[]
  spentPlates: string[]
  won: boolean
}

export type Action = { type: 'walk'; tileId: string } | { type: 'operate'; mechanism: string }

export interface Transition {
  state: GameState
  route: string[]
  collected: string[]
  moved: string[]
  plate: string | null
  goalLocked: number
}

type MovingMechanism = RotatorDef | MoverDef

const routeCache = new WeakMap<GameState, { level: LevelDef; key: string; routes: Map<string, string[]> }>()

function* blocksOf(level: LevelDef, state: GameState) {
  for (const block of level.blocks) yield { ...block, id: cellId(block.pos) }
  for (const mechanism of level.mechanisms) {
    if (mechanism.type === 'rotator') {
      yield* rotatorBlocks(mechanism, state.rotator[mechanism.id])
    } else if (mechanism.type === 'mover') {
      yield* moverBlocks(mechanism, state.mover[mechanism.id].stopIndex)
    }
  }
}

export function initialState(level: LevelDef): GameState {
  const state: GameState = {
    at: cellId(level.start),
    rotator: {},
    mover: {},
    orbs: [],
    spentPlates: [],
    won: false,
  }
  for (const mechanism of level.mechanisms) {
    if (mechanism.type === 'rotator') state.rotator[mechanism.id] = mechanism.initialStep ?? 0
    if (mechanism.type === 'mover') state.mover[mechanism.id] = moverCursor(mechanism)
  }
  for (const tile of tilesOf(level, state).values()) {
    if (cellId(tile.pos) === cellId(level.start)) {
      state.at = tile.id
      break
    }
  }
  return state
}

export function tilesOf(level: LevelDef, state: GameState): Map<string, Tile> {
  const tiles = new Map<string, Tile>()
  for (const block of blocksOf(level, state)) {
    if (block.kind === 'path') tiles.set(block.id, { id: block.id, pos: block.pos })
  }
  return tiles
}

export function occupiedOf(level: LevelDef, state: GameState): Set<string> {
  return new Set([...blocksOf(level, state)].map((block) => cellId(block.pos)))
}

function routesOf(level: LevelDef, state: GameState): Map<string, string[]> {
  const key = stateKey(state)
  const cached = routeCache.get(state)
  if (cached?.level === level && cached.key === key) return cached.routes
  const graph = buildGraph([...tilesOf(level, state).values()], occupiedOf(level, state))
  const routes = new Map<string, string[]>()
  routeCache.set(state, { level, key, routes })
  if (!graph.has(state.at)) return routes
  routes.set(state.at, [])
  const queue = [state.at]
  // 沿用 buildGraph 的邻居顺序，让等长路线的选择与 findPath 一致。
  for (let index = 0; index < queue.length; index++) {
    const current = queue[index]
    const route = routes.get(current)!
    for (const next of graph.get(current) ?? []) {
      if (routes.has(next)) continue
      routes.set(next, [...route, next])
      queue.push(next)
    }
  }
  return routes
}

export function reachableFrom(level: LevelDef, state: GameState): Map<string, string[]> {
  return new Map([...routesOf(level, state)].map(([id, route]) => [id, [...route]]))
}

export function legalActions(level: LevelDef, state: GameState): Action[] {
  if (state.won) return []
  const actions: Action[] = []
  for (const tileId of routesOf(level, state).keys()) {
    if (tileId !== state.at) actions.push({ type: 'walk', tileId })
  }
  for (const mechanism of level.mechanisms) {
    if (mechanism.type !== 'plate' && mechanism.handle) actions.push({ type: 'operate', mechanism: mechanism.id })
  }
  return actions
}

function moveMechanisms(level: LevelDef, state: GameState, source: MovingMechanism): string[] {
  const triggers = new Map<string, boolean>([[source.id, false]])
  for (const link of source.links ?? []) {
    if (!triggers.has(link.target)) triggers.set(link.target, link.reverse === true)
  }
  const moved: string[] = []
  for (const [id, reverse] of triggers) {
    const mechanism = level.mechanisms.find((item) => item.id === id)
    if (!mechanism || mechanism.type === 'plate') continue
    if (mechanism.type === 'rotator') {
      state.rotator[id] = (state.rotator[id] + (reverse ? 3 : 1)) % 4
    } else {
      state.mover[id] = advanceMover(mechanism, state.mover[id])
    }
    moved.push(id)
  }
  return moved
}

export function applyAction(level: LevelDef, state: GameState, action: Action): Transition | null {
  if (state.won) return null
  let route: string[] = []
  let operated: MovingMechanism | undefined
  if (action.type === 'walk') {
    if (action.tileId === state.at) return null
    const reachable = routesOf(level, state).get(action.tileId)
    if (!reachable) return null
    route = [...reachable]
  } else {
    operated = level.mechanisms.find(
      (item): item is MovingMechanism => item.id === action.mechanism && item.type !== 'plate',
    )
    if (!operated?.handle) return null
  }

  const next: GameState = {
    ...state,
    rotator: { ...state.rotator },
    mover: { ...state.mover },
    orbs: [...state.orbs],
    spentPlates: [...state.spentPlates],
  }
  const result: Transition = { state: next, route, collected: [], moved: [], plate: null, goalLocked: 0 }
  if (operated) {
    result.moved = moveMechanisms(level, next, operated)
    return result
  }

  const collected = new Set(state.orbs)
  for (const tileId of route) {
    level.orbs.forEach((orb, index) => {
      const id = `orb-${index}`
      const at = 'tile' in orb ? cellId(orb.tile) : `${orb.mechanism}#${orb.block}`
      if (at === tileId && !collected.has(id)) {
        collected.add(id)
        result.collected.push(id)
      }
    })
  }
  next.at = route[route.length - 1]
  next.orbs = [...collected].sort()
  const tile = tilesOf(level, next).get(next.at)!
  if (cellId(tile.pos) === cellId(level.goal)) {
    result.goalLocked = level.orbs.filter((orb, index) => !orb.optional && !collected.has(`orb-${index}`)).length
    next.won = result.goalLocked === 0
    return result
  }

  const plate = level.mechanisms.find((item) => item.type === 'plate' && cellId(item.tile) === next.at)
  if (plate?.type === 'plate' && !(plate.once && state.spentPlates.includes(plate.id))) {
    const target = level.mechanisms.find((item) => item.id === plate.target)
    if (target && target.type !== 'plate') {
      result.plate = plate.id
      result.moved = moveMechanisms(level, next, target)
      if (plate.once) next.spentPlates = [...next.spentPlates, plate.id].sort()
    }
  }
  return result
}

export function stateKey(state: GameState): string {
  const entries = <T>(record: Record<string, T>): [string, T][] =>
    Object.keys(record)
      .sort()
      .map((id) => [id, record[id]])
  return JSON.stringify([
    state.at,
    entries(state.rotator),
    entries(state.mover).map(([id, { stopIndex, direction }]) => [id, stopIndex, direction]),
    [...state.orbs].sort(),
    [...state.spentPlates].sort(),
    state.won,
  ])
}
