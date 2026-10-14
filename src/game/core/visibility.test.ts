import { describe, expect, it } from 'vitest'
import type { Vec3 } from '../levels/types'
import { topVisible } from './visibility'

describe('顶面可见性', () => {
  it('被前方柱子挡住', () => {
    const tile: Vec3 = [0, 0, 0]
    const column: Vec3 = [1, 1, 1]
    expect(topVisible(tile, [tile])).toBe(true)
    expect(topVisible(tile, [tile, column])).toBe(false)
  })

  it('错觉连接合格', () => {
    const low: Vec3 = [2, 0, 0]
    const high: Vec3 = [7, 4, 4]
    const blocks = [low, high]
    expect(topVisible(low, blocks)).toBe(true)
    expect(topVisible(high, blocks)).toBe(true)
  })

  it('错觉连接违反遮挡规则', () => {
    const above: Vec3 = [11, 4, 4]
    const below: Vec3 = [9, 1, 1]
    const blocks = [above, below]
    expect(topVisible(below, blocks)).toBe(false)
    expect(topVisible(above, blocks)).toBe(true)
  })
})
