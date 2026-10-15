import { describe, expect, it } from 'vitest'
import { levels } from '../game/levels'
import { firstPlayableIndex, isUnlocked } from './store'

describe('正式关卡进度', () => {
  it('空存档从序章开始，逐关解锁并继续到第一个未通关关卡', () => {
    expect(firstPlayableIndex([])).toBe(0)
    for (let completedCount = 0; completedCount < levels.length; completedCount++) {
      const completed = levels.slice(0, completedCount).map((level) => level.id)
      expect(firstPlayableIndex(completed)).toBe(completedCount)
      for (let index = 0; index < levels.length; index++) {
        expect(isUnlocked(index, completed)).toBe(index <= completedCount)
      }
    }
  })

  it('九关全通后回到第八关，旧的小样记录不解锁正式关卡', () => {
    expect(firstPlayableIndex(levels.map((level) => level.id))).toBe(8)
    expect(firstPlayableIndex(['prototype'])).toBe(0)
    expect(isUnlocked(1, ['prototype'])).toBe(false)
  })
})
