import { defineLevel } from './builders'

export default defineLevel({
  id: 'sample-01',
  title: '叠庭',
  chapter: 2,
  revision: 1,
  soundtrack: 'courtyard',
  hints: ['转轮转动桥臂，拉杆升降平台'],
  build: (b) => {
    b.island({ x: [-1, 3], z: [0, 3], y: -1, depth: 2.5 })
    for (const x of [0, 1]) b.path([x, 0, 2], 'terracotta')
    b.island({ x: [4, 9], z: [0, 8], y: -1, depth: 3.5 })
    b.column({ x: 6, z: 4, from: 0, to: 2 }, 'teal')
    for (const pos of [
      [6, 0, 5],
      [6, 0, 6],
      [7, 0, 6],
      [8, 0, 6],
    ] as const)
      b.solid([...pos], 'teal')
    b.rotator({
      id: 'ferry',
      pivot: [6, 2, 4],
      blocks: [
        { offset: [-1, 0, 0] },
        { offset: [1, 0, 0] },
        { offset: [3, 1, 2] },
        { offset: [1, -1, 0], kind: 'solid', color: 'teal' },
        { offset: [1, -1, 1], kind: 'solid', color: 'teal' },
        { offset: [1, -1, 2], kind: 'solid', color: 'teal' },
        { offset: [2, -1, 2], kind: 'solid', color: 'teal' },
        { offset: [3, -1, 2], kind: 'solid', color: 'teal' },
        { offset: [3, 0, 2], kind: 'solid', color: 'teal' },
      ],
      handle: { block: [8, 0, 6], face: 'z' },
    })
    b.orb({ mechanism: 'ferry', block: 0 })
    b.mover({
      id: 'lift',
      origin: [4, 1, 3],
      axis: 'y',
      stops: [0, 3],
      blocks: [
        { offset: [0, 0, 0] },
        { offset: [-1, 0, 0] },
        { offset: [0, -1, 0], kind: 'solid', color: 'teal' },
        { offset: [0, -1, -1], kind: 'solid', color: 'teal' },
      ],
      handle: { block: [6, 0, 6], face: 'z' },
    })
    b.column({ x: 2, z: 0, from: 0, to: 1 }, 'rose')
    b.path([2, 2, 0], 'rose')
    b.orb({ tile: [2, 2, 0] })
    b.solid([-1, 0, 0], 'terracotta')
    b.path([-1, 1, 0], 'terracotta')
    b.orb({ tile: [-1, 1, 0], optional: true })
    b.island({ x: [10, 12], z: [6, 8], y: 0, depth: 4 })
    b.column({ x: 12, z: 8, from: 1, to: 4 }, 'rose')
    b.path([12, 5, 8], 'rose')
    b.tree([-1, -1, 3])
    b.flower([7, -1, 8])
    b.window({ pos: [12, 2, 8], face: 'x' })
    b.lamp([0, -1, 3])
    b.lamp([8, -1, 7])
    b.lamp([10, 0, 8])
    b.start([0, 0, 2])
    b.goal([12, 5, 8])
  },
  solution: [
    { type: 'walk', to: [5, 2, 4] },
    { type: 'walk', to: [3, 1, 3] },
    { type: 'operate', mechanism: 'ferry' },
    { type: 'operate', mechanism: 'ferry' },
    { type: 'operate', mechanism: 'lift' },
    { type: 'walk', to: [2, 2, 0] },
    { type: 'operate', mechanism: 'lift' },
    { type: 'walk', to: [3, 3, 2] },
    { type: 'operate', mechanism: 'ferry' },
    { type: 'operate', mechanism: 'ferry' },
    { type: 'walk', to: [12, 5, 8] },
  ],
})
