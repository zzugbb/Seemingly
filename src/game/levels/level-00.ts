import { defineLevel } from './builders'

// 序章只教点击行走。屏幕路线从近处 (0,2) 走到远处的灯笼 (1,0)，高度都是 0。
export default defineLevel({
  id: 'level-00',
  title: '启程',
  hints: ['点击路面，小人会走过去'],
  build: (b) => {
    b.island({ x: [-1, 2], z: [-1, 3], y: -1 })
    b.path([0, 0, 2], 'terracotta')
    b.path([0, 0, 1], 'terracotta')
    b.path([0, 0, 0], 'terracotta')
    b.path([1, 0, 0], 'terracotta')

    b.column({ x: 2, z: -1, from: 0, to: 2 }, 'rose')
    b.window({ pos: [2, 0, -1], face: 'x' })
    b.window({ pos: [2, 1, -1], face: 'z' })
    b.window({ pos: [2, 2, -1], face: 'x' })

    b.island({ x: [6, 8], z: [5, 6], y: -1 })

    b.tree([2, -1, 3])
    b.tree([7, -1, 5])
    b.flower([-1, -1, 3])
    b.flower([1, -1, 2])

    b.start([0, 0, 2])
    b.goal([1, 0, 0])
  },
  solution: [{ type: 'walk', to: [1, 0, 0] }],
})
