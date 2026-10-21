import { defineLevel } from './builders'
import type { Vec3 } from './types'

export default defineLevel({
  id: 'level-06',
  title: '回环',
  chapter: 2,
  revision: 4,
  soundtrack: 'courtyard',
  hints: ['浅色顶板是路面，金色转轮改变建筑'],
  build: (b) => {
    b.island({ x: [1, 8], z: [0, 1], y: -1, depth: 2 })
    b.island({ x: [1, 9], z: [5, 8], y: 0, depth: 2.5 })
    b.island({ x: [1, 3], z: [-4, -2], y: -1, depth: 3 })
    for (let z = 2; z <= 4; z++) {
      b.solid([1, -1, z], 'sand')
      b.solid([9, 0, z], 'sand')
      b.solid([4, -1, z], 'sand')
    }
    for (const [x, y, z] of [
      [5, 3, 7],
      [9, 2, 5],
      [2, 2, -3],
      [7, 2, 6],
    ] as const)
      b.column({ x, z, from: z >= 5 ? 1 : 0, to: y - 1 }, 'rose')
    b.column({ x: 4, z: 4, from: 0, to: 2 }, 'teal')
    b.column({ x: 7, z: 4, from: 0, to: 2 }, 'teal')
    b.solid([1, 1, 8], 'teal')
    b.solid([9, 1, 6], 'teal')
    b.path([7, 2, 6], 'terracotta')
    b.orb({ tile: [7, 2, 6], optional: true })
    b.tree([1, -1, 0])
    b.flower([8, 0, 7])
    b.window({ pos: [2, 0, -3], face: 'z' })
    b.lamp([2, 0, 7])
    b.lamp([8, 0, 6])
    b.lamp([1, -1, -3])
    b.path([5, 3, 7], 'terracotta')
    b.path([9, 2, 5], 'terracotta')
    b.path([2, 2, -3], 'rose')
    const frame: Vec3[] = [
      [-1, -1, 0],
      [0, -1, -1],
      [0, -1, -2],
      [1, -1, -2],
      [1, -1, -3],
      [1, -1, -4],
      [0, -1, -4],
      [0, -1, -5],
      [0, 0, -5],
      [0, 0, -6],
    ]
    b.rotator({
      id: 'west',
      pivot: [4, 2, 4],
      initialStep: 1,
      blocks: [
        { offset: [-1, 0, 0] },
        { offset: [0, 1, -6] },
        ...frame.map((offset) => ({ offset, kind: 'solid' as const, color: 'teal' as const })),
      ],
      handle: { block: [1, 1, 8], face: 'z' },
    })
    b.rotator({
      id: 'east',
      pivot: [7, 2, 4],
      initialStep: 0,
      blocks: [{ offset: [-1, 0, 0] }, { offset: [-1, 0, -1] }],
      handle: { block: [9, 1, 6], face: 'z' },
    })
    b.orb({ mechanism: 'east', block: 1 })
    b.orb({ tile: [9, 2, 5] })
    b.start([5, 3, 7])
    b.goal([2, 2, -3])
  },
  solution: [
    { type: 'walk', to: [4, 2, 5] },
    { type: 'operate', mechanism: 'west' },
    { type: 'walk', to: [6, 2, 3] },
    { type: 'operate', mechanism: 'east' },
    { type: 'operate', mechanism: 'east' },
    { type: 'walk', to: [9, 2, 5] },
    { type: 'walk', to: [8, 2, 5] },
    { type: 'operate', mechanism: 'east' },
    { type: 'operate', mechanism: 'west' },
    { type: 'walk', to: [10, 3, 4] },
    { type: 'operate', mechanism: 'west' },
    { type: 'walk', to: [2, 2, -3] },
  ],
})
