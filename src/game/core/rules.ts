import type { GateDef, LevelDef, MoverDef, RotatorDef, ScreenDir, TileRef, Vec3 } from '../levels/types'
import { buildGraph, cellId, screenKey, type Graph, type Tile } from './iso'
import { advanceMover, moverBlocks, moverCursor, rotatorBlocks, type MoverCursor } from './mechanisms'
import { rayHitsAny } from './visibility'

export interface GameState {
  at: string
  rotator: Record<string, number>
  mover: Record<string, MoverCursor>
  orbs: string[]
  spentPlates: string[]
  won: boolean
  gates: Record<string, boolean>
  handleUses: Record<string, number>
  crates: Record<string, string>
  patrols: Record<string, { index: number; direction: 1 | -1 }>
}

export type Action =
  { type: 'walk'; tileId: string } | { type: 'operate'; mechanism: string } | { type: 'push'; crate: string }

export interface Transition {
  state: GameState
  route: string[]
  collected: string[]
  moved: string[]
  plate: string | null
  goalLocked: number
  pushed: { crate: string; from: string; to: string } | null
  gatesChanged: string[]
  patrolMoves: { patrol: string; from: string; to: string }[]
}

type Operable = RotatorDef | MoverDef | GateDef
const routeCache = new WeakMap<GameState, { level: LevelDef; key: string; routes: Map<string, string[]> }>()
interface Geometry {
  tiles: Map<string, Tile>
  blocks: Vec3[]
  occupied: Set<string>
  oneWays: Map<string, ScreenDir>
  visible?: Set<string>
  enterable?: Set<string>
  graph?: Graph
}
const geometryCache = new WeakMap<LevelDef, Map<string, Geometry>>()

function geometryOf(level: LevelDef, state: GameState): Geometry {
  const key = JSON.stringify([state.rotator, Object.entries(state.mover).map(([id, cursor]) => [id, cursor.stopIndex])])
  let layouts = geometryCache.get(level)
  if (!layouts) geometryCache.set(level, (layouts = new Map()))
  const cached = layouts.get(key)
  if (cached) return cached
  const tiles = new Map<string, Tile>()
  const blocks: Vec3[] = []
  for (const block of blocksOf(level, state)) {
    blocks.push(block.pos)
    if (block.kind === 'path') tiles.set(block.id, { id: block.id, pos: block.pos })
  }
  const geometry: Geometry = {
    tiles,
    blocks,
    occupied: new Set(blocks.map(cellId)),
    oneWays: new Map(
      level.blocks.flatMap((block) => (block.oneWay ? [[cellId(block.pos), block.oneWay] as const] : [])),
    ),
  }
  layouts.set(key, geometry)
  if (layouts.size > 64) layouts.delete(layouts.keys().next().value!)
  return geometry
}

function visibleOf(geometry: Geometry): Set<string> {
  return (geometry.visible ??= visibleTiles(geometry.tiles, geometry.blocks))
}

function graphOf(geometry: Geometry): Graph {
  return (geometry.graph ??= buildGraph([...geometry.tiles.values()], geometry.occupied))
}

function enterableOf(geometry: Geometry): Set<string> {
  return (geometry.enterable ??= new Set([...graphOf(geometry).keys()].filter((id) => visibleOf(geometry).has(id))))
}

export const tileRefId = (ref: TileRef): string => ('tile' in ref ? cellId(ref.tile) : `${ref.mechanism}#${ref.block}`)

function* blocksOf(level: LevelDef, state: GameState) {
  for (const block of level.blocks) yield { ...block, id: cellId(block.pos) }
  for (const mechanism of level.mechanisms) {
    if (mechanism.type === 'rotator') yield* rotatorBlocks(mechanism, state.rotator[mechanism.id])
    else if (mechanism.type === 'mover') yield* moverBlocks(mechanism, state.mover[mechanism.id].stopIndex)
  }
}

export function initialState(level: LevelDef): GameState {
  // 新的一局或搜索重新读取关卡定义；同次查询期间关卡数据保持只读。
  geometryCache.delete(level)
  const state: GameState = {
    at: cellId(level.start),
    rotator: {},
    mover: {},
    orbs: [],
    spentPlates: [],
    won: false,
    gates: {},
    handleUses: {},
    crates: {},
    patrols: {},
  }
  for (const mechanism of level.mechanisms) {
    if (mechanism.type === 'rotator') state.rotator[mechanism.id] = mechanism.initialStep ?? 0
    if (mechanism.type === 'mover') state.mover[mechanism.id] = moverCursor(mechanism)
    if (mechanism.type === 'gate' && mechanism.mode === 'toggle')
      state.gates[mechanism.id] = mechanism.initiallyOpen ?? false
    if (mechanism.type !== 'plate' && mechanism.handle?.uses !== undefined) state.handleUses[mechanism.id] = 0
  }
  for (const tile of tilesOf(level, state).values()) {
    if (cellId(tile.pos) === cellId(level.start)) {
      state.at = tile.id
      break
    }
  }
  level.crates?.forEach((crate, index) => {
    state.crates[`crate-${index}`] = tileRefId(crate)
  })
  level.patrols?.forEach((_, index) => {
    state.patrols[`patrol-${index}`] = { index: 0, direction: 1 }
  })
  return state
}

export function tilesOf(level: LevelDef, state: GameState): Map<string, Tile> {
  return new Map([...geometryOf(level, state).tiles].map(([id, tile]) => [id, { id, pos: [...tile.pos] }]))
}

export function occupiedOf(level: LevelDef, state: GameState): Set<string> {
  return new Set(geometryOf(level, state).occupied)
}

export function patrolTilesOf(level: LevelDef, state: GameState): Record<string, string> {
  const tiles: Record<string, string> = {}
  level.patrols?.forEach((patrol, index) => {
    const id = `patrol-${index}`
    const ref = patrol.route[state.patrols[id].index]
    if (ref) tiles[id] = tileRefId(ref)
  })
  return tiles
}

export function gatesOf(level: LevelDef, state: GameState, departing = false): Record<string, boolean> {
  const objects = [...Object.values(state.crates), ...Object.values(patrolTilesOf(level, state))]
  const held = new Set<string>()
  for (const item of level.mechanisms) {
    if (item.type !== 'plate' || item.mode !== 'hold') continue
    const tile = cellId(item.tile)
    if ((!departing && state.at === tile) || objects.includes(tile)) held.add(item.target)
  }
  const gates: Record<string, boolean> = {}
  for (const item of level.mechanisms) {
    if (item.type !== 'gate') continue
    gates[item.id] =
      item.mode === 'toggle'
        ? state.gates[item.id]
        : held.has(item.id) || state.at === cellId(item.tile) || objects.includes(cellId(item.tile))
  }
  return gates
}

const directionOf = (from: Tile, to: Tile): ScreenDir | null => {
  const da = to.pos[0] - to.pos[1] - from.pos[0] + from.pos[1]
  const db = to.pos[2] - to.pos[1] - from.pos[2] + from.pos[1]
  return da === 1 && db === 0
    ? '+a'
    : da === -1 && db === 0
      ? '-a'
      : da === 0 && db === 1
        ? '+b'
        : da === 0 && db === -1
          ? '-b'
          : null
}

const visibleTiles = (tiles: Map<string, Tile>, blocks: Vec3[]): Set<string> =>
  new Set(
    [...tiles.values()].filter(({ pos: [x, y, z] }) => !rayHitsAny([x, y + 0.5, z], blocks)).map((tile) => tile.id),
  )

export function visibleTilesOf(level: LevelDef, state: GameState): Set<string> {
  return new Set(visibleOf(geometryOf(level, state)))
}

function entryFilter(
  level: LevelDef,
  state: GameState,
  tiles: Map<string, Tile>,
  options: { ignoreCrate?: string; patrol?: string; gates?: Record<string, boolean> } = {},
) {
  const geometry = geometryOf(level, state)
  const enterable = enterableOf(geometry)
  const crates = new Set(
    Object.entries(state.crates)
      .filter(([id]) => id !== options.ignoreCrate)
      .map(([, at]) => at),
  )
  const patrols = new Set(
    Object.entries(patrolTilesOf(level, state))
      .filter(([id]) => id !== options.patrol)
      .map(([, at]) => at),
  )
  const gates = options.gates ?? gatesOf(level, state, !options.patrol)
  const closed = new Set(
    level.mechanisms.flatMap((item) => (item.type === 'gate' && !gates[item.id] ? [cellId(item.tile)] : [])),
  )
  const oneWays = geometry.oneWays
  return (from: string, to: string): boolean => {
    const a = tiles.get(from),
      b = tiles.get(to)
    return (
      !!a &&
      !!b &&
      enterable.has(to) &&
      !crates.has(to) &&
      !patrols.has(to) &&
      !(options.patrol && to === state.at) &&
      !closed.has(to) &&
      (!oneWays.has(to) || oneWays.get(to) === directionOf(a, b))
    )
  }
}

export function walkGraph(level: LevelDef, state: GameState): Graph {
  const geometry = geometryOf(level, state)
  const { tiles } = geometry
  const graph = graphOf(geometry)
  const canEnter = entryFilter(level, state, tiles)
  // 保留当前位置的出边，遮挡只禁止进入；邻居顺序沿用 buildGraph。
  return new Map([...graph].map(([id, neighbors]) => [id, neighbors.filter((to) => canEnter(id, to))]))
}

function routesOf(level: LevelDef, state: GameState): Map<string, string[]> {
  // 收光、额度与一次性压板记录不参与寻路；影响通路的状态仍逐次核对，允许调用方原地更新。
  const key = JSON.stringify([state.at, state.rotator, state.mover, state.gates, state.crates, state.patrols])
  const cached = routeCache.get(state)
  if (cached?.level === level && cached.key === key) return cached.routes
  const graph = walkGraph(level, state)
  const routes = new Map<string, string[]>()
  routeCache.set(state, { level, key, routes })
  if (!graph.has(state.at)) return routes
  routes.set(state.at, [])
  const queue = [state.at]
  for (let index = 0; index < queue.length; index++) {
    const current = queue[index],
      route = routes.get(current)!
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

const hasUses = (mechanism: Operable, state: GameState): boolean =>
  !!mechanism.handle &&
  (mechanism.type !== 'gate' || mechanism.mode === 'toggle') &&
  (mechanism.handle.uses === undefined || (state.handleUses[mechanism.id] ?? 0) < mechanism.handle.uses)

function pushTarget(level: LevelDef, state: GameState, crate: string): string | null {
  const { tiles } = geometryOf(level, state)
  const from = tiles.get(state.at),
    at = tiles.get(state.crates[crate])
  if (!from || !at || !directionOf(from, at)) return null
  const canEnter = entryFilter(level, state, tiles, { ignoreCrate: crate })
  if (!canEnter(from.id, at.id)) return null
  const a = at.pos[0] - at.pos[1],
    b = at.pos[2] - at.pos[1]
  const da = a - from.pos[0] + from.pos[1],
    db = b - from.pos[2] + from.pos[1]
  for (const tile of tiles.values()) {
    if (screenKey(tile.pos) === `${a + da},${b + db}` && canEnter(at.id, tile.id)) return tile.id
  }
  return null
}

export function legalActions(level: LevelDef, state: GameState): Action[] {
  if (state.won) return []
  const actions: Action[] = []
  for (const tileId of routesOf(level, state).keys()) if (tileId !== state.at) actions.push({ type: 'walk', tileId })
  for (const mechanism of level.mechanisms)
    if (mechanism.type !== 'plate' && hasUses(mechanism, state))
      actions.push({ type: 'operate', mechanism: mechanism.id })
  for (const crate of Object.keys(state.crates))
    if (pushTarget(level, state, crate)) actions.push({ type: 'push', crate })
  return actions
}

function moveMechanisms(level: LevelDef, state: GameState, source: Operable): string[] {
  const triggers = new Map<string, boolean>([[source.id, false]])
  if (source.type !== 'gate')
    for (const link of source.links ?? [])
      if (!triggers.has(link.target)) triggers.set(link.target, link.reverse === true)
  const moved: string[] = []
  for (const [id, reverse] of triggers) {
    const mechanism = level.mechanisms.find((item) => item.id === id)
    if (!mechanism || mechanism.type === 'plate') continue
    if (mechanism.type === 'rotator') state.rotator[id] = (state.rotator[id] + (reverse ? 3 : 1)) % 4
    else if (mechanism.type === 'mover') state.mover[id] = advanceMover(mechanism, state.mover[id])
    else {
      if (mechanism.mode !== 'toggle') continue
      const occupied =
        state.at === cellId(mechanism.tile) ||
        Object.values(state.crates).includes(cellId(mechanism.tile)) ||
        Object.values(patrolTilesOf(level, state)).includes(cellId(mechanism.tile))
      if (state.gates[id] && occupied) continue
      state.gates[id] = !state.gates[id]
    }
    moved.push(id)
  }
  return moved
}

function movePatrols(level: LevelDef, state: GameState): Transition['patrolMoves'] {
  if (!level.patrols?.length) return []
  const geometry = geometryOf(level, state)
  const { tiles } = geometry
  const graph = graphOf(geometry)
  // 压力在整轮巡逻前、后各求值一次；同轮占位则按编号即时更新。
  const gates = gatesOf(level, state)
  const moves: Transition['patrolMoves'] = []
  level.patrols.forEach((patrol, number) => {
    const id = `patrol-${number}`
    const cursor = state.patrols[id]
    if (patrol.route.length < 2) return
    let direction = cursor.direction
    if (patrol.mode === 'pingpong' && (cursor.index + direction < 0 || cursor.index + direction >= patrol.route.length))
      direction = direction === 1 ? -1 : 1
    const index = (cursor.index + direction + patrol.route.length) % patrol.route.length
    const from = tileRefId(patrol.route[cursor.index]),
      to = tileRefId(patrol.route[index])
    const canEnter = entryFilter(level, state, tiles, { patrol: id, gates })
    const moved = !!graph.get(from)?.includes(to) && canEnter(from, to)
    state.patrols[id] = { index: moved ? index : cursor.index, direction }
    if (moved) moves.push({ patrol: id, from, to })
  })
  return moves
}

export function applyAction(level: LevelDef, state: GameState, action: Action): Transition | null {
  if (state.won) return null
  let route: string[] = [],
    operated: Operable | undefined,
    pushed: Transition['pushed'] = null
  if (action.type === 'walk') {
    if (action.tileId === state.at) return null
    const reachable = routesOf(level, state).get(action.tileId)
    if (!reachable) return null
    route = [...reachable]
  } else if (action.type === 'push') {
    const to = pushTarget(level, state, action.crate)
    if (!to) return null
    pushed = { crate: action.crate, from: state.crates[action.crate], to }
    route = [pushed.from]
  } else {
    operated = level.mechanisms.find((item): item is Operable => item.id === action.mechanism && item.type !== 'plate')
    if (!operated || !hasUses(operated, state)) return null
  }
  const next: GameState = {
    ...state,
    rotator: { ...state.rotator },
    mover: { ...state.mover },
    orbs: [...state.orbs],
    spentPlates: [...state.spentPlates],
    gates: { ...state.gates },
    handleUses: { ...state.handleUses },
    crates: { ...state.crates },
    patrols: { ...state.patrols },
  }
  const result: Transition = {
    state: next,
    route,
    collected: [],
    moved: [],
    plate: null,
    goalLocked: 0,
    pushed,
    gatesChanged: [],
    patrolMoves: [],
  }
  if (operated) {
    if (operated.handle?.uses !== undefined) next.handleUses[operated.id] = (state.handleUses[operated.id] ?? 0) + 1
    result.moved = moveMechanisms(level, next, operated)
  } else {
    const collected = new Set(state.orbs)
    for (const tileId of route)
      level.orbs.forEach((orb, index) => {
        const id = `orb-${index}`
        if (tileRefId(orb) === tileId && !collected.has(id)) {
          collected.add(id)
          result.collected.push(id)
        }
      })
    next.at = route[route.length - 1]
    next.orbs = [...collected].sort()
    if (pushed) next.crates[pushed.crate] = pushed.to
    if (action.type === 'walk') {
      const plate = level.mechanisms.find(
        (item) => item.type === 'plate' && item.mode !== 'hold' && cellId(item.tile) === next.at,
      )
      if (plate?.type === 'plate' && !(plate.once && state.spentPlates.includes(plate.id))) {
        const target = level.mechanisms.find((item) => item.id === plate.target)
        if (target && target.type !== 'plate' && (target.type !== 'gate' || target.mode === 'toggle')) {
          result.plate = plate.id
          result.moved = moveMechanisms(level, next, target)
          if (plate.once) next.spentPlates = [...next.spentPlates, plate.id].sort()
        }
      }
    }
  }
  result.patrolMoves = movePatrols(level, next)
  const before = gatesOf(level, state),
    after = gatesOf(level, next)
  result.gatesChanged = Object.keys(after).filter((id) => before[id] !== after[id])
  for (const id of result.gatesChanged) if (!result.moved.includes(id)) result.moved.push(id)
  if (action.type === 'walk' && cellId(geometryOf(level, next).tiles.get(next.at)!.pos) === cellId(level.goal)) {
    result.goalLocked = level.orbs.filter((orb, index) => !orb.optional && !next.orbs.includes(`orb-${index}`)).length
    next.won = result.goalLocked === 0
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
    entries(state.gates),
    entries(state.handleUses),
    entries(state.crates),
    entries(state.patrols).map(([id, { index, direction }]) => [id, index, direction]),
  ])
}
