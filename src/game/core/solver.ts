import type { LevelDef } from '../levels/types'
import {
  applyAction,
  initialState,
  legalActions,
  reachableFrom,
  stateKey,
  tilesOf,
  type Action,
  type GameState,
} from './rules'

export interface LevelMetrics {
  minActions: number | null
  minActionsAll: number | null
  reachableStates: number
  deadEndStates: number
  illusions: number
  tradeoffs: number
}

interface StateNode {
  state: GameState
  depth: number
  edges: { action: Action; to: number }[]
  incoming: number[]
}

export class StateLimitError extends Error {
  constructor(readonly limit: number) {
    super(`可达状态数超过 ${limit}`)
  }
}

function stateGraph(level: LevelDef, start: GameState, storeEdges = true): StateNode[] {
  const nodes: StateNode[] = [{ state: start, depth: 0, edges: [], incoming: [] }]
  const indices = new Map([[stateKey(start), 0]])
  for (let from = 0; from < nodes.length; from++) {
    const node = nodes[from]
    for (const action of legalActions(level, node.state)) {
      const transition = applyAction(level, node.state, action)!
      const key = stateKey(transition.state)
      let to = indices.get(key)
      if (to === undefined) {
        if (nodes.length >= (level.challenge ? 100000 : 30000))
          throw new StateLimitError(level.challenge ? 100000 : 30000)
        to = nodes.length
        indices.set(key, to)
        nodes.push({ state: transition.state, depth: node.depth + 1, edges: [], incoming: [] })
      }
      if (storeEdges) node.edges.push({ action, to })
      nodes[to].incoming.push(from)
    }
  }
  return nodes
}

function winDistances(nodes: StateNode[]): number[] {
  const distances = nodes.map(() => -1)
  const queue: number[] = []
  nodes.forEach((node, index) => {
    if (!node.state.won) return
    distances[index] = 0
    queue.push(index)
  })
  for (let index = 0; index < queue.length; index++) {
    const to = queue[index]
    for (const from of nodes[to].incoming) {
      if (distances[from] !== -1) continue
      distances[from] = distances[to] + 1
      queue.push(from)
    }
  }
  return distances
}

function policyOf(nodes: StateNode[], distances: number[]): Map<string, Action | null> {
  return new Map(
    nodes.map((node, index) => {
      const edge =
        distances[index] > 0 ? node.edges.find(({ to }) => distances[to] === distances[index] - 1) : undefined
      return [stateKey(node.state), edge?.action ?? null]
    }),
  )
}

function solutionCounts(level: LevelDef): { illusions: number; tradeoffs: number } {
  let state = initialState(level)
  let illusions = 0
  let tradeoffs = 0
  for (const step of level.solution) {
    const tiles = tilesOf(level, state)
    const target =
      step.type === 'walk' ? [...tiles.values()].find((tile) => tile.pos.join(',') === step.to.join(',')) : null
    const action: Action | null = step.type === 'walk' ? (target ? { type: 'walk', tileId: target.id } : null) : step
    if (!action) break
    const transition = applyAction(level, state, action)
    if (!transition) break
    let from = tiles.get(state.at)!.pos
    for (const id of transition.route) {
      const to = tiles.get(id)!.pos
      if (to[1] !== from[1] || Math.abs(to[0] - from[0]) + Math.abs(to[2] - from[2]) !== 1) illusions++
      from = to
    }
    if (action.type !== 'walk') {
      const before = reachableFrom(level, state)
      const after = reachableFrom(level, transition.state)
      const added = [...after.keys()].some((id) => !before.has(id))
      const removed = [...before.keys()].some((id) => !after.has(id))
      if (added && removed) tradeoffs++
    }
    state = transition.state
  }
  return { illusions, tradeoffs }
}

export function analyze(level: LevelDef): LevelMetrics {
  const nodes = stateGraph(level, initialState(level), false)
  const distances = winDistances(nodes)
  let minActionsAll: number | null = null
  for (const node of nodes) {
    if (node.state.won && node.state.orbs.length === level.orbs.length) {
      minActionsAll = node.depth
      break
    }
  }
  return {
    minActions: distances[0] < 0 ? null : distances[0],
    minActionsAll,
    reachableStates: nodes.length,
    deadEndStates: distances.filter((distance) => distance < 0).length,
    ...solutionCounts(level),
  }
}

export function buildPolicy(level: LevelDef): Map<string, Action | null> {
  const nodes = stateGraph(level, initialState(level))
  return policyOf(nodes, winDistances(nodes))
}

export function reachableStates(level: LevelDef): ReadonlyArray<Readonly<GameState>> {
  return stateGraph(level, initialState(level), false).map((node) => node.state)
}

export function nextHint(level: LevelDef, state: GameState): Action | null {
  if (state.won) return null
  const nodes = stateGraph(level, state)
  const distances = winDistances(nodes)
  if (distances[0] < 0) return null
  return nodes[0].edges.find(({ to }) => distances[to] === distances[0] - 1)?.action ?? null
}

export function randomWinRate(level: LevelDef, opts: { runs: number; maxActions: number; seed: number }): number {
  if (!Number.isInteger(opts.runs) || opts.runs <= 0 || !Number.isInteger(opts.maxActions) || opts.maxActions < 0) {
    throw new RangeError('随机模拟次数必须为正整数，步数上限必须为非负整数')
  }
  const nodes = stateGraph(level, initialState(level))
  let seed = opts.seed >>> 0
  const random = () => {
    seed = (seed + 0x6d2b79f5) | 0
    let value = Math.imul(seed ^ (seed >>> 15), seed | 1)
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61)
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296
  }
  let wins = 0
  for (let run = 0; run < opts.runs; run++) {
    let at = 0
    for (let step = 0; step < opts.maxActions && !nodes[at].state.won; step++) {
      const edges = nodes[at].edges
      if (edges.length === 0) break
      at = edges[Math.floor(random() * edges.length)].to
    }
    if (nodes[at].state.won) wins++
  }
  return wins / opts.runs
}
