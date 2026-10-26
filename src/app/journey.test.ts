import { afterEach, describe, expect, it, vi } from 'vitest'
import { mainLevels, challengeLevels } from '../game/levels'
import { emptySave } from './save'
import { canShareJourney, journeyStats, shareJourney } from './journey'
import { journeyScene } from './journey-image'

const complete = { done: true, allOrbs: true, parMet: true, bestSteps: 0 }

describe('旅程成绩卡', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('只在主线全通开放，正式关历史评价独立汇总，忽略样段和未知记录', () => {
    const save = emptySave()
    save.levels.sample = complete
    save.levels.unknown = complete
    for (const level of mainLevels.slice(0, -1)) save.levels[level.id] = complete
    expect(journeyStats(save).available).toBe(false)
    save.levels[mainLevels.at(-1)!.id] = { ...complete, allOrbs: false, parMet: false }
    expect(journeyStats(save)).toMatchObject({
      available: true,
      milestone: '主线关卡已全部抵达',
      mainDone: 15,
      challengeDone: 0,
      done: 15,
      allOrbs: 14,
      parMet: 14,
      earned: 43,
      ratingMax: 60,
    })
    for (const level of challengeLevels) save.levels[level.id] = complete
    expect(journeyStats(save)).toMatchObject({ milestone: '全部关卡已抵达', earned: 58, done: 20 })
    save.levels[mainLevels.at(-1)!.id] = complete
    expect(journeyStats(save)).toMatchObject({ milestone: '全部关卡与评价已完成', earned: 60, allOrbs: 20, parMet: 20 })
  })

  it('历史分次获得的三项分别计数，不用单次步数重新评分', () => {
    const save = emptySave()
    save.levels[mainLevels[0]!.id] = { ...complete, bestSteps: 999 }
    expect(journeyStats(save)).toMatchObject({ done: 1, allOrbs: 1, parMet: 1, earned: 3 })
  })

  it('结局图片使用正式标准解法与独立模拟器，不修改关卡或存档', () => {
    const level = mainLevels.at(-1)!
    const before = JSON.stringify(level)
    const a = journeyScene(level)
    const b = journeyScene(level)
    expect(a.state().won).toBe(true)
    expect(a.isIdle()).toBe(true)
    expect(a).not.toBe(b)
    expect(a.state()).toEqual(b.state())
    expect(JSON.stringify(level)).toBe(before)
  })

  it('只在支持文件分享时开放系统分享，能力检查抛错时降级', () => {
    const file = new File(['test'], '成绩.png', { type: 'image/png' })
    vi.stubGlobal('navigator', {})
    expect(canShareJourney(file)).toBe(false)
    vi.stubGlobal('navigator', { share: vi.fn(), canShare: vi.fn(() => false) })
    expect(canShareJourney(file)).toBe(false)
    const canShare = vi.fn(() => true)
    vi.stubGlobal('navigator', { share: vi.fn(), canShare })
    expect(canShareJourney(file)).toBe(true)
    expect(canShare).toHaveBeenCalledWith({ files: [file] })
    vi.stubGlobal('navigator', {
      share: vi.fn(),
      canShare: () => {
        throw new Error('blocked')
      },
    })
    expect(canShareJourney(file)).toBe(false)
  })

  it('用户取消分享不报错，其他错误保留图片降级', async () => {
    const file = new File(['test'], '成绩.png', { type: 'image/png' })
    const share = vi.fn().mockResolvedValue(undefined)
    vi.stubGlobal('navigator', { share })
    expect(await shareJourney(file)).toBe('shared')
    expect(share).toHaveBeenCalledWith({ files: [file], title: '积木错位 · 旅程成绩' })
    share.mockRejectedValueOnce(new DOMException('cancelled', 'AbortError'))
    expect(await shareJourney(file)).toBe('cancelled')
    share.mockRejectedValueOnce(new Error('blocked'))
    expect(await shareJourney(file)).toBe('failed')
  })
})
