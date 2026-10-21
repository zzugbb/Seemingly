import { describe, expect, it } from 'vitest'
import { validateLevels } from '../core/validate'
import { LevelSim } from '../core/sim'
import { surfaceY } from '../core/iso'
import { applyAction, initialState, legalActions, stateKey } from '../core/rules'
import { analyze } from '../core/solver'
import type { LevelDef, Vec3 } from './types'
import { mainLevels, challengeLevels } from './index'
import { targets } from './targets'

const settle = (sim: LevelSim) => {
  const events = []
  for (let frame = 0; frame < 800 && !sim.isIdle(); frame++) events.push(...sim.update(1 / 30))
  expect(sim.isIdle()).toBe(true)
  return events
}
const walk = (sim: LevelSim, to: Vec3) => {
  expect(sim.command({ type: 'walk', tileId: sim.tileAt(to)!.id })).toBe('ok')
  return settle(sim)
}
const operate = (sim: LevelSim, mechanism: string) => {
  expect(sim.command({ type: 'operate', mechanism })).toBe('ok')
  return settle(sim)
}
const canWinWithoutRiding = (level: LevelDef) => {
  const queue = [initialState(level)]
  const seen = new Set([stateKey(queue[0])])
  for (let index = 0; index < queue.length; index++) {
    const state = queue[index]
    if (state.won) return true
    for (const action of legalActions(level, state)) {
      if (action.type === 'operate' && state.at.startsWith(`${action.mechanism}#`)) continue
      const next = applyAction(level, state, action)!.state
      const key = stateKey(next)
      if (!seen.has(key)) {
        seen.add(key)
        queue.push(next)
      }
    }
  }
  return false
}

describe('第 1～2 章', () => {
  it('按顺序提供六关，两章各三关，每关都有设计者给定的难度目标', () => {
    expect(mainLevels.map((level) => level.id)).toEqual(Array.from({ length: 6 }, (_, index) => `level-0${index + 1}`))
    expect(mainLevels.map((level) => level.chapter)).toEqual([1, 1, 1, 2, 2, 2])
    expect(mainLevels.map((level) => level.title)).toEqual(['启程', '转动', '错位', '转动', '乘风', '两难'])
    expect(Object.keys(targets)).toEqual(mainLevels.map((level) => level.id))
    expect(challengeLevels).toEqual([])
    expect(mainLevels.every((level) => !level.ending)).toBe(true)
  })
  it('六关通过全部结构、安全、解法、可见性、规模与难度校验', () => {
    expect(validateLevels(mainLevels, targets)).toEqual([])
  })
  it('启程：先去灯笼会提示缺光点，撤销可恢复到出发前', () => {
    const level = mainLevels[0],
      sim = new LevelSim(level)
    expect(walk(sim, level.goal)).toContainEqual({ type: 'goal-locked', missing: 2 })
    expect(sim.status).toBe('playing')
    expect(sim.undo()).toBe(true)
    expect(sim.steps()).toBe(0)
    expect(sim.state().at).toBe(level.start.join(','))
    walk(sim, [1, 0, -1])
    expect(walk(sim, level.goal)).toContainEqual({ type: 'goal-locked', missing: 1 })
    walk(sim, [6, 2, 3])
    expect(sim.orbProgress().collected).toBe(2)
    expect(sim.undo()).toBe(true)
    expect(sim.orbProgress().collected).toBe(1)
    walk(sim, [6, 2, 3])
    expect(walk(sim, level.goal)).toContainEqual({ type: 'won' })
  })
  it.each([
    [
      [1, 0, -1],
      [6, 2, 3],
    ],
    [
      [6, 2, 3],
      [1, 0, -1],
    ],
  ] as const)('启程：两处光点可按任一顺序收集，回庭点灯都是三步', (first, second) => {
    const sim = new LevelSim(mainLevels[0])
    walk(sim, [...first])
    walk(sim, [...second])
    expect(sim.orbProgress().collected).toBe(2)
    expect(walk(sim, sim.level.goal)).toContainEqual({ type: 'won' })
    expect(sim.steps()).toBe(3)
  })
  it('转动：站在中心静台取光再转向灯笼，三步通关', () => {
    const level = mainLevels[1]
    const metrics = analyze(level)
    expect(metrics).toMatchObject({ minActions: 3, minActionsAll: 3, reachableStates: 34, deadEndStates: 0 })
    const sim = new LevelSim(level)
    expect(sim.command({ type: 'walk', tileId: sim.tileAt(level.goal)!.id })).toBe('unreachable')
    walk(sim, [3, 1, 3])
    expect(sim.orbProgress().collected).toBe(1)
    expect(sim.state().at).toBe('3,1,3')
    const before = structuredClone(sim.state())
    expect(sim.undo()).toBe(true)
    expect(sim.orbProgress().collected).toBe(0)
    expect(sim.state()).toEqual({ ...before, orbs: [], at: level.start.join(',') })
    walk(sim, [3, 1, 3])
    operate(sim, 'bridge')
    expect(walk(sim, level.goal)).toContainEqual({ type: 'won' })
    expect(sim.steps()).toBe(3)
  })
  it('转动：入口先转会断开，转回或撤销都能恢复，且不必乘坐', () => {
    const sim = new LevelSim(mainLevels[1])
    const center = sim.tileAt([3, 1, 3])!.id
    operate(sim, 'bridge')
    expect(sim.command({ type: 'walk', tileId: center })).toBe('unreachable')
    expect(sim.undo()).toBe(true)
    expect(sim.command({ type: 'walk', tileId: center })).toBe('ok')
    const again = new LevelSim(mainLevels[1])
    operate(again, 'bridge')
    operate(again, 'bridge')
    operate(again, 'bridge')
    operate(again, 'bridge')
    expect(again.command({ type: 'walk', tileId: center })).toBe('ok')
    expect(canWinWithoutRiding(mainLevels[1])).toBe(true)
  })
  it('转动：禁用把手后无解', () => {
    const level = structuredClone(mainLevels[1])
    const bridge = level.mechanisms.find((mechanism) => mechanism.id === 'bridge')!
    if (bridge.type === 'rotator') bridge.handle = undefined
    expect(analyze(level).minActions).toBeNull()
  })
  it('错位：岔路没有捷径，跨到远塔不会自动收齐中层侧廊的光点', () => {
    const sim = new LevelSim(mainLevels[2])
    walk(sim, [2, 0, -1])
    const steps = walk(sim, [10, 4, 5])
    expect(steps).toContainEqual({ type: 'step', tileId: '0,0,2' })
    expect(steps).not.toContainEqual({ type: 'orb', id: 'orb-1' })
    expect(sim.orbProgress().collected).toBe(2)
    expect(walk(sim, sim.level.goal)).toContainEqual({ type: 'goal-locked', missing: 1 })
    expect(sim.undo()).toBe(true)
    walk(sim, [5, 1, 0])
    expect(sim.orbProgress().collected).toBe(3)
    expect(sim.undo()).toBe(true)
    expect(sim.orbProgress().collected).toBe(2)
    walk(sim, [5, 1, 0])
    walk(sim, sim.level.goal)
    expect(sim.status).toBe('won')
    expect(sim.steps()).toBe(4)
  })
  it('转动：先乘下层平台取选做，再回北台，全收集十二步；乘坐撤销恢复站位', () => {
    const sim = new LevelSim(mainLevels[3])
    operate(sim, 'bridge')
    walk(sim, [3, 1, 4])
    expect(sim.state().at).toBe('bridge#2')
    const before = structuredClone(sim.state())
    operate(sim, 'bridge')
    expect(sim.characterPose().position).toEqual([6, surfaceY(1), 7])
    expect(sim.undo()).toBe(true)
    expect(sim.state()).toEqual(before)
    operate(sim, 'bridge')
    walk(sim, [9, 3, 9])
    expect(sim.orbProgress().collected).toBe(1)
    walk(sim, [6, 1, 7])
    operate(sim, 'bridge')
    operate(sim, 'bridge')
    walk(sim, [5, 1, 1])
    expect(sim.orbProgress().collected).toBe(2)
    operate(sim, 'bridge')
    walk(sim, [6, 2, 3])
    operate(sim, 'bridge')
    walk(sim, sim.level.goal)
    expect(sim.status).toBe('won')
    expect(sim.steps()).toBe(targets['level-04'].minActionsAll)
  })
  it('转动：没有下层乘台仍能走主线，但选做光点不可到达', () => {
    const level = structuredClone(mainLevels[3])
    const bridge = level.mechanisms.find((mechanism) => mechanism.id === 'bridge')!
    if (bridge.type === 'rotator') bridge.blocks[2].kind = 'solid'
    const metrics = analyze(level)
    expect(metrics.minActions).toBe(6)
    expect(metrics.minActionsAll).toBeNull()
  })
  it('乘风：北台作为选做中转站，短桥取光再换长臂，十二步全收集', () => {
    const sim = new LevelSim(mainLevels[4])
    walk(sim, [5, 2, 4])
    expect(sim.state().at).toBe('ferry#0')
    expect(sim.orbProgress().requiredCollected).toBe(1)
    operate(sim, 'ferry')
    operate(sim, 'ferry')
    operate(sim, 'ferry')
    walk(sim, [5, 1, 1])
    expect(sim.orbProgress().collected).toBe(2)
    expect(sim.undo()).toBe(true)
    expect(sim.orbProgress().collected).toBe(1)
    walk(sim, [5, 1, 1])
    operate(sim, 'ferry')
    operate(sim, 'ferry')
    walk(sim, [6, 2, 3])
    expect(sim.state().at).toBe('ferry#1')
    operate(sim, 'ferry')
    operate(sim, 'ferry')
    operate(sim, 'ferry')
    const events = walk(sim, sim.level.goal)
    expect(events).toContainEqual({ type: 'step', tileId: 'ferry#2' })
    expect(sim.status).toBe('won')
    expect(sim.steps()).toBe(targets['level-05'].minActionsAll)
  })
  it('乘风：主线在南侧下短桥、换长臂，不能只坐同一条桥到灯笼', () => {
    const sim = new LevelSim(mainLevels[4])
    walk(sim, [5, 2, 4])
    operate(sim, 'ferry')
    walk(sim, [4, 1, 4])
    operate(sim, 'ferry')
    operate(sim, 'ferry')
    walk(sim, [6, 2, 5])
    expect(sim.state().at).toBe('ferry#1')
    operate(sim, 'ferry')
    walk(sim, sim.level.goal)
    expect(sim.status).toBe('won')
    expect(sim.orbProgress().collected).toBe(1)
    expect(sim.steps()).toBe(8)
    const level = structuredClone(mainLevels[4])
    const ferry = level.mechanisms.find((mechanism) => mechanism.id === 'ferry')!
    if (ferry.type === 'rotator') ferry.blocks[1].kind = 'solid'
    expect(analyze(level).minActions).toBeNull()
  })
  it('两难：借东桥换乘西高台，退开东桥找到低处光点，全收集十五步完成', () => {
    const sim = new LevelSim(mainLevels[5])
    walk(sim, [3, 2, 4])
    operate(sim, 'west')
    operate(sim, 'west')
    operate(sim, 'east')
    walk(sim, [5, 1, 1])
    walk(sim, [6, 2, 3])
    expect(sim.state().at).toBe('east#1')
    operate(sim, 'west')
    operate(sim, 'west')
    operate(sim, 'east')
    walk(sim, [8, 4, 8])
    expect(sim.orbProgress().collected).toBe(1)
    expect(sim.command({ type: 'walk', tileId: 'west#2' })).toBe('unreachable')
    operate(sim, 'east')
    walk(sim, [5, 1, 4])
    expect(sim.state().at).toBe('west#2')
    expect(sim.orbProgress().collected).toBe(2)
    expect(sim.undo()).toBe(true)
    expect(sim.orbProgress().collected).toBe(1)
    walk(sim, [5, 1, 4])
    walk(sim, [8, 4, 8])
    expect(sim.state().at).toBe('west#1')
    const before = structuredClone(sim.state())
    operate(sim, 'west')
    expect(sim.undo()).toBe(true)
    expect(sim.state()).toEqual(before)
    operate(sim, 'west')
    walk(sim, [6, 2, -3])
    expect(sim.status).toBe('won')
    expect(sim.orbProgress().collected).toBe(2)
    expect(sim.steps()).toBe(targets['level-06'].minActionsAll)
  })
  it('两难：东桥必须参与中转，单独循环西转盘不能通关', () => {
    const level = structuredClone(mainLevels[5])
    const east = level.mechanisms.find((mechanism) => mechanism.id === 'east')!
    if (east.type === 'rotator') east.handle = undefined
    expect(analyze(level).minActions).toBeNull()
  })
  it('改坏一处坐标会指出是哪一项、哪一格', () => {
    const broken = structuredClone(mainLevels[0])
    broken.blocks.find((block) => block.pos.join(',') === '0,0,3')!.pos = [0, 0, 2]
    expect(validateLevels([broken])).toContainEqual({ check: '无重叠', cell: '0,0,2', detail: '两块积木占用同一格' })
  })
})
