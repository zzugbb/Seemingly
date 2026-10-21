import { describe, expect, it } from 'vitest'
import { visibleTilesOf } from '../core/rules'
import { LevelSim } from '../core/sim'
import { surfaceY } from '../core/iso'
import { analyze } from '../core/solver'
import { validateLevels } from '../core/validate'
import sample from './sample-01'
import level05 from './level-05'
import { sampleTargets, targets } from './targets'
import type { SolutionStep } from './types'

function step(sim: LevelSim, action: SolutionStep) {
  expect(sim.command(action.type === 'walk' ? { type: 'walk', tileId: sim.tileAt(action.to)!.id } : action)).toBe('ok')
  for (let frame = 0; frame < 800 && !sim.isIdle(); frame++) sim.update(1 / 30)
  expect(sim.isIdle()).toBe(true)
}
describe.each([
  ['独立样段：叠庭', sample, sampleTargets],
  ['正式第五关：叠庭', level05, { 'level-05': targets['level-05'] }],
] as const)('%s', (_title, level, levelTargets) => {
  const fullSolution: SolutionStep[] = [
    ...level.solution.slice(0, 5),
    { type: 'walk', to: [-1, 1, 0] },
    ...level.solution.slice(5),
  ]
  it('主线与全收集分别通过结构、安全、可见性、遮挡与难度校验', () => {
    expect(validateLevels([level], levelTargets)).toEqual([])
    expect(validateLevels([{ ...level, solution: fullSolution }], {})).toEqual([])
  })
  it.each(['lift', 'ferry'])('禁止 %s 操作后不可通关', (id) => {
    const copy = structuredClone(level)
    const mechanism = copy.mechanisms.find((item) => item.id === id)!
    if (mechanism.type === 'mover' || mechanism.type === 'rotator') delete mechanism.handle
    expect(analyze(copy).minActions).toBeNull()
  })
  it('乘侧翼升到上层，下台降空台才能看见并登上后方高台，撤销恢复遮挡', () => {
    const sim = new LevelSim(level)
    level.solution.slice(0, 4).forEach((action) => step(sim, action))
    expect(sim.state().at).toBe('lift#1')
    expect(sim.command({ type: 'operate', mechanism: 'lift' })).toBe('ok')
    sim.update(0.675)
    expect(sim.characterPose().position[1]).toBeGreaterThan(surfaceY(1))
    expect(sim.characterPose().position[1]).toBeLessThan(surfaceY(4))
    expect(sim.undo()).toBe(false)
    for (let frame = 0; frame < 100 && !sim.isIdle(); frame++) sim.update(1 / 30)
    expect(sim.state().at).toBe('lift#1')
    step(sim, level.solution[5])
    expect(sim.state().at).toBe('2,2,0')
    expect(visibleTilesOf(level, sim.state()).has('ferry#2')).toBe(false)
    step(sim, level.solution[6])
    expect(visibleTilesOf(level, sim.state()).has('ferry#2')).toBe(true)
    expect(sim.undo()).toBe(true)
    expect(visibleTilesOf(level, sim.state()).has('ferry#2')).toBe(false)
    level.solution.slice(6).forEach((action) => step(sim, action))
    expect(sim.status).toBe('won')
    expect(sim.steps()).toBe(11)
    expect(sim.orbProgress().collected).toBe(2)
    expect(sim.undo()).toBe(true)
    expect(sim.status).toBe('playing')
  })
  it('上层侧翼通向选做西台，收光与撤销正确，十二步全收集', () => {
    const sim = new LevelSim(level)
    fullSolution.slice(0, 6).forEach((action) => step(sim, action))
    expect(sim.orbProgress().collected).toBe(2)
    expect(sim.undo()).toBe(true)
    expect(sim.orbProgress().collected).toBe(1)
    fullSolution.slice(5).forEach((action) => step(sim, action))
    expect(sim.status).toBe('won')
    expect(sim.steps()).toBe(12)
    expect(sim.orbProgress().collected).toBe(3)
  })
})
