import { defineLevel } from './builders'

export default defineLevel({
  id: 'level-04',
  title: '转动',
  chapter: 2,
  revision: 2,
  soundtrack: 'courtyard',
  hints: ['点击金色转轮，桥会转动 90 度'],
  build: (b) => {
    b.island({ x: [-1, 3], z: [0, 3], y: -1 })
    b.path([0, 0, 2], 'terracotta')
    b.path([1, 0, 2], 'terracotta')
    b.path([2, 0, 2], 'terracotta')

    b.island({ x: [4, 10], z: [0, 6], y: -1, depth: 3 })
    b.column({ x: 6, z: 4, from: 0, to: 1 }, 'teal')
    b.path([6, 2, 4], 'teal')
    for (const pos of [
      [6, 0, 5],
      [6, 0, 6],
      [7, 0, 6],
      [8, 0, 6],
    ] as const)
      b.solid([...pos], 'teal')
    b.rotator({
      id: 'bridge',
      pivot: [6, 2, 4],
      blocks: [
        { offset: [-1, 0, 0] },
        { offset: [1, 0, 0] },
        { offset: [0, -1, -3] },
        { offset: [0, -1, -1], kind: 'solid', color: 'teal' },
        { offset: [0, -1, -2], kind: 'solid', color: 'teal' },
      ],
      handle: { block: [8, 0, 6], face: 'z' },
    })

    b.solid([5, 0, 1], 'terracotta')
    b.path([5, 1, 1], 'terracotta')
    b.orb({ tile: [5, 1, 1] })

    b.column({ x: 9, z: 5, from: 0, to: 2 }, 'rose')
    b.path([9, 3, 5], 'rose')

    b.island({ x: [7, 10], z: [7, 10], y: -1, depth: 4 })
    b.column({ x: 9, z: 9, from: 0, to: 2 }, 'rose')
    b.path([9, 3, 9], 'rose')
    b.orb({ tile: [9, 3, 9], optional: true })

    b.tree([-1, -1, 3])
    b.window({ pos: [9, 1, 5], face: 'z' })
    b.flower([7, -1, 9])
    b.window({ pos: [9, 1, 9], face: 'z' })

    b.start([0, 0, 2])
    b.goal([9, 3, 5])
  },
  solution: [
    { type: 'walk', to: [6, 2, 4] },
    { type: 'operate', mechanism: 'bridge' },
    { type: 'walk', to: [5, 1, 1] },
    { type: 'walk', to: [6, 2, 4] },
    { type: 'operate', mechanism: 'bridge' },
    { type: 'walk', to: [9, 3, 5] },
  ],
})
