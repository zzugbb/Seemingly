import { defineLevel } from './builders'

// 路起初在塔的背面（-z）。转两档后转到 +z，才和眼前的路接上。
export default defineLevel({
  id: 'level-04',
  title: '回望',
  build: (b) => {
    b.island({ x: [5, 7], z: [3, 4], y: -1 })
    b.column({ x: 6, z: 4, from: 0, to: 2 }, 'terracotta')
    b.column({ x: 5, z: 4, from: 0, to: 2 }, 'terracotta')
    b.path([6, 3, 4], 'terracotta')
    b.path([5, 3, 4], 'terracotta')

    b.island({ x: [3, 4], z: [1, 2], y: -1 })
    b.column({ x: 4, z: 2, from: 0, to: 2 }, 'teal')
    b.path([4, 3, 2], 'teal')
    b.rotator({
      id: 'tower',
      pivot: [4, 3, 2],
      blocks: [
        { offset: [0, 0, -1], kind: 'solid', color: 'rose' },
        { offset: [0, 1, -1], kind: 'solid', color: 'rose' },
        { offset: [0, 2, -1], kind: 'solid', color: 'rose' },
        { offset: [0, 0, -2] },
      ],
      handle: { block: [6, 0, 4], face: 'x' },
    })
    b.window({ pos: [4, 0, 2], face: 'x' })
    b.window({ pos: [4, 1, 2], face: 'z' })
    b.window({ pos: [4, 2, 2], face: 'x' })

    b.island({ x: [3, 5], z: [5, 6], y: -1 })
    b.column({ x: 4, z: 5, from: 0, to: 2 }, 'rose')
    b.path([4, 3, 5], 'rose')

    b.tree([7, -1, 3])
    b.tree([3, -1, 6])
    b.flower([5, -1, 3])
    b.flower([5, -1, 6])

    b.start([6, 3, 4])
    b.goal([4, 3, 5])
  },
  solution: [
    { type: 'walk', to: [5, 3, 4] },
    { type: 'operate', mechanism: 'tower' },
    { type: 'operate', mechanism: 'tower' },
    { type: 'walk', to: [4, 3, 5] },
  ],
})
