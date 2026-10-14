import { describe, expect, it } from 'vitest'
import { defineLevel } from '../levels/builders'
import { cellId, surfaceY } from './iso'
import { LevelSim, type SimEvent } from './sim'

const level = defineLevel({
  id: 'sim-fixture',
  title: '模拟',
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

  it('站在机关上拒绝操作', () => {
    const sim = new LevelSim(level)
    expect(sim.command({ type: 'walk', tileId: 'bridge#0' })).toBe('ok')
    settle(sim)
    expect(sim.tiles().get('bridge#0')?.pos).toEqual([5, 0, 0])
    expect(sim.command({ type: 'operate', mechanism: 'bridge' })).toBe('standing-on-mechanism')
    expect(sim.mechanismPose('bridge')).toEqual({ rotationY: 0 })
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
