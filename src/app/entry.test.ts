import { describe, expect, it } from 'vitest'
import { challengeLevels, mainLevels } from '../game/levels'
import { emptySave, type LevelRecord, type SaveData } from './save'
import { campaignStats, chapterArrival, initialPreviewIndex, journeyChoice, selectStatus } from './entry'

const record = (steps: number, allOrbs = true, parMet = true): LevelRecord => ({
  done: true,
  allOrbs,
  bestSteps: steps,
  parMet,
})

const saveWith = (levels: SaveData['levels']): SaveData => ({ ...emptySave(), levels })

describe('标题入口', () => {
  it('空进度从第一关开始，不显示伪造评价', () => {
    const stats = campaignStats(emptySave(), mainLevels, challengeLevels)
    expect(stats).toMatchObject({ mainDone: 0, earned: 0, ratingMax: mainLevels.length * 3, showProgress: false })
    expect(journeyChoice(emptySave(), mainLevels)).toMatchObject({
      mode: 'start',
      label: '开始旅程',
      caption: '前往 第 1 关 · 启程',
      index: 0,
    })
  })

  it('完成前三关后继续第四关', () => {
    const save = saveWith({
      'level-01': record(3),
      'level-02': record(3),
      'level-03': record(4, true, false),
    })
    expect(campaignStats(save, mainLevels, challengeLevels)).toMatchObject({
      mainDone: 3,
      mainCount: 6,
      earned: 8,
      showProgress: true,
    })
    expect(journeyChoice(save, mainLevels)).toMatchObject({
      mode: 'continue',
      label: '继续旅程',
      caption: '前往 第 4 关 · 换乘',
      index: 3,
    })
  })

  it('六关抵达但评价未满时重访选关，评价上限按实际列表计算', () => {
    const levels = Object.fromEntries(mainLevels.map((level) => [level.id, record(level.solution.length, true, false)]))
    const save = saveWith(levels)
    const stats = campaignStats(save, mainLevels, challengeLevels)
    expect(stats.mainDone).toBe(6)
    expect(stats.earned).toBe(12)
    expect(stats.ratingMax).toBe([...mainLevels, ...challengeLevels].length * 3)
    expect(journeyChoice(save, mainLevels).mode).toBe('revisit')
    expect(journeyChoice(save, mainLevels).label).toBe('重访旅程')
  })

  it('六关评价齐全仍是重访，不增加第七关', () => {
    const save = saveWith(Object.fromEntries(mainLevels.map((level) => [level.id, record(3)])))
    const stats = campaignStats(save, mainLevels, challengeLevels)
    expect(stats).toMatchObject({ mainDone: 6, earned: 18, ratingMax: 18 })
    expect(journeyChoice(save, mainLevels)).toMatchObject({ mode: 'revisit', caption: '当前开放的关卡已全部抵达' })
  })

  it('修订缺口继续第一个未抵达关，不按较大编号跳过', () => {
    const save = saveWith({
      'level-01': record(3),
      'level-03': record(4),
      'level-04': record(8),
      'level-06': record(12),
    })
    expect(journeyChoice(save, mainLevels)).toMatchObject({
      mode: 'continue',
      index: 1,
      caption: '前往 第 2 关 · 转动',
    })
    expect(campaignStats(save, mainLevels, challengeLevels).mainDone).toBe(4)
  })

  it('样段和孤立旧编号不计入主线抵达或评价', () => {
    const save = saveWith({
      'sample-01': record(11),
      'old-level': record(1),
    })
    expect(campaignStats(save, mainLevels, challengeLevels)).toMatchObject({
      mainDone: 0,
      earned: 0,
      showProgress: false,
    })
    expect(journeyChoice(save, mainLevels).mode).toBe('start')
  })
})

describe('选关状态', () => {
  it('空进度只有第一关是下一站', () => {
    expect(selectStatus(emptySave(), 0)).toEqual({ status: 'next', label: '下一站' })
    expect(selectStatus(emptySave(), 1)).toEqual({ status: 'locked', label: '先通过第 1 关' })
    expect(selectStatus(emptySave(), 5).status).toBe('locked')
    expect(initialPreviewIndex(emptySave())).toBe(0)
    expect(chapterArrival(emptySave(), 1)).toEqual({ done: 0, total: 3 })
  })

  it('完成前三关后下一站是第四关，后两关锁定', () => {
    const save = saveWith({
      'level-01': record(3),
      'level-02': record(3),
      'level-03': record(4),
    })
    expect(chapterArrival(save, 1)).toEqual({ done: 3, total: 3 })
    expect(chapterArrival(save, 2)).toEqual({ done: 0, total: 3 })
    expect(selectStatus(save, 3)).toEqual({ status: 'next', label: '下一站' })
    expect(selectStatus(save, 4)).toEqual({ status: 'locked', label: '先通过第 4 关' })
    expect(selectStatus(save, 5)).toEqual({ status: 'locked', label: '先通过第 5 关' })
    expect(initialPreviewIndex(save)).toBe(3)
  })

  it('全部抵达时没有下一站，预览停在最后一关', () => {
    const save = saveWith(Object.fromEntries(mainLevels.map((level) => [level.id, record(3)])))
    expect(mainLevels.every((_, index) => selectStatus(save, index).status === 'done')).toBe(true)
    expect(initialPreviewIndex(save)).toBe(mainLevels.length - 1)
  })

  it('修订缺口仍按原解锁规则暂锁，并保留已抵达记录', () => {
    const save = saveWith({
      'level-01': record(3),
      'level-03': record(4),
      'level-04': record(8),
      'level-06': record(12),
    })
    expect(selectStatus(save, 1)).toEqual({ status: 'next', label: '下一站' })
    expect(selectStatus(save, 2)).toEqual({ status: 'locked', label: '已抵达 · 先通过第 2 关' })
    expect(selectStatus(save, 3)).toEqual({ status: 'done', label: '已抵达' })
    expect(selectStatus(save, 4)).toEqual({ status: 'open', label: '可探索' })
    expect(selectStatus(save, 5)).toEqual({ status: 'locked', label: '已抵达 · 先通过第 5 关' })
    expect(save.levels['level-03']?.done).toBe(true)
    expect(save.levels['level-06']?.done).toBe(true)
  })
})
