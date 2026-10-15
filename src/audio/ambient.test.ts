import { describe, expect, it, vi } from 'vitest'
import type { AudioBus } from './engine'
import { Ambient } from './ambient'

const audioBus = () => {
  const sources: { stop: ReturnType<typeof vi.fn>; disconnect: ReturnType<typeof vi.fn> }[] = []
  const gains: { disconnect: ReturnType<typeof vi.fn> }[] = []
  const output = { disconnect: vi.fn() }
  const context = {
    currentTime: 3,
    createOscillator: () => {
      const source = { frequency: { value: 0 }, connect: vi.fn(), start: vi.fn(), stop: vi.fn(), disconnect: vi.fn() }
      sources.push(source)
      return source
    },
    createGain: () => {
      const gain = {
        gain: { value: 0, setValueAtTime: vi.fn(), linearRampToValueAtTime: vi.fn() },
        connect: vi.fn(),
        disconnect: vi.fn(),
      }
      gains.push(gain)
      return gain
    },
  }
  return { bus: { context, output } as unknown as AudioBus, sources, gains, output }
}

describe('环境和弦生命周期', () => {
  it('未解锁或静音不创建音源，重复同步同一输出不叠加', () => {
    const { bus, sources } = audioBus()
    const ambient = new Ambient()
    ambient.sync(undefined)
    expect(sources).toHaveLength(0)
    ambient.sync(bus)
    expect(sources).toHaveLength(4)
    ambient.sync({ ...bus })
    expect(sources).toHaveLength(4)
  })

  it('静音同步停止三音及起伏振荡器并释放节点，重新开声创建新的一份', () => {
    const { bus, sources, gains, output } = audioBus()
    const ambient = new Ambient()
    ambient.sync(bus)
    ambient.sync(undefined)
    for (const source of sources) {
      expect(source.stop).toHaveBeenCalledExactlyOnceWith(3)
      expect(source.disconnect).toHaveBeenCalledTimes(1)
    }
    for (const gain of gains) expect(gain.disconnect).toHaveBeenCalledTimes(1)
    expect(output.disconnect).not.toHaveBeenCalled()
    ambient.stop()
    for (const source of sources) expect(source.stop).toHaveBeenCalledTimes(1)
    ambient.sync(bus)
    expect(sources).toHaveLength(8)
    for (const source of sources.slice(4)) expect(source.stop).not.toHaveBeenCalled()
  })

  it('更换上下文先释放旧音源，不保留旧输出连接', () => {
    const first = audioBus()
    const second = audioBus()
    const ambient = new Ambient()
    ambient.sync(first.bus)
    ambient.sync(second.bus)
    for (const source of first.sources) expect(source.stop).toHaveBeenCalledTimes(1)
    expect(second.sources).toHaveLength(4)
    ambient.stop()
    for (const source of second.sources) expect(source.stop).toHaveBeenCalledTimes(1)
  })
})
