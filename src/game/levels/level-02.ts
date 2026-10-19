import { defineLevel } from './builders'

export default defineLevel({
  id: 'level-02',
  title: '看似',
  chapter: 1,
  revision: 2,
  soundtrack: 'courtyard',
  hints: ['看起来连着，就能走过去'],
  build: (b) => {
    b.island({ x: [-1, 3], z: [-1, 3], y: -1 })
    b.path([0, 0, 2], 'terracotta')
    b.path([0, 0, 1], 'terracotta')
    b.path([1, 0, 1], 'terracotta')
    b.path([2, 0, 1], 'terracotta')

    b.island({ x: [5, 10], z: [3, 7], y: -1, depth: 4 })
    b.column({ x: 6, z: 4, from: 0, to: 2 }, 'rose')
    b.column({ x: 7, z: 4, from: 0, to: 2 }, 'rose')
    b.column({ x: 6, z: 5, from: 0, to: 2 }, 'rose')
    b.path([6, 3, 4], 'rose')
    b.path([7, 3, 4], 'rose')
    b.path([6, 3, 5], 'rose')
    b.orb({ tile: [6, 3, 5] })
    for (const z of [5, 6]) {
      b.column({ x: 9, z, from: 0, to: 3 }, 'rose')
      b.path([9, 4, z], 'rose')
    }
    b.orb({ tile: [9, 4, 6] })

    b.island({ x: [4, 8], z: [0, 1], y: -1 })
    b.column({ x: 5, z: 1, from: 0, to: 0 }, 'terracotta')
    b.column({ x: 6, z: 1, from: 0, to: 0 }, 'terracotta')
    b.column({ x: 7, z: 1, from: 0, to: 0 }, 'terracotta')
    b.path([5, 1, 1], 'terracotta')
    b.path([6, 1, 1], 'terracotta')
    b.path([7, 1, 1], 'terracotta')

    b.tree([-1, -1, 3])
    b.flower([10, -1, 7])
    b.window({ pos: [9, 2, 6], face: 'z' })
    b.window({ pos: [6, 1, 5], face: 'z' })
    b.window({ pos: [7, 1, 4], face: 'x' })

    b.start([0, 0, 2])
    b.goal([7, 1, 1])
  },
  solution: [
    { type: 'walk', to: [6, 3, 5] },
    { type: 'walk', to: [9, 4, 6] },
    { type: 'walk', to: [7, 1, 1] },
  ],
})
