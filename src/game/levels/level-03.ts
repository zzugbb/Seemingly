import { defineLevel } from './builders'

// 升降台从 y=0 升到 y=2，才和左右两条高路对齐。屏幕上都在 b=0 这一行。
export default defineLevel({
  id: 'level-03',
  title: '升起',
  build: (b) => {
    b.island({ x: [0, 2], z: [1, 3], y: -1 })
    b.column({ x: 0, z: 2, from: 0, to: 1 }, 'terracotta')
    b.column({ x: 1, z: 2, from: 0, to: 1 }, 'terracotta')
    b.column({ x: 2, z: 2, from: 0, to: 1 }, 'terracotta')
    b.path([0, 2, 2], 'terracotta')
    b.path([1, 2, 2], 'terracotta')
    b.path([2, 2, 2], 'terracotta')

    b.island({ x: [3, 3], z: [1, 3], y: -1 })
    b.mover({
      id: 'lift',
      origin: [3, 0, 2],
      axis: 'y',
      stops: [0, 2],
      blocks: [{ offset: [0, 0, 0] }],
      handle: { block: [2, 1, 2], face: 'z' },
    })

    b.island({ x: [4, 6], z: [1, 3], y: -1 })
    b.column({ x: 4, z: 2, from: 0, to: 1 }, 'rose')
    b.column({ x: 5, z: 2, from: 0, to: 1 }, 'rose')
    b.path([4, 2, 2], 'rose')
    b.path([5, 2, 2], 'rose')
    b.column({ x: 6, z: 1, from: 0, to: 4 }, 'rose')
    b.window({ pos: [6, 1, 1], face: 'x' })
    b.window({ pos: [6, 2, 1], face: 'z' })
    b.window({ pos: [6, 4, 1], face: 'x' })

    b.tree([0, -1, 3])
    b.tree([6, -1, 3])
    b.flower([2, -1, 1])
    b.flower([4, -1, 3])

    b.start([0, 2, 2])
    b.goal([5, 2, 2])
  },
  solution: [
    { type: 'walk', to: [2, 2, 2] },
    { type: 'operate', mechanism: 'lift' },
    { type: 'walk', to: [3, 2, 2] },
    { type: 'walk', to: [5, 2, 2] },
  ],
})
