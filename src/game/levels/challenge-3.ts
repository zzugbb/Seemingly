import { defineLevel } from './builders'

export default defineLevel({
  id: 'challenge-3',
  title: '逆织',
  chapter: 3,
  revision: 1,
  challenge: true,
  soundtrack: 'courtyard',
  hints: [],
  build: (b) => {
    b.island({ x: [-2, 0], z: [1, 3], y: -1, depth: 2 })
    b.island({ x: [1, 6], z: [0, 7], y: -1, depth: 3 })
    b.island({ x: [12, 17], z: [7, 13], y: 6, depth: 3 })
    b.island({ x: [7, 10], z: [-1, 6], y: -1, depth: 2.5 })
    b.path([-1, 0, 2], 'terracotta')
    b.path([4, 2, 7], 'rose')
    b.path([12, 7, 7], 'terracotta')
    b.path([15, 9, 13], 'rose')
    b.solid([3, 0, 3], 'teal')
    b.solid([3, 1, 3], 'teal')
    b.solid([5, 0, 7], 'teal')
    b.solid([4, 0, 7], 'rose')
    b.solid([4, 1, 7], 'rose')
    b.solid([14, 7, 10], 'teal')
    b.solid([14, 8, 10], 'teal')
    b.solid([15, 7, 13], 'rose')
    b.solid([15, 8, 13], 'rose')
    b.path([6, 2, 0], 'rose')
    b.solid([6, 0, 0], 'rose')
    b.solid([6, 1, 0], 'rose')
    b.path([11, 7, 7], 'terracotta')
    b.solid([11, 6, 7], 'sand')
    b.solid([8, 0, 5], 'teal')
    b.solid([8, 1, 5], 'teal')
    b.solid([8, 2, 5], 'teal')
    b.solid([8, 3, 5], 'teal')
    b.solid([10, 0, 0], 'teal')
    b.solid([10, 1, 0], 'teal')
    b.rotator({
      id: 'pair',
      pivot: [3, 1, 3],
      blocks: [
        { offset: [-2, 0, 0] },
        { offset: [-1, 0, 0], kind: 'solid', color: 'teal' },
        { offset: [-2, -1, 0], kind: 'solid', color: 'teal' },
        { offset: [-1, -1, 0], kind: 'solid', color: 'teal' },
      ],
      handle: { block: [5, 0, 7], face: 'z' },
      links: [{ target: 'remote' }],
    })
    b.rotator({
      id: 'remote',
      pivot: [14, 8, 10],
      initialStep: 1,
      blocks: [
        { offset: [-1, 0, 0] },
        { offset: [-1, 0, -1] },
        { offset: [-1, -1, 0], kind: 'solid', color: 'teal' },
        { offset: [-1, -1, -1], kind: 'solid', color: 'teal' },
      ],
    })
    b.rotator({
      id: 'relay',
      pivot: [8, 4, 5],
      blocks: [{ offset: [-2, 0, 0] }],
      handle: { block: [10, 1, 0], face: 'z' },
      links: [{ target: 'remote', reverse: true }],
    })
    b.orb({ tile: [4, 2, 7] })
    b.path([14, 7, 7], 'rose')
    b.orb({ tile: [14, 7, 7], optional: true })
    b.orb({ tile: [15, 9, 13] })
    b.path([17, 9, 11], 'rose')
    b.column({ x: 17, z: 11, from: 7, to: 8 }, 'rose')
    b.orb({ tile: [17, 9, 11] })
    b.tree([-2, -1, 3])
    b.flower([6, -1, 7])
    b.window({ pos: [15, 7, 13], face: 'x' })
    b.lamp([12, 6, 13])
    b.lamp([16, 6, 11])
    b.start([-1, 0, 2])
    b.goal([6, 2, 0])
  },
  solution: [
    { type: 'walk', to: [1, 1, 3] },
    { type: 'operate', mechanism: 'pair' },
    { type: 'walk', to: [4, 2, 7] },
    { type: 'walk', to: [3, 1, 5] },
    { type: 'operate', mechanism: 'pair' },
    { type: 'operate', mechanism: 'pair' },
    { type: 'walk', to: [6, 4, 5] },
    { type: 'operate', mechanism: 'pair' },
    { type: 'operate', mechanism: 'pair' },
    { type: 'operate', mechanism: 'relay' },
    { type: 'walk', to: [15, 9, 13] },
    { type: 'walk', to: [14, 8, 11] },
    { type: 'operate', mechanism: 'pair' },
    { type: 'walk', to: [17, 9, 11] },
    { type: 'walk', to: [15, 8, 10] },
    { type: 'operate', mechanism: 'relay' },
    { type: 'operate', mechanism: 'relay' },
    { type: 'walk', to: [6, 2, 0] },
  ],
})
