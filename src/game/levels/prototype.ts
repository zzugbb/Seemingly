import { defineLevel } from './builders'

export const level = defineLevel({
  id: 'prototype',
  title: '小样',
  build: (b) => {
    // 起点小岛：低处的步道
    b.island({ x: [-1, 2], z: [-1, 4], y: -1, depth: 3.2 })
    b.path([0, 0, 3], 'terracotta')
    b.path([0, 0, 2], 'terracotta')
    b.path([0, 0, 1], 'terracotta')
    b.path([0, 0, 0], 'terracotta')
    b.path([1, 0, 0], 'terracotta')
    b.path([2, 0, 0], 'terracotta')

    // 高塔：塔顶在屏幕上紧贴起点步道的尽头
    b.island({ x: [6, 11], z: [3, 5], y: -1, depth: 4 })
    b.column({ x: 7, z: 4, from: 0, to: 3 }, 'rose')
    b.column({ x: 8, z: 4, from: 0, to: 3 }, 'rose')
    b.path([7, 4, 4], 'rose')
    b.path([8, 4, 4], 'rose')

    // 转盘立柱
    b.column({ x: 10, z: 4, from: 0, to: 3 }, 'teal')
    b.path([10, 4, 4], 'teal')

    b.rotator({
      id: 'bridge',
      pivot: [10, 4, 4],
      blocks: [{ offset: [0, 0, -1] }, { offset: [0, 0, 1] }],
      handle: { block: [10, 2, 4], face: 'z' },
    })

    // 终点基座：比桥低得多，但转盘转到位后看起来正好接上
    b.island({ x: [8, 11], z: [0, 1], y: -1, depth: 2.6 })
    b.solid([9, 0, 1], 'terracotta')
    b.solid([10, 0, 1], 'terracotta')
    b.path([9, 1, 1], 'terracotta')
    b.path([10, 1, 1], 'terracotta')

    b.start([0, 0, 3])
    b.goal([10, 1, 1])

    b.tree([-1, -1, 1])
    b.tree([2, -1, 3])
    b.tree([-1, -1, 4])
    b.tree([11, -1, 0])
    b.tree([6, -1, 5])

    b.flower([1, -1, 2])
    b.flower([-1, -1, -1])
    b.flower([2, -1, 1.6])
    b.flower([1.4, -1, 4])
    b.flower([9, -1, 5])
    b.flower([11, -1, 3])

    b.window({ pos: [7, 1, 4], face: 'z' })
    b.window({ pos: [8, 2, 4], face: 'z' })
    b.window({ pos: [8, 1, 4], face: 'x' })
    b.window({ pos: [8, 3, 4], face: 'x' })
    b.window({ pos: [7, 3, 4], face: 'z' })
  },
  solution: [
    { type: 'walk', to: [8, 4, 4] },
    { type: 'operate', mechanism: 'bridge' },
    { type: 'walk', to: [10, 1, 1] },
  ],
})
