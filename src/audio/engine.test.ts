import { describe, expect, it, vi } from 'vitest'
import { AudioEngine } from './engine'

const audioContext = () => {
  const gain = {
    gain: { value: 1, cancelScheduledValues: vi.fn(), setValueAtTime: vi.fn(), setTargetAtTime: vi.fn() },
    connect: vi.fn(),
  }
  const context = {
    state: 'suspended' as AudioContextState,
    currentTime: 2,
    destination: {},
    createGain: vi.fn(() => gain),
    resume: vi.fn(async () => {
      context.state = 'running'
    }),
  }
  const create = vi.fn(() => context as unknown as AudioContext)
  return { context, gain, create }
}

describe('音频引擎', () => {
  it('创建引擎和设置存档静音都不提前创建音频上下文', () => {
    const { create } = audioContext()
    const engine = new AudioEngine(create)
    engine.setMuted(true)
    expect(create).not.toHaveBeenCalled()
    expect(engine.getBus()).toBeUndefined()
  })

  it('首次交互创建并恢复上下文，后续交互复用同一输出', async () => {
    const { create, context, gain } = audioContext()
    const engine = new AudioEngine(create)
    await engine.unlock()
    expect(create).toHaveBeenCalledTimes(1)
    expect(context.resume).toHaveBeenCalledTimes(1)
    expect(gain.connect).toHaveBeenCalledWith(context.destination)
    expect(engine.getBus()?.context).toBe(context)
    expect(gain.gain.value).toBe(0.28)
    await engine.unlock()
    expect(create).toHaveBeenCalledTimes(1)
    expect(context.resume).toHaveBeenCalledTimes(1)
  })

  it('首次交互遵守已保存的静音，切换后更新 master 且不向静音时提供输出', async () => {
    const { create, gain } = audioContext()
    const engine = new AudioEngine(create)
    engine.setMuted(true)
    await engine.unlock()
    expect(gain.gain.value).toBe(0)
    expect(engine.getBus()).toBeUndefined()
    engine.setMuted(false)
    expect(engine.getBus()).toBeDefined()
    expect(gain.gain.setTargetAtTime).toHaveBeenCalledWith(0.28, 2, 0.015)
    engine.setMuted(true)
    expect(gain.gain.setValueAtTime).toHaveBeenCalledWith(0, 2)
    expect(engine.getBus()).toBeUndefined()
  })

  it('浏览器挂起后下一次手势重试恢复，失败不抛异常或排队', async () => {
    const { create, context } = audioContext()
    const engine = new AudioEngine(create)
    context.resume.mockRejectedValueOnce(new Error('需要再次交互'))
    await expect(engine.unlock()).resolves.toBeUndefined()
    expect(engine.getBus()).toBeUndefined()
    await engine.unlock()
    expect(engine.getBus()).toBeDefined()
    expect(create).toHaveBeenCalledTimes(1)
  })

  it('没有音频能力或创建失败时仍可继续游戏', async () => {
    await expect(new AudioEngine(() => undefined).unlock()).resolves.toBeUndefined()
    const engine = new AudioEngine(() => {
      throw new Error('音频不可用')
    })
    await expect(engine.unlock()).resolves.toBeUndefined()
    expect(engine.getBus()).toBeUndefined()
  })
})
