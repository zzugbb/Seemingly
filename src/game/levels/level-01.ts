import { defineLevel } from './builders'

export default defineLevel({
  id: 'level-01',
  title: '启程',
  chapter: 1,
  hints: ['点击路面，小人会走过去', '集齐光点，灯笼才会亮'],
  build: (b) => {
    b.island({ x: [-1, 3], z: [-1, 3], y: -1 })
    for (const pos of [
      [0, 0, 3],
      [0, 0, 2],
      [0, 0, 1],
      [1, 0, 1],
      [2, 0, 1],
      [0, 0, 0],
      [0, 0, -1],
      [1, 0, -1],
    ] as const)
      b.path([...pos], 'terracotta')
    b.orb({ tile: [1, 0, -1] })

    b.island({ x: [4, 6], z: [2, 4], y: -1 })
    b.column({ x: 5, z: 3, from: 0, to: 1 }, 'rose')
    b.path([5, 2, 3], 'rose')

    b.tree([-1, -1, 0])
    b.flower([3, -1, 3])
    b.tree([6, -1, 4])

    b.start([0, 0, 3])
    b.goal([5, 2, 3])
  },
  solution: [
    { type: 'walk', to: [1, 0, -1] },
    { type: 'walk', to: [5, 2, 3] },
  ],
})
