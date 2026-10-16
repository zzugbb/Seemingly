import { defineLevel } from './builders'

// 屏幕路线：压板 (1,4) → 折返 (1,2) → 桥心 (4,2) → 出口 (4,5)。
// 压板先转出西侧桥臂；站到静态桥心后再转一档，才出现南侧出口。
export default defineLevel({
  id: 'level-05',
  title: '先后',
  chapter: 1,
  build: (b) => {
    b.island({ x: [-1, 2], z: [1, 4], y: -1 })
    for (const z of [2, 3, 4]) b.path([1, 0, z], 'terracotta')
    b.path([2, 0, 2], 'terracotta')
    b.plate({ id: 'bridge-plate', tile: [1, 0, 4], target: 'bridge', once: true })

    b.island({ x: [4, 4], z: [1, 2], y: -1 })
    b.path([4, 0, 2], 'teal')
    b.rotator({
      id: 'bridge',
      pivot: [4, 0, 2],
      blocks: [{ offset: [0, 0, -1] }, { offset: [1, 0, 0] }],
      handle: { block: [1, 0, 4], face: 'z' },
    })

    b.island({ x: [3, 5], z: [4, 5], y: -1 })
    b.path([4, 0, 4], 'rose')
    b.path([4, 0, 5], 'rose')

    b.tree([-1, -1, 1])
    b.tree([5, -1, 4])
    b.flower([-1, -1, 3])
    b.flower([5, -1, 5])
    b.start([1, 0, 2])
    b.goal([4, 0, 5])
  },
  solution: [
    { type: 'walk', to: [1, 0, 4] },
    { type: 'walk', to: [4, 0, 2] },
    { type: 'operate', mechanism: 'bridge' },
    { type: 'walk', to: [4, 0, 5] },
  ],
})
