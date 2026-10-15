import { defineLevel } from './builders'

// 压板 (0,3) 把双桥从 b=1 推到 b=3，再推到 b=5。
// 第一次到中间岛后，沿 (0,3)～(0,5) 折返；路过压板不触发，停下才改接终点。
export default defineLevel({
  id: 'level-07',
  title: '回环',
  build: (b) => {
    b.island({ x: [-2, 0], z: [1, 5], y: -1 })
    for (const z of [1, 2, 3, 4, 5]) b.path([0, 0, z], 'terracotta')
    b.plate({ id: 'loop-plate', tile: [0, 0, 3], target: 'loop-bridge' })

    b.island({ x: [2, 2], z: [2, 5], y: -1 })
    for (const z of [3, 4, 5]) b.path([2, 0, z], 'terracotta')
    b.mover({
      id: 'loop-bridge',
      origin: [1, 0, 1],
      axis: 'z',
      stops: [0, 2, 4],
      blocks: [{ offset: [0, 0, 0] }, { offset: [2, 0, 0] }],
      handle: { block: [0, 0, 5], face: 'z' },
    })

    b.island({ x: [4, 5], z: [4, 5], y: -1 })
    b.path([4, 0, 5], 'rose')
    b.tree([-2, -1, 2])
    b.tree([5, -1, 4])
    b.flower([-2, -1, 4])
    b.flower([5, -1, 5])
    b.start([0, 0, 1])
    b.goal([4, 0, 5])
  },
  solution: [
    { type: 'walk', to: [0, 0, 3] },
    { type: 'walk', to: [2, 0, 3] },
    { type: 'walk', to: [0, 0, 5] },
    { type: 'walk', to: [0, 0, 3] },
    { type: 'walk', to: [2, 0, 5] },
    { type: 'walk', to: [4, 0, 5] },
  ],
})
