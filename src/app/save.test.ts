import { afterEach, describe, expect, it, vi } from 'vitest'
import { emptySave, loadSave, writeSave } from './save'

const memory = new Map<string, string>()

afterEach(() => {
  memory.clear()
  vi.unstubAllGlobals()
})

const installStorage = () => {
  vi.stubGlobal('localStorage', {
    getItem: (key: string) => memory.get(key) ?? null,
    setItem: (key: string, value: string) => {
      memory.set(key, value)
    },
  })
}

describe('存档', () => {
  it('写入后能读回，坏数据退回空存档', () => {
    installStorage()
    writeSave({ version: 1, completed: ['prototype'], muted: true })
    expect(loadSave()).toEqual({ version: 1, completed: ['prototype'], muted: true })
    memory.set('seemingly:save:v1', '{')
    expect(loadSave()).toEqual(emptySave())
  })
})
