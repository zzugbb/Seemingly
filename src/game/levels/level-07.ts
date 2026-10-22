import { defineLevel } from './builders'

export default defineLevel({
  id: 'level-07',
  title: '停靠',
  chapter: 3,
  revision: 1,
  soundtrack: 'courtyard',
  hints: [],
  build: (b) => {
    b.island({ x: [-1, 1], z: [1, 3], y: -1, depth: 2 })
    b.island({ x: [2, 7], z: [0, 4], y: -1, depth: 2.5 })
    b.island({ x: [4, 6], z: [5, 7], y: 0, depth: 2.5 })
    b.island({ x: [8, 13], z: [3, 8], y: 1, depth: 3 })
    b.path([0, 0, 2], 'terracotta')
    b.path([5, 2, 5], 'rose')
    b.path([5, 2, 6], 'rose')
    b.path([11, 4, 8], 'rose')
    b.path([13, 4, 6], 'rose')
    b.path([12, 4, 7], 'rose')
    b.path([12, 4, 8], 'rose')
    b.solid([2, 0, 4], 'teal')
    b.solid([5, 1, 5], 'rose')
    b.solid([5, 1, 6], 'rose')
    b.column({ x: 10, z: 5, from: 2, to: 3 }, 'teal')
    b.solid([12, 2, 8], 'teal')
    b.column({ x: 11, z: 8, from: 2, to: 3 }, 'rose')
    b.column({ x: 13, z: 6, from: 2, to: 3 }, 'rose')
    b.column({ x: 12, z: 7, from: 2, to: 3 }, 'rose')
    b.solid([12, 3, 8], 'rose')
    b.mover({
      id: 'shuttle',
      origin: [2, 1, 3],
      axis: 'x',
      stops: [0, 2, 4],
      blocks: [
        { offset: [0, 0, 0] },
        { offset: [0, 0, -1] },
        { offset: [0, -1, 0], kind: 'solid', color: 'teal' },
        { offset: [0, -1, -1], kind: 'solid', color: 'teal' },
      ],
      handle: { block: [2, 0, 4], face: 'z' },
    })
    b.rotator({
      id: 'swing',
      pivot: [10, 3, 5],
      blocks: [{ offset: [-1, 0, 0] }],
      handle: { block: [12, 2, 8], face: 'z' },
    })
    b.orb({ tile: [5, 2, 6] })
    b.orb({ tile: [13, 4, 6], optional: true })
    b.tree([-1, -1, 3])
    b.flower([4, 0, 7])
    b.window({ pos: [11, 2, 8], face: 'x' })
    b.lamp([13, 1, 8])
    b.start([0, 0, 2])
    b.goal([11, 4, 8])
  },
  solution: [
    { type: 'walk', to: [2, 1, 3] },
    { type: 'operate', mechanism: 'shuttle' },
    { type: 'walk', to: [5, 2, 6] },
    { type: 'walk', to: [4, 1, 3] },
    { type: 'operate', mechanism: 'shuttle' },
    { type: 'walk', to: [9, 3, 5] },
    { type: 'operate', mechanism: 'swing' },
    { type: 'walk', to: [11, 4, 8] },
  ],
})
