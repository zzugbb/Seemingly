import { defineLevel } from './builders'

export default defineLevel({
  id: 'level-03',
  title: '错位',
  chapter: 1,
  revision: 2,
  soundtrack: 'courtyard',
  build: (b) => {
    b.island({ x: [-1, 3], z: [-2, 3], y: -1 })
    for (const pos of [
      [0, 0, 2],
      [1, 0, 2],
      [2, 0, 2],
      [0, 0, 1],
      [0, 0, 0],
      [1, 0, 0],
      [1, 0, -1],
      [2, 0, -1],
    ] as const)
      b.path([...pos], 'terracotta')
    b.orb({ tile: [2, 0, -1] })

    b.island({ x: [5, 11], z: [4, 6], y: -1, depth: 4 })
    b.column({ x: 6, z: 5, from: 0, to: 2 }, 'rose')
    b.column({ x: 6, z: 4, from: 0, to: 2 }, 'rose')
    b.path([6, 3, 5], 'rose')
    b.path([6, 3, 4], 'rose')

    b.island({ x: [4, 10], z: [0, 3], y: -1, depth: 2.8 })
    for (const x of [4, 5, 6]) {
      b.solid([x, 0, 1], 'terracotta')
      b.path([x, 1, 1], 'terracotta')
    }
    b.solid([5, 0, 0], 'terracotta')
    b.path([5, 1, 0], 'terracotta')
    b.orb({ tile: [5, 1, 0] })

    for (const x of [8, 9]) {
      b.column({ x, z: 2, from: 0, to: 1 }, 'sand')
      b.path([x, 2, 2], 'cream')
    }

    for (const x of [9, 10]) {
      b.column({ x, z: 5, from: 0, to: 3 }, 'rose')
      b.path([x, 4, 5], 'rose')
    }
    b.orb({ tile: [10, 4, 5] })

    b.tree([-1, -1, 3])
    b.flower([11, -1, 6])
    b.window({ pos: [10, 2, 5], face: 'x' })
    b.window({ pos: [6, 1, 5], face: 'z' })

    b.start([0, 0, 2])
    b.goal([9, 2, 2])
  },
  solution: [
    { type: 'walk', to: [2, 0, -1] },
    { type: 'walk', to: [5, 1, 0] },
    { type: 'walk', to: [10, 4, 5] },
    { type: 'walk', to: [9, 2, 2] },
  ],
})
