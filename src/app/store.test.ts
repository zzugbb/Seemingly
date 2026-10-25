import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { challengeLevels, mainLevels, sampleLevels, levelRevisions, type LevelDef } from '../game/levels'
import { targets } from '../game/levels/targets'
import { emptySave, loadSave } from './save'
import { campaignStats, ratingCount } from './entry'
import { firstPlayableIndex, isUnlocked, useApp } from './store'
beforeEach(() => useApp.setState({ screen: 'title', current: { list: 'main', index: 0 }, save: emptySave() }))
afterEach(() => vi.unstubAllGlobals())
describe('进度与评价', () => {
  it('已学教学跨重进与刷新保留、重复事件不写档，不写样段或影响评价', () => {
    const memory = new Map<string, string>()
    const setItem = vi.fn((key: string, value: string) => memory.set(key, value))
    vi.stubGlobal('localStorage', { getItem: (key: string) => memory.get(key) ?? null, setItem })
    const app = useApp.getState()
    app.learnTutorials(['walk', 'collect'])
    expect(useApp.getState().save.levels).toEqual({})
    expect(useApp.getState().save.muted).toBe(false)
    app.goSelect()
    app.play('main', 0)
    expect(useApp.getState().save.tutorials).toEqual(['walk', 'collect'])
    expect(loadSave().tutorials).toEqual(['walk', 'collect'])
    app.learnTutorials(['walk'])
    expect(setItem).toHaveBeenCalledTimes(1)
    app.completeLevel('level-01', { steps: 3, allOrbs: true, usedHint: false })
    expect(useApp.getState().save.levels['level-01'].parMet).toBe(true)
    app.play('sample', 0)
    const before = useApp.getState().save
    app.learnTutorials(['lift', 'ride'])
    expect(useApp.getState().save).toBe(before)
  })
  it('15/18 重玩分次补评，提示局次与较差成绩不回退历史，刷新保留', () => {
    const memory = new Map<string, string>()
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => memory.get(key) ?? null,
      setItem: (key: string, value: string) => memory.set(key, value),
    })
    const save = emptySave()
    for (const [index, level] of mainLevels.slice(0, 6).entries()) {
      save.levels[level.id] = {
        done: true,
        allOrbs: true,
        parMet: index < 3,
        bestSteps: targets[level.id].minActionsAll,
      }
    }
    useApp.setState({ save })
    const complete = useApp.getState().completeLevel
    expect(campaignStats(save).earned).toBe(15)
    expect(campaignStats(save).ratingMax).toBe(60)
    expect(isUnlocked(save, 'main', 6)).toBe(true)
    const id = 'level-04'
    complete(id, { steps: 8, allOrbs: false, usedHint: true })
    expect(useApp.getState().save.levels[id]).toEqual({ done: true, allOrbs: true, parMet: false, bestSteps: 8 })
    expect(campaignStats(useApp.getState().save).earned).toBe(15)
    complete(id, { steps: 8, allOrbs: false, usedHint: false })
    expect(campaignStats(useApp.getState().save).earned).toBe(16)
    expect(ratingCount(useApp.getState().save.levels[id])).toBe(3)
    complete(id, { steps: 16, allOrbs: false, usedHint: true })
    expect(useApp.getState().save.levels[id]).toEqual({ done: true, allOrbs: true, parMet: true, bestSteps: 8 })
    expect(loadSave()).toEqual(useApp.getState().save)
    expect(campaignStats(loadSave()).earned).toBe(16)
    expect(isUnlocked(loadSave(), 'main', 5)).toBe(true)
  })
  it('独立样段随时可进入，通关不写入主线评价、修订或解锁', () => {
    const before = useApp.getState().save
    useApp.getState().play('sample', 0)
    expect(useApp.getState().current).toEqual({ list: 'sample', index: 0 })
    expect(useApp.getState().screen).toBe('play')
    useApp.getState().completeLevel(sampleLevels[0].id, { steps: 12, allOrbs: true, usedHint: false })
    expect(useApp.getState().save).toBe(before)
    expect(levelRevisions[sampleLevels[0].id]).toBeUndefined()
    expect(firstPlayableIndex(before)).toBe(0)
    expect(isUnlocked(before, 'main', 1)).toBe(false)
    expect(isUnlocked(before, 'sample', 1)).toBe(false)
  })
  it('逐关解锁并继续到第一个未通关关卡，未知记录不解锁', () => {
    const save = emptySave()
    expect(firstPlayableIndex(save)).toBe(0)
    expect(isUnlocked(save, 'main', 1)).toBe(false)
    for (let i = 0; i < mainLevels.length; i++) {
      expect(firstPlayableIndex(save)).toBe(i)
      expect(isUnlocked(save, 'main', i)).toBe(true)
      save.levels[mainLevels[i].id] = {
        done: true,
        allOrbs: true,
        bestSteps: targets[mainLevels[i].id].minActions,
        parMet: true,
      }
    }
    expect(firstPlayableIndex(save)).toBe(mainLevels.length - 1)
    expect(isUnlocked(save, 'main', 99)).toBe(false)
    expect(
      isUnlocked(
        { ...emptySave(), levels: { prototype: { done: true, allOrbs: true, bestSteps: 1, parMet: true } } },
        'main',
        1,
      ),
    ).toBe(false)
  })
  it('保存历史最好；提示影响本次步数评价，后续无提示仍可获得', () => {
    const complete = useApp.getState().completeLevel,
      id = mainLevels[0].id
    const minimum = targets[id].minActions
    complete(id, { steps: 4, allOrbs: false, usedHint: true })
    expect(useApp.getState().save.levels[id]).toEqual({ done: true, allOrbs: false, bestSteps: 4, parMet: false })
    complete(id, { steps: minimum + 1, allOrbs: false, usedHint: false })
    expect(useApp.getState().save.levels[id].parMet).toBe(false)
    complete(id, { steps: minimum, allOrbs: true, usedHint: true })
    expect(useApp.getState().save.levels[id]).toEqual({ done: true, allOrbs: true, bestSteps: minimum, parMet: false })
    complete(id, { steps: minimum, allOrbs: false, usedHint: false })
    expect(useApp.getState().save.levels[id].parMet).toBe(true)
    complete(id, { steps: 8, allOrbs: false, usedHint: true })
    expect(useApp.getState().save.levels[id]).toEqual({ done: true, allOrbs: true, bestSteps: minimum, parMet: true })
  })
  it('拒绝直接进入未解锁或不存在的关卡', () => {
    useApp.getState().play('main', 1)
    expect(useApp.getState().screen).toBe('title')
    useApp.getState().play('main', 0)
    expect(useApp.getState().current).toEqual({ list: 'main', index: 0 })
    useApp.getState().goSelect()
    useApp.getState().play('challenge', 0)
    expect(useApp.getState().screen).toBe('select')
  })
  it('第一章挑战看通关，其余章节挑战看本章全部光点，空章不解锁', () => {
    const main = [
      { id: 'a', chapter: 1 },
      { id: 'b', chapter: 1 },
      { id: 'c', chapter: 2 },
      { id: 'd', chapter: 2 },
    ] as LevelDef[]
    const challenge = [
      { id: 'x', chapter: 1 },
      { id: 'y', chapter: 2 },
      { id: 'z', chapter: 3 },
    ] as LevelDef[]
    const lists = { main, challenge, sample: [] },
      save = emptySave()
    const record = { done: true, allOrbs: false, bestSteps: 3, parMet: false }
    save.levels.a = record
    expect(isUnlocked(save, 'challenge', 0, lists)).toBe(false)
    save.levels.b = record
    expect(isUnlocked(save, 'challenge', 0, lists)).toBe(true)
    save.levels.c = { ...record, allOrbs: true }
    save.levels.d = record
    expect(isUnlocked(save, 'challenge', 1, lists)).toBe(false)
    save.levels.d = { ...record, allOrbs: true }
    expect(isUnlocked(save, 'challenge', 1, lists)).toBe(true)
    expect(isUnlocked(save, 'challenge', 2, lists)).toBe(false)
  })
})

it('正式五挑战按母章解锁，与挑战完成次序和步数评价无关', () => {
  const save = emptySave()
  for (let index = 0; index < 5; index++) {
    const chapter = mainLevels.filter((level) => level.chapter === index + 1)
    expect(isUnlocked(save, 'challenge', index)).toBe(false)
    for (const level of chapter) save.levels[level.id] = { done: true, allOrbs: false, parMet: false, bestSteps: 99 }
    expect(isUnlocked(save, 'challenge', index)).toBe(index === 0)
    for (const level of chapter.slice(0, 2)) save.levels[level.id].allOrbs = true
    expect(isUnlocked(save, 'challenge', index)).toBe(index === 0)
    save.levels[chapter[2].id].allOrbs = true
    expect(isUnlocked(save, 'challenge', index)).toBe(true)
  }
  useApp.setState({ save })
  useApp.getState().play('challenge', 4)
  expect(useApp.getState().current).toEqual({ list: 'challenge', index: 4 })
  expect(challengeLevels).toHaveLength(5)
})

it('旧十五关45项保留，挑战补评分别累计且不写主线教学，刷新后为48/60', () => {
  const memory = new Map<string, string>()
  vi.stubGlobal('localStorage', {
    getItem: (key: string) => memory.get(key) ?? null,
    setItem: (key: string, value: string) => memory.set(key, value),
  })
  const records = Object.fromEntries(
    mainLevels.map((l) => [l.id, { done: true, allOrbs: true, parMet: true, bestSteps: targets[l.id].minActions }]),
  )
  useApp.setState({ save: { ...emptySave(), levels: records, tutorials: ['walk'], muted: true } })
  const original = structuredClone(records)
  const app = useApp.getState()
  expect(campaignStats(app.save)).toMatchObject({ mainDone: 15, earned: 45, ratingMax: 60 })
  app.play('challenge', 1)
  app.learnTutorials(['ride', 'patrol'])
  app.completeLevel('challenge-2', { steps: 21, allOrbs: true, usedHint: true })
  expect(useApp.getState().save.levels['challenge-2']).toEqual({
    done: true,
    allOrbs: true,
    parMet: false,
    bestSteps: 21,
  })
  app.completeLevel('challenge-2', { steps: 16, allOrbs: false, usedHint: false })
  app.completeLevel('challenge-2', { steps: 30, allOrbs: false, usedHint: true })
  const loaded = loadSave()
  expect(loaded.levels['challenge-2']).toEqual({ done: true, allOrbs: true, parMet: true, bestSteps: 16 })
  expect(loaded.tutorials).toEqual(['walk'])
  expect(loaded.muted).toBe(true)
  for (const [id, record] of Object.entries(original)) expect(loaded.levels[id]).toEqual(record)
  expect(campaignStats(loaded)).toMatchObject({ mainDone: 15, earned: 48, ratingMax: 60 })
})
