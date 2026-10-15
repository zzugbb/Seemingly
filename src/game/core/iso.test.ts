import { describe, expect, it } from 'vitest'
import type { Vec3 } from '../levels/types'
import { buildGraph, cellId, findPath, rotateOffset, screenKey, segmentPoint, surfaceY, type Tile } from './iso'

const tile = (pos: Vec3): Tile => ({ id: cellId(pos), pos })

describe('screenKey', () => {
  it('沿视线方向平移的格子屏幕坐标相同', () => {
    expect(screenKey([4, 0, 0])).toBe(screenKey([7, 3, 3]))
    expect(screenKey([4, 0, 0])).not.toBe(screenKey([4, 1, 0]))
  })
})

describe('buildGraph / findPath', () => {
  it('屏幕相邻但三维不相邻的格子可以连通', () => {
    const low = tile([2, 0, 0])
    const high = tile([7, 4, 4])
    const graph = buildGraph([low, high], new Set([low.id, high.id]))
    expect(findPath(graph, low.id, high.id)).toEqual([high.id])
  })

  it('顶上压着积木的格子不可行走', () => {
    const a = tile([0, 0, 0])
    const b = tile([1, 0, 0])
    const occupied = new Set([a.id, b.id, cellId([1, 1, 0])])
    expect(findPath(buildGraph([a, b], occupied), a.id, b.id)).toBeNull()
  })
})

describe('rotateOffset', () => {
  const rotate = (offset: Vec3, step: number) => rotateOffset(offset, step).map((v) => v + 0)

  it('与 Three.js 绕 Y 轴正向旋转 90 度一致', () => {
    expect(rotate([1, 0, 0], 1)).toEqual([0, 0, -1])
    expect(rotate([0, 0, 1], 1)).toEqual([1, 0, 0])
    expect(rotate([0, 0, 1], 4)).toEqual([0, 0, 1])
  })
})

describe('segmentPoint', () => {
  it('跨越错觉连接时，中点两侧的位置在屏幕上重合', () => {
    const from: Vec3 = [2, 0, 0]
    const to: Vec3 = [7, 4, 4]
    const before = segmentPoint(from, to, 0.4999)
    const after = segmentPoint(from, to, 0.5)
    const key = ([x, y, z]: Vec3) => [x - y, z - y]
    expect(key(before)[0]).toBeCloseTo(key(after)[0], 3)
    expect(key(before)[1]).toBeCloseTo(key(after)[1], 3)
    expect(segmentPoint(from, to, 1)).toEqual([7, surfaceY(4), 4])
  })
})
