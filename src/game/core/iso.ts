import type { Vec3 } from '../levels/types'

export const SLAB_HEIGHT = 0.06

export const cellId = ([x, y, z]: Vec3) => `${x},${y},${z}`

// 等距相机沿 (1,1,1) 观察：沿该方向平移的方块在屏幕上重合，因此用 (x-y, z-y) 作为屏幕坐标
export const screenKey = ([x, y, z]: Vec3) => `${x - y},${z - y}`

export function rotateOffset([x, y, z]: Vec3, step: number): Vec3 {
  switch (((step % 4) + 4) % 4) {
    case 0:
      return [x, y, z]
    case 1:
      return [z, y, -x]
    case 2:
      return [-x, y, -z]
    default:
      return [-z, y, x]
  }
}

export const addVec = (a: Vec3, b: Vec3): Vec3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]]

export interface Tile {
  id: string
  pos: Vec3
}

export type Graph = Map<string, string[]>

const NEIGHBOR_OFFSETS: [number, number][] = [
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1],
]

export function buildGraph(tiles: Tile[], occupied: Set<string>): Graph {
  const walkable = tiles.filter(({ pos: [x, y, z] }) => !occupied.has(cellId([x, y + 1, z])))
  const byKey = new Map<string, Tile[]>()
  for (const tile of walkable) {
    const key = screenKey(tile.pos)
    byKey.set(key, [...(byKey.get(key) ?? []), tile])
  }

  const graph: Graph = new Map()
  for (const tile of walkable) {
    const [x, y, z] = tile.pos
    const neighbors: string[] = []
    for (const [dx, dz] of NEIGHBOR_OFFSETS) {
      const key = `${x - y + dx},${z - y + dz}`
      for (const other of byKey.get(key) ?? []) neighbors.push(other.id)
    }
    graph.set(tile.id, neighbors)
  }
  return graph
}

export function findPath(graph: Graph, from: string, to: string): string[] | null {
  if (!graph.has(from) || !graph.has(to)) return null
  const prev = new Map<string, string | null>([[from, null]])
  const queue = [from]
  while (queue.length > 0) {
    const current = queue.shift()!
    if (current === to) break
    for (const next of graph.get(current) ?? []) {
      if (prev.has(next)) continue
      prev.set(next, current)
      queue.push(next)
    }
  }
  if (!prev.has(to)) return null
  const route: string[] = []
  for (let node: string | null = to; node !== null; node = prev.get(node) ?? null) route.unshift(node)
  return route.slice(1)
}

export const surfaceY = (y: number) => y + 0.5 + SLAB_HEIGHT

// 两个屏幕相邻的格子之间：前半程沿真实方向走，过中点后瞬移到目标格的等价位置，正交视角下看不出跳变
export function segmentPoint(from: Vec3, to: Vec3, t: number): Vec3 {
  const k = to[1] - from[1]
  const dx = to[0] - from[0] - k
  const dz = to[2] - from[2] - k
  if (t < 0.5) return [from[0] + dx * t, surfaceY(from[1]), from[2] + dz * t]
  return [to[0] - dx * (1 - t), surfaceY(to[1]), to[2] - dz * (1 - t)]
}

export function segmentHeading(from: Vec3, to: Vec3): number {
  const k = to[1] - from[1]
  return Math.atan2(to[0] - from[0] - k, to[2] - from[2] - k)
}
