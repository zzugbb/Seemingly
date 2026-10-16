import { defineLevel } from './builders'

// 路线沿 b=2：起点 (-1,2) → 落脚点 (2,2) → 塔心 (6,2)，再转向 (6,5)。
// 滑台只能填一个缺口；必须先走到静态落脚点，再把它移向塔的入口。
export default defineLevel({
  id: 'level-06',
  title: '交错',
  chapter: 1,
  build: (b) => {
    b.island({ x: [-2, 0], z: [1, 3], y: -1 })
    b.path([-1, 0, 2], 'terracotta')
    b.path([0, 0, 2], 'terracotta')
    b.mover({
      id: 'slider',
      origin: [1, 0, 2],
      axis: 'x',
      stops: [0, 2],
      initialStop: 1,
      blocks: [{ offset: [0, 0, 0] }],
      handle: { block: [0, 0, 2], face: 'z' },
    })

    b.island({ x: [2, 2], z: [1, 3], y: -1 })
    b.path([2, 0, 2], 'terracotta')

    b.island({ x: [5, 8], z: [1, 5], y: -1 })
    b.path([6, 0, 2], 'teal')
    b.rotator({
      id: 'tower',
      pivot: [6, 0, 2],
      blocks: [
        { offset: [0, 0, -1] },
        { offset: [0, 0, -2] },
        { offset: [1, 0, 0], kind: 'solid', color: 'rose' },
        { offset: [1, 1, 0], kind: 'solid', color: 'rose' },
        { offset: [1, 2, 0], kind: 'solid', color: 'rose' },
      ],
      handle: { block: [6, 0, 5], face: 'z' },
    })
    b.path([6, 0, 5], 'rose')

    b.tree([-2, -1, 3])
    b.tree([8, -1, 4])
    b.flower([0, -1, 3])
    b.flower([8, -1, 2])
    b.start([-1, 0, 2])
    b.goal([6, 0, 5])
  },
  solution: [
    { type: 'operate', mechanism: 'slider' },
    { type: 'walk', to: [2, 0, 2] },
    { type: 'operate', mechanism: 'slider' },
    { type: 'operate', mechanism: 'tower' },
    { type: 'walk', to: [6, 0, 2] },
    { type: 'operate', mechanism: 'tower' },
    { type: 'walk', to: [6, 0, 5] },
  ],
})
