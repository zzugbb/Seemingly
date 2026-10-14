import { describe, expect, it } from 'vitest'
import type { MoverDef, PlateDef, RotatorDef, Vec3 } from '../levels/types'
import { advanceMover, judgePlate, moverBlocks, moverCursor, rotatorBlocks } from './mechanisms'

const positions = (blocks: { pos: Vec3 }[]) => blocks.map((block) => block.pos.map((value) => value + 0))

describe('转盘档位', () => {
  const rotator: RotatorDef = {
    type: 'rotator',
    id: 'bridge',
    pivot: [0, 0, 0],
    blocks: [{ offset: [0, 0, 1] }, { offset: [1, 2, 0], color: 'rose', kind: 'solid' }],
    handle: { block: [0, 1, 0], face: 'z' },
  }

  it('四个档位的世界坐标绕 Y 轴转动，第 4 档回到起点', () => {
    expect(positions(rotatorBlocks(rotator, 0))).toEqual([
      [0, 0, 1],
      [1, 2, 0],
    ])
    expect(positions(rotatorBlocks(rotator, 1))).toEqual([
      [1, 0, 0],
      [0, 2, -1],
    ])
    expect(positions(rotatorBlocks(rotator, 2))).toEqual([
      [0, 0, -1],
      [-1, 2, 0],
    ])
    expect(positions(rotatorBlocks(rotator, 3))).toEqual([
      [-1, 0, 0],
      [0, 2, 1],
    ])
    expect(positions(rotatorBlocks(rotator, 4))).toEqual(positions(rotatorBlocks(rotator, 0)))
  })

  it('积木编号带机关 id，并抹掉旋转产生的 -0', () => {
    const blocks = rotatorBlocks(rotator, 1)
    expect(blocks.map((block) => block.id)).toEqual(['bridge#0', 'bridge#1'])
    expect(blocks[0]?.kind).toBe('path')
    expect(blocks[0]?.color).toBe('tealLight')
    expect(blocks[1]?.kind).toBe('solid')
    expect(blocks[1]?.color).toBe('rose')
    for (const value of blocks[0]?.pos ?? []) expect(Object.is(value, -0)).toBe(false)
  })
})

describe('平移台往返', () => {
  const mover: MoverDef = {
    type: 'mover',
    id: 'lift',
    origin: [4, 1, 2],
    axis: 'y',
    stops: [0, 2, 3],
    blocks: [{ offset: [1, 0, 0] }],
    handle: { block: [4, 0, 2], face: 'x' },
  }

  it('沿停靠位走到尽头后反向，再从起点折回', () => {
    const stops: number[] = []
    let cursor = moverCursor(mover)
    for (let i = 0; i < 5; i++) {
      stops.push(mover.stops[cursor.stopIndex] ?? 0)
      cursor = advanceMover(mover, cursor)
    }
    expect(stops).toEqual([0, 2, 3, 2, 0])
    expect(cursor).toEqual({ stopIndex: 1, direction: 1 })
  })

  it('世界坐标是原点、偏移和当前停靠位之和', () => {
    expect(moverBlocks(mover, 0)[0]?.pos).toEqual([5, 1, 2])
    expect(moverBlocks(mover, 1)[0]?.pos).toEqual([5, 3, 2])
    expect(moverBlocks(mover, 2)[0]?.pos).toEqual([5, 4, 2])
    expect(moverBlocks(mover, 1)[0]?.id).toBe('lift#0')
  })

  it('水平轴只改对应的那一维', () => {
    const slide: MoverDef = { ...mover, axis: 'x', stops: [0, 2] }
    const depth: MoverDef = { ...mover, axis: 'z', stops: [0, 2] }
    expect(moverBlocks(slide, 1)[0]?.pos).toEqual([7, 1, 2])
    expect(moverBlocks(depth, 1)[0]?.pos).toEqual([5, 1, 4])
  })
})

describe('压板', () => {
  const plate: PlateDef = { type: 'plate', id: 'pad', tile: [1, 0, 2], target: 'bridge', once: true }
  const base = { plate, at: [1, 0, 2] as Vec3, stopped: true, spent: false, targetBusy: false, standingOnTarget: false }

  it('once 压板只在停下时触发一次', () => {
    const first = judgePlate(base)
    expect(first).toEqual({ trigger: true, spent: true })
    expect(judgePlate({ ...base, spent: first.spent })).toEqual({ trigger: false, spent: true })
  })

  it('路过、机关在动或人站在机关上时不触发，也不消耗', () => {
    expect(judgePlate({ ...base, stopped: false })).toEqual({ trigger: false, spent: false })
    expect(judgePlate({ ...base, at: [0, 0, 2] })).toEqual({ trigger: false, spent: false })
    expect(judgePlate({ ...base, targetBusy: true })).toEqual({ trigger: false, spent: false })
    expect(judgePlate({ ...base, standingOnTarget: true })).toEqual({ trigger: false, spent: false })
  })

  it('普通压板每次停下都会再触发', () => {
    const repeat = judgePlate({ ...base, plate: { ...plate, once: false } })
    expect(repeat).toEqual({ trigger: true, spent: false })
    expect(judgePlate({ ...base, plate: { ...plate, once: false }, spent: true })).toEqual({
      trigger: true,
      spent: false,
    })
  })
})
