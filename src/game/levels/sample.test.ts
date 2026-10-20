import { describe, expect, it } from 'vitest'
import { visibleTilesOf } from '../core/rules'
import { LevelSim } from '../core/sim'
import { surfaceY } from '../core/iso'
import { analyze } from '../core/solver'
import { validateLevels } from '../core/validate'
import sample from './sample-01'
import { sampleTargets } from './targets'
import type { SolutionStep } from './types'

function step(sim: LevelSim, action: SolutionStep) {
  expect(sim.command(action.type === 'walk' ? { type: 'walk', tileId: sim.tileAt(action.to)!.id } : action)).toBe('ok')
  for (let frame = 0; frame < 800 && !sim.isIdle(); frame++) sim.update(1 / 30)
  expect(sim.isIdle()).toBe(true)
}
const all: SolutionStep[] = [
  ...sample.solution.slice(0, 5),
  { type: 'walk', to: [-1, 1, 0] },
  ...sample.solution.slice(5),
]

describe('独立样段：叠庭', () => {
  it('主线与全收集分别通过结构、安全、可见性、遮挡与难度校验', () => {
    expect(validateLevels([sample], sampleTargets)).toEqual([])
    const full = { ...sample, solution: all }
    expect(validateLevels([full], {})).toEqual([])
  })
  it.each(['lift', 'ferry'])('禁止 %s 操作后不可通关', (id) => {
    const level = structuredClone(sample)
    const mechanism = level.mechanisms.find((item) => item.id === id)!
    if (mechanism.type === 'mover' || mechanism.type === 'rotator') delete mechanism.handle
    expect(analyze(level).minActions).toBeNull()
  })
  it('乘侧翼升到上层，下台降空台才能看见并登上后方高台，撤销恢复遮挡', () => {
    const sim = new LevelSim(sample)
    sample.solution.slice(0, 4).forEach((action) => step(sim, action))
    expect(sim.state().at).toBe('lift#1')
    expect(sim.command({ type: 'operate', mechanism: 'lift' })).toBe('ok')
    sim.update(0.675)
    expect(sim.characterPose().position[1]).toBeGreaterThan(surfaceY(1))
    expect(sim.characterPose().position[1]).toBeLessThan(surfaceY(4))
    expect(sim.undo()).toBe(false)
    for (let frame = 0; frame < 100 && !sim.isIdle(); frame++) sim.update(1 / 30)
    expect(sim.state().at).toBe('lift#1')
    step(sim, sample.solution[5])
    expect(sim.state().at).toBe('2,2,0')
    expect(visibleTilesOf(sample, sim.state()).has('ferry#2')).toBe(false)
    step(sim, sample.solution[6])
    expect(visibleTilesOf(sample, sim.state()).has('ferry#2')).toBe(true)
    expect(sim.undo()).toBe(true)
    expect(visibleTilesOf(sample, sim.state()).has('ferry#2')).toBe(false)
    sample.solution.slice(6).forEach((action) => step(sim, action))
    expect(sim.status).toBe('won')
    expect(sim.steps()).toBe(11)
    expect(sim.orbProgress().collected).toBe(2)
    expect(sim.undo()).toBe(true)
    expect(sim.status).toBe('playing')
  })
  it('上层侧翼通向选做西台，收光与撤销正确，十二步全收集', () => {
    const sim = new LevelSim(sample)
    all.slice(0, 6).forEach((action) => step(sim, action))
    expect(sim.orbProgress().collected).toBe(2)
    expect(sim.undo()).toBe(true)
    expect(sim.orbProgress().collected).toBe(1)
    all.slice(5).forEach((action) => step(sim, action))
    expect(sim.status).toBe('won')
    expect(sim.steps()).toBe(12)
    expect(sim.orbProgress().collected).toBe(3)
  })
})
