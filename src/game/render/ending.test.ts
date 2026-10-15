import { describe, expect, it } from 'vitest'
import { endingProgress } from './ending'

describe('结尾时序', () => {
  it('终点先亮，其余灯笼每隔 0.45 秒依次点亮', () => {
    expect(endingProgress(0, 9)).toEqual({ litCount: 1, towerLit: false, finished: false })
    expect(endingProgress(0.44, 9).litCount).toBe(1)
    expect(endingProgress(0.45, 9).litCount).toBe(2)
    expect(endingProgress(3.6, 9)).toEqual({ litCount: 9, towerLit: false, finished: false })
  })

  it('全部灯笼点亮后塔亮起，再显示结尾文字', () => {
    expect(endingProgress(4.2, 9)).toEqual({ litCount: 9, towerLit: true, finished: false })
    expect(endingProgress(5.1, 9)).toEqual({ litCount: 9, towerLit: true, finished: true })
    expect(endingProgress(100, 9)).toEqual({ litCount: 9, towerLit: true, finished: true })
  })
})
