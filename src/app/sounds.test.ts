import { beforeEach, describe, expect, it, vi } from 'vitest'
import { playSound } from '../audio/sfx'
import { LevelSim } from '../game/core/sim'
import { levels } from '../game/levels'
import { playSimEvent } from './sounds'

vi.mock('../audio/sfx', () => ({ playSound: vi.fn() }))

const solveWithSound = (index: number) => {
  const level = levels[index]!
  const sim = new LevelSim(level)
  for (const step of level.solution) {
    const command = step.type === 'walk' ? { type: 'walk' as const, tileId: sim.tileAt(step.to)!.id } : step
    expect(sim.command(command)).toBe('ok')
    for (let frame = 0; !sim.isIdle() && frame < 1000; frame++) {
      sim.update(1 / 30).forEach(playSimEvent)
    }
  }
  expect(sim.status).toBe('won')
  return vi.mocked(playSound).mock.calls.map(([sound]) => sound)
}

describe('模拟器音效接入', () => {
  beforeEach(() => vi.clearAllMocks())

  it('转盘一档只响一次，整条路线每格脚步一次，抵达只点亮一次', () => {
    expect(solveWithSound(2)).toEqual(['mechanism', 'step', 'step', 'step', 'step', 'step', 'step', 'lantern'])
  })

  it('升降台跨两格发出两声机关，分段行走不多播起步或到位事件', () => {
    expect(solveWithSound(3)).toEqual(['step', 'step', 'mechanism', 'mechanism', 'step', 'step', 'step', 'lantern'])
  })
})
