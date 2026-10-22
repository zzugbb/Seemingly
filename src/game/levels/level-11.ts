import { defineLevel } from './builders'

export default defineLevel({
  id: 'level-11',
  title: '越界',
  chapter: 4,
  revision: 1,
  soundtrack: 'courtyard',
  hints: [],
  build: (b) => {
    b.island({ x: [0, 2], z: [-2, 3], y: -2, depth: 2 })
    b.island({ x: [3, 7], z: [1, 5], y: -1, depth: 3 })
    b.island({ x: [5, 10], z: [7, 9], y: 0, depth: 3 })
    b.island({ x: [11, 14], z: [8, 13], y: 2, depth: 3 })
    b.path([1, -1, -1], 'terracotta')
    b.path([2, -1, -1], 'terracotta')
    b.path([1, -1, 0], 'terracotta')
    b.path([2, -1, 0], 'terracotta')
    b.path([2, -1, 3], 'terracotta')
    b.path([1, -1, 3], 'terracotta')
    b.path([0, -1, 3], 'terracotta')
    b.path([6, 2, 7], 'rose')
    b.path([5, 2, 7], 'rose')
    b.path([8, 3, 7], 'rose')
    b.path([8, 3, 8], 'rose', { oneWay: '+b' })
    b.path([9, 3, 7], 'rose')
    b.path([9, 3, 8], 'rose')
    b.path([9, 3, 9], 'rose')
    b.path([13, 5, 13], 'rose')
    b.column({ x: 5, z: 3, from: 0, to: 1 }, 'teal')
    b.solid([5, 1, 9], 'teal')
    b.solid([6, 1, 7], 'rose')
    b.solid([5, 1, 7], 'rose')
    b.column({ x: 8, z: 7, from: 1, to: 2 }, 'rose')
    b.column({ x: 8, z: 8, from: 1, to: 2 }, 'rose')
    b.column({ x: 9, z: 7, from: 1, to: 2 }, 'rose')
    b.column({ x: 9, z: 8, from: 1, to: 2 }, 'rose')
    b.column({ x: 9, z: 9, from: 1, to: 2 }, 'rose')
    b.column({ x: 12, z: 10, from: 3, to: 4 }, 'teal')
    b.solid([14, 3, 13], 'teal')
    b.column({ x: 13, z: 13, from: 3, to: 4 }, 'rose')
    b.rotator({
      id: 'turntable',
      pivot: [5, 1, 3],
      blocks: [{ offset: [-2, 0, 0] }, { offset: [-1, 0, 0] }],
      handle: { block: [5, 1, 9], face: 'z' },
    })
    b.plate({ id: 'weight', tile: [5, 2, 7], target: 'door', mode: 'hold' })
    b.gate({ id: 'door', tile: [9, 3, 8], mode: 'hold' })
    b.rotator({
      id: 'finish',
      pivot: [12, 4, 10],
      blocks: [{ offset: [-1, 0, 0] }],
      handle: { block: [14, 3, 13], face: 'z' },
    })
    b.plate({ id: 'garden-weight', tile: [6, 2, 7], mode: 'hold', target: 'garden-door' })
    b.gate({ id: 'garden-door', tile: [2, -1, 3], mode: 'hold' })
    b.crate({ tile: [1, -1, 0] })
    b.orb({ tile: [0, -1, 3], optional: true })
    b.orb({ tile: [8, 3, 7] })
    b.orb({ tile: [9, 3, 9] })
    b.tree([10, 0, 7])
    b.flower([10, 0, 9])
    b.window({ pos: [13, 3, 13], face: 'x' })
    b.lamp([11, 2, 13])
    b.lamp([14, 2, 9])
    b.start([2, -1, 0])
    b.goal([13, 5, 13])
  },
  solution: [
    { type: 'walk', to: [1, -1, -1] },
    { type: 'push', crate: 'crate-0' },
    { type: 'walk', to: [4, 1, 3] },
    { type: 'operate', mechanism: 'turntable' },
    { type: 'push', crate: 'crate-0' },
    { type: 'walk', to: [8, 3, 8] },
    { type: 'push', crate: 'crate-0' },
    { type: 'walk', to: [11, 4, 10] },
    { type: 'operate', mechanism: 'finish' },
    { type: 'walk', to: [13, 5, 13] },
  ],
})
