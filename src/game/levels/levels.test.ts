import { describe, expect, it } from 'vitest'
import { validateLevels } from '../core/validate'
import { LevelSim } from '../core/sim'
import { applyAction, gatesOf, initialState, legalActions, stateKey } from '../core/rules'
import { analyze, buildPolicy, reachableStates } from '../core/solver'
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
const noSouthDockWin = (all: boolean) => {
  const level = mainLevels[5]
  const start = initialState(level)
  const queue = [{ state: start, depth: 0 }]
  const seen = new Set([stateKey(start)])
  for (let index = 0; index < queue.length; index++) {
    const item = queue[index]
    if (!item) continue
    const { state, depth } = item
    if (state.won && (!all || state.orbs.length === level.orbs.length)) return depth
    for (const action of legalActions(level, state)) {
      const transition = applyAction(level, state, action)
      if (!transition) continue
      if (action.type === 'walk' && state.rotator.east === 1 && transition.route.includes('east#0')) continue
      const next = transition.state
      const key = stateKey(next)
      if (!seen.has(key)) {
        seen.add(key)
        queue.push({ state: next, depth: depth + 1 })
      }
    }
  }
  return null
}

describe('第 1～4 章', () => {
  it('按顺序提供十二关，前四章各三关，每关都有设计者给定的难度目标', () => {
    expect(mainLevels.map((level) => level.id)).toEqual(
      Array.from({ length: 12 }, (_, index) => `level-${String(index + 1).padStart(2, '0')}`),
    )
    expect(mainLevels.map((level) => level.chapter)).toEqual([1, 1, 1, 2, 2, 2, 3, 3, 3, 4, 4, 4])
    expect(mainLevels.map((level) => level.title)).toEqual([
      '启程',
      '转动',
      '随行',
      '换乘',
      '叠庭',
      '回环',
      '停靠',
      '联动',
      '牵引',
      '推动',
      '越界',
      '重量',
    ])
    expect(mainLevels.slice(0, 6).map((level) => level.revision)).toEqual([2, 3, 4, 3, 3, 4])
    expect(mainLevels.slice(6).map((level) => level.revision)).toEqual([1, 2, 2, 2, 2, 1])
    expect(Object.keys(targets)).toEqual(mainLevels.map((level) => level.id))
    expect(challengeLevels).toEqual([])
    expect(mainLevels.every((level) => !level.ending)).toBe(true)
  })
  it('十二关通过全部结构、安全、解法、可见性、规模与难度校验', () => {
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
  it('随行：乘到南岸后离台取光，四步点灯', () => {
    const level = mainLevels[2]
    expect(analyze(level)).toMatchObject({ minActions: 4, minActionsAll: 4, reachableStates: 52, deadEndStates: 0 })
    const sim = new LevelSim(level)
    walk(sim, [2, 1, 3])
    expect(sim.state().at).toBe('ferry#0')
    expect(sim.orbProgress().collected).toBe(0)
    const boarded = structuredClone(sim.state())
    expect(sim.command({ type: 'operate', mechanism: 'ferry' })).toBe('ok')
    expect(sim.undo()).toBe(false)
    sim.update(1 / 30)
    const mid = sim.characterPose().position
    expect(mid[0]).not.toBe(2)
    settle(sim)
    expect(sim.state().at).toBe('ferry#0')
    expect(sim.state().rotator.ferry).toBe(1)
    expect(sim.characterPose().position[0]).not.toBe(mid[0])
    expect(sim.undo()).toBe(true)
    expect(sim.state()).toEqual(boarded)
    operate(sim, 'ferry')
    walk(sim, [4, 2, 7])
    expect(sim.state().at).toBe('4,2,7')
    expect(sim.orbProgress().collected).toBe(1)
    expect(sim.undo()).toBe(true)
    expect(sim.state().at).toBe('ferry#0')
    expect(sim.orbProgress().collected).toBe(0)
    walk(sim, [4, 2, 7])
    const events = walk(sim, level.goal)
    expect(events).toContainEqual({ type: 'step', tileId: '4,2,6' })
    expect(events).toContainEqual({ type: 'step', tileId: '5,2,6' })
    expect(events).toContainEqual({ type: 'won' })
    expect(sim.steps()).toBe(4)
  })
  it('随行：直接点灯不会顺路收光，离台后转动不会带走岸上角色', () => {
    const sim = new LevelSim(mainLevels[2])
    walk(sim, [2, 1, 3])
    operate(sim, 'ferry')
    expect(walk(sim, sim.level.goal)).toContainEqual({ type: 'goal-locked', missing: 1 })
    expect(sim.orbProgress().collected).toBe(0)
    expect(sim.undo()).toBe(true)
    walk(sim, [4, 2, 7])
    const ashore = sim.characterPose().position
    operate(sim, 'ferry')
    expect(sim.characterPose().position).toEqual(ashore)
    expect(walk(sim, sim.level.goal)).toContainEqual({ type: 'won' })
  })
  it('随行：错过南岸后可在空高台往返，再乘回南岸恢复', () => {
    const sim = new LevelSim(mainLevels[2])
    walk(sim, [2, 1, 3])
    operate(sim, 'ferry')
    operate(sim, 'ferry')
    expect(sim.command({ type: 'walk', tileId: '4,2,7' })).toBe('unreachable')
    expect(sim.command({ type: 'walk', tileId: sim.level.goal.join(',') })).toBe('unreachable')
    walk(sim, [6, 2, 4])
    walk(sim, [4, 1, 3])
    expect(sim.state().at).toBe('ferry#0')
    operate(sim, 'ferry')
    operate(sim, 'ferry')
    operate(sim, 'ferry')
    walk(sim, [4, 2, 7])
    expect(walk(sim, sim.level.goal)).toContainEqual({ type: 'won' })
  })
  it('随行：每个可达未完成状态的提示都合法且最终通关', () => {
    const level = mainLevels[2]
    const policy = buildPolicy(level)
    for (const start of reachableStates(level)) {
      let state = start
      const seen = new Set<string>()
      while (!state.won) {
        const key = stateKey(state)
        expect(seen.has(key)).toBe(false)
        seen.add(key)
        const action = policy.get(key)
        expect(action).toBeTruthy()
        expect(legalActions(level, state)).toContainEqual(action)
        state = applyAction(level, state, action!)!.state
      }
    }
  })
  it('随行：禁用把手或禁止乘坐都不能通关', () => {
    const level = structuredClone(mainLevels[2])
    const ferry = level.mechanisms.find((mechanism) => mechanism.id === 'ferry')!
    if (ferry.type === 'rotator') ferry.handle = undefined
    expect(analyze(level).minActions).toBeNull()
    expect(canWinWithoutRiding(mainLevels[2])).toBe(false)
  })
  it('换乘：北台作为选做中转站，短桥取光再换长臂，十二步全收集', () => {
    const sim = new LevelSim(mainLevels[3])
    walk(sim, [7, 4, 6])
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
    walk(sim, [8, 4, 5])
    expect(sim.state().at).toBe('ferry#1')
    operate(sim, 'ferry')
    operate(sim, 'ferry')
    operate(sim, 'ferry')
    const events = walk(sim, sim.level.goal)
    expect(events).toContainEqual({ type: 'step', tileId: 'ferry#2' })
    expect(sim.status).toBe('won')
    expect(sim.steps()).toBe(targets['level-04'].minActionsAll)
  })
  it('换乘：主线在南侧下短桥、换长臂，不能只坐同一条桥到灯笼', () => {
    const sim = new LevelSim(mainLevels[3])
    walk(sim, [7, 4, 6])
    operate(sim, 'ferry')
    walk(sim, [4, 1, 4])
    operate(sim, 'ferry')
    operate(sim, 'ferry')
    walk(sim, [8, 4, 7])
    expect(sim.state().at).toBe('ferry#1')
    operate(sim, 'ferry')
    walk(sim, sim.level.goal)
    expect(sim.status).toBe('won')
    expect(sim.orbProgress().collected).toBe(1)
    expect(sim.steps()).toBe(8)
    const level = structuredClone(mainLevels[3])
    const ferry = level.mechanisms.find((mechanism) => mechanism.id === 'ferry')!
    if (ferry.type === 'rotator') ferry.blocks[1].kind = 'solid'
    expect(analyze(level).minActions).toBeNull()
  })
  it('回环：借东桥取两处必需光点，选外角返回西远端，十二步点灯', () => {
    const level = mainLevels[5]
    expect(analyze(level)).toMatchObject({ minActions: 12, minActionsAll: 14, reachableStates: 536, deadEndStates: 0 })
    expect(level.decor.lanterns).toHaveLength(3)
    const sim = new LevelSim(level)
    walk(sim, [4, 2, 5])
    expect(sim.state().at).toBe('west#0')
    operate(sim, 'west')
    walk(sim, [10, 5, 7])
    expect(sim.state().at).toBe('east#1')
    expect(sim.orbProgress().requiredCollected).toBe(1)
    operate(sim, 'east')
    operate(sim, 'east')
    walk(sim, [14, 6, 10])
    expect(sim.orbProgress().requiredCollected).toBe(2)
    walk(sim, [12, 5, 9])
    expect(sim.state().at).toBe('east#1')
    const beforeReturn = structuredClone(sim.state())
    expect(sim.command({ type: 'operate', mechanism: 'east' })).toBe('ok')
    expect(sim.undo()).toBe(false)
    expect(sim.command({ type: 'walk', tileId: '14,6,10' })).toBe('busy')
    sim.update(1 / 30)
    const ridingEast = [...sim.characterPose().position]
    settle(sim)
    expect(sim.state().at).toBe('east#1')
    expect(sim.state().rotator.east).toBe(3)
    expect(sim.characterPose().position).not.toEqual(ridingEast)
    expect(sim.undo()).toBe(true)
    expect(sim.state()).toEqual(beforeReturn)
    operate(sim, 'east')
    operate(sim, 'west')
    walk(sim, [9, 2, 3])
    expect(sim.state().at).toBe('west#1')
    const beforeLift = structuredClone(sim.state())
    expect(sim.command({ type: 'operate', mechanism: 'west' })).toBe('ok')
    expect(sim.undo()).toBe(false)
    expect(sim.command({ type: 'walk', tileId: level.goal.join(',') })).toBe('busy')
    sim.update(1 / 30)
    const ridingWest = [...sim.characterPose().position]
    settle(sim)
    expect(sim.state().at).toBe('west#1')
    expect(sim.state().rotator.west).toBe(0)
    expect(sim.characterPose().position).not.toEqual(ridingWest)
    expect(sim.undo()).toBe(true)
    expect(sim.state()).toEqual(beforeLift)
    operate(sim, 'west')
    expect(walk(sim, level.goal)).toContainEqual({ type: 'won' })
    expect(sim.steps()).toBe(12)
    expect(sim.orbProgress().collected).toBe(2)
    expect(sim.undo()).toBe(true)
    expect(sim.status).toBe('playing')
    expect(sim.orbProgress().collected).toBe(2)
  })
  it('回环：缺东庭光点不能点灯，西桥未到位不能返程，到位后内端可经外角自动寻路', () => {
    const skipped = new LevelSim(mainLevels[5])
    walk(skipped, [4, 2, 5])
    operate(skipped, 'west')
    walk(skipped, [10, 5, 7])
    operate(skipped, 'east')
    operate(skipped, 'east')
    operate(skipped, 'east')
    operate(skipped, 'west')
    walk(skipped, [9, 2, 3])
    operate(skipped, 'west')
    expect(walk(skipped, skipped.level.goal)).toContainEqual({ type: 'goal-locked', missing: 1 })
    expect(skipped.status).toBe('playing')
    const inner = new LevelSim(mainLevels[5])
    walk(inner, [4, 2, 5])
    operate(inner, 'west')
    walk(inner, [10, 5, 7])
    operate(inner, 'east')
    operate(inner, 'east')
    walk(inner, [14, 6, 10])
    walk(inner, [12, 5, 8])
    expect(inner.state().at).toBe('east#0')
    operate(inner, 'east')
    expect(inner.state().at).toBe('east#0')
    expect(inner.tileAt([11, 5, 7])?.id).toBe('east#0')
    expect(inner.command({ type: 'walk', tileId: 'west#1' })).toBe('unreachable')
    operate(inner, 'west')
    const returnEvents = walk(inner, [9, 2, 3])
    expect(returnEvents).toContainEqual({ type: 'step', tileId: 'east#1' })
    expect(inner.steps()).toBe(10)
    operate(inner, 'west')
    expect(walk(inner, inner.level.goal)).toContainEqual({ type: 'won' })
    expect(inner.steps()).toBe(12)
  })
  it('回环：中途经内端停靠南庭，十四步收齐三处光点', () => {
    const sim = new LevelSim(mainLevels[5])
    walk(sim, [4, 2, 5])
    operate(sim, 'west')
    walk(sim, [10, 5, 8])
    expect(sim.state().at).toBe('east#0')
    operate(sim, 'west')
    operate(sim, 'east')
    walk(sim, [12, 6, 11])
    expect(sim.orbProgress().collected).toBe(2)
    expect(sim.undo()).toBe(true)
    expect(sim.orbProgress().collected).toBe(1)
    walk(sim, [12, 6, 11])
    walk(sim, [11, 5, 9])
    expect(sim.state().at).toBe('east#0')
    operate(sim, 'east')
    walk(sim, [14, 6, 10])
    expect(sim.orbProgress().collected).toBe(3)
    walk(sim, [12, 5, 9])
    expect(sim.state().at).toBe('east#1')
    operate(sim, 'east')
    walk(sim, [9, 2, 3])
    operate(sim, 'west')
    expect(walk(sim, sim.level.goal)).toContainEqual({ type: 'won' })
    expect(sim.steps()).toBe(14)
    expect(sim.orbProgress().collected).toBe(3)
  })
  it('回环：两把手、西远端和乘坐都不能绕过，南庭不是主线必经', () => {
    for (const id of ['west', 'east']) {
      const level = structuredClone(mainLevels[5])
      const mechanism = level.mechanisms.find((item) => item.id === id)!
      if (mechanism.type === 'rotator') mechanism.handle = undefined
      expect(analyze(level).minActions).toBeNull()
    }
    const blockedHigh = structuredClone(mainLevels[5])
    const west = blockedHigh.mechanisms.find((item) => item.id === 'west')!
    if (west.type === 'rotator') west.blocks[1]!.kind = 'solid'
    expect(analyze(blockedHigh).minActions).toBeNull()
    expect(canWinWithoutRiding(mainLevels[5])).toBe(false)
    expect(noSouthDockWin(false)).toBe(12)
    expect(noSouthDockWin(true)).toBeNull()
  })
  it('联动：两个把手都必需，远桥相位锁定，东口校准仍是同长解', () => {
    const level = mainLevels[7]
    expect(level.revision).toBe(2)
    expect(analyze(level)).toMatchObject({
      minActions: 13,
      minActionsAll: 14,
      reachableStates: 1064,
      deadEndStates: 0,
      illusions: 9,
      tradeoffs: 2,
    })
    for (const handle of ['pair', 'relay']) {
      const blocked = structuredClone(level)
      const mechanism = blocked.mechanisms.find((item) => item.id === handle)!
      if (mechanism.type === 'rotator') mechanism.handle = undefined
      expect(analyze(blocked).minActions).toBeNull()
    }
    for (const state of reachableStates(level))
      expect(state.rotator.remote).toBe((state.rotator.pair + state.rotator.relay + 1) % 4)
    const main = new LevelSim(level)
    for (const step of level.solution) {
      if (step.type === 'walk') walk(main, step.to)
      else if (step.type === 'operate') operate(main, step.mechanism)
    }
    expect(main.status).toBe('won')
    expect(main.steps()).toBe(13)
    expect(main.orbProgress()).toMatchObject({ collected: 2, requiredCollected: 2 })
    const alternate = new LevelSim(level)
    const play = (step: { type: 'walk'; tileId?: string; to?: Vec3 } | { type: 'operate'; mechanism: string }) => {
      if (step.type === 'operate') operate(alternate, step.mechanism)
      else if (step.to) walk(alternate, step.to)
      else expect(alternate.command({ type: 'walk', tileId: step.tileId! })).toBe('ok')
      if (step.type === 'walk' && step.tileId) settle(alternate)
    }
    play({ type: 'walk', tileId: 'pair#0' })
    play({ type: 'operate', mechanism: 'pair' })
    play({ type: 'walk', to: [4, 2, 7] })
    play({ type: 'walk', tileId: 'pair#0' })
    play({ type: 'operate', mechanism: 'pair' })
    expect(alternate.state().at).toBe('pair#0')
    play({ type: 'operate', mechanism: 'relay' })
    play({ type: 'walk', tileId: 'remote#0' })
    play({ type: 'operate', mechanism: 'pair' })
    play({ type: 'walk', to: [15, 9, 13] })
    play({ type: 'walk', tileId: 'relay#0' })
    play({ type: 'operate', mechanism: 'relay' })
    play({ type: 'operate', mechanism: 'relay' })
    play({ type: 'walk', to: [6, 2, 0] })
    expect(alternate.status).toBe('won')
    expect(alternate.steps()).toBe(13)
    const missed = new LevelSim(level)
    walk(missed, [1, 1, 3])
    operate(missed, 'pair')
    walk(missed, [4, 2, 7])
    operate(missed, 'pair')
    expect(missed.state().at).toBe('4,2,7')
    expect(missed.command({ type: 'walk', tileId: 'pair#0' })).toBe('unreachable')
    let restored = false
    for (let turn = 0; turn < 3 && !restored; turn++) {
      operate(missed, 'pair')
      restored = missed.command({ type: 'walk', tileId: 'pair#0' }) === 'ok'
    }
    expect(restored).toBe(true)
    expect(settle(missed).some((event) => event.type === 'step')).toBe(true)
    expect(missed.state().at).toBe('pair#0')
    expect(missed.undo()).toBe(true)
    expect(missed.state().at).toBe('4,2,7')
  })
  it('牵引：经过不召台，停住才召台，主线两次恢复归门，南侧绕行仍可通关', () => {
    const level = mainLevels[8]
    expect(level.revision).toBe(2)
    expect(analyze(level)).toMatchObject({
      minActions: 13,
      minActionsAll: 14,
      reachableStates: 1184,
      deadEndStates: 0,
      illusions: 16,
      tradeoffs: 3,
    })
    let passed = initialState(level)
    for (const action of [
      { type: 'walk' as const, tileId: 'swing#0' },
      { type: 'operate' as const, mechanism: 'swing' },
      { type: 'walk' as const, tileId: '4,2,8' },
    ])
      passed = applyAction(level, passed, action)!.state
    expect(passed.mover.receiver.stopIndex).toBe(1)
    expect(passed.gates.door).toBe(false)
    const stopped = applyAction(level, passed, { type: 'walk', tileId: '4,2,7' })!.state
    expect(stopped.mover.receiver.stopIndex).toBe(0)
    expect(stopped.gates.door).toBe(true)
    expect(stopped.gates['south-door']).toBe(true)
    const sim = new LevelSim(level)
    let north = 0
    for (const step of level.solution) {
      const events =
        step.type === 'walk' ? walk(sim, step.to) : step.type === 'operate' ? operate(sim, step.mechanism) : []
      north += events.filter((event) => event.type === 'plate' && event.id === 'call-north').length
    }
    expect(north).toBe(2)
    expect(sim.status).toBe('won')
    expect(sim.steps()).toBe(13)
    expect(sim.orbProgress().requiredCollected).toBe(3)
    const withoutNorth = [initialState(level)]
    const seenSouth = new Set([stateKey(withoutNorth[0]!)])
    let longer = false
    for (let index = 0; index < withoutNorth.length && !longer; index++) {
      const state = withoutNorth[index]!
      for (const action of legalActions(level, state)) {
        const transition = applyAction(level, state, action)!
        if (transition.plate === 'call-north') continue
        if (transition.state.won) {
          longer = true
          break
        }
        const key = stateKey(transition.state)
        if (seenSouth.has(key)) continue
        seenSouth.add(key)
        withoutNorth.push(transition.state)
      }
    }
    expect(longer).toBe(true)
  })
  it('推动：箱留远岸守近门，人三次乘台，返庭取光后十二步点灯', () => {
    const level = mainLevels[9]
    expect(analyze(level)).toMatchObject({ minActions: 12, minActionsAll: 13, reachableStates: 1012, deadEndStates: 0 })
    const sim = new LevelSim(level)
    walk(sim, [0, 0, 2])
    for (let count = 0; count < 2; count++) {
      expect(sim.command({ type: 'push', crate: 'crate-0' })).toBe('ok')
      settle(sim)
    }
    const loaded = structuredClone(sim.state())
    operate(sim, 'freight')
    expect(sim.state().crates['crate-0']).toBe('freight#1')
    expect(sim.undo()).toBe(true)
    expect(sim.state()).toEqual(loaded)
    operate(sim, 'freight')
    expect(sim.command({ type: 'push', crate: 'crate-0' })).toBe('ok')
    settle(sim)
    expect(sim.state().crates['crate-0']).toBe('8,2,4')
    expect(gatesOf(level, sim.state()).door).toBe(true)
    operate(sim, 'freight')
    expect(sim.state().at).toBe('freight#1')
    walk(sim, [1, 0, 0])
    expect(sim.orbProgress().requiredCollected).toBe(2)
    expect(sim.undo()).toBe(true)
    expect(sim.orbProgress().requiredCollected).toBe(1)
    expect(gatesOf(level, sim.state()).door).toBe(true)
    walk(sim, [1, 0, 0])
    walk(sim, [3, 1, 2])
    operate(sim, 'freight')
    walk(sim, [10, 4, 9])
    operate(sim, 'finish')
    expect(walk(sim, level.goal)).toContainEqual({ type: 'won' })
    expect(sim.steps()).toBe(12)
    expect(sim.state().crates['crate-0']).toBe('8,2,4')
  })
  it('推动：先赴灯塔会缺近庭光，选做可以在任一次远岸停靠取得', () => {
    const level = mainLevels[9]
    const replay = (sim: LevelSim, steps: typeof level.solution) => {
      for (const step of steps) {
        if (step.type === 'walk') walk(sim, step.to)
        else if (step.type === 'operate') operate(sim, step.mechanism)
        else {
          expect(sim.command(step)).toBe('ok')
          settle(sim)
        }
      }
    }
    const skipped = new LevelSim(level)
    replay(skipped, [...level.solution.slice(0, 5), ...level.solution.slice(9, 11)])
    expect(walk(skipped, level.goal)).toContainEqual({ type: 'goal-locked', missing: 1 })
    expect(skipped.status).toBe('playing')
    for (const stop of [4, 9]) {
      const sim = new LevelSim(level)
      replay(sim, [
        ...level.solution.slice(0, stop),
        { type: 'walk', to: [5, 1, 1] },
        ...(stop === 4 ? [{ type: 'walk' as const, to: [5, 1, 3] as Vec3 }] : []),
        ...level.solution.slice(stop),
      ])
      expect(sim.status).toBe('won')
      expect(sim.steps()).toBe(stop === 4 ? 14 : 13)
      expect(sim.orbProgress().collected).toBe(4)
    }
  })
  it('越界：低廊路过不触发，停板开出口后才可将箱改压主线门', () => {
    const level = mainLevels[10]
    expect(analyze(level)).toMatchObject({
      minActions: 11,
      minActionsAll: 12,
      reachableStates: 3712,
      deadEndStates: 1040,
    })
    const sim = new LevelSim(level)
    for (const step of level.solution.slice(0, 5)) {
      if (step.type === 'walk') walk(sim, step.to)
      else if (step.type === 'operate') operate(sim, step.mechanism)
      else {
        expect(sim.command(step)).toBe('ok')
        settle(sim)
      }
    }
    expect(sim.state().crates['crate-0']).toBe('6,2,7')
    expect(gatesOf(level, sim.state())['garden-door']).toBe(true)
    const passed = walk(sim, [0, -1, 3])
    expect(passed).toContainEqual({ type: 'step', tileId: '1,-1,3' })
    expect(sim.state().gates['exit-door']).toBe(false)
    expect(walk(sim, [1, -1, 3])).toContainEqual({ type: 'plate', id: 'latch', triggered: true })
    expect(sim.state().gates['exit-door']).toBe(true)
    walk(sim, [8, 3, 8])
    expect(sim.command({ type: 'push', crate: 'crate-0' })).toBe('ok')
    settle(sim)
    expect(gatesOf(level, sim.state(), true)).toMatchObject({ 'garden-door': false, door: true, 'exit-door': true })
    walk(sim, [11, 4, 10])
    operate(sim, 'finish')
    walk(sim, level.goal)
    expect(sim.status).toBe('won')
    expect(sim.steps()).toBe(12)
    expect(sim.orbProgress().collected).toBe(3)
  })
  it('越界：过早推进或入口反推均是无解状态，撤销恢复非空获胜策略', () => {
    const level = mainLevels[10]
    const policy = buildPolicy(level)
    for (const early of [true, false]) {
      const sim = new LevelSim(level)
      const prefix = early
        ? [...level.solution.slice(0, 5), level.solution[6], level.solution[7]]
        : [
            { type: 'walk' as const, to: [3, 1, 3] as Vec3 },
            { type: 'push' as const, crate: 'crate-0' },
          ]
      for (const step of prefix) {
        if (step.type === 'walk') walk(sim, step.to)
        else if (step.type === 'operate') operate(sim, step.mechanism)
        else {
          expect(sim.command(step)).toBe('ok')
          settle(sim)
        }
      }
      expect(policy.get(stateKey(sim.state()))).toBeNull()
      expect(sim.undo()).toBe(true)
      expect(policy.get(stateKey(sim.state()))).toBeTruthy()
    }
  })
  it('改坏一处坐标会指出是哪一项、哪一格', () => {
    const broken = structuredClone(mainLevels[0])
    broken.blocks.find((block) => block.pos.join(',') === '0,0,3')!.pos = [0, 0, 2]
    expect(validateLevels([broken])).toContainEqual({ check: '无重叠', cell: '0,0,2', detail: '两块积木占用同一格' })
  })
})
