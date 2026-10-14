import { describe, expect, it } from 'vitest'
import { validateLevels } from '../core/validate'
import { levels } from './index'

describe('关卡校验', () => {
  it('小样通过全部校验', () => {
    expect(validateLevels(levels)).toEqual([])
  })

  it('改坏一处坐标会指出是哪一项、哪一格', () => {
    const prototype = levels[0]
    if (!prototype) throw new Error('缺少小样')
    const broken = structuredClone(prototype)
    const block = broken.blocks.find((item) => item.pos[0] === 7 && item.pos[1] === 0 && item.pos[2] === 4)
    if (!block) throw new Error('找不到要改坏的积木')
    block.pos = [7, 1, 4]
    const issues = validateLevels([broken])
    expect(issues).toContainEqual({ check: '无重叠', cell: '7,1,4', detail: '两块积木占用同一格' })
  })
})
