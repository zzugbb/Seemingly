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
      sim.update(1 / 30).forEach((event) => playSimEvent(event, level))
    }
  }
  expect(sim.status).toBe('won')
  return vi.mocked(playSound).mock.calls.map(([sound]) => sound)
}

describe('模拟器音效接入', () => {
  beforeEach(() => vi.clearAllMocks())

  it('启程：两处光点与回庭点灯分别发声，没有机关声', () => {
    const sounds = solveWithSound(0)
    expect(sounds.filter((sound) => sound === 'orb')).toHaveLength(2)
    expect(sounds.filter((sound) => sound === 'lantern')).toHaveLength(1)
    expect(sounds).not.toContain('turn')
    expect(sounds).not.toContain('mechanism')
  })

  it('转动：一次操作、收集光点和抵达分别发声，脚步多于操作步', () => {
    const sounds = solveWithSound(1)
    expect(sounds.filter((sound) => sound === 'mechanism')).toHaveLength(1)
    expect(sounds.filter((sound) => sound === 'orb')).toHaveLength(1)
    expect(sounds.filter((sound) => sound === 'lantern')).toHaveLength(1)
    expect(sounds.filter((sound) => sound === 'step').length).toBeGreaterThan(2)
  })

  it('新增音效事件保留门的开关方向，非音效事件不发声', () => {
    const events: Parameters<typeof playSimEvent>[0][] = [
      { type: 'orb', id: 'orb-0' },
      { type: 'goal-locked', missing: 1 },
      { type: 'undo' },
      { type: 'push', crate: 'crate-0' },
      { type: 'gate', id: 'gate', open: true },
      { type: 'gate', id: 'gate', open: false },
      { type: 'mechanism-start', id: 'turn' },
    ]
    events.forEach((event) => playSimEvent(event, { ...levels[1], soundtrack: undefined }))
    expect(vi.mocked(playSound).mock.calls).toEqual([
      ['orb'],
      ['goalLocked'],
      ['undo'],
      ['push'],
      ['gate', { open: true }],
      ['gate', { open: false }],
    ])
  })

  it('换乘：换乘时发脚步，随桥运动不额外发出脚步音', () => {
    const sounds = solveWithSound(3)
    expect(sounds.filter((sound) => sound === 'step')).toHaveLength(7)
    expect(sounds.filter((sound) => sound === 'mechanism')).toHaveLength(4)
    expect(sounds.filter((sound) => sound === 'orb')).toHaveLength(1)
    expect(sounds.filter((sound) => sound === 'lantern')).toHaveLength(1)
  })
  it('回环：运动和到位分开发声，两座转盘仍按原顺序使用不同音区', () => {
    const sounds = solveWithSound(5)
    expect(sounds.filter((sound) => sound === 'turn')).toHaveLength(6)
    const turns = vi.mocked(playSound).mock.calls.filter(([sound]) => sound === 'turn')
    expect(turns.filter(([, options]) => options?.register === 0)).toHaveLength(3)
    expect(turns.filter(([, options]) => options?.register === 7)).toHaveLength(3)
    expect(sounds.filter((sound) => sound === 'orb')).toHaveLength(2)
    expect(sounds.filter((sound) => sound === 'lantern')).toHaveLength(1)
  })
})
