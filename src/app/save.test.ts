import { afterEach, describe, expect, it, vi } from 'vitest'
import { emptySave, loadSave, writeSave } from './save'
const memory = new Map<string, string>()
const storage = () =>
  vi.stubGlobal('localStorage', {
    getItem: (key: string) => memory.get(key) ?? null,
    setItem: (key: string, value: string) => memory.set(key, value),
  })
afterEach(() => {
  memory.clear()
  vi.unstubAllGlobals()
})
describe('v2 存档', () => {
  it('v1 只保留静音，不迁移通关进度', () => {
    storage()
    memory.set('seemingly:save:v1', JSON.stringify({ version: 1, muted: true, completed: ['level-01'] }))
    expect(loadSave()).toEqual({ ...emptySave(), muted: true })
  })
  it('兼容期 v2 的同名旧关卡记录只保留静音', () => {
    storage()
    memory.set(
      'seemingly:save:v2',
      JSON.stringify({
        version: 2,
        muted: true,
        levels: { 'level-01': { done: true, allOrbs: true, bestSteps: 1, parMet: true } },
      }),
    )
    expect(loadSave()).toEqual({ ...emptySave(), muted: true })
    const remade = { ...loadSave(), levels: { 'level-01': { done: true, allOrbs: true, bestSteps: 2, parMet: true } } }
    writeSave(remade)
    expect(loadSave()).toEqual(remade)
  })
  it('v2 完整读写，优先于旧存档', () => {
    storage()
    const save = {
      version: 2 as const,
      muted: false,
      levels: { 'level-01': { done: true, allOrbs: true, bestSteps: 1, parMet: true } },
    }
    memory.set('seemingly:save:v1', JSON.stringify({ version: 1, muted: true, completed: ['level-01'] }))
    writeSave(save)
    expect(loadSave()).toEqual(save)
    expect(memory.has('seemingly:save:v2')).toBe(true)
  })
  it.each([
    '{',
    'null',
    '[]',
    '{"version":3}',
    JSON.stringify({
      version: 2,
      campaign: 'remake',
      muted: false,
      levels: { x: { done: true, allOrbs: true, bestSteps: -1, parMet: true } },
    }),
  ])('损坏和未知数据退回空存档：%s', (raw) => {
    storage()
    memory.set('seemingly:save:v2', raw)
    expect(loadSave()).toEqual(emptySave())
  })
  it('无法访问本地存储时仍可在当前会话继续', () => {
    vi.stubGlobal('localStorage', {
      getItem: () => {
        throw new Error('blocked')
      },
      setItem: () => {
        throw new Error('blocked')
      },
    })
    expect(loadSave()).toEqual(emptySave())
    expect(() => writeSave(emptySave())).not.toThrow()
  })
})
