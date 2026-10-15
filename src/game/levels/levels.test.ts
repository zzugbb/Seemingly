import { describe, expect, it } from 'vitest'
import { validateLevels } from '../core/validate'
import { levels } from './index'
import { LevelSim } from '../core/sim'

const settle = (sim: LevelSim) => {
  const events = []
  for (let frame = 0; frame < 800 && !sim.isIdle(); frame++) events.push(...sim.update(1 / 30))
  expect(sim.isIdle()).toBe(true)
  return events
}

describe('关卡校验', () => {
  it('先后：踩板转桥后折返，桥心再转一档才能抵达灯笼', () => {
    const level = levels.find((item) => item.id === 'level-05')
    expect(level).toBeDefined()
    if (!level) throw new Error('缺少先后')
    expect(level.solution.length).toBeGreaterThanOrEqual(4)
    expect(level.solution.length).toBeLessThanOrEqual(8)
    const sim = new LevelSim(level)
    const plate = level.mechanisms.find((item) => item.type === 'plate')
    if (!plate || plate.type !== 'plate') throw new Error('缺少压板')
    expect(sim.command({ type: 'walk', tileId: sim.tileAt(level.goal)!.id })).toBe('unreachable')
    expect(sim.command({ type: 'walk', tileId: sim.tileAt(plate.tile)!.id })).toBe('ok')
    expect(settle(sim)).toContainEqual({ type: 'plate', id: plate.id, triggered: true })
    expect(sim.command({ type: 'walk', tileId: sim.tileAt(level.goal)!.id })).toBe('unreachable')
    const pivot = level.mechanisms.find((item) => item.type === 'rotator')
    if (!pivot || pivot.type !== 'rotator') throw new Error('缺少转盘')
    expect(sim.command({ type: 'walk', tileId: sim.tileAt(pivot.pivot)!.id })).toBe('ok')
    settle(sim)
    expect(sim.command({ type: 'operate', mechanism: pivot.id })).toBe('ok')
    settle(sim)
    expect(sim.command({ type: 'walk', tileId: sim.tileAt(level.goal)!.id })).toBe('ok')
    settle(sim)
    expect(sim.status).toBe('won')
  })
  it('小样通过全部校验', () => {
    expect(validateLevels(levels)).toEqual([])
  })

  it('改坏一处坐标会指出是哪一项、哪一格', () => {
    const prototype = levels.find((level) => level.id === 'prototype')
    if (!prototype) throw new Error('缺少小样')
    const broken = structuredClone(prototype)
    const block = broken.blocks.find((item) => item.pos[0] === 7 && item.pos[1] === 0 && item.pos[2] === 4)
    if (!block) throw new Error('找不到要改坏的积木')
    block.pos = [7, 1, 4]
    const issues = validateLevels([broken])
    expect(issues).toContainEqual({ check: '无重叠', cell: '7,1,4', detail: '两块积木占用同一格' })
  })
})
