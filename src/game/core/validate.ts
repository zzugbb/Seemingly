import type { LevelDef, MoverDef, RotatorDef, Vec3 } from '../levels/types'
import { cellId } from './iso'
import { moverBlocks, moverCursor, rotatorBlocks, type MoverCursor } from './mechanisms'
import { placedBlocks, runSolution } from './solve'
import { rayHitsAny, topVisible } from './visibility'

export type LevelCheck = '基本结构' | '无重叠' | '解法可行' | '可见性' | '遮挡规则' | '把手可见' | '构图范围'

export interface LevelIssue {
  check: LevelCheck
  cell: string
  detail: string
}

const SCREEN_SPAN = 14

interface Gear {
  rotator: Map<string, number>
  mover: Map<string, MoverCursor>
}

const sameVec = (a: Vec3, b: Vec3) => a[0] + 0 === b[0] + 0 && a[1] + 0 === b[1] + 0 && a[2] + 0 === b[2] + 0

const includesVec = (list: readonly Vec3[], pos: Vec3) => list.some((item) => sameVec(item, pos))

const createGear = (level: LevelDef): Gear => {
  const gear: Gear = { rotator: new Map(), mover: new Map() }
  for (const mechanism of level.mechanisms) {
    if (mechanism.type === 'rotator') gear.rotator.set(mechanism.id, mechanism.initialStep ?? 0)
    if (mechanism.type === 'mover') gear.mover.set(mechanism.id, moverCursor(mechanism))
  }
  return gear
}

const variableAxes = (level: LevelDef): { id: string; count: number; type: 'rotator' | 'mover' }[] => {
  const axes: { id: string; count: number; type: 'rotator' | 'mover' }[] = []
  for (const mechanism of level.mechanisms) {
    if (mechanism.type === 'rotator') axes.push({ id: mechanism.id, count: 4, type: 'rotator' })
    if (mechanism.type === 'mover')
      axes.push({ id: mechanism.id, count: Math.max(1, mechanism.stops.length), type: 'mover' })
  }
  return axes
}

const gearFromDigits = (level: LevelDef, digits: number[]): Gear => {
  const gear = createGear(level)
  const axes = variableAxes(level)
  axes.forEach((axis, index) => {
    const value = digits[index] ?? 0
    if (axis.type === 'rotator') gear.rotator.set(axis.id, value)
    if (axis.type === 'mover') {
      const mechanism = level.mechanisms.find((item): item is MoverDef => item.id === axis.id && item.type === 'mover')
      if (!mechanism) return
      gear.mover.set(axis.id, { stopIndex: value, direction: value > 0 ? 1 : -1 })
    }
  })
  return gear
}

const enumerateGears = (level: LevelDef): Gear[] => {
  const axes = variableAxes(level)
  const total = axes.reduce((count, axis) => count * axis.count, 1)
  if (total > 64) return []
  const gears: Gear[] = []
  for (let index = 0; index < total; index++) {
    const digits: number[] = []
    let rest = index
    for (const axis of axes) {
      digits.push(rest % axis.count)
      rest = Math.floor(rest / axis.count)
    }
    gears.push(gearFromDigits(level, digits))
  }
  return gears
}

const screenOf = (pos: Vec3): [number, number] => [pos[0] - pos[1], pos[2] - pos[1]]

const adjacent3d = (a: Vec3, b: Vec3) => {
  const distance = Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]) + Math.abs(a[2] - b[2])
  return distance === 1
}

const occludedCell = (from: Vec3, to: Vec3): Vec3 | null => {
  if (adjacent3d(from, to)) return null
  const [a1, b1] = screenOf(from)
  const [a2, b2] = screenOf(to)
  const da = a2 - a1
  const db = b2 - b1
  if (Math.abs(da) + Math.abs(db) !== 1) return null
  const lower = da + db > 0 ? to : from
  const upper = lower === to ? from : to
  return lower[1] < upper[1] ? lower : null
}

const handlePoint = (block: Vec3, face: 'x' | 'z'): Vec3 => {
  const [x, y, z] = block
  return face === 'x' ? [x + 0.5, y, z] : [x, y, z + 0.5]
}

const push = (issues: LevelIssue[], seen: Set<string>, issue: LevelIssue) => {
  const key = `${issue.check}:${issue.cell}`
  if (seen.has(key)) return
  seen.add(key)
  issues.push(issue)
}

const checkStructure = (level: LevelDef, ids: Set<string>, issues: LevelIssue[], seen: Set<string>) => {
  if (ids.has(level.id)) push(issues, seen, { check: '基本结构', cell: level.id, detail: '关卡编号重复' })
  ids.add(level.id)

  const gear = createGear(level)
  const blocks = placedBlocks(level, gear)
  const mechanismCells = new Set<string>()
  for (const mechanism of level.mechanisms) {
    const positions =
      mechanism.type === 'rotator'
        ? rotatorBlocks(mechanism, gear.rotator.get(mechanism.id) ?? 0).map((block) => block.pos)
        : mechanism.type === 'mover'
          ? moverBlocks(mechanism, gear.mover.get(mechanism.id)?.stopIndex ?? 0).map((block) => block.pos)
          : []
    for (const pos of positions) mechanismCells.add(cellId(pos))
  }
  const paths = blocks.filter((pos) => {
    const staticPath = level.blocks.some((block) => block.kind === 'path' && sameVec(block.pos, pos))
    const mechanismPath = level.mechanisms.some((mechanism) => {
      if (mechanism.type === 'plate') return false
      const parts =
        mechanism.type === 'rotator'
          ? rotatorBlocks(mechanism, gear.rotator.get(mechanism.id) ?? 0)
          : moverBlocks(mechanism, gear.mover.get(mechanism.id)?.stopIndex ?? 0)
      return parts.some((block) => (block.kind ?? 'path') === 'path' && sameVec(block.pos, pos))
    })
    return staticPath || mechanismPath
  })

  if (!includesVec(paths, level.start)) {
    push(issues, seen, { check: '基本结构', cell: cellId(level.start), detail: '起点不是路面' })
  }
  if (!includesVec(paths, level.goal)) {
    push(issues, seen, { check: '基本结构', cell: cellId(level.goal), detail: '终点不是路面' })
  }
  if (mechanismCells.has(cellId(level.goal))) {
    push(issues, seen, { check: '基本结构', cell: cellId(level.goal), detail: '终点在机关上' })
  }

  const mechanismIds = new Set<string>()
  for (const mechanism of level.mechanisms) {
    if (mechanismIds.has(mechanism.id)) {
      push(issues, seen, { check: '基本结构', cell: mechanism.id, detail: '机关编号重复' })
    }
    mechanismIds.add(mechanism.id)
  }
  for (const mechanism of level.mechanisms) {
    if (mechanism.type !== 'plate') continue
    const target = level.mechanisms.find((item) => item.id === mechanism.target)
    if (!target || target.type === 'plate') {
      push(issues, seen, { check: '基本结构', cell: cellId(mechanism.tile), detail: '压板没有可触发的机关' })
    }
  }
}

const checkOverlap = (layouts: Vec3[][], issues: LevelIssue[], seen: Set<string>) => {
  for (const layout of layouts) {
    const counts = new Map<string, number>()
    for (const pos of layout) {
      const cell = cellId(pos)
      counts.set(cell, (counts.get(cell) ?? 0) + 1)
    }
    for (const [cell, count] of counts) {
      if (count > 1) push(issues, seen, { check: '无重叠', cell, detail: '两块积木占用同一格' })
    }
  }
}

const checkSolution = (
  level: LevelDef,
  run: ReturnType<typeof runSolution>,
  issues: LevelIssue[],
  seen: Set<string>,
) => {
  if (!run.ok) {
    push(issues, seen, {
      check: '解法可行',
      cell: run.cell ?? cellId(level.goal),
      detail: `第 ${(run.failedStep ?? 0) + 1} 步没有走通（${run.result ?? 'not-won'}）`,
    })
  }
  for (const walk of run.walks) {
    for (const pos of walk.positions) {
      if (!topVisible(pos, walk.blocks)) {
        push(issues, seen, { check: '可见性', cell: cellId(pos), detail: '顶面被其他积木挡住' })
      }
    }
    for (let index = 1; index < walk.positions.length; index++) {
      const from = walk.positions[index - 1]
      const to = walk.positions[index]
      if (!from || !to) continue
      const cell = occludedCell(from, to)
      if (cell) push(issues, seen, { check: '遮挡规则', cell: cellId(cell), detail: '错觉连接往屏幕下方降低了高度' })
    }
  }
}

const checkHandles = (level: LevelDef, layouts: Vec3[][], issues: LevelIssue[], seen: Set<string>) => {
  const handles = level.mechanisms.filter((mechanism): mechanism is RotatorDef | MoverDef => mechanism.type !== 'plate')
  for (const blocks of layouts) {
    for (const mechanism of handles) {
      if (!mechanism.handle) continue
      const point = handlePoint(mechanism.handle.block, mechanism.handle.face)
      if (rayHitsAny(point, blocks)) {
        push(issues, seen, { check: '把手可见', cell: cellId(mechanism.handle.block), detail: '把手被其他积木挡住' })
      }
    }
  }
}

const extentPositions = (level: LevelDef): Vec3[] => {
  const positions = level.blocks.map((block) => block.pos)
  for (const mechanism of level.mechanisms) {
    if (mechanism.type === 'rotator') {
      for (let step = 0; step < 4; step++) for (const block of rotatorBlocks(mechanism, step)) positions.push(block.pos)
    } else if (mechanism.type === 'mover') {
      for (let stop = 0; stop < mechanism.stops.length; stop++) {
        for (const block of moverBlocks(mechanism, stop)) positions.push(block.pos)
      }
    }
  }
  return positions
}

const checkFrame = (level: LevelDef, issues: LevelIssue[], seen: Set<string>) => {
  let minA = Infinity
  let maxA = -Infinity
  let minB = Infinity
  let maxB = -Infinity
  let extreme: Vec3 = level.start
  for (const pos of extentPositions(level)) {
    const [a, b] = screenOf(pos)
    if (a < minA) minA = a
    if (a > maxA) {
      maxA = a
      extreme = pos
    }
    if (b < minB) minB = b
    if (b > maxB) {
      maxB = b
      extreme = pos
    }
  }
  if (maxA - minA > SCREEN_SPAN || maxB - minB > SCREEN_SPAN) {
    push(issues, seen, { check: '构图范围', cell: cellId(extreme), detail: '屏幕坐标超出 14×14' })
  }
}

export function validateLevel(level: LevelDef, ids: Set<string> = new Set()): LevelIssue[] {
  const issues: LevelIssue[] = []
  const seen = new Set<string>()
  const gears = enumerateGears(level)
  const run = runSolution(level)
  const layouts = gears.length > 0 ? gears.map((gear) => placedBlocks(level, gear)) : run.layouts
  checkStructure(level, ids, issues, seen)
  checkOverlap(layouts, issues, seen)
  checkSolution(level, run, issues, seen)
  checkHandles(level, layouts, issues, seen)
  checkFrame(level, issues, seen)
  return issues
}

export function validateLevels(levels: readonly LevelDef[]): LevelIssue[] {
  const issues: LevelIssue[] = []
  const ids = new Set<string>()
  for (const level of levels) issues.push(...validateLevel(level, ids))
  return issues
}
