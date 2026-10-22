import type { LevelDef, MoverDef, RotatorDef, Vec3 } from '../levels/types'
import { SLAB_HEIGHT, surfaceY } from './iso'
import { moverBlocks, rotatorBlocks } from './mechanisms'
import { applyAction, legalActions, tilesOf, type GameState } from './rules'
import {
  advanceBrace,
  braceScale,
  BLOCK_SIZE,
  BLOCK_RADIUS,
  SLAB_WIDTH,
  SLAB_RADIUS,
  CHARACTER_HEIGHT,
  CHARACTER_RADIUS,
  islandLayers,
} from './shapes'
import { reachableStates } from './solver'

type MovingDef = RotatorDef | MoverDef
interface Box {
  id: string
  pos: Vec3
  angle: number
  half: Vec3
  radius: number
  staticBlock?: boolean
}
export interface ClearanceIssue {
  mechanism: string
  from: number
  fraction: number
  object: string
  obstacle: string
}
export interface ClearanceReport {
  structuralTransitions: number
  characterTransitions: number
  samples: number
  issues: ClearanceIssue[]
}

type Point = [number, number]
const dot = (a: Point, b: Point) => a[0] * b[0] + a[1] * b[1]

function corners(box: Box): Point[] {
  const c = Math.cos(box.angle),
    s = Math.sin(box.angle)
  return [
    [-1, -1],
    [1, -1],
    [1, 1],
    [-1, 1],
  ].map(([x, z]) => [
    box.pos[0] + x * box.half[0] * c + z * box.half[2] * s,
    box.pos[2] - x * box.half[0] * s + z * box.half[2] * c,
  ])
}

function edgeDistance(p: Point, a: Point, b: Point): number {
  const d: Point = [b[0] - a[0], b[1] - a[1]]
  const t = Math.max(0, Math.min(1, dot([p[0] - a[0], p[1] - a[1]], d) / dot(d, d)))
  return Math.hypot(p[0] - a[0] - t * d[0], p[1] - a[1] - t * d[1])
}

function rectangleDistance(a: Box, b: Box): number {
  const av = corners(a),
    bv = corners(b)
  let separated = false
  for (const angle of [a.angle, b.angle]) {
    for (const axis of [
      [Math.cos(angle), -Math.sin(angle)],
      [Math.sin(angle), Math.cos(angle)],
    ] as Point[]) {
      const ap = av.map((p) => dot(p, axis)),
        bp = bv.map((p) => dot(p, axis))
      if (Math.max(...ap) < Math.min(...bp) || Math.max(...bp) < Math.min(...ap)) separated = true
    }
  }
  if (!separated) return 0
  let distance = Infinity
  for (const [points, edges] of [
    [av, bv],
    [bv, av],
  ]) {
    for (const p of points)
      for (let i = 0; i < 4; i++) {
        distance = Math.min(distance, edgeDistance(p, edges[i], edges[(i + 1) % 4]))
      }
  }
  return distance
}

function intersects(a: Box, b: Box): boolean {
  const radius = a.radius + b.radius
  const dy = Math.max(0, Math.abs(a.pos[1] - b.pos[1]) - a.half[1] - b.half[1])
  if (dy > radius) return false
  const bound = Math.hypot(a.half[0], a.half[2]) + Math.hypot(b.half[0], b.half[2]) + radius
  if (Math.hypot(a.pos[0] - b.pos[0], a.pos[2] - b.pos[2]) > bound) return false
  return Math.hypot(rectangleDistance(a, b), dy) < radius - 1e-5
}

function parts(id: string, pos: Vec3, path: boolean, angle = 0): Box[] {
  const h = BLOCK_SIZE / 2 - BLOCK_RADIUS
  const w = SLAB_WIDTH / 2 - SLAB_RADIUS
  const boxes: Box[] = [{ id, pos, angle, half: [h, h, h], radius: BLOCK_RADIUS }]
  if (path)
    boxes.push({
      id: `${id}/slab`,
      pos: [pos[0], pos[1] + 0.5, pos[2]],
      angle,
      half: [w, SLAB_HEIGHT - SLAB_RADIUS, w],
      radius: SLAB_RADIUS,
    })
  return boxes
}

function settledParts(m: MovingDef, state: Readonly<GameState>): Box[] {
  const blocks =
    m.type === 'rotator' ? rotatorBlocks(m, state.rotator[m.id]) : moverBlocks(m, state.mover[m.id].stopIndex)
  return blocks.flatMap((b) => parts(b.id, b.pos, b.kind === 'path'))
}

function movingParts(m: MovingDef, state: Readonly<GameState>, next: GameState, t: number): Box[] {
  const angle = m.type === 'rotator' ? ((state.rotator[m.id] + t) * Math.PI) / 2 : 0
  const c = Math.cos(angle),
    s = Math.sin(angle)
  const origin = m.type === 'rotator' ? m.pivot : m.origin
  return m.blocks.flatMap((b, i) => {
    const [x, y, z] = b.offset
    const pos: Vec3 = [origin[0] + x * c + z * s, origin[1] + y, origin[2] - x * s + z * c]
    if (m.type === 'mover') {
      const from = m.stops[state.mover[m.id].stopIndex],
        to = m.stops[next.mover[m.id].stopIndex]
      pos[m.axis === 'x' ? 0 : m.axis === 'y' ? 1 : 2] += from + (to - from) * t
    }
    return parts(`${m.id}#${i}`, pos, b.kind !== 'solid', angle)
  })
}

function bearingContact(m: MovingDef, moving: Box, fixed: Box): boolean {
  if (m.type !== 'rotator' || !fixed.staticBlock) return false
  if (fixed.pos[0] !== m.pivot[0] || fixed.pos[2] !== m.pivot[2]) return false
  const block = m.blocks[Number(moving.id.split('#')[1].split('/')[0])]
  return !!block && Math.hypot(block.offset[0], block.offset[2]) === 1 && Math.abs(fixed.pos[1] - m.pivot[1]) <= 1
}

function actorIntersects(pos: Vec3, height: number, box: Box): boolean {
  const dx = pos[0] - box.pos[0],
    dz = pos[2] - box.pos[2]
  const c = Math.cos(box.angle),
    s = Math.sin(box.angle)
  const horizontal = Math.max(
    0,
    Math.hypot(
      Math.max(0, Math.abs(dx * c - dz * s) - box.half[0]),
      Math.max(0, Math.abs(dx * s + dz * c) - box.half[2]),
    ) - CHARACTER_RADIUS,
  )
  const foot = surfaceY(pos[1])
  const vertical = Math.max(0, box.pos[1] - box.half[1] - foot - height, foot - box.pos[1] - box.half[1])
  return Math.hypot(horizontal, vertical) < box.radius - 1e-5
}

// 只供设计／测试，不参与寻路、输入接受或运行时物理。
export function checkMotionClearance(level: LevelDef, samples = 181): ClearanceReport {
  if (!Number.isInteger(samples) || samples < 3) throw new RangeError('运动采样至少三个姿态')
  if (
    level.crates?.length ||
    level.mechanisms.some((m) => (m.type !== 'rotator' && m.type !== 'mover') || m.links?.length)
  ) {
    throw new Error('净空检查目前只覆盖独立转盘／平移台；联动、压板、门或箱子须另行建模')
  }
  const mechanisms = level.mechanisms as MovingDef[]
  const staticParts = level.blocks.flatMap((b) =>
    parts(b.pos.join(','), b.pos, b.kind === 'path').map((part) => ({ ...part, staticBlock: true })),
  )
  const rocks: Box[] = level.decor.islands.flatMap((island, i) =>
    islandLayers(island).map((layer, j) => ({
      id: `island-${i}#${j}`,
      pos: layer.position,
      angle: 0,
      half: layer.size.map((v) => v / 2 - 0.08) as Vec3,
      radius: 0.08,
    })),
  )
  // 方形外包络包含转盘圆底及金边；本机关与自身底盘的轴承连接不作为结构穿插。
  const bases: Box[] = mechanisms.flatMap((m) =>
    m.type === 'rotator'
      ? [
          {
            id: `${m.id}/base`,
            pos: [m.pivot[0], m.pivot[1] - 0.55, m.pivot[2]] as Vec3,
            angle: 0,
            half: [1.214, 0.034, 1.214] as Vec3,
            radius: 0.001,
          },
        ]
      : [],
  )
  const structural = new Set<string>(),
    characters = new Set<string>()
  const issues: ClearanceIssue[] = []
  for (const state of reachableStates(level))
    for (const action of legalActions(level, state)) {
      if (action.type !== 'operate') continue
      const m = mechanisms.find((item) => item.id === action.mechanism)!
      const key = JSON.stringify([state.rotator, state.mover, m.id])
      const actorKey = `${key}/${state.at}`
      const checkStructure = !structural.has(key),
        checkActor = !characters.has(actorKey)
      if (!checkStructure && !checkActor) continue
      structural.add(key)
      characters.add(actorKey)
      const next = applyAction(level, state, action)!.state
      const fixed = [
        ...staticParts,
        ...rocks,
        ...bases.filter((b) => b.id !== `${m.id}/base`),
        ...mechanisms.filter((other) => other !== m).flatMap((other) => settledParts(other, state)),
      ]
      const rider = state.at.startsWith(`${m.id}#`)
      const at = tilesOf(level, state).get(state.at)!.pos
      const from = m.type === 'rotator' ? state.rotator[m.id] : state.mover[m.id].stopIndex
      let structureHit = false,
        actorHit = false
      for (let i = 0; i < samples; i++) {
        const fraction = i / (samples - 1)
        const moving = movingParts(m, state, next, fraction)
        const addIssue = (object: string, obstacle: string) =>
          issues.push({ mechanism: m.id, from, fraction, object, obstacle })
        if (checkStructure && !structureHit)
          for (const block of moving) {
            const obstacle = fixed.find((b) => !bearingContact(m, block, b) && intersects(block, b))
            if (obstacle) {
              addIssue(block.id, obstacle.id)
              structureHit = true
              break
            }
          }
        if (checkActor && !actorHit) {
          const pos = rider ? moving.find((b) => b.id === state.at)!.pos : at
          const duration =
            m.type === 'rotator' ? 0.9 : Math.abs(m.stops[next.mover[m.id].stopIndex] - m.stops[from]) * 0.45
          const elapsed = (fraction < 0.5 ? Math.cbrt(fraction / 4) : 1 - Math.cbrt((1 - fraction) / 4)) * duration
          const height = CHARACTER_HEIGHT * (i === samples - 1 ? 1 : braceScale(advanceBrace(0, true, elapsed)))
          const obstacles = rider
            ? [...fixed, ...moving.filter((b) => b.id !== state.at && b.id !== `${state.at}/slab`)]
            : moving
          const obstacle = obstacles.find((b) => actorIntersects(pos, height, b))
          if (obstacle) {
            addIssue(`character@${state.at}`, obstacle.id)
            actorHit = true
          }
        }
      }
    }
  return { structuralTransitions: structural.size, characterTransitions: characters.size, samples, issues }
}
