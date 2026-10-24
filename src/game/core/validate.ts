import type { GateDef, LevelDef, MoverDef, RotatorDef, TileRef, Vec3 } from '../levels/types'
import type { LevelTarget } from '../levels/targets'
import { cellId } from './iso'
import { moverBlocks, moverCursor, rotatorBlocks, type MoverCursor } from './mechanisms'
import { measureLevel } from './metrics'
import { applyAction, initialState, legalActions, occupiedOf, patrolTilesOf, tileRefId, tilesOf } from './rules'
import { placedBlocks, runSolution } from './solve'
import { reachableStates, StateLimitError } from './solver'
import { rayHitsAny, topVisible } from './visibility'

export type LevelCheck =
  | '基本结构'
  | '无重叠'
  | '乘坐安全'
  | '巡逻路线'
  | '解法可行'
  | '可见性'
  | '遮挡规则'
  | '把手可见'
  | '光点可见'
  | '构图范围'
  | '难度指标'
  | '规模上限'

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
  const key = `${issue.check}:${issue.cell}:${issue.detail}`
  if (seen.has(key)) return
  seen.add(key)
  issues.push(issue)
}

const checkStructure = (level: LevelDef, ids: Set<string>, issues: LevelIssue[], seen: Set<string>) => {
  if (ids.has(level.id)) push(issues, seen, { check: '基本结构', cell: level.id, detail: '关卡编号重复' })
  ids.add(level.id)

  const gear = createGear(level)
  const state = initialState(level)
  const paths = [...tilesOf(level, state).values()]
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
  if (!paths.some((tile) => sameVec(tile.pos, level.start))) {
    push(issues, seen, { check: '基本结构', cell: cellId(level.start), detail: '起点不是路面' })
  }
  if (!paths.some((tile) => sameVec(tile.pos, level.goal))) {
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
    if (mechanism.type === 'plate') {
      if (!level.blocks.some((block) => block.kind === 'path' && sameVec(block.pos, mechanism.tile))) {
        push(issues, seen, { check: '基本结构', cell: cellId(mechanism.tile), detail: '压板不在静态路面上' })
      }
      const target = level.mechanisms.find((item) => item.id === mechanism.target)
      const hold = mechanism.mode === 'hold'
      if (
        !target ||
        target.type === 'plate' ||
        (hold ? target.type !== 'gate' || target.mode !== 'hold' : target.type === 'gate' && target.mode !== 'toggle')
      ) {
        push(issues, seen, { check: '基本结构', cell: cellId(mechanism.tile), detail: '压板目标不是可触发的机关' })
      }
      if (hold && mechanism.once)
        push(issues, seen, { check: '基本结构', cell: mechanism.id, detail: '按住压板不能设为一次性' })
    } else if (mechanism.type !== 'gate') {
      for (const link of mechanism.links ?? []) {
        const target = level.mechanisms.find((item) => item.id === link.target)
        if (
          !target ||
          target.type === 'plate' ||
          target === mechanism ||
          (target.type === 'gate' && target.mode !== 'toggle')
        ) {
          push(issues, seen, { check: '基本结构', cell: mechanism.id, detail: `联动目标 ${link.target} 无效` })
        }
      }
    }
  }
  level.orbs.forEach((orb, index) => {
    if (!validRef(level, orb) || tileRefId(orb) === state.at) {
      push(issues, seen, { check: '基本结构', cell: `orb-${index}`, detail: '光点必须引用起点以外的有效路面积木' })
    }
  })
  const elements = new Set<string>()
  const element = (id: string, tile: string) => {
    if (
      !paths.some((path) => path.id === tile) ||
      elements.has(tile) ||
      tile === state.at ||
      tile === cellId(level.goal)
    ) {
      push(issues, seen, { check: '基本结构', cell: id, detail: '元素必须位于起终点之外的独立路面上' })
    }
    elements.add(tile)
  }
  for (const mechanism of level.mechanisms) {
    if (
      mechanism.type !== 'plate' &&
      mechanism.handle?.uses !== undefined &&
      (!Number.isInteger(mechanism.handle.uses) || mechanism.handle.uses < 0)
    ) {
      push(issues, seen, { check: '基本结构', cell: mechanism.id, detail: '把手次数必须为非负整数' })
    }
    if (mechanism.type === 'gate') {
      element(mechanism.id, cellId(mechanism.tile))
      if (mechanism.mode === 'hold' && (mechanism.handle || mechanism.initiallyOpen !== undefined))
        push(issues, seen, { check: '基本结构', cell: mechanism.id, detail: '按住门不能设置把手或初始开关' })
    }
  }
  for (const block of level.blocks) if (block.oneWay) element(cellId(block.pos), cellId(block.pos))
  level.crates?.forEach((crate, index) => {
    const id = `crate-${index}`
    if (!validRef(level, crate)) push(issues, seen, { check: '基本结构', cell: id, detail: '积木箱引用的路面积木无效' })
    element(id, tileRefId(crate))
  })
  level.patrols?.forEach((patrol, index) => {
    const id = `patrol-${index}`
    if (patrol.route.length < 2) {
      push(issues, seen, { check: '巡逻路线', cell: id, detail: '巡逻路线至少需要两格' })
      return
    }
    if (patrol.route.some((ref) => !validRef(level, ref))) {
      push(issues, seen, { check: '巡逻路线', cell: id, detail: '巡逻路线引用的路面积木无效' })
      return
    }
    element(id, tileRefId(patrol.route[0]))
    const tiles = tilesOf(level, state)
    const route = patrol.route.map((ref) => tiles.get(tileRefId(ref))!.pos)
    const edges = route.slice(1).map((to, i) => [route[i], to])
    if (patrol.mode === 'loop') edges.push([route[route.length - 1], route[0]])
    for (const [from, to] of edges) {
      const a = screenOf(from),
        b = screenOf(to)
      if (Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]) !== 1)
        push(issues, seen, { check: '巡逻路线', cell: id, detail: `开局路线 ${cellId(from)} → ${cellId(to)} 不相邻` })
    }
  })
}

const validRef = (level: LevelDef, ref: TileRef): boolean => {
  if ('tile' in ref) return level.blocks.some((block) => block.kind === 'path' && sameVec(block.pos, ref.tile))
  const mechanism = level.mechanisms.find((item) => item.id === ref.mechanism)
  return (
    !!mechanism &&
    (mechanism.type === 'rotator' || mechanism.type === 'mover') &&
    Number.isInteger(ref.block) &&
    ref.block >= 0 &&
    !!mechanism.blocks[ref.block] &&
    (mechanism.blocks[ref.block].kind ?? 'path') === 'path'
  )
}

const checkScale = (level: LevelDef, issues: LevelIssue[], seen: Set<string>) => {
  const moving = level.mechanisms.filter((item) => item.type === 'rotator' || item.type === 'mover').length
  for (const [name, count, max] of [
    ['积木箱', level.crates?.length ?? 0, 2],
    ['巡逻者', level.patrols?.length ?? 0, 1],
    ['光点', level.orbs.length, 4],
    ['转盘与平移台', moving, level.challenge ? 5 : 4],
  ] as const) {
    if (count > max)
      push(issues, seen, { check: '规模上限', cell: level.id, detail: `${name} ${count} 个，最多 ${max} 个` })
  }
}

const reachableLayouts = (level: LevelDef, issues: LevelIssue[], seen: Set<string>): Vec3[][] => {
  const layouts = new Map<string, { blocks: Vec3[]; occupied: Set<string>; tiles: ReturnType<typeof tilesOf> }>()
  for (const state of reachableStates(level)) {
    const key = JSON.stringify([
      state.rotator,
      Object.entries(state.mover).map(([id, cursor]) => [id, cursor.stopIndex]),
    ])
    let layout = layouts.get(key)
    if (!layout) {
      const gear: Gear = {
        rotator: new Map(Object.entries(state.rotator)),
        mover: new Map(Object.entries(state.mover)),
      }
      layout = { blocks: placedBlocks(level, gear), occupied: occupiedOf(level, state), tiles: tilesOf(level, state) }
      layouts.set(key, layout)
    }
    for (const [id, at] of [
      ['小人', state.at],
      ...Object.entries(state.crates),
      ...Object.entries(patrolTilesOf(level, state)),
    ]) {
      const pos = layout.tiles.get(at)?.pos
      if (pos && layout.occupied.has(cellId([pos[0], pos[1] + 1, pos[2]]))) {
        push(issues, seen, { check: '乘坐安全', cell: cellId(pos), detail: `${id}头顶有积木` })
      }
    }
  }
  if (level.patrols?.length) {
    for (const state of reachableStates(level)) {
      for (const action of legalActions(level, state)) {
        const next = applyAction(level, state, action)!.state
        const tiles = tilesOf(level, next),
          occupied = occupiedOf(level, next)
        for (const [id, at] of Object.entries(patrolTilesOf(level, state))) {
          const pos = tiles.get(at)!.pos
          if (occupied.has(cellId([pos[0], pos[1] + 1, pos[2]])))
            push(issues, seen, { check: '乘坐安全', cell: cellId(pos), detail: `${id}随机关到位时头顶有积木` })
        }
      }
    }
  }
  return [...layouts.values()].map((layout) => layout.blocks)
}

const checkOrbs = (level: LevelDef, issues: LevelIssue[], seen: Set<string>) => {
  const state = initialState(level)
  const tiles = tilesOf(level, state)
  const blocks = placedBlocks(level, createGear(level))
  level.orbs.forEach((orb, index) => {
    const tile = tiles.get('tile' in orb ? cellId(orb.tile) : `${orb.mechanism}#${orb.block}`)!
    const [x, y, z] = tile.pos
    if (rayHitsAny([x, y + 0.5, z], blocks)) {
      push(issues, seen, { check: '光点可见', cell: `orb-${index}`, detail: '开局光点所在路面的顶面中心被挡住' })
    }
  })
}

const checkDifficulty = (level: LevelDef, target: LevelTarget, issues: LevelIssue[], seen: Set<string>) => {
  const metrics = measureLevel(level, target.randomWin?.steps)
  const checks: [boolean, string][] = [
    [metrics.minActions === target.minActions, `最少步数 ${metrics.minActions}，目标 ${target.minActions}`],
    [
      metrics.minActionsAll === target.minActionsAll,
      `全收集最少步数 ${metrics.minActionsAll}，目标 ${target.minActionsAll}`,
    ],
    [
      level.solution.length === metrics.minActions,
      `标准解法 ${level.solution.length} 步，最少步数 ${metrics.minActions}`,
    ],
    [metrics.illusions >= target.illusionsMin, `错觉连接数 ${metrics.illusions}，至少 ${target.illusionsMin}`],
  ]
  if (target.reachableStatesMin !== undefined)
    checks.push([
      metrics.reachableStates >= target.reachableStatesMin,
      `可达状态数 ${metrics.reachableStates}，至少 ${target.reachableStatesMin}`,
    ])
  if (target.tradeoffsMin !== undefined)
    checks.push([
      metrics.tradeoffs >= target.tradeoffsMin,
      `取舍次数 ${metrics.tradeoffs}，至少 ${target.tradeoffsMin}`,
    ])
  if (target.randomWin)
    checks.push([
      metrics.randomRate <= target.randomWin.maxRate,
      `随机通关率 ${metrics.randomRate}，最多 ${target.randomWin.maxRate}（${metrics.randomSteps} 步）`,
    ])
  for (const [passed, detail] of checks) if (!passed) push(issues, seen, { check: '难度指标', cell: level.id, detail })
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
  const handles = level.mechanisms.filter(
    (mechanism): mechanism is RotatorDef | MoverDef | GateDef => mechanism.type !== 'plate',
  )
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

export function validateLevel(level: LevelDef, ids: Set<string> = new Set(), target?: LevelTarget): LevelIssue[] {
  const issues: LevelIssue[] = []
  const seen = new Set<string>()
  checkStructure(level, ids, issues, seen)
  checkScale(level, issues, seen)
  checkOverlap([placedBlocks(level, createGear(level))], issues, seen)
  if (issues.length > 0) return issues
  let reachable: Vec3[][]
  try {
    reachable = reachableLayouts(level, issues, seen)
  } catch (error) {
    if (!(error instanceof StateLimitError)) throw error
    push(issues, seen, { check: '规模上限', cell: level.id, detail: error.message })
    return issues
  }
  const gears = enumerateGears(level)
  const layouts = gears.length > 0 ? gears.map((gear) => placedBlocks(level, gear)) : reachable
  const run = runSolution(level)
  checkOverlap(layouts, issues, seen)
  checkSolution(level, run, issues, seen)
  checkHandles(level, layouts, issues, seen)
  checkOrbs(level, issues, seen)
  checkFrame(level, issues, seen)
  if (target) checkDifficulty(level, target, issues, seen)
  return issues
}

export function validateLevels(levels: readonly LevelDef[], targets: Record<string, LevelTarget> = {}): LevelIssue[] {
  const issues: LevelIssue[] = []
  const ids = new Set<string>()
  for (const level of levels) issues.push(...validateLevel(level, ids, targets[level.id]))
  return issues
}
