import { describe, expect, it } from 'vitest'
import { defineLevel } from '../levels/builders'
import { levels } from '../levels'
import { applyAction, initialState, legalActions, stateKey, type Action, type GameState } from './rules'
import { analyze, buildPolicy, nextHint, randomWinRate, StateLimitError } from './solver'
import { runSolution } from './solve'
import { validateLevel } from './validate'

const straight = defineLevel({
  id: 'solver-straight',
  title: '直线测试',
  chapter: 1,
  build: (b) => {
    for (let x = 0; x <= 2; x++) b.path([x, 0, 0], 'sand')
    b.path([0, 0, 1], 'sand')
    b.orb({ tile: [1, 0, 0] })
    b.orb({ tile: [0, 0, 1], optional: true })
    b.start([0, 0, 0])
    b.goal([2, 0, 0])
  },
  solution: [{ type: 'walk', to: [2, 0, 0] }],
})

const riding = defineLevel({
  id: 'solver-riding',
  title: '乘坐测试',
  chapter: 2,
  build: (b) => {
    b.path([0, 0, 0], 'sand')
    b.solid([2, 0, 0], 'teal')
    b.path([2, 0, 2], 'sand')
    b.path([2, 0, 3], 'sand')
    b.rotator({
      id: 'bridge',
      pivot: [2, 0, 0],
      blocks: [{ offset: [-1, 0, 0] }],
      handle: { block: [0, 0, 0], face: 'z' },
    })
    b.orb({ mechanism: 'bridge', block: 0 })
    b.orb({ tile: [2, 0, 3], optional: true })
    b.start([0, 0, 0])
    b.goal([2, 0, 2])
  },
  solution: [
    { type: 'walk', to: [1, 0, 0] },
    { type: 'operate', mechanism: 'bridge' },
    { type: 'walk', to: [2, 0, 2] },
  ],
})

const trap = defineLevel({
  id: 'solver-trap',
  title: '一次性压板测试',
  chapter: 4,
  build: (b) => {
    b.path([-1, 0, 0], 'sand')
    b.path([0, 0, 0], 'sand')
    b.path([2, 0, 0], 'sand')
    b.mover({ id: 'bridge', origin: [1, 0, 0], axis: 'x', stops: [0, 4], blocks: [{ offset: [0, 0, 0] }] })
    b.plate({ id: 'trap', tile: [-1, 0, 0], target: 'bridge', once: true })
    b.orb({ tile: [-1, 0, 0], optional: true })
    b.start([0, 0, 0])
    b.goal([2, 0, 0])
  },
  solution: [{ type: 'walk', to: [2, 0, 0] }],
})

const fixtures = [
  {
    level: straight,
    minActions: 1,
    minActionsAll: 2,
    deadEndStates: 0,
    tradeoffs: 0,
    first: { type: 'walk', tileId: '2,0,0' },
  },
  {
    level: riding,
    minActions: 3,
    minActionsAll: 4,
    deadEndStates: 0,
    tradeoffs: 1,
    first: { type: 'walk', tileId: 'bridge#0' },
  },
  {
    level: trap,
    minActions: 1,
    minActionsAll: null,
    deadEndStates: 2,
    tradeoffs: 0,
    first: { type: 'walk', tileId: '2,0,0' },
  },
] as const

const followPolicy = (level: typeof straight, state: GameState, policy: Map<string, Action | null>) => {
  const visited = new Set<string>()
  while (!state.won) {
    const key = stateKey(state)
    expect(visited.has(key)).toBe(false)
    visited.add(key)
    const action = policy.get(key)
    expect(action).toBeTruthy()
    if (!action) throw new Error('可解状态缺少策略')
    const transition = applyAction(level, state, action)
    expect(transition).not.toBeNull()
    state = transition!.state
  }
  return visited.size
}

describe('求解器指标与提示', () => {
  it('推箱子压住按住压板后绕行过门，最优解需要推动且解法校验一致', () => {
    const level = defineLevel({
      id: 'solver-crate',
      title: '推箱子测试',
      chapter: 4,
      solution: [
        { type: 'push', crate: 'crate-0' },
        { type: 'walk', to: [4, 0, 0] },
      ],
      build: (b) => {
        for (let x = 0; x <= 4; x++) b.path([x, 0, 0], 'sand')
        for (let x = 1; x <= 3; x++) b.path([x, 0, 1], 'sand')
        b.crate({ tile: [1, 0, 0] })
        b.plate({ id: 'pad', tile: [2, 0, 0], mode: 'hold', target: 'gate' })
        b.gate({ id: 'gate', tile: [3, 0, 0], mode: 'hold' })
        b.start([0, 0, 0])
        b.goal([4, 0, 0])
      },
    })
    expect(analyze(level)).toMatchObject({ minActions: 2, minActionsAll: 2 })
    expect(nextHint(level, initialState(level))).toEqual({ type: 'push', crate: 'crate-0' })
    expect(followPolicy(level, initialState(level), buildPolicy(level))).toBe(2)
    expect(runSolution(level).ok).toBe(true)
    expect(validateLevel(level)).toEqual([])
  })

  it('主线搜索超过状态上限时停止，同一规模在挑战关允许的范围内', () => {
    const level = defineLevel({
      id: 'solver-limit',
      title: '规模测试',
      chapter: 5,
      solution: [],
      build: (b) => {
        b.path([0, 0, 0], 'sand')
        b.path([9, 0, 0], 'sand')
        b.rotator({ id: 'drive', pivot: [8, 0, 0], blocks: [], handle: { block: [0, 0, 0], face: 'z', uses: 30000 } })
        b.start([0, 0, 0])
        b.goal([9, 0, 0])
      },
    })
    expect(() => analyze(level)).toThrow(StateLimitError)
    expect(validateLevel(level)).toContainEqual(expect.objectContaining({ check: '规模上限', cell: level.id }))
    expect(analyze({ ...level, challenge: true })).toMatchObject({ reachableStates: 30001, minActions: null })
  })
  it.each(fixtures)('$level.title：精确指标、第一步提示与两秒性能预算', (fixture) => {
    const start = performance.now()
    const metrics = analyze(fixture.level)
    expect(performance.now() - start).toBeLessThan(2000)
    expect(metrics).toMatchObject({
      minActions: fixture.minActions,
      minActionsAll: fixture.minActionsAll,
      deadEndStates: fixture.deadEndStates,
      tradeoffs: fixture.tradeoffs,
      illusions: 0,
    })
    expect(nextHint(fixture.level, initialState(fixture.level))).toEqual(fixture.first)
    const policy = buildPolicy(fixture.level)
    expect(policy.get(stateKey(initialState(fixture.level)))).toEqual(fixture.first)
    expect(followPolicy(fixture.level, initialState(fixture.level), policy)).toBe(fixture.minActions)
    expect(metrics.reachableStates).toBe(policy.size)
  })

  it('一次性压板之后有两个不可挽回的状态，通关状态与死局提示均为 null', () => {
    const policy = buildPolicy(trap)
    expect(analyze(trap).reachableStates).toBe(5)
    const dead = applyAction(trap, initialState(trap), { type: 'walk', tileId: '-1,0,0' })!.state
    expect(nextHint(trap, dead)).toBeNull()
    expect(policy.get(stateKey(dead))).toBeNull()
    const won = applyAction(trap, initialState(trap), { type: 'walk', tileId: '2,0,0' })!.state
    expect(nextHint(trap, won)).toBeNull()
    expect(policy.get(stateKey(won))).toBeNull()
  })

  it('从乘坐后的当前状态求最优下一步，不回到开局', () => {
    const aboard = applyAction(riding, initialState(riding), { type: 'walk', tileId: 'bridge#0' })!.state
    expect(nextHint(riding, aboard)).toEqual({ type: 'operate', mechanism: 'bridge' })
    const moved = applyAction(riding, aboard, { type: 'operate', mechanism: 'bridge' })!.state
    expect(nextHint(riding, moved)).toEqual({ type: 'walk', tileId: '2,0,2' })
  })

  it('没有出口时返回无解，全部可达状态都是死局', () => {
    const level = { ...straight, goal: [99, 0, 99] as [number, number, number], solution: [] }
    const metrics = analyze(level)
    expect(metrics.minActions).toBeNull()
    expect(metrics.minActionsAll).toBeNull()
    expect(metrics.deadEndStates).toBe(metrics.reachableStates)
    expect([...buildPolicy(level).values()].every((action) => action === null)).toBe(true)
    expect(nextHint(level, initialState(level))).toBeNull()
    expect(randomWinRate(level, { runs: 10, maxActions: 10, seed: 1 })).toBe(0)
  })

  it('只有增加或只有减少可达路面的操作不算取舍', () => {
    const level = {
      ...riding,
      solution: [
        ...Array.from({ length: 4 }, () => ({ type: 'operate' as const, mechanism: 'bridge' })),
        ...riding.solution,
      ],
    }
    expect(analyze(level).tradeoffs).toBe(1)
  })

  it('按规则层路线统计错觉连接次数', () => {
    const level = defineLevel({
      id: 'solver-illusion',
      title: '错觉测试',
      chapter: 1,
      build: (b) => {
        b.path([0, 0, 0], 'sand')
        b.path([3, 2, 2], 'sand')
        b.path([6, 4, 4], 'sand')
        b.start([0, 0, 0])
        b.goal([6, 4, 4])
      },
      solution: [{ type: 'walk', to: [6, 4, 4] }],
    })
    expect(analyze(level)).toMatchObject({ minActions: 1, minActionsAll: 1, illusions: 2, tradeoffs: 0 })
  })

  it('策略覆盖每个可达可解状态，不包含非法动作，不改变输入关卡或状态', () => {
    const before = structuredClone(riding)
    const initial = initialState(riding)
    const original = structuredClone(initial)
    const policy = buildPolicy(riding)
    const queue = [initial]
    const seen = new Set([stateKey(initial)])
    for (let index = 0; index < queue.length; index++) {
      const state = queue[index]
      if (!state.won) followPolicy(riding, state, policy)
      for (const action of legalActions(riding, state)) {
        const next = applyAction(riding, state, action)!.state
        const key = stateKey(next)
        if (!seen.has(key)) {
          seen.add(key)
          queue.push(next)
        }
      }
    }
    expect(policy.size).toBe(seen.size)
    expect(initial).toEqual(original)
    expect(riding).toEqual(before)
  })
})

describe('正式关卡求解与性能', () => {
  it.each(levels)('$id 在两秒内求出与标准解法等长的最优解', (level) => {
    const started = performance.now()
    const metrics = analyze(level)
    expect(performance.now() - started).toBeLessThan(2000)
    expect(metrics.minActions).not.toBeNull()
    expect(metrics.minActions).toBe(level.solution.length)
    expect(metrics.minActionsAll).toBeGreaterThanOrEqual(metrics.minActions!)
  })
})

describe('固定种子随机通关率', () => {
  it('相同种子结果一致，代理在所有合法动作中均匀选择', () => {
    const options = { runs: 500, maxActions: 1, seed: 1234 }
    const first = randomWinRate(straight, options)
    expect(randomWinRate(straight, options)).toBe(first)
    expect(first).toBeGreaterThan(0.25)
    expect(first).toBeLessThan(0.42)
    const rates = [1, 2, 3, 4].map((seed) => randomWinRate(straight, { ...options, seed }))
    expect(new Set(rates).size).toBeGreaterThan(1)
  })

  it('步数不足或无解时不能通关，足够步数时直线最终可通关', () => {
    expect(randomWinRate(straight, { runs: 100, maxActions: 0, seed: 1 })).toBe(0)
    expect(randomWinRate(riding, { runs: 100, maxActions: 2, seed: 1 })).toBe(0)
    expect(randomWinRate(straight, { runs: 100, maxActions: 100, seed: 1 })).toBe(1)
  })

  it('拒绝无效模拟次数和步数预算', () => {
    for (const options of [
      { runs: 0, maxActions: 1 },
      { runs: 1.5, maxActions: 1 },
      { runs: 1, maxActions: -1 },
    ]) {
      expect(() => randomWinRate(straight, { ...options, seed: 1 })).toThrow(RangeError)
    }
  })
})
