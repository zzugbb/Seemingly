import { describe, expect, it, vi } from 'vitest'
import * as iso from './iso'
import { defineLevel, type LevelBuilder } from '../levels/builders'
import { levels } from '../levels'
import { cellId, findPath } from './iso'
import {
  applyAction,
  gatesOf,
  type Action,
  initialState,
  legalActions,
  occupiedOf,
  reachableFrom,
  stateKey,
  tilesOf,
  walkGraph,
  visibleTilesOf,
  type GameState,
  type Transition,
} from './rules'

const fixture = (build: (b: LevelBuilder) => void = () => {}) =>
  defineLevel({
    id: 'rules-fixture',
    title: '规则测试',
    chapter: 1,
    solution: [],
    build: (b) => {
      for (let x = 0; x <= 3; x++) b.path([x, 0, 0], 'sand')
      for (let x = 0; x <= 2; x++) b.path([x, 0, 1], 'sand')
      b.path([0, 0, 2], 'sand')
      b.solid([0, 1, 2], 'rose')
      b.path([6, 2, 2], 'rose')
      b.orb({ tile: [1, 0, 0] })
      b.orb({ tile: [0, 0, 1], optional: true })
      b.start([0, 0, 0])
      b.goal([3, 0, 0])
      build(b)
    },
  })

const withGears = () =>
  fixture((b) => {
    b.rotator({
      id: 'drive',
      pivot: [10, 0, 0],
      blocks: [{ offset: [1, 0, 0] }],
      initialStep: 3,
      handle: { block: [0, 1, 2], face: 'z' },
      links: [
        { target: 'reverse', reverse: true },
        { target: 'lift', reverse: true },
      ],
    })
    b.rotator({
      id: 'reverse',
      pivot: [15, 0, 0],
      blocks: [{ offset: [1, 0, 0] }],
      links: [{ target: 'indirect' }],
    })
    b.rotator({ id: 'indirect', pivot: [20, 0, 0], blocks: [{ offset: [1, 0, 0] }] })
    b.mover({ id: 'lift', origin: [25, 0, 0], axis: 'y', stops: [0, 2, 3], blocks: [{ offset: [0, 0, 0] }] })
  })

const transitioned = (transition: Transition | null): Transition => {
  expect(transition).not.toBeNull()
  if (!transition) throw new Error('预期合法动作')
  return transition
}

describe('关卡数据与初始状态', () => {
  it('保留光点定义顺序、章节和初始机关状态', () => {
    const level = withGears()
    expect(level.orbs).toEqual([{ tile: [1, 0, 0] }, { tile: [0, 0, 1], optional: true }])
    expect(initialState(level)).toEqual({
      at: '0,0,0',
      rotator: { drive: 3, reverse: 0, indirect: 0 },
      mover: { lift: { stopIndex: 0, direction: 1 } },
      orbs: [],
      spentPlates: [],
      won: false,
      gates: {},
      handleUses: {},
      crates: {},
      patrols: {},
    })
    const mechanisms = level.mechanisms.map((item) => (item.type === 'mover' ? { ...item, initialStop: 2 } : item))
    expect(initialState({ ...level, mechanisms }).mover.lift).toEqual({ stopIndex: 2, direction: 1 })
  })

  it('路面图只包含路面，占用集合包含结构和机关全部积木', () => {
    const level = withGears()
    const state = initialState(level)
    const tiles = tilesOf(level, state)
    expect(tiles.get('drive#0')?.pos).toEqual([10, 0, 1])
    expect(tiles.has('0,1,2')).toBe(false)
    expect(tiles.has('0,0,2')).toBe(true)
    expect(occupiedOf(level, state)).toEqual(
      new Set([...level.blocks.map((block) => cellId(block.pos)), '10,0,1', '16,0,0', '21,0,0', '25,0,0']),
    )
    expect(reachableFrom(level, state).has('0,0,2')).toBe(false)
  })
})

describe('行走与光点', () => {
  it('路过即收集必需光点，抵达终点可通关，选做光点不阻止通关', () => {
    const level = fixture()
    const result = transitioned(applyAction(level, initialState(level), { type: 'walk', tileId: '3,0,0' }))
    expect(result).toEqual({
      state: { ...initialState(level), at: '3,0,0', orbs: ['orb-0'], won: true },
      route: ['1,0,0', '2,0,0', '3,0,0'],
      collected: ['orb-0'],
      moved: [],
      plate: null,
      goalLocked: 0,
      pushed: null,
      gatesChanged: [],
      patrolMoves: [],
    })
  })

  it('必需光点不齐时返回缺少数量，之后仍可继续行走', () => {
    const level = fixture((b) => {
      b.orb({ tile: [1, 0, 1] })
      b.orb({ tile: [2, 0, 1] })
    })
    const locked = transitioned(applyAction(level, initialState(level), { type: 'walk', tileId: '3,0,0' }))
    expect(locked.goalLocked).toBe(2)
    expect(locked.state.won).toBe(false)
    const collect = transitioned(applyAction(level, locked.state, { type: 'walk', tileId: '1,0,1' }))
    const rest = transitioned(applyAction(level, collect.state, { type: 'walk', tileId: '2,0,1' }))
    const finish = transitioned(applyAction(level, rest.state, { type: 'walk', tileId: '3,0,0' }))
    expect(finish.state.won).toBe(true)
    expect(finish.goalLocked).toBe(0)
  })

  it('选做光点也收集，重复进入不重复收集', () => {
    const level = fixture()
    level.blocks = level.blocks.filter((block) => cellId(block.pos) !== '0,1,2')
    const first = transitioned(applyAction(level, initialState(level), { type: 'walk', tileId: '0,0,1' }))
    expect(first.collected).toEqual(['orb-1'])
    const back = transitioned(applyAction(level, first.state, { type: 'walk', tileId: '0,0,0' }))
    const again = transitioned(applyAction(level, back.state, { type: 'walk', tileId: '0,0,1' }))
    expect(again.collected).toEqual([])
    expect(again.state.orbs).toEqual(['orb-1'])
  })

  it('只在路线终点判定通关，允许经过灯笼继续行走', () => {
    const level = fixture()
    const result = transitioned(applyAction(level, initialState(level), { type: 'walk', tileId: '6,2,2' }))
    expect(result.route).toContain('3,0,0')
    expect(result.state.at).toBe('6,2,2')
    expect(result.state.won).toBe(false)
  })

  it('当前格、未知格、被压住的路面和断开的路面都不可行走', () => {
    const level = fixture((b) => b.path([99, 0, 99], 'sand'))
    const state = initialState(level)
    for (const tileId of ['0,0,0', 'missing', '0,0,2', '99,0,99']) {
      expect(applyAction(level, state, { type: 'walk', tileId })).toBeNull()
      expect(legalActions(level, state)).not.toContainEqual({ type: 'walk', tileId })
    }
  })
})

describe('机关、压板与乘坐', () => {
  it('直接操作只展开一层联动，逆转只影响转盘，输入状态不变', () => {
    const level = withGears()
    const state = initialState(level)
    const before = structuredClone(state)
    const result = transitioned(applyAction(level, state, { type: 'operate', mechanism: 'drive' }))
    expect(result.moved).toEqual(['drive', 'reverse', 'lift'])
    expect(result.route).toEqual([])
    expect(result.plate).toBeNull()
    expect(result.state.rotator).toEqual({ drive: 0, reverse: 3, indirect: 0 })
    expect(result.state.mover.lift).toEqual({ stopIndex: 1, direction: 1 })
    expect(state).toEqual(before)
  })

  it('平移台联动也只展开一层，并按停靠位往返', () => {
    const level = withGears()
    const lift = level.mechanisms.find((mechanism) => mechanism.type === 'mover')!
    if (lift.type !== 'mover') throw new Error('缺少平移台')
    lift.handle = { block: [0, 1, 2], face: 'x' }
    lift.links = [{ target: 'reverse' }]
    let state = initialState(level)
    const cursors = []
    for (let index = 0; index < 5; index++) {
      const result = transitioned(applyAction(level, state, { type: 'operate', mechanism: 'lift' }))
      expect(result.moved).toEqual(['lift', 'reverse'])
      state = result.state
      cursors.push(state.mover.lift)
    }
    expect(cursors).toEqual([
      { stopIndex: 1, direction: 1 },
      { stopIndex: 2, direction: 1 },
      { stopIndex: 1, direction: -1 },
      { stopIndex: 0, direction: -1 },
      { stopIndex: 1, direction: 1 },
    ])
    expect(state.rotator.indirect).toBe(0)
  })

  it('无把手机关、压板和未知机关不能直接操作', () => {
    const level = withGears()
    level.mechanisms.push({ type: 'plate', id: 'pad', tile: [2, 0, 1], target: 'reverse' })
    const state = initialState(level)
    const operations = legalActions(level, state).filter((action) => action.type === 'operate')
    expect(operations).toEqual([{ type: 'operate', mechanism: 'drive' }])
    for (const mechanism of ['reverse', 'lift', 'pad', 'missing']) {
      expect(applyAction(level, state, { type: 'operate', mechanism })).toBeNull()
    }
  })

  it.each([false, true])('压板可驱动无把手机关并联动，once=%s', (once) => {
    const level = withGears()
    level.mechanisms.push({ type: 'plate', id: 'pad', tile: [2, 0, 1], target: 'reverse', once })
    let state = initialState(level)
    const first = transitioned(applyAction(level, state, { type: 'walk', tileId: '2,0,1' }))
    expect(first.plate).toBe('pad')
    expect(first.moved).toEqual(['reverse', 'indirect'])
    expect(first.state.rotator.reverse).toBe(1)
    expect(first.state.spentPlates).toEqual(once ? ['pad'] : [])
    state = transitioned(applyAction(level, first.state, { type: 'walk', tileId: '2,0,0' })).state
    const second = transitioned(applyAction(level, state, { type: 'walk', tileId: '2,0,1' }))
    expect(second.moved).toEqual(once ? [] : ['reverse', 'indirect'])
    expect(second.state.rotator.reverse).toBe(once ? 1 : 2)
  })

  it('经过压板不停下不会触发', () => {
    const level = withGears()
    level.mechanisms.push({ type: 'plate', id: 'pad', tile: [1, 0, 0], target: 'drive', once: true })
    const result = transitioned(applyAction(level, initialState(level), { type: 'walk', tileId: '2,0,0' }))
    expect(result.plate).toBeNull()
    expect(result.moved).toEqual([])
    expect(result.state.spentPlates).toEqual([])
  })

  it.each(['rotator', 'mover'] as const)('乘坐 %s 时格子编号不变，位置随机关变化并收集机关上的光点', (type) => {
    const level = defineLevel({
      id: `ride-${type}`,
      title: '乘坐测试',
      chapter: 2,
      solution: [],
      build: (b) => {
        b.path([0, 0, 0], 'sand')
        b.path([9, 0, 0], 'sand')
        const handle = { block: [0, 0, 0] as [number, number, number], face: 'z' as const }
        if (type === 'rotator') b.rotator({ id: 'ride', pivot: [2, 0, 0], blocks: [{ offset: [-1, 0, 0] }], handle })
        else
          b.mover({ id: 'ride', origin: [1, 0, 0], axis: 'y', stops: [0, 2], blocks: [{ offset: [0, 0, 0] }], handle })
        b.orb({ mechanism: 'ride', block: 0 })
        b.start([0, 0, 0])
        b.goal([9, 0, 0])
      },
    })
    const walk = transitioned(applyAction(level, initialState(level), { type: 'walk', tileId: 'ride#0' }))
    expect(walk.collected).toEqual(['orb-0'])
    const ride = transitioned(applyAction(level, walk.state, { type: 'operate', mechanism: 'ride' }))
    expect(ride.state.at).toBe('ride#0')
    expect(tilesOf(level, ride.state).get(ride.state.at)?.pos).toEqual(type === 'rotator' ? [2, 0, 1] : [1, 2, 0])
    expect(ride.collected).toEqual([])
    expect(ride.state.orbs).toEqual(['orb-0'])
    expect(initialState({ ...level, start: [1, 0, 0] }).at).toBe('ride#0')
  })

  it('被联动的机关也能带着小人移动', () => {
    const level = withGears()
    const state = { ...initialState(level), at: 'reverse#0' }
    const result = transitioned(applyAction(level, state, { type: 'operate', mechanism: 'drive' }))
    expect(result.state.at).toBe('reverse#0')
    expect(tilesOf(level, result.state).get('reverse#0')?.pos).toEqual([15, 0, 1])
  })
})

describe('可达路线、合法动作与状态键', () => {
  it('同布局复用邻接图，位置变化后仍重新计算可达路线', () => {
    const level = fixture()
    const state = initialState(level)
    const search = vi.spyOn(iso, 'buildGraph')
    try {
      for (const action of legalActions(level, state)) applyAction(level, state, action)
      expect(search).toHaveBeenCalledTimes(1)
      state.at = '1,0,0'
      const actions = legalActions(level, state)
      expect(actions).not.toContainEqual({ type: 'walk', tileId: state.at })
      expect(actions).toContainEqual({ type: 'walk', tileId: '0,0,0' })
      expect(reachableFrom(level, state).get('3,0,0')).toEqual(['2,0,0', '3,0,0'])
      expect(search).toHaveBeenCalledTimes(1)
    } finally {
      search.mockRestore()
    }
  })

  it('复用静态邻接时门状态仍逐次生效，公开邻接表修改不污染缓存', () => {
    const level = fixture((b) => b.gate({ id: 'door', tile: [1, 0, 0], mode: 'toggle' }))
    const state = initialState(level)
    expect(walkGraph(level, state).get(state.at)).not.toContain('1,0,0')
    expect(reachableFrom(level, state).has('1,0,0')).toBe(false)
    state.gates.door = true
    const graph = walkGraph(level, state)
    expect(graph.get(state.at)).toContain('1,0,0')
    expect(reachableFrom(level, state).get('1,0,0')).toEqual(['1,0,0'])
    graph.get(state.at)!.splice(0)
    graph.delete('1,0,0')
    expect(walkGraph(level, state).get(state.at)).toContain('1,0,0')
    expect(walkGraph(level, state).has('1,0,0')).toBe(true)
    state.gates.door = false
    expect(walkGraph(level, state).get(state.at)).not.toContain('1,0,0')
    expect(reachableFrom(level, state).has('1,0,0')).toBe(false)
  })

  it('共享几何只按机关位置复用，公开集合及坐标改写不会污染后续查询', () => {
    const level = fixture()
    const state = initialState(level)
    const tiles = tilesOf(level, state)
    const original = [...tiles.get('0,0,0')!.pos]
    tiles.get('0,0,0')!.pos[0] = 99
    tiles.delete('1,0,0')
    const occupied = occupiedOf(level, state)
    occupied.clear()
    const visible = visibleTilesOf(level, state)
    visible.clear()
    expect(tilesOf(level, state).get('0,0,0')!.pos).toEqual(original)
    expect(tilesOf(level, state).has('1,0,0')).toBe(true)
    expect(occupiedOf(level, state).size).toBeGreaterThan(0)
    expect(visibleTilesOf(level, state).size).toBeGreaterThan(0)
    level.blocks.push({ pos: [99, 0, 99], kind: 'path', color: 'sand' })
    expect(tilesOf(level, initialState(level)).has('99,0,99')).toBe(true)
  })
  it('修改对外返回的路线或转移路线不会污染后续动作', () => {
    const level = fixture()
    const state = initialState(level)
    const routes = reachableFrom(level, state)
    routes.get('3,0,0')!.push('missing')
    routes.delete('1,0,0')
    const first = transitioned(applyAction(level, state, { type: 'walk', tileId: '3,0,0' }))
    expect(first.route).toEqual(['1,0,0', '2,0,0', '3,0,0'])
    first.route.push('missing')
    expect(transitioned(applyAction(level, state, { type: 'walk', tileId: '3,0,0' })).route).toEqual([
      '1,0,0',
      '2,0,0',
      '3,0,0',
    ])
  })

  it('所有目标路线与 findPath 完全一致，包括等长分岔、错觉连接和不可达路面', () => {
    const level = fixture((b) => b.path([99, 0, 99], 'sand'))
    const initial = initialState(level)
    const tiles = tilesOf(level, initial)
    for (const at of tiles.keys()) {
      const state = { ...initial, at }
      const graph = walkGraph(level, state)
      const routes = reachableFrom(level, state)
      for (const target of tiles.keys()) {
        expect(routes.get(target) ?? null).toEqual(findPath(graph, at, target))
      }
    }
  })

  it('每个列出的动作都合法，不包含当前位置', () => {
    const level = withGears()
    const state = initialState(level)
    const actions = legalActions(level, state)
    expect(actions).not.toContainEqual({ type: 'walk', tileId: state.at })
    expect(actions).toContainEqual({ type: 'walk', tileId: '6,2,2' })
    for (const action of actions) expect(applyAction(level, state, action)).not.toBeNull()
  })

  it.each(levels)('正式关卡 $id 的标准解法在规则层也能完成，路线与现有寻路一致', (level) => {
    let state = initialState(level)
    for (const step of level.solution) {
      const before = structuredClone(state)
      if (step.type === 'walk') {
        const tiles = tilesOf(level, state)
        const target = [...tiles.values()].find((tile) => cellId(tile.pos) === cellId(step.to))
        expect(target).toBeDefined()
        if (!target) throw new Error('解法目标不是路面')
        const graph = walkGraph(level, state)
        const result = transitioned(applyAction(level, state, { type: 'walk', tileId: target.id }))
        expect(result.route).toEqual(findPath(graph, state.at, target.id))
        expect(state).toEqual(before)
        state = result.state
      } else {
        const result = transitioned(applyAction(level, state, step))
        expect(state).toEqual(before)
        state = result.state
      }
    }
    expect(state.won).toBe(true)
  })

  it('通关后没有合法动作，直接调用状态转移也被拒绝', () => {
    const level = withGears()
    const state = transitioned(applyAction(level, initialState(level), { type: 'walk', tileId: '3,0,0' })).state
    expect(legalActions(level, state)).toEqual([])
    expect(applyAction(level, state, { type: 'walk', tileId: '2,0,0' })).toBeNull()
    expect(applyAction(level, state, { type: 'operate', mechanism: 'drive' })).toBeNull()
  })

  it('状态键与对象或集合插入顺序无关，但包含全部规则状态', () => {
    const state: GameState = {
      at: '0,0,0',
      rotator: { b: 1, a: 2 },
      mover: { d: { stopIndex: 1, direction: -1 }, c: { stopIndex: 0, direction: 1 } },
      orbs: ['orb-2', 'orb-1'],
      spentPlates: ['z', 'a'],
      won: false,
      gates: {},
      handleUses: {},
      crates: {},
      patrols: {},
    }
    const reordered: GameState = {
      ...state,
      rotator: { a: 2, b: 1 },
      mover: { c: state.mover.c, d: state.mover.d },
      orbs: ['orb-1', 'orb-2'],
      spentPlates: ['a', 'z'],
    }
    expect(stateKey(state)).toBe(stateKey(reordered))
    const changes: Partial<GameState>[] = [
      { at: '1,0,0' },
      { rotator: { ...state.rotator, a: 3 } },
      { mover: { ...state.mover, d: { stopIndex: 0, direction: -1 } } },
      { mover: { ...state.mover, d: { stopIndex: 1, direction: 1 } } },
      { orbs: ['orb-1'] },
      { spentPlates: ['a'] },
      { won: true },
      { gates: { gate: true } },
      { crates: { 'crate-0': '1,0,0' } },
      { handleUses: { drive: 1 } },
    ]
    for (const change of changes) expect(stateKey({ ...state, ...change })).not.toBe(stateKey(state))
  })
})

const newFixture = (build: (b: LevelBuilder) => void = () => {}) =>
  defineLevel({
    id: 'new-rules',
    title: '新机制测试',
    chapter: 4,
    solution: [],
    build: (b) => {
      for (let x = 0; x <= 4; x++) b.path([x, 0, 0], 'sand')
      b.path([0, 0, 1], 'sand')
      b.start([0, 0, 0])
      b.goal([4, 0, 0])
      build(b)
    },
  })
const newAct = (level: ReturnType<typeof newFixture>, state: ReturnType<typeof initialState>, action: Action) => {
  const result = applyAction(level, state, action)
  expect(result).not.toBeNull()
  return result!
}

describe('T6.6 新机制规则', () => {
  it('行走到灯笼时先触发终点压板，再判断通关', () => {
    const level = newFixture((b) => {
      b.gate({ id: 'gate', tile: [3, 0, 0], mode: 'toggle', initiallyOpen: true })
      b.plate({ id: 'pad', tile: [4, 0, 0], target: 'gate' })
    })
    const result = newAct(level, initialState(level), { type: 'walk', tileId: '4,0,0' })
    expect(result.plate).toBe('pad')
    expect(result.state.gates.gate).toBe(false)
    expect(result.state.won).toBe(true)
  })
  it('箱子挡住行走，推动跟进并收集原箱子格的光点，不收集箱子目标光点', () => {
    const level = newFixture((b) => {
      b.crate({ tile: [1, 0, 0] })
      b.orb({ tile: [1, 0, 0] })
      b.orb({ tile: [2, 0, 0] })
    })
    const state = initialState(level)
    expect(reachableFrom(level, state).has('2,0,0')).toBe(false)
    const result = newAct(level, state, { type: 'push', crate: 'crate-0' })
    expect(result.state.at).toBe('1,0,0')
    expect(result.state.crates['crate-0']).toBe('2,0,0')
    expect(result.collected).toEqual(['orb-0'])
    expect(result.route).toEqual(['1,0,0'])
    expect(result.pushed).toEqual({ crate: 'crate-0', from: '1,0,0', to: '2,0,0' })
    expect(state.crates['crate-0']).toBe('1,0,0')
  })
  it('箱子压住按住压板时开门，小人自己压着时寻路按关门处理', () => {
    const level = newFixture((b) => {
      b.plate({ id: 'pad', tile: [1, 0, 0], mode: 'hold', target: 'gate' })
      b.gate({ id: 'gate', tile: [3, 0, 0], mode: 'hold' })
    })
    const state = newAct(level, initialState(level), { type: 'walk', tileId: '1,0,0' }).state
    expect(reachableFrom(level, state).has('4,0,0')).toBe(false)
    const withCrate = { ...state, at: '2,0,0', crates: { 'crate-0': '1,0,0' } }
    expect(reachableFrom(level, withCrate).has('4,0,0')).toBe(true)
  })
  it('切换门可联动，门里有小人或箱子时关门无效，其他机关照常运动', () => {
    const level = newFixture((b) => {
      b.gate({ id: 'gate', tile: [2, 0, 0], mode: 'toggle', initiallyOpen: true })
      b.rotator({
        id: 'drive',
        pivot: [9, 0, 0],
        blocks: [],
        handle: { block: [0, 0, 0], face: 'z' },
        links: [{ target: 'gate' }],
      })
    })
    for (const state of [
      { ...initialState(level), at: '2,0,0' },
      { ...initialState(level), crates: { 'crate-0': '2,0,0' } },
    ]) {
      const result = newAct(level, state, { type: 'operate', mechanism: 'drive' })
      expect(result.state.gates.gate).toBe(true)
      expect(result.state.rotator.drive).toBe(1)
      expect(result.gatesChanged).toEqual([])
    }
    expect(newAct(level, initialState(level), { type: 'operate', mechanism: 'drive' }).state.gates.gate).toBe(false)
  })
  it('限次把手只消耗直接操作次数，压板触发不消耗次数', () => {
    const level = newFixture((b) => {
      b.mover({
        id: 'lift',
        origin: [8, 0, 0],
        axis: 'y',
        stops: [0, 1],
        blocks: [],
        handle: { block: [0, 0, 0], face: 'z', uses: 1 },
      })
      b.plate({ id: 'pad', tile: [1, 0, 0], target: 'lift' })
    })
    const state = newAct(level, initialState(level), { type: 'operate', mechanism: 'lift' }).state
    expect(state.handleUses.lift).toBe(1)
    expect(applyAction(level, state, { type: 'operate', mechanism: 'lift' })).toBeNull()
    expect(legalActions(level, state)).not.toContainEqual({ type: 'operate', mechanism: 'lift' })
    expect(newAct(level, state, { type: 'walk', tileId: '1,0,0' }).state.mover.lift.stopIndex).toBe(0)
  })
  it('单向格限制小人与箱子的进入方向，离开自由', () => {
    const level = newFixture((b) => {
      b.path([1, 0, 1], 'sand', { oneWay: '+b' })
      b.path([2, 0, 1], 'sand')
      b.crate({ tile: [1, 0, 0] })
    })
    expect(applyAction(level, initialState(level), { type: 'walk', tileId: '1,0,1' })).toBeNull()
    const state = { ...initialState(level), at: '2,0,1', crates: { 'crate-0': '1,0,1' } }
    expect(applyAction(level, state, { type: 'push', crate: 'crate-0' })).toBeNull()
    expect(reachableFrom(level, { ...initialState(level), at: '1,0,1', crates: {} }).has('0,0,1')).toBe(true)
    expect(reachableFrom(level, { ...initialState(level), at: '1,0,0', crates: {} }).get('1,0,1')).toEqual(['1,0,1'])
  })
  it('遮挡阻止进入但允许离开，机关转动可改变遮挡', () => {
    const level = newFixture((b) => {
      b.path([-1, 0, 0], 'sand')
      b.rotator({
        id: 'tower',
        pivot: [1, 1, 2],
        blocks: [{ offset: [1, 0, 0], kind: 'solid' }],
        handle: { block: [0, 0, 0], face: 'z' },
      })
    })
    const state = initialState(level)
    // (2,1,2) 不挡本行，转后 (1,1,1) 遮住起点。
    const after = newAct(level, state, { type: 'operate', mechanism: 'tower' }).state
    const hidden = { ...after, at: '1,0,0' }
    expect(visibleTilesOf(level, after).has('0,0,0')).toBe(false)
    expect(reachableFrom(level, hidden).has('0,0,0')).toBe(false)
    expect(reachableFrom(level, after).has('-1,0,0')).toBe(true)
    const restored = newAct(level, after, { type: 'operate', mechanism: 'tower' }).state
    expect(visibleTilesOf(level, restored).has('0,0,0')).toBe(true)
    expect(reachableFrom(level, { ...restored, at: '1,0,0' }).has('0,0,0')).toBe(true)
  })
  it('推动可跨错觉连接并推上机关，箱子随后随机关移动', () => {
    const level = defineLevel({
      id: 'push-illusion',
      title: '错觉推动',
      chapter: 4,
      solution: [],
      build: (b) => {
        b.path([0, 0, 0], 'sand')
        b.path([1, 0, 0], 'sand')
        b.path([0, 0, 1], 'sand')
        b.mover({
          id: 'lift',
          origin: [4, 2, 2],
          axis: 'y',
          stops: [0, 1],
          blocks: [{ offset: [0, 0, 0] }],
          handle: { block: [0, 0, 0], face: 'z' },
        })
        b.crate({ tile: [1, 0, 0] })
        b.start([0, 0, 0])
        b.goal([0, 0, 1])
      },
    })
    const pushed = newAct(level, initialState(level), { type: 'push', crate: 'crate-0' }).state
    expect(pushed.crates['crate-0']).toBe('lift#0')
    const carried = newAct(level, pushed, { type: 'operate', mechanism: 'lift' }).state
    expect(tilesOf(level, carried).get(carried.crates['crate-0'])?.pos).toEqual([4, 3, 2])
  })

  it.each(['没有路面', '箱子', '头顶积木', '关门', '遮挡', '单向目标', '单向跟进'] as const)(
    '前方受阻不能推动：%s',
    (obstacle) => {
      const level = newFixture((b) => b.crate({ tile: [1, 0, 0] }))
      if (obstacle === '没有路面') level.blocks = level.blocks.filter((block) => block.pos[0] !== 2)
      if (obstacle === '箱子') level.crates!.push({ tile: [2, 0, 0] })
      if (obstacle === '头顶积木') level.blocks.push({ pos: [2, 1, 0], kind: 'solid', color: 'sand' })
      if (obstacle === '遮挡') level.blocks.push({ pos: [3, 1, 1], kind: 'solid', color: 'sand' })
      if (obstacle === '关门') level.mechanisms.push({ type: 'gate', id: 'gate', tile: [2, 0, 0], mode: 'toggle' })
      if (obstacle.startsWith('单向'))
        level.blocks.find((block) => block.pos[0] === (obstacle === '单向目标' ? 2 : 1) && block.pos[2] === 0)!.oneWay =
          '-a'
      const state = initialState(level)
      expect(applyAction(level, state, { type: 'push', crate: 'crate-0' })).toBeNull()
      expect(legalActions(level, state)).not.toContainEqual({ type: 'push', crate: 'crate-0' })
    },
  )

  it('按住门在箱子或小人离开门格后才关闭', () => {
    const level = newFixture((b) => {
      b.crate({ tile: [1, 0, 0] })
      b.plate({ id: 'pad', tile: [1, 0, 0], mode: 'hold', target: 'gate' })
      b.gate({ id: 'gate', tile: [2, 0, 0], mode: 'hold' })
    })
    let state = initialState(level)
    expect(gatesOf(level, state).gate).toBe(true)
    state = newAct(level, state, { type: 'push', crate: 'crate-0' }).state
    expect(gatesOf(level, state).gate).toBe(true)
    state = newAct(level, state, { type: 'push', crate: 'crate-0' }).state
    expect(gatesOf(level, state).gate).toBe(true)
    const left = newAct(level, state, { type: 'walk', tileId: '1,0,0' })
    expect(gatesOf(level, left.state).gate).toBe(true)
    const closed = newAct(level, left.state, { type: 'walk', tileId: '0,0,0' })
    expect(gatesOf(level, closed.state).gate).toBe(false)
    expect(closed.gatesChanged).toEqual(['gate'])
  })

  it('自己压着按住压板时，也不能把箱子推进对应的门', () => {
    const level = newFixture((b) => {
      b.crate({ tile: [2, 0, 0] })
      b.plate({ id: 'pad', tile: [1, 0, 0], mode: 'hold', target: 'gate' })
      b.gate({ id: 'gate', tile: [3, 0, 0], mode: 'hold' })
    })
    const state = newAct(level, initialState(level), { type: 'walk', tileId: '1,0,0' }).state
    expect(gatesOf(level, state).gate).toBe(true)
    expect(applyAction(level, state, { type: 'push', crate: 'crate-0' })).toBeNull()
  })

  it('推动不触发触发压板，到灯笼也不判通关', () => {
    const level = newFixture((b) => {
      b.crate({ tile: [1, 0, 0] })
      b.plate({ id: 'pad', tile: [1, 0, 0], target: 'gate' })
      b.gate({ id: 'gate', tile: [3, 0, 0], mode: 'toggle' })
    })
    level.goal = [2, 0, 0]
    let state = newAct(level, initialState(level), { type: 'push', crate: 'crate-0' }).state
    expect(state.gates.gate).toBe(false)
    state = { ...state, gates: { gate: true } }
    const pushed = newAct(level, state, { type: 'push', crate: 'crate-0' })
    expect(pushed.state.at).toBe('2,0,0')
    expect(pushed.state.won).toBe(false)
    expect(pushed.plate).toBeNull()
  })
})

describe('巡逻者', () => {
  const patrolLevel = (build: (b: LevelBuilder) => void = () => {}) =>
    defineLevel({
      id: 'patrol-rules',
      title: '巡逻测试',
      chapter: 5,
      solution: [],
      build: (b) => {
        for (let x = 0; x < 4; x++) b.path([x, 0, 0], 'sand')
        b.path([0, 0, 1], 'sand')
        b.start([0, 0, 1])
        b.goal([3, 0, 0])
        b.rotator({ id: 'clock', pivot: [5, 0, 0], blocks: [], handle: { block: [0, 0, 1], face: 'z' } })
        b.patrol({ route: [{ tile: [0, 0, 0] }, { tile: [1, 0, 0] }, { tile: [2, 0, 0] }], mode: 'pingpong' })
        build(b)
      },
    })
  const tick = (level: ReturnType<typeof patrolLevel>, state: GameState) =>
    transitioned(applyAction(level, state, { type: 'operate', mechanism: 'clock' }))
  it('往返到端点先反向，每个玩家动作只走一格；不会收光或触发压板', () => {
    const level = patrolLevel((b) => {
      b.orb({ tile: [1, 0, 0] })
      b.plate({ id: 'p', tile: [1, 0, 0], target: 'clock' })
    })
    let state = initialState(level)
    const original = structuredClone(state)
    for (const [index, direction] of [
      [1, 1],
      [2, 1],
      [1, -1],
      [0, -1],
      [1, 1],
    ]) {
      const next = tick(level, state)
      expect(next.state.patrols['patrol-0']).toEqual({ index, direction })
      expect(next.patrolMoves).toHaveLength(1)
      expect(next.plate).toBeNull()
      expect(next.collected).toEqual([])
      state = next.state
    }
    expect(original.patrols['patrol-0']).toEqual({ index: 0, direction: 1 })
  })
  it('环形路线首尾相接，非法指令不推进巡逻', () => {
    const level = patrolLevel()
    level.patrols![0] = {
      route: [{ tile: [0, 0, 0] }, { tile: [1, 0, 0] }, { tile: [1, 0, 1] }, { tile: [0, 0, 1] }],
      mode: 'loop',
    }
    level.blocks.push({ pos: [1, 0, 1], kind: 'path', color: 'sand' })
    // 玩家不占环线，手写无关位置只检验环形游标。
    let state = { ...initialState(level), at: '3,0,0' }
    for (const index of [1, 2, 3, 0]) {
      state = tick(level, state).state
      expect(state.patrols['patrol-0'].index).toBe(index)
    }
    expect(applyAction(level, state, { type: 'walk', tileId: '0,0,0' })).toBeNull()
  })
  it.each(['player', 'crate', 'gate', 'oneway', 'hidden', 'disconnected'] as const)(
    '%s挡住下一格时原地等待',
    (obstacle) => {
      const level = patrolLevel((b) => {
        if (obstacle === 'crate') b.crate({ tile: [1, 0, 0] })
        if (obstacle === 'gate') b.gate({ id: 'g', tile: [1, 0, 0], mode: 'toggle' })
        if (obstacle === 'hidden') b.solid([2, 1, 1], 'rose')
      })
      if (obstacle === 'oneway') level.blocks.find((b) => cellId(b.pos) === '1,0,0')!.oneWay = '-a'
      if (obstacle === 'disconnected') level.patrols![0].route[1] = { tile: [2, 0, 0] }
      const state = initialState(level)
      if (obstacle === 'player') state.at = '1,0,0'
      const result = tick(level, state)
      expect(result.patrolMoves).toEqual([])
      expect(result.state.patrols['patrol-0'].index).toBe(0)
    },
  )
  it('玩家和箱子不能进入巡逻占位，离开遮挡格允许且不伤害玩家', () => {
    const level = patrolLevel((b) => b.crate({ tile: [2, 0, 0] }))
    const state = initialState(level)
    expect(reachableFrom(level, state).has('0,0,0')).toBe(false)
    state.at = '3,0,0'
    state.patrols['patrol-0'].index = 1
    expect(applyAction(level, state, { type: 'push', crate: 'crate-0' })).toBeNull()
    const blocked = patrolLevel((b) => b.solid([2, 1, 1], 'rose'))
    blocked.patrols![0].route = [{ tile: [1, 0, 0] }, { tile: [0, 0, 0] }]
    expect(tick(blocked, initialState(blocked)).state.patrols['patrol-0'].index).toBe(1)
  })
  it('巡逻压板开门，玩家离板寻路仍能用其压力，门内占位阻止关闭', () => {
    const level = patrolLevel((b) => {
      b.plate({ id: 'pad', tile: [1, 0, 0], target: 'g', mode: 'hold' })
      b.gate({ id: 'g', tile: [2, 0, 0], mode: 'hold' })
    })
    const a = tick(level, initialState(level)).state
    expect(gatesOf(level, a, true).g).toBe(true)
    expect(reachableFrom(level, a).has('3,0,0')).toBe(false) // 巡逻者仍挡住窄廊。
    const b = tick(level, a).state
    expect(b.patrols['patrol-0'].index).toBe(2)
    expect(gatesOf(level, b).g).toBe(true)
    const c = tick(level, b).state
    expect(gatesOf(level, c).g).toBe(true) // 返回压板。
    const d = tick(level, { ...c, patrols: { 'patrol-0': { index: 1, direction: -1 } } }).state
    expect(gatesOf(level, d).g).toBe(false)
  })
  it('随机关移动后再判断路线连接；位置与方向都进入状态键', () => {
    const level = patrolLevel((b) =>
      b.mover({
        id: 'lift',
        origin: [0, 0, 2],
        axis: 'x',
        stops: [0, 2],
        blocks: [{ offset: [0, 0, 0] }],
        handle: { block: [0, 0, 1], face: 'z' },
      }),
    )
    level.patrols![0].route = [{ mechanism: 'lift', block: 0 }, { tile: [0, 0, 1] }]
    const state = initialState(level)
    const result = transitioned(applyAction(level, state, { type: 'operate', mechanism: 'lift' }))
    expect(result.state.patrols['patrol-0'].index).toBe(0)
    expect(tilesOf(level, result.state).get('lift#0')!.pos).toEqual([2, 0, 2])
    expect(stateKey(state)).not.toBe(stateKey({ ...state, patrols: { 'patrol-0': { index: 0, direction: -1 } } }))
    expect(stateKey(state)).not.toBe(stateKey({ ...state, patrols: { 'patrol-0': { index: 1, direction: 1 } } }))
  })
})
