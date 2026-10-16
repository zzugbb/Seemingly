import { describe, expect, it } from 'vitest'
import { defineLevel } from '../levels/builders'
import { runSolution } from './solve'

describe('标准解法验证', () => {
  it('逆向联动乘坐后，从实际落脚点记录路线和机关布局', () => {
    const level = defineLevel({
      id: 'solution-ride',
      title: '解法测试',
      chapter: 2,
      build: (b) => {
        b.path([0, 0, 0], 'sand')
        b.path([2, 0, 0], 'teal')
        b.path([3, 0, -1], 'sand')
        b.rotator({ id: 'bridge', pivot: [2, 0, 0], blocks: [{ offset: [-1, 0, 0] }] })
        b.mover({
          id: 'drive',
          origin: [10, 0, 0],
          axis: 'y',
          stops: [0, 2],
          blocks: [{ offset: [0, 0, 0] }],
          handle: { block: [0, 0, 0], face: 'z' },
          links: [{ target: 'bridge', reverse: true }],
        })
        b.start([0, 0, 0])
        b.goal([3, 0, -1])
      },
      solution: [
        { type: 'walk', to: [1, 0, 0] },
        { type: 'operate', mechanism: 'drive' },
        { type: 'walk', to: [3, 0, -1] },
      ],
    })
    const run = runSolution(level)
    expect(run.ok).toBe(true)
    expect(run.walks[1].positions).toEqual([
      [2, 0, -1],
      [3, 0, -1],
    ])
    expect(run.walks[1].blocks).toContainEqual([2, 0, -1])
    expect(run.walks[1].blocks).not.toContainEqual([2, 0, 1])
  })
})
