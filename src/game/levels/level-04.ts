import { defineLevel } from './builders'

export default defineLevel({
  id: 'level-04',
  title: '换乘',
  chapter: 2,
  revision: 3,
  soundtrack: 'courtyard',
  hints: ['浅色顶板是路面，金色转轮改变建筑'],
  build: (b) => {
    b.island({ x: [-1, 3], z: [1, 3], y: -1, depth: 2.5 })
    for (const x of [0, 1, 2]) b.path([x, 0, 2], 'terracotta')
    b.island({ x: [4, 9], z: [0, 8], y: -1, depth: 3.5 })
    b.column({ x: 8, z: 6, from: 2, to: 4 }, 'teal')
    for (const pos of [
      [6, 0, 5],
      [6, 0, 6],
      [7, 0, 6],
      [8, 0, 6],
    ] as const)
      b.solid([...pos], 'teal')
    b.rotator({
      id: 'ferry',
      pivot: [8, 4, 6],
      blocks: [
        { offset: [-1, 0, 0] },
        { offset: [1, 0, 0] },
        { offset: [3, 1, 1] },
        { offset: [1, -1, 0], kind: 'solid', color: 'teal' },
        { offset: [1, -1, 1], kind: 'solid', color: 'teal' },
        { offset: [2, -1, 1], kind: 'solid', color: 'teal' },
        { offset: [3, -1, 1], kind: 'solid', color: 'teal' },
        { offset: [3, 0, 1], kind: 'solid', color: 'teal' },
      ],
      handle: { block: [8, 0, 6], face: 'z' },
    })
    b.orb({ mechanism: 'ferry', block: 0 })
    b.solid([4, 0, 4], 'terracotta')
    b.path([4, 1, 4], 'terracotta')
    b.solid([5, 0, 1], 'terracotta')
    b.path([5, 1, 1], 'terracotta')
    b.orb({ tile: [5, 1, 1], optional: true })
    b.island({ x: [12, 14], z: [7, 9], y: 0, depth: 5 })
    b.column({ x: 13, z: 8, from: 1, to: 5 }, 'rose')
    b.path([13, 6, 8], 'rose')
    b.tree([-1, -1, 3])
    b.flower([7, -1, 8])
    b.window({ pos: [13, 3, 8], face: 'x' })
    b.start([0, 0, 2])
    b.goal([13, 6, 8])
  },
  solution: [
    { type: 'walk', to: [7, 4, 6] },
    { type: 'operate', mechanism: 'ferry' },
    { type: 'walk', to: [4, 1, 4] },
    { type: 'operate', mechanism: 'ferry' },
    { type: 'operate', mechanism: 'ferry' },
    { type: 'walk', to: [8, 4, 7] },
    { type: 'operate', mechanism: 'ferry' },
    { type: 'walk', to: [13, 6, 8] },
  ],
})
