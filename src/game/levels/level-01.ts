import { defineLevel } from './builders'

// 屏幕路线 (0,2)→(0,1)→(0,0)→(1,0)→(2,0) 都在高度 0，再错觉接到 (3,0) 高度 3 的塔顶。
export default defineLevel({
  id: 'level-01',
  title: '看似',
  chapter: 1,
  hints: ['点击路面，小人会走过去', '看起来连着，就能走过去'],
  build: (b) => {
    b.island({ x: [-1, 2], z: [-1, 3], y: -1 })
    b.path([0, 0, 2], 'terracotta')
    b.path([0, 0, 1], 'terracotta')
    b.path([0, 0, 0], 'terracotta')
    b.path([1, 0, 0], 'terracotta')
    b.path([2, 0, 0], 'terracotta')

    b.island({ x: [5, 8], z: [1, 4], y: -1 })
    b.column({ x: 6, z: 3, from: 0, to: 2 }, 'rose')
    b.path([6, 3, 3], 'rose')

    b.column({ x: 7, z: 2, from: 0, to: 4 }, 'rose')
    b.window({ pos: [7, 1, 2], face: 'x' })
    b.window({ pos: [7, 2, 2], face: 'z' })
    b.window({ pos: [7, 4, 2], face: 'x' })

    b.tree([-1, -1, 3])
    b.tree([2, -1, 3])
    b.flower([1, -1, 3])
    b.flower([6, -1, 4])

    b.start([0, 0, 2])
    b.goal([6, 3, 3])
  },
  solution: [{ type: 'walk', to: [6, 3, 3] }],
})
