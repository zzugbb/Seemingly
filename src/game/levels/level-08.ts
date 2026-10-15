import { defineLevel } from './builders'

// 从远岛 (7,5) 踩板接桥，到桥心 (4,3) 后转向北侧 (4,1)。
// 平移台补上 (3,1)，回到序章起点 (0,2)，最后点亮原来的灯笼 (1,0)。
export default defineLevel({
  id: 'level-08',
  title: '归来',
  ending: {
    lanterns: [
      [1, 0, 0],
      [0, 0, 0],
      [0, 0, 1],
      [0, 0, 2],
      [1, 0, 1],
      [2, 0, 1],
      [-1, -1, 3],
      [2, -1, 3],
      [2, 2, -1],
    ],
    tower: [
      [2, 0, -1],
      [2, 1, -1],
      [2, 2, -1],
    ],
  },
  build: (b) => {
    b.island({ x: [-1, 2], z: [-1, 3], y: -1 })
    b.path([0, 0, 2], 'terracotta')
    b.path([0, 0, 1], 'terracotta')
    b.path([0, 0, 0], 'terracotta')
    b.path([1, 0, 0], 'terracotta')
    b.path([1, 0, 1], 'terracotta')
    b.path([2, 0, 1], 'terracotta')
    b.column({ x: 2, z: -1, from: 0, to: 2 }, 'rose')
    b.window({ pos: [2, 0, -1], face: 'x' })
    b.window({ pos: [2, 1, -1], face: 'z' })
    b.window({ pos: [2, 2, -1], face: 'x' })

    b.island({ x: [3, 4], z: [1, 3], y: -1 })
    b.path([4, 0, 1], 'terracotta')
    b.path([4, 0, 3], 'teal')
    b.rotator({
      id: 'home-bridge',
      pivot: [4, 0, 3],
      initialStep: 3,
      blocks: [{ offset: [1, 0, 0] }, { offset: [1, 0, 1] }],
      handle: { block: [6, 0, 5], face: 'z' },
    })
    b.mover({
      id: 'home-slider',
      origin: [3, 0, 0],
      axis: 'z',
      stops: [0, 1],
      blocks: [{ offset: [0, 0, 0] }],
      handle: { block: [0, 0, 2], face: 'z' },
    })

    b.island({ x: [6, 8], z: [5, 6], y: -1 })
    b.path([7, 0, 5], 'terracotta')
    b.path([6, 0, 5], 'terracotta')
    b.path([6, 0, 4], 'terracotta')
    b.plate({ id: 'home-plate', tile: [6, 0, 5], target: 'home-bridge', once: true })

    b.tree([1, -1, 3])
    b.tree([8, -1, 6])
    b.flower([-1, -1, 3])
    b.flower([1, -1, 2])
    b.start([7, 0, 5])
    b.goal([1, 0, 0])
  },
  solution: [
    { type: 'walk', to: [6, 0, 5] },
    { type: 'walk', to: [4, 0, 3] },
    { type: 'operate', mechanism: 'home-bridge' },
    { type: 'walk', to: [4, 0, 1] },
    { type: 'operate', mechanism: 'home-slider' },
    { type: 'walk', to: [0, 0, 2] },
    { type: 'walk', to: [1, 0, 0] },
  ],
})
