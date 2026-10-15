import { defineLevel } from './builders'

// 三段短路分别位于 a=0、2、4，远端 b=4 的压板推动同一座滑桥。
// 每次沿原路折返到 b=2，桥已从来路改接到下一段；最后抵达 (6,2)。
export default defineLevel({
  id: 'level-07',
  title: '回环',
  build: (b) => {
    b.island({ x: [-2, 0], z: [1, 4], y: -1 })
    for (const z of [2, 3, 4]) b.path([0, 0, z], 'terracotta')
    b.plate({ id: 'first-plate', tile: [0, 0, 4], target: 'loop-bridge', once: true })

    b.island({ x: [2, 4], z: [2, 4], y: -1 })
    for (const x of [2, 4]) {
      for (const z of [2, 3, 4]) b.path([x, 0, z], 'terracotta')
    }
    b.plate({ id: 'middle-plate', tile: [2, 0, 4], target: 'loop-bridge', once: true })
    b.plate({ id: 'last-plate', tile: [4, 0, 4], target: 'loop-bridge', once: true })
    b.mover({
      id: 'loop-bridge',
      origin: [-1, 0, 2],
      axis: 'x',
      stops: [0, 2, 4, 6],
      blocks: [{ offset: [0, 0, 0] }],
      handle: { block: [0, 0, 4], face: 'z' },
    })

    b.island({ x: [6, 7], z: [1, 3], y: -1 })
    b.path([6, 0, 2], 'rose')
    b.tree([-2, -1, 3])
    b.tree([7, -1, 3])
    b.flower([-2, -1, 4])
    b.flower([6, -1, 3])
    b.start([0, 0, 2])
    b.goal([6, 0, 2])
  },
  solution: [
    { type: 'walk', to: [0, 0, 4] },
    { type: 'walk', to: [2, 0, 2] },
    { type: 'walk', to: [2, 0, 4] },
    { type: 'walk', to: [4, 0, 2] },
    { type: 'walk', to: [4, 0, 4] },
    { type: 'walk', to: [6, 0, 2] },
  ],
})
