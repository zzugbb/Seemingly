import { defineLevel } from './builders'

export default defineLevel({
  id: 'level-04',
  title: '转动',
  chapter: 2,
  hints: ['点击金色转轮，桥会转动 90 度'],
  build: (b) => {
    b.island({ x: [-1, 3], z: [0, 3], y: -1 })
    b.path([0, 0, 2], 'terracotta')
    b.path([1, 0, 2], 'terracotta')
    b.path([2, 0, 2], 'terracotta')

    b.island({ x: [5, 7], z: [3, 5], y: -1, depth: 3 })
    b.column({ x: 6, z: 4, from: 0, to: 1 }, 'teal')
    b.path([6, 2, 4], 'teal')
    b.rotator({
      id: 'bridge',
      pivot: [6, 2, 4],
      blocks: [{ offset: [-1, 0, 0] }, { offset: [1, 0, 0] }],
      handle: { block: [6, 0, 4], face: 'x' },
    })

    b.island({ x: [4, 6], z: [0, 1], y: -1 })
    b.solid([5, 0, 1], 'terracotta')
    b.path([5, 1, 1], 'terracotta')
    b.orb({ tile: [5, 1, 1] })

    b.island({ x: [8, 10], z: [4, 6], y: -1, depth: 4 })
    b.column({ x: 9, z: 5, from: 0, to: 2 }, 'rose')
    b.path([9, 3, 5], 'rose')

    b.island({ x: [7, 9], z: [7, 9], y: -1, depth: 5 })
    b.column({ x: 8, z: 8, from: 0, to: 3 }, 'rose')
    b.path([8, 4, 8], 'rose')
    b.orb({ tile: [8, 4, 8], optional: true })

    b.tree([-1, -1, 3])
    b.window({ pos: [9, 1, 5], face: 'z' })
    b.flower([7, -1, 9])

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
