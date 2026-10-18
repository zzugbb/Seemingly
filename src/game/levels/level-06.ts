import { defineLevel } from './builders'

export default defineLevel({
  id: 'level-06',
  title: '两难',
  chapter: 2,
  build: (b) => {
    b.island({ x: [-1, 2], z: [1, 3], y: -1 })
    b.path([0, 0, 2], 'terracotta')
    b.path([1, 0, 2], 'terracotta')

    b.island({ x: [2, 4], z: [-1, 0], y: -1 })
    b.path([3, 0, 0], 'terracotta')
    b.orb({ tile: [3, 0, 0] })

    b.island({ x: [4, 6], z: [3, 5], y: -1 })
    b.column({ x: 5, z: 4, from: 0, to: 1 }, 'teal')
    b.path([5, 2, 4], 'teal')
    b.rotator({
      id: 'hub',
      pivot: [5, 2, 4],
      blocks: [{ offset: [-1, 0, 0] }, { offset: [0, 0, -1] }],
      handle: { block: [5, 0, 4], face: 'z' },
    })

    b.island({ x: [5, 7], z: [6, 8], y: -1, depth: 4 })
    b.column({ x: 6, z: 7, from: 0, to: 2 }, 'rose')
    b.path([6, 3, 7], 'rose')
    b.orb({ tile: [6, 3, 7] })

    b.island({ x: [8, 10], z: [4, 6], y: -1, depth: 4 })
    b.column({ x: 9, z: 5, from: 0, to: 3 }, 'teal')
    b.rotator({
      id: 'ferry',
      pivot: [9, 3, 5],
      blocks: [{ offset: [-1, 0, 0] }, { offset: [1, 0, 0] }],
      handle: { block: [9, 0, 5], face: 'x' },
    })
    b.orb({ mechanism: 'ferry', block: 1, optional: true })

    b.island({ x: [9, 11], z: [7, 9], y: -1, depth: 5 })
    b.column({ x: 10, z: 8, from: 0, to: 3 }, 'rose')
    b.path([10, 4, 8], 'rose')

    b.tree([-1, -1, 3])
    b.window({ pos: [6, 1, 7], face: 'z' })
    b.window({ pos: [10, 2, 8], face: 'x' })

    b.start([0, 0, 2])
    b.goal([10, 4, 8])
  },
  solution: [
    { type: 'walk', to: [3, 0, 0] },
    { type: 'walk', to: [5, 2, 3] },
    { type: 'operate', mechanism: 'hub' },
    { type: 'walk', to: [6, 3, 7] },
    { type: 'operate', mechanism: 'hub' },
    { type: 'walk', to: [8, 3, 5] },
    { type: 'operate', mechanism: 'ferry' },
    { type: 'walk', to: [10, 4, 8] },
  ],
})
