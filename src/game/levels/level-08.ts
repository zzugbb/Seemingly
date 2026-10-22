import { defineLevel } from './builders'

export default defineLevel({
  id: 'level-08',
  title: '联动',
  chapter: 3,
  revision: 1,
  soundtrack: 'courtyard',
  hints: [],
  build: (b) => {
    b.island({ x: [-2, 0], z: [1, 3], y: -1, depth: 2 })
    b.island({ x: [1, 6], z: [0, 7], y: -1, depth: 3 })
    b.island({ x: [8, 12], z: [3, 9], y: 2, depth: 3 })
    b.path([-1, 0, 2], 'terracotta')
    b.path([4, 2, 7], 'rose')
    b.path([8, 3, 3], 'terracotta')
    b.path([11, 5, 9], 'rose')
    b.column({ x: 3, z: 3, from: 0, to: 1 }, 'teal')
    b.solid([5, 0, 7], 'teal')
    b.column({ x: 4, z: 7, from: 0, to: 1 }, 'rose')
    b.column({ x: 10, z: 6, from: 3, to: 4 }, 'teal')
    b.column({ x: 11, z: 9, from: 3, to: 4 }, 'rose')
    b.rotator({
      id: 'pair',
      pivot: [3, 1, 3],
      blocks: [
        { offset: [-2, 0, 0] },
        { offset: [-1, 0, 0], kind: 'solid', color: 'teal' },
        { offset: [-2, -1, 0], kind: 'solid', color: 'teal' },
        { offset: [-1, -1, 0], kind: 'solid', color: 'teal' },
      ],
      handle: { block: [5, 0, 7], face: 'z' },
      links: [{ target: 'remote' }],
    })
    b.rotator({
      id: 'remote',
      pivot: [10, 4, 6],
      initialStep: 2,
      blocks: [
        { offset: [-1, 0, 0] },
        { offset: [-1, 0, -1] },
        { offset: [-1, -1, 0], kind: 'solid', color: 'teal' },
        { offset: [-1, -1, -1], kind: 'solid', color: 'teal' },
      ],
    })
    b.orb({ tile: [4, 2, 7] })
    b.orb({ tile: [8, 3, 3], optional: true })
    b.tree([-2, -1, 3])
    b.flower([6, -1, 7])
    b.window({ pos: [11, 3, 9], face: 'x' })
    b.lamp([8, 2, 9])
    b.lamp([12, 2, 7])
    b.start([-1, 0, 2])
    b.goal([11, 5, 9])
  },
  solution: [
    { type: 'walk', to: [1, 1, 3] },
    { type: 'operate', mechanism: 'pair' },
    { type: 'walk', to: [4, 2, 7] },
    { type: 'walk', to: [3, 1, 5] },
    { type: 'operate', mechanism: 'pair' },
    { type: 'walk', to: [9, 4, 6] },
    { type: 'operate', mechanism: 'pair' },
    { type: 'walk', to: [11, 5, 9] },
  ],
})
