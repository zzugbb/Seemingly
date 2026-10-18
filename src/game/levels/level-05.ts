import { defineLevel } from './builders'

export default defineLevel({
  id: 'level-05',
  title: '乘风',
  chapter: 2,
  hints: ['站在桥上转动，桥会带着你走'],
  build: (b) => {
    b.island({ x: [-1, 3], z: [1, 3], y: -1 })
    b.path([0, 0, 2], 'terracotta')
    b.path([1, 0, 2], 'terracotta')
    b.path([2, 0, 2], 'terracotta')

    b.island({ x: [5, 7], z: [3, 5], y: -1 })
    b.column({ x: 6, z: 4, from: 0, to: 2 }, 'teal')
    b.rotator({
      id: 'ferry',
      pivot: [6, 2, 4],
      blocks: [{ offset: [-1, 0, 0] }, { offset: [1, 0, 0] }],
      handle: { block: [6, 0, 4], face: 'x' },
    })
    b.orb({ mechanism: 'ferry', block: 1, optional: true })

    b.island({ x: [5, 7], z: [6, 8], y: -1 })
    b.column({ x: 6, z: 6, from: 0, to: 1 }, 'terracotta')
    b.path([6, 2, 6], 'terracotta')
    b.orb({ tile: [6, 2, 6] })

    b.island({ x: [10, 12], z: [6, 8], y: -1, depth: 6 })
    b.column({ x: 11, z: 7, from: 0, to: 4 }, 'rose')
    b.path([11, 5, 7], 'rose')

    b.tree([-1, -1, 3])
    b.window({ pos: [11, 2, 7], face: 'x' })
    b.flower([7, -1, 8])

    b.start([0, 0, 2])
    b.goal([11, 5, 7])
  },
  solution: [
    { type: 'walk', to: [5, 2, 4] },
    { type: 'operate', mechanism: 'ferry' },
    { type: 'walk', to: [6, 2, 6] },
    { type: 'walk', to: [6, 2, 5] },
    { type: 'operate', mechanism: 'ferry' },
    { type: 'walk', to: [11, 5, 7] },
  ],
})
