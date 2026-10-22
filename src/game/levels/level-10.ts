import { defineLevel } from './builders'

export default defineLevel({
  id: 'level-10',
  title: '推动',
  chapter: 4,
  revision: 1,
  soundtrack: 'courtyard',
  hints: [],
  build: (b) => {
    b.island({ x: [-1, 2], z: [1, 4], y: -1, depth: 2 })
    b.island({ x: [3, 6], z: [1, 4], y: -1, depth: 2 })
    b.island({ x: [7, 9], z: [4, 7], y: 0, depth: 3 })
    b.island({ x: [10, 14], z: [7, 12], y: 2, depth: 3 })
    b.path([0, 0, 2], 'terracotta')
    b.path([0, 0, 3], 'terracotta')
    b.path([1, 0, 2], 'terracotta')
    b.path([1, 0, 3], 'terracotta')
    b.path([8, 2, 4], 'rose')
    b.path([7, 2, 5], 'rose')
    b.path([7, 2, 6], 'rose')
    b.path([7, 2, 7], 'rose')
    b.path([12, 5, 12], 'rose')
    b.path([5, 1, 1], 'terracotta')
    b.solid([3, 0, 4], 'teal')
    b.solid([8, 1, 4], 'rose')
    b.solid([7, 1, 5], 'rose')
    b.solid([7, 1, 6], 'rose')
    b.solid([7, 1, 7], 'rose')
    b.column({ x: 11, z: 9, from: 3, to: 4 }, 'teal')
    b.solid([14, 3, 12], 'teal')
    b.column({ x: 12, z: 12, from: 3, to: 4 }, 'rose')
    b.solid([5, 0, 1], 'terracotta')
    b.mover({
      id: 'freight',
      origin: [3, 1, 3],
      axis: 'x',
      stops: [0, 2],
      blocks: [
        { offset: [0, 0, 0] },
        { offset: [1, 0, 0] },
        { offset: [0, 0, -1] },
        { offset: [0, -1, 0], kind: 'solid', color: 'teal' },
        { offset: [1, -1, 0], kind: 'solid', color: 'teal' },
        { offset: [0, -1, -1], kind: 'solid', color: 'teal' },
      ],
      handle: { block: [3, 0, 4], face: 'z' },
    })
    b.plate({ id: 'weight', tile: [8, 2, 4], mode: 'hold', target: 'door' })
    b.gate({ id: 'door', tile: [7, 2, 6], mode: 'hold' })
    b.rotator({
      id: 'finish',
      pivot: [11, 4, 9],
      blocks: [{ offset: [-1, 0, 0] }],
      handle: { block: [14, 3, 12], face: 'z' },
    })
    b.crate({ tile: [1, 0, 2] })
    b.orb({ tile: [0, 0, 3] })
    b.orb({ tile: [7, 2, 7] })
    b.orb({ tile: [5, 1, 1], optional: true })
    b.tree([-1, -1, 4])
    b.flower([9, 0, 7])
    b.window({ pos: [12, 3, 12], face: 'x' })
    b.lamp([14, 2, 8])
    b.start([1, 0, 3])
    b.goal([12, 5, 12])
  },
  solution: [
    { type: 'walk', to: [0, 0, 2] },
    { type: 'push', crate: 'crate-0' },
    { type: 'push', crate: 'crate-0' },
    { type: 'operate', mechanism: 'freight' },
    { type: 'push', crate: 'crate-0' },
    { type: 'walk', to: [10, 4, 9] },
    { type: 'operate', mechanism: 'finish' },
    { type: 'walk', to: [12, 5, 12] },
  ],
})
