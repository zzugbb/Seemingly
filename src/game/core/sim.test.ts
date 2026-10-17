import { describe, expect, it } from 'vitest'
import { defineLevel, type LevelBuilder } from '../levels/builders'
import { cellId, surfaceY } from './iso'
import { applyAction, initialState } from './rules'
import { levels } from '../levels'
import { LevelSim, type SimEvent } from './sim'

const level = defineLevel({
  id: 'sim-fixture',
  title: '模拟',
  chapter: 1,
  build: (b) => {
    b.path([0, 0, 0], 'terracotta')
    b.path([1, 0, 0], 'terracotta')
    b.path([2, 0, 0], 'terracotta')
    b.path([3, 0, 0], 'terracotta')
    b.path([4, 0, 0], 'teal')
    b.path([0, 2, 0], 'sand')
    b.rotator({
      id: 'bridge',
      pivot: [4, 0, 0],
      blocks: [{ offset: [1, 0, 0] }],
      handle: { block: [4, 0, 0], face: 'x' },
    })
    b.plate({ id: 'pad', tile: [2, 0, 0], target: 'bridge' })
    b.mover({
      id: 'lift',
      origin: [0, 5, 0],
      axis: 'y',
      stops: [0, 2],
      blocks: [{ offset: [0, 0, 0] }],
      handle: { block: [0, 4, 0], face: 'z' },
    })
    b.solid([0, 4, 0], 'teal')
    b.start([0, 0, 0])
    b.goal([3, 0, 0])
  },
  solution: [{ type: 'walk', to: [3, 0, 0] }],
})

const settle = (sim: LevelSim): SimEvent[] => {
  const events: SimEvent[] = []
  for (let frame = 0; frame < 800 && !sim.isIdle(); frame++) events.push(...sim.update(1 / 30))
  expect(sim.isIdle()).toBe(true)
  return events
}

describe('模拟器', () => {
  it('行走', () => {
    const sim = new LevelSim(level)
    const target = cellId([1, 0, 0])
    expect(sim.command({ type: 'walk', tileId: target })).toBe('ok')
    expect(sim.isIdle()).toBe(false)
    const events = settle(sim)
    expect(events[0]).toEqual({ type: 'walk-start', route: [target] })
    expect(events).toContainEqual({ type: 'step', tileId: target })
    expect(sim.characterPose()).toMatchObject({ position: [1, surfaceY(0), 0], walking: false })
    expect(sim.status).toBe('playing')
  })

  it('行走途中改目的地，当前这一格走完后走新路线', () => {
    const sim = new LevelSim(level)
    expect(sim.command({ type: 'walk', tileId: cellId([3, 0, 0]) })).toBe('ok')
    for (let frame = 0; frame < 4; frame++) sim.update(1 / 30)
    expect(sim.characterPose().walking).toBe(true)
    expect(sim.command({ type: 'walk', tileId: cellId([1, 0, 0]) })).toBe('ok')
    settle(sim)
    expect(sim.characterPose().position).toEqual([1, surfaceY(0), 0])
    expect(sim.status).toBe('playing')
  })

  it('走不通', () => {
    const sim = new LevelSim(level)
    expect(sim.command({ type: 'walk', tileId: cellId([0, 2, 0]) })).toBe('unreachable')
    expect(sim.isIdle()).toBe(true)
    expect(sim.characterPose().position).toEqual([0, surfaceY(0), 0])
  })

  it('机关运动中拒绝指令', () => {
    const sim = new LevelSim(level)
    expect(sim.command({ type: 'operate', mechanism: 'bridge' })).toBe('ok')
    const started = sim.update(1 / 30)
    expect(started).toContainEqual({ type: 'mechanism-start', id: 'bridge' })
    expect(sim.command({ type: 'walk', tileId: cellId([1, 0, 0]) })).toBe('busy')
    expect(sim.command({ type: 'operate', mechanism: 'bridge' })).toBe('busy')
    expect(sim.tiles().get('bridge#0')?.pos).toEqual([5, 0, 0])
    const pose = sim.mechanismPose('bridge')
    expect('rotationY' in pose && pose.rotationY).toBeGreaterThan(0)
  })

  it('站在转盘上可以乘坐，位置和朝向随动画变化，格子编号不变', () => {
    const sim = new LevelSim(level)
    expect(sim.command({ type: 'walk', tileId: 'bridge#0' })).toBe('ok')
    settle(sim)
    expect(sim.tiles().get('bridge#0')?.pos).toEqual([5, 0, 0])
    const before = structuredClone(sim.state())
    const heading = sim.characterPose().heading
    expect(sim.command({ type: 'operate', mechanism: 'bridge' })).toBe('ok')
    sim.update(0)
    for (let frame = 0; frame < 15; frame++) sim.update(0.03)
    const pose = sim.characterPose()
    expect(pose.position[0]).toBeCloseTo(4 + Math.SQRT1_2)
    expect(pose.position[1]).toBe(surfaceY(0))
    expect(pose.position[2]).toBeCloseTo(-Math.SQRT1_2)
    expect(pose.heading).toBeCloseTo(heading + Math.PI / 4)
    expect(pose.walking).toBe(false)
    expect(sim.state()).toEqual(before)
    settle(sim)
    expect(sim.state().at).toBe('bridge#0')
    expect(sim.characterPose().position).toEqual([4, surfaceY(0), -1])
    expect(sim.characterPose().heading).toBeCloseTo(heading + Math.PI / 2)
    expect(sim.status).toBe('playing')
  })

  it('压板触发', () => {
    const sim = new LevelSim(level)
    expect(sim.command({ type: 'walk', tileId: cellId([2, 0, 0]) })).toBe('ok')
    const events = settle(sim)
    expect(events).toContainEqual({ type: 'plate', id: 'pad', triggered: true })
    expect(events).toContainEqual({ type: 'mechanism-end', id: 'bridge' })
    expect(sim.tiles().get('bridge#0')?.pos).toEqual([4, 0, -1])
    expect(sim.characterPose().position).toEqual([2, surfaceY(0), 0])
  })

  it('平移台按格子发出节拍', () => {
    const sim = new LevelSim(level)
    expect(sim.command({ type: 'operate', mechanism: 'lift' })).toBe('ok')
    const events = settle(sim)
    expect(events.filter((event) => event.type === 'mechanism-tick')).toHaveLength(2)
    expect(sim.mechanismPose('lift')).toEqual({ offset: [0, 2, 0] })
  })

  it('通关后拒绝指令', () => {
    const sim = new LevelSim(level)
    expect(sim.command({ type: 'walk', tileId: cellId([3, 0, 0]) })).toBe('ok')
    const events = settle(sim)
    expect(events.some((event) => event.type === 'plate')).toBe(false)
    expect(events).toContainEqual({ type: 'won' })
    expect(sim.status).toBe('won')
    expect(sim.isIdle()).toBe(true)
    expect(sim.command({ type: 'walk', tileId: cellId([0, 0, 0]) })).toBe('busy')
    expect(sim.command({ type: 'operate', mechanism: 'bridge' })).toBe('busy')
  })
})

const orbLevel = () => {
  const fixture = structuredClone(level)
  fixture.orbs = [{ tile: [1, 0, 0] }, { tile: [4, 0, 0], optional: true }]
  const plate = fixture.mechanisms.find((mechanism) => mechanism.type === 'plate')!
  if (plate.type !== 'plate') throw new Error('缺少压板')
  plate.once = true
  return fixture
}

const linkedLevel = () => {
  const fixture = orbLevel()
  const bridge = fixture.mechanisms.find((mechanism) => mechanism.type === 'rotator')!
  if (bridge.type !== 'rotator') throw new Error('缺少转盘')
  bridge.links = [{ target: 'lift' }]
  const lift = fixture.mechanisms.find((mechanism) => mechanism.type === 'mover')!
  if (lift.type !== 'mover') throw new Error('缺少平移台')
  lift.stops = [0, 4]
  return fixture
}

describe('规则层驱动、联动与事件', () => {
  it('无把手与未知目标分别返回原因，非法动作不增加步数', () => {
    const fixture = structuredClone(level)
    const bridge = fixture.mechanisms.find((mechanism) => mechanism.type === 'rotator')!
    if (bridge.type !== 'rotator') throw new Error('缺少转盘')
    delete bridge.handle
    const sim = new LevelSim(fixture)
    expect(sim.command({ type: 'operate', mechanism: 'bridge' })).toBe('no-handle')
    expect(sim.command({ type: 'operate', mechanism: 'pad' })).toBe('unknown-target')
    expect(sim.command({ type: 'operate', mechanism: 'missing' })).toBe('unknown-target')
    expect(sim.command({ type: 'walk', tileId: '0,0,0' })).toBe('unreachable')
    expect(sim.steps()).toBe(0)
    expect(sim.canUndo()).toBe(false)
    expect(sim.undo()).toBe(false)
  })

  it('联动同时开始，较短机关先结束，全部到位后才提交状态并接受新指令', () => {
    const fixture = linkedLevel()
    const sim = new LevelSim(fixture)
    const before = structuredClone(sim.state())
    const transition = applyAction(fixture, before, { type: 'operate', mechanism: 'bridge' })!
    expect(sim.command({ type: 'operate', mechanism: 'bridge' })).toBe('ok')
    expect(sim.undo()).toBe(false)
    expect(sim.update(0)).toEqual([
      { type: 'mechanism-start', id: 'bridge' },
      { type: 'mechanism-start', id: 'lift' },
    ])
    const events: SimEvent[] = []
    for (let frame = 0; frame < 30; frame++) events.push(...sim.update(0.03))
    expect(events).toContainEqual({ type: 'mechanism-end', id: 'bridge' })
    expect(events).not.toContainEqual({ type: 'mechanism-end', id: 'lift' })
    expect(sim.state()).toEqual(before)
    expect(sim.command({ type: 'walk', tileId: '1,0,0' })).toBe('busy')
    expect(sim.undo()).toBe(false)
    expect(sim.canUndo()).toBe(false)
    expect(settle(sim)).toContainEqual({ type: 'mechanism-end', id: 'lift' })
    expect(sim.state()).toEqual(transition.state)
    expect(sim.steps()).toBe(1)
  })

  it('逆向联动连续插值，乘坐平移台时小人和机关上的光点一起移动', () => {
    const fixture = linkedLevel()
    fixture.start = [0, 5, 0]
    fixture.orbs = [{ mechanism: 'lift', block: 0 }]
    const lift = fixture.mechanisms.find((mechanism) => mechanism.type === 'mover')!
    if (lift.type !== 'mover') throw new Error('缺少平移台')
    lift.links = [{ target: 'bridge', reverse: true }]
    const sim = new LevelSim(fixture)
    expect(sim.command({ type: 'operate', mechanism: 'lift' })).toBe('ok')
    sim.update(0)
    for (let frame = 0; frame < 15; frame++) sim.update(0.03)
    const bridgePose = sim.mechanismPose('bridge')
    expect('rotationY' in bridgePose && bridgePose.rotationY).toBeCloseTo(-Math.PI / 4)
    const height = sim.characterPose().position[1]
    expect(height).toBeGreaterThan(surfaceY(5))
    expect(height).toBeLessThan(surfaceY(9))
    expect(sim.orbPose('orb-0').position).toEqual([0, height + 0.35, 0])
    settle(sim)
    expect(sim.state().at).toBe('lift#0')
    expect(sim.characterPose().position).toEqual([0, surfaceY(9), 0])
    expect(sim.orbProgress().collected).toBe(0)
  })

  it('光点只在动画进入该格时发出事件，路线结束才提交规则状态', () => {
    const fixture = orbLevel()
    const sim = new LevelSim(fixture)
    expect(sim.orbProgress()).toEqual({ required: 1, requiredCollected: 0, total: 2, collected: 0 })
    expect(sim.command({ type: 'walk', tileId: '3,0,0' })).toBe('ok')
    const events: SimEvent[] = []
    for (let frame = 0; frame < 30 && !events.some((event) => event.type === 'orb'); frame++)
      events.push(...sim.update(1 / 30))
    expect(events.slice(-2)).toEqual([
      { type: 'step', tileId: '1,0,0' },
      { type: 'orb', id: 'orb-0' },
    ])
    expect(sim.state()).toEqual(initialState(fixture))
    expect(sim.orbPose('orb-0').collected).toBe(true)
    expect(sim.orbProgress()).toEqual({ required: 1, requiredCollected: 1, total: 2, collected: 1 })
    expect(settle(sim)).toContainEqual({ type: 'won' })
    expect(sim.state().orbs).toEqual(['orb-0'])
  })

  it('必需光点不足时发出 goal-locked，仍可继续行走', () => {
    const fixture = orbLevel()
    fixture.orbs[0] = { tile: [4, 0, 0] }
    const sim = new LevelSim(fixture)
    expect(sim.command({ type: 'walk', tileId: '3,0,0' })).toBe('ok')
    const locked = settle(sim)
    expect(locked).toContainEqual({ type: 'goal-locked', missing: 1 })
    expect(locked).not.toContainEqual({ type: 'won' })
    expect(sim.command({ type: 'walk', tileId: '4,0,0' })).toBe('ok')
    settle(sim)
    expect(sim.command({ type: 'walk', tileId: '3,0,0' })).toBe('ok')
    expect(settle(sim)).toContainEqual({ type: 'won' })
  })
})

describe('撤销与行走改道', () => {
  it('刚收到指令和相邻两段之间都能改道，停在刚到的格子时立即结束行走', () => {
    const sim = new LevelSim(orbLevel())
    sim.command({ type: 'walk', tileId: '3,0,0' })
    expect(sim.command({ type: 'walk', tileId: '4,0,0' })).toBe('ok')
    for (let frame = 0; frame < 12; frame++) sim.update(1 / 30)
    expect(sim.characterPose().position).toEqual([1, surfaceY(0), 0])
    expect(sim.command({ type: 'walk', tileId: '1,0,0' })).toBe('ok')
    const events = settle(sim)
    expect(events).not.toContainEqual({ type: 'step', tileId: '2,0,0' })
    expect(sim.state().at).toBe('1,0,0')
    expect(sim.state().orbs).toEqual(['orb-0'])
    expect(sim.steps()).toBe(1)
  })

  it('乘坐后撤销恢复乘坐前的朝向与位置，再撤销返回开局', () => {
    const sim = new LevelSim(level)
    sim.command({ type: 'walk', tileId: 'bridge#0' })
    settle(sim)
    const before = sim.characterPose()
    sim.command({ type: 'operate', mechanism: 'bridge' })
    settle(sim)
    expect(sim.steps()).toBe(2)
    expect(sim.undo()).toBe(true)
    expect(sim.characterPose()).toEqual(before)
    expect(sim.steps()).toBe(1)
    expect(sim.undo()).toBe(true)
    expect(sim.state()).toEqual(initialState(level))
    expect(sim.characterPose().heading).toBe(0)
    expect(new LevelSim(level).steps()).toBe(0)
  })

  it('撤销恢复光点、一次性压板与联动状态，步数减一并发出 undo', () => {
    const fixture = linkedLevel()
    const sim = new LevelSim(fixture)
    expect(sim.command({ type: 'walk', tileId: '2,0,0' })).toBe('ok')
    const events = settle(sim)
    expect(events.findIndex((event) => event.type === 'plate')).toBeGreaterThan(
      events.findIndex((event) => event.type === 'step' && event.tileId === '2,0,0'),
    )
    expect(sim.state().spentPlates).toEqual(['pad'])
    expect(sim.steps()).toBe(1)
    expect(sim.undo()).toBe(true)
    expect(sim.update(0)).toEqual([{ type: 'undo' }])
    expect(sim.state()).toEqual(initialState(fixture))
    expect(sim.steps()).toBe(0)
    expect(sim.orbProgress().collected).toBe(0)
    expect(sim.command({ type: 'walk', tileId: '2,0,0' })).toBe('ok')
    expect(settle(sim)).toContainEqual({ type: 'plate', id: 'pad', triggered: true })
  })

  it('行走途中可以撤销，立即回到动作前且不再发出过时事件', () => {
    const fixture = orbLevel()
    const sim = new LevelSim(fixture)
    sim.command({ type: 'walk', tileId: '3,0,0' })
    for (let frame = 0; frame < 15; frame++) sim.update(1 / 30)
    expect(sim.orbProgress().collected).toBe(1)
    expect(sim.undo()).toBe(true)
    expect(sim.isIdle()).toBe(true)
    expect(sim.characterPose()).toMatchObject({ position: [0, surfaceY(0), 0], walking: false, heading: 0 })
    expect(sim.update(1)).toEqual([{ type: 'undo' }])
    expect(sim.update(1)).toEqual([])
  })

  it('改道保留已经经过的光点，当前段走完后折返，只算一步且可一次撤销', () => {
    const fixture = orbLevel()
    const sim = new LevelSim(fixture)
    sim.command({ type: 'walk', tileId: '3,0,0' })
    for (let frame = 0; frame < 15; frame++) sim.update(1 / 30)
    const position = sim.characterPose().position
    expect(sim.command({ type: 'walk', tileId: '0,0,0' })).toBe('ok')
    expect(sim.characterPose().position).toEqual(position)
    const events = settle(sim)
    expect(events).toContainEqual({ type: 'step', tileId: '2,0,0' })
    expect(events.filter((event) => event.type === 'orb')).toEqual([])
    expect(sim.state()).toEqual({ ...initialState(fixture), orbs: ['orb-0'] })
    expect(sim.steps()).toBe(1)
    expect(sim.undo()).toBe(true)
    expect(sim.state()).toEqual(initialState(fixture))
  })

  it('改道停在当前段终点时触发该压板，而不是中途触发原路线上的压板', () => {
    const sim = new LevelSim(orbLevel())
    sim.command({ type: 'walk', tileId: '3,0,0' })
    for (let frame = 0; frame < 15; frame++) sim.update(1 / 30)
    expect(sim.command({ type: 'walk', tileId: '2,0,0' })).toBe('ok')
    const events = settle(sim)
    expect(events).toContainEqual({ type: 'plate', id: 'pad', triggered: true })
    expect(sim.state().spentPlates).toEqual(['pad'])
    expect(sim.status).toBe('playing')
    expect(sim.steps()).toBe(1)
  })

  it('无效改道保持原路线，通关之后撤销可以恢复并继续游戏', () => {
    const sim = new LevelSim(orbLevel())
    sim.command({ type: 'walk', tileId: '3,0,0' })
    sim.update(0.02)
    expect(sim.command({ type: 'walk', tileId: 'missing' })).toBe('unreachable')
    expect(sim.command({ type: 'operate', mechanism: 'bridge' })).toBe('busy')
    expect(settle(sim)).toContainEqual({ type: 'won' })
    expect(sim.steps()).toBe(1)
    expect(sim.undo()).toBe(true)
    expect(sim.status).toBe('playing')
    expect(sim.command({ type: 'walk', tileId: '1,0,0' })).toBe('ok')
  })
})

describe('规则与动画状态一致', () => {
  it.each(levels)('$id 标准解法每一步最终状态与 applyAction 完全一致', (fixture) => {
    const sim = new LevelSim(fixture)
    for (const step of fixture.solution) {
      const command = step.type === 'walk' ? { type: 'walk' as const, tileId: sim.tileAt(step.to)!.id } : step
      const expected = applyAction(fixture, sim.state(), command)!
      expect(expected).not.toBeNull()
      expect(sim.command(command)).toBe('ok')
      settle(sim)
      expect(sim.state()).toEqual(expected.state)
    }
    expect(sim.status).toBe('won')
    expect(sim.steps()).toBe(fixture.solution.length)
  })
})

const newSimLevel = (build: (b: LevelBuilder) => void) =>
  defineLevel({
    id: 'sim-new',
    title: '新机制动画',
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

describe('T6.6 推动、门与撤销', () => {
  it('触发压板的门动画在行走结束后才开始计时', () => {
    const level = newSimLevel((b) => {
      b.plate({ id: 'pad', tile: [1, 0, 0], target: 'gate' })
      b.gate({ id: 'gate', tile: [3, 0, 0], mode: 'toggle' })
    })
    const sim = new LevelSim(level)
    expect(sim.command({ type: 'walk', tileId: '1,0,0' })).toBe('ok')
    for (let frame = 0; frame < 12; frame++) sim.update(1 / 30)
    expect(sim.characterPose().position).toEqual([1, surfaceY(0), 0])
    expect(sim.gatePose('gate').open).toBe(0)
    for (let frame = 0; frame < 6; frame++) sim.update(1 / 30)
    expect(sim.gatePose('gate').open).toBeCloseTo(0.5)
    settle(sim)
    expect(sim.state().gates.gate).toBe(true)
  })
  it('推动到按住压板后再播放开门，全部动画完成才提交状态，撤销恢复完整状态', () => {
    const level = newSimLevel((b) => {
      b.crate({ tile: [1, 0, 0] })
      b.orb({ tile: [1, 0, 0] })
      b.plate({ id: 'pad', tile: [2, 0, 0], target: 'gate', mode: 'hold' })
      b.gate({ id: 'gate', tile: [3, 0, 0], mode: 'hold' })
    })
    const sim = new LevelSim(level),
      before = structuredClone(sim.state())
    const expected = applyAction(level, sim.state(), { type: 'push', crate: 'crate-0' })!
    expect(sim.command({ type: 'push', crate: 'crate-0' })).toBe('ok')
    expect(sim.undo()).toBe(false)
    expect(sim.command({ type: 'walk', tileId: '0,0,1' })).toBe('busy')
    const events: SimEvent[] = []
    for (let frame = 0; frame < 10; frame++) events.push(...sim.update(1 / 30))
    expect(events[0]).toEqual({ type: 'push', crate: 'crate-0' })
    expect(sim.gatePose('gate').open).toBe(0)
    expect(sim.cratePose('crate-0').position[0]).toBeCloseTo(1 + 10 / 30 / 0.35)
    expect(sim.state()).toEqual(before)
    events.push(...sim.update(1 / 30))
    expect(sim.cratePose('crate-0').position).toEqual([2, surfaceY(0), 0])
    expect(events).toContainEqual({ type: 'orb', id: 'orb-0' })
    expect(events).toContainEqual({ type: 'gate', id: 'gate', open: true })
    for (let frame = 0; frame < 6; frame++) events.push(...sim.update(1 / 30))
    expect(sim.gatePose('gate').open).toBeCloseTo(0.5)
    expect(sim.undo()).toBe(false)
    events.push(...settle(sim))
    expect(sim.state()).toEqual(expected.state)
    expect(sim.gatePose('gate').open).toBe(1)
    expect(sim.steps()).toBe(1)
    expect(sim.undo()).toBe(true)
    expect(sim.state()).toEqual(before)
    expect(sim.gatePose('gate').open).toBe(0)
    expect(sim.cratePose('crate-0').position).toEqual([1, surfaceY(0), 0])
    expect(sim.update(0)).toEqual([{ type: 'undo' }])
  })

  it('离开自己压住的压板时第一步开始关门，行走中撤销恢复开门', () => {
    const level = newSimLevel((b) => {
      b.plate({ id: 'pad', tile: [1, 0, 0], target: 'gate', mode: 'hold' })
      b.gate({ id: 'gate', tile: [3, 0, 0], mode: 'hold' })
    })
    const sim = new LevelSim(level)
    expect(sim.command({ type: 'walk', tileId: '1,0,0' })).toBe('ok')
    settle(sim)
    expect(sim.gatePose('gate').open).toBe(1)
    expect(sim.command({ type: 'walk', tileId: '4,0,0' })).toBe('unreachable')
    expect(sim.command({ type: 'walk', tileId: '2,0,0' })).toBe('ok')
    expect(sim.update(1 / 30)).toContainEqual({ type: 'gate', id: 'gate', open: false })
    expect(sim.gatePose('gate').open).toBeLessThan(1)
    expect(sim.state().at).toBe('1,0,0')
    expect(sim.undo()).toBe(true)
    expect(sim.gatePose('gate').open).toBe(1)
    expect(sim.command({ type: 'walk', tileId: '2,0,0' })).toBe('ok')
    settle(sim)
    expect(sim.gatePose('gate').open).toBe(0)
  })

  it('切换门动画耗时0.4秒，限次耗尽返回原因，撤销恢复把手次数', () => {
    const level = newSimLevel((b) =>
      b.gate({ id: 'gate', tile: [2, 0, 0], mode: 'toggle', handle: { block: [0, 0, 0], face: 'z', uses: 1 } }),
    )
    const sim = new LevelSim(level)
    expect(sim.command({ type: 'operate', mechanism: 'gate' })).toBe('ok')
    const events: SimEvent[] = []
    for (let frame = 0; frame < 6; frame++) events.push(...sim.update(1 / 30))
    expect(events).toContainEqual({ type: 'gate', id: 'gate', open: true })
    expect(sim.gatePose('gate').open).toBeCloseTo(0.5)
    expect(sim.isIdle()).toBe(false)
    expect(sim.command({ type: 'operate', mechanism: 'gate' })).toBe('busy')
    expect(sim.undo()).toBe(false)
    for (let frame = 0; frame < 6; frame++) sim.update(1 / 30)
    expect(sim.isIdle()).toBe(true)
    expect(sim.state().handleUses.gate).toBe(1)
    expect(sim.command({ type: 'operate', mechanism: 'gate' })).toBe('handle-used-up')
    expect(sim.steps()).toBe(1)
    expect(sim.undo()).toBe(true)
    expect(sim.state().handleUses.gate).toBe(0)
    expect(sim.gatePose('gate').open).toBe(0)
  })

  it('推过错觉连接时屏幕位置连续，箱子推上机关后姿态随机关动画移动', () => {
    const level = defineLevel({
      id: 'sim-push-illusion',
      title: '错觉推动动画',
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
          stops: [0, 2],
          blocks: [{ offset: [0, 0, 0] }],
          handle: { block: [0, 0, 0], face: 'z' },
        })
        b.crate({ tile: [1, 0, 0] })
        b.start([0, 0, 0])
        b.goal([0, 0, 1])
      },
    })
    const sim = new LevelSim(level)
    expect(sim.command({ type: 'push', crate: 'crate-0' })).toBe('ok')
    for (let frame = 1; frame <= 10; frame++) {
      sim.update(1 / 30)
      const [x, y, z] = sim.cratePose('crate-0').position
      expect(x - y + surfaceY(0)).toBeCloseTo(1 + frame / 30 / 0.35)
      expect(z - y + surfaceY(0)).toBeCloseTo(0)
    }
    settle(sim)
    expect(sim.cratePose('crate-0').position).toEqual([4, surfaceY(2), 2])
    expect(sim.command({ type: 'operate', mechanism: 'lift' })).toBe('ok')
    for (let frame = 0; frame < 10; frame++) sim.update(1 / 30)
    expect(sim.cratePose('crate-0').position[1]).toBeGreaterThan(surfaceY(2))
    expect(sim.cratePose('crate-0').position[1]).toBeLessThan(surfaceY(4))
    settle(sim)
    expect(sim.state().crates['crate-0']).toBe('lift#0')
    expect(sim.cratePose('crate-0').position).toEqual([4, surfaceY(4), 2])
    expect(sim.undo()).toBe(true)
    expect(sim.cratePose('crate-0').position).toEqual([4, surfaceY(2), 2])
    expect(sim.undo()).toBe(true)
    expect(sim.cratePose('crate-0').position).toEqual([1, surfaceY(0), 0])
  })

  it('未知箱子与推不动的箱子返回原因，非法推动不计步', () => {
    const sim = new LevelSim(newSimLevel((b) => b.crate({ tile: [2, 0, 0] })))
    expect(sim.command({ type: 'push', crate: 'unknown' })).toBe('unknown-target')
    expect(sim.command({ type: 'push', crate: 'crate-0' })).toBe('cannot-push')
    expect(sim.steps()).toBe(0)
  })
})
