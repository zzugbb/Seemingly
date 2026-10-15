import { defineLevel } from './builders'

// 桥一开始横着，转一档后沿 x 方向把两座岛接上。高度都是 3。
export default defineLevel({
  id: 'level-02',
  title: '转动',
  hints: ['点击路面，小人会走过去', '点击金色转轮，旋转桥梁'],
  build: (b) => {
    b.island({ x: [0, 2], z: [1, 3], y: -1 })
    b.column({ x: 1, z: 2, from: 0, to: 2 }, 'terracotta')
    b.column({ x: 2, z: 2, from: 0, to: 2 }, 'terracotta')
    b.path([1, 3, 2], 'terracotta')
    b.path([2, 3, 2], 'terracotta')

    b.island({ x: [4, 4], z: [1, 3], y: -1 })
    b.column({ x: 4, z: 2, from: 0, to: 2 }, 'teal')
    b.path([4, 3, 2], 'teal')
    b.rotator({
      id: 'bridge',
      pivot: [4, 3, 2],
      blocks: [{ offset: [0, 0, -1] }, { offset: [0, 0, 1] }],
      handle: { block: [4, 1, 2], face: 'z' },
    })
    b.window({ pos: [4, 0, 2], face: 'z' })
    b.window({ pos: [4, 1, 2], face: 'x' })
    b.window({ pos: [4, 2, 2], face: 'z' })

    b.island({ x: [6, 8], z: [1, 3], y: -1 })
    b.column({ x: 6, z: 2, from: 0, to: 2 }, 'rose')
    b.column({ x: 7, z: 2, from: 0, to: 2 }, 'rose')
    b.path([6, 3, 2], 'rose')
    b.path([7, 3, 2], 'rose')

    b.tree([0, -1, 3])
    b.tree([8, -1, 1])
    b.flower([2, -1, 1])
    b.flower([6, -1, 3])

    b.start([1, 3, 2])
    b.goal([7, 3, 2])
  },
  solution: [
    { type: 'operate', mechanism: 'bridge' },
    { type: 'walk', to: [7, 3, 2] },
  ],
})
