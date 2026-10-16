import { describe, expect, it } from 'vitest'
import { validateLevels } from '../core/validate'
import { levels } from './index'
import { LevelSim } from '../core/sim'
import { runSolution } from '../core/solve'
import { targets } from './targets'

const settle = (sim: LevelSim) => {
  const events = []
  for (let frame = 0; frame < 800 && !sim.isIdle(); frame++) events.push(...sim.update(1 / 30))
  expect(sim.isIdle()).toBe(true)
  return events
}

describe('关卡校验', () => {
  it('回环：开局任意切换平移台，都不能一次行走直达终点', () => {
    const level = levels.find((item) => item.id === 'level-07')!
    const sim = new LevelSim(level)
    for (let index = 0; index < 8; index++) {
      expect(sim.command({ type: 'walk', tileId: sim.tileAt(level.goal)!.id })).toBe('unreachable')
      expect(sim.command({ type: 'operate', mechanism: 'loop-bridge' })).toBe('ok')
      settle(sim)
    }
  })
  it('只按顺序提供序章与第 1～8 关，不再包含小样', () => {
    expect(levels.map((level) => level.id)).toEqual(Array.from({ length: 9 }, (_, index) => `level-0${index}`))
  })
  it('归来的结尾有九盏灯笼和序章塔，位置均有静态积木承托', () => {
    const level = levels.find((item) => item.id === 'level-08')!
    const ending = level.ending
    expect(ending).toBeDefined()
    if (!ending) throw new Error('缺少结尾布景')
    expect(ending.lanterns).toHaveLength(9)
    expect(new Set(ending.lanterns.map((pos) => pos.join(','))).size).toBe(9)
    expect(new Set(ending.lanterns.map(([x, y, z]) => `${x - y},${z - y}`)).size).toBe(9)
    expect(ending.lanterns[0]).toEqual(level.goal)
    for (const pos of [...ending.lanterns, ...ending.tower]) {
      expect(level.blocks.some((block) => block.pos.join(',') === pos.join(','))).toBe(true)
    }
  })
  it('归来：用三种机关回到序章起点与原来的灯笼', () => {
    const level = levels.find((item) => item.id === 'level-08')
    const prologue = levels.find((item) => item.id === 'level-00')
    expect(level).toBeDefined()
    if (!level || !prologue) throw new Error('缺少归来或序章')
    expect(new Set(level.mechanisms.map((item) => item.type))).toEqual(new Set(['plate', 'rotator', 'mover']))
    expect(level.solution.length).toBeGreaterThanOrEqual(6)
    expect(level.solution.length).toBeLessThanOrEqual(12)
    expect(level.goal).toEqual(prologue.goal)
    for (const block of prologue.blocks) expect(level.blocks).toContainEqual(block)
    const run = runSolution(level)
    expect(run.ok).toBe(true)
    expect(run.walks.flatMap((walk) => walk.positions)).toContainEqual(prologue.start)
    const sim = new LevelSim(level)
    expect(sim.command({ type: 'walk', tileId: sim.tileAt(level.goal)!.id })).toBe('unreachable')
  })
  it('回环：三段路逐段折返，压板把入口改接为下一段出口', () => {
    const level = levels.find((item) => item.id === 'level-07')!
    expect(level.solution.length).toBe(6)
    const sim = new LevelSim(level)
    const walk = (pos: [number, number, number]) => {
      expect(sim.command({ type: 'walk', tileId: sim.tileAt(pos)!.id })).toBe('ok')
      return settle(sim)
    }
    const goal = sim.tileAt(level.goal)!.id
    expect(walk([0, 0, 4])).toContainEqual({ type: 'plate', id: 'first-plate', triggered: true })
    expect(walk([2, 0, 2])).toContainEqual({ type: 'step', tileId: '0,0,3' })
    expect(sim.command({ type: 'walk', tileId: goal })).toBe('unreachable')
    expect(walk([2, 0, 4])).toContainEqual({ type: 'plate', id: 'middle-plate', triggered: true })
    expect(walk([4, 0, 2])).toContainEqual({ type: 'step', tileId: '2,0,3' })
    expect(sim.command({ type: 'walk', tileId: goal })).toBe('unreachable')
    expect(walk([4, 0, 4])).toContainEqual({ type: 'plate', id: 'last-plate', triggered: true })
    expect(walk(level.goal)).toContainEqual({ type: 'step', tileId: '4,0,3' })
    expect(sim.status).toBe('won')
  })
  it('交错：滑台换接落脚点后，转塔分别打开入口与出口', () => {
    const level = levels.find((item) => item.id === 'level-06')
    expect(level).toBeDefined()
    if (!level) throw new Error('缺少交错')
    expect(level.solution.length).toBeGreaterThanOrEqual(6)
    expect(level.solution.length).toBeLessThanOrEqual(12)
    const sim = new LevelSim(level)
    const walk = (pos: [number, number, number]) => sim.command({ type: 'walk', tileId: sim.tileAt(pos)!.id })
    expect(walk([2, 0, 2])).toBe('unreachable')
    expect(sim.command({ type: 'operate', mechanism: 'slider' })).toBe('ok')
    settle(sim)
    expect(walk([2, 0, 2])).toBe('ok')
    settle(sim)
    expect(walk([6, 0, 2])).toBe('unreachable')
    expect(sim.command({ type: 'operate', mechanism: 'slider' })).toBe('ok')
    settle(sim)
    expect(walk([6, 0, 2])).toBe('unreachable')
    expect(sim.command({ type: 'operate', mechanism: 'tower' })).toBe('ok')
    settle(sim)
    expect(walk([6, 0, 2])).toBe('ok')
    settle(sim)
    expect(walk(level.goal)).toBe('unreachable')
    expect(sim.command({ type: 'operate', mechanism: 'tower' })).toBe('ok')
    settle(sim)
    expect(walk(level.goal)).toBe('ok')
    settle(sim)
    expect(sim.status).toBe('won')
  })
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
  it('全部正式关卡通过适用校验，并强制检查已登记的难度目标', () => {
    expect(validateLevels(levels, targets)).toEqual([])
  })
  it('难度目标只引用已实现的关卡', () => {
    for (const id of Object.keys(targets)) expect(levels.some((level) => level.id === id)).toBe(true)
  })

  it('改坏一处坐标会指出是哪一项、哪一格', () => {
    const level = levels.find((level) => level.id === 'level-02')
    if (!level) throw new Error('缺少转动')
    const broken = structuredClone(level)
    const block = broken.blocks.find((item) => item.pos[0] === 1 && item.pos[1] === 3 && item.pos[2] === 2)
    if (!block) throw new Error('找不到要改坏的积木')
    block.pos = [2, 3, 2]
    const issues = validateLevels([broken])
    expect(issues).toContainEqual({ check: '无重叠', cell: '2,3,2', detail: '两块积木占用同一格' })
  })
})
