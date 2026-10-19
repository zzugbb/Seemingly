import { defineLevel } from './builders'

export default defineLevel({
  id: 'level-01',
  title: '启程',
  chapter: 1,
  revision: 2,
  soundtrack: 'courtyard',
  hints: ['点击浅色路面，小人会走过去', '集齐两处光点，再回到灯笼'],
  build: (b) => {
    b.island({ x: [-1, 3], z: [-1, 3], y: -1, depth: 2 })
    for (const pos of [
      [0, 0, 3],
      [0, 0, 2],
      [0, 0, 1],
      [1, 0, 1],
      [2, 0, 1],
      [0, 0, 0],
      [0, 0, -1],
      [1, 0, -1],
      [1, 0, 2],
    ] as const)
      b.path([...pos], 'terracotta')
    b.orb({ tile: [1, 0, -1] })
    b.island({ x: [4, 7], z: [2, 4], y: -1, depth: 2.8 })
    for (const x of [5, 6]) {
      b.column({ x, z: 3, from: 0, to: 1 }, 'rose')
      b.path([x, 2, 3], 'rose')
    }
    b.orb({ tile: [6, 2, 3] })
    b.tree([-1, -1, 0])
    b.flower([3, -1, 3])
    b.tree([7, -1, 4])
    b.window({ pos: [5, 0, 3], face: 'z' })
    b.start([0, 0, 3])
    b.goal([1, 0, 2])
  },
  solution: [
    { type: 'walk', to: [1, 0, -1] },
    { type: 'walk', to: [6, 2, 3] },
    { type: 'walk', to: [1, 0, 2] },
  ],
})
