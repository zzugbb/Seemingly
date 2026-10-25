import { defineLevel } from './builders'

export default defineLevel({
  id: 'challenge-4',
  title: '递位',
  chapter: 4,
  revision: 1,
  challenge: true,
  soundtrack: 'courtyard',
  hints: [],
  build: (b) => {
    b.island({ x: [-1, 2], z: [-1, 4], y: -1, depth: 2 })
    b.island({ x: [3, 10], z: [1, 9], y: -1, depth: 3 })
    b.island({ x: [11, 14], z: [3, 8], y: 0, depth: 2.5 })
    b.path([1, 0, 3], 'terracotta')
    b.path([1, 0, 2], 'terracotta')
    b.path([2, 0, 0], 'rose')
    b.path([3, 1, 2], 'rose')
    b.path([4, 2, 5], 'rose', { oneWay: '+a' })
    b.path([5, 2, 5], 'rose', { oneWay: '+a' })
    b.path([6, 2, 5], 'rose')
    b.path([7, 2, 5], 'rose')
    b.path([8, 2, 4], 'rose')
    b.path([8, 2, 5], 'rose')
    b.path([6, 2, 6], 'rose')
    b.path([7, 2, 6], 'rose')
    b.path([6, 1, 2], 'terracotta')
    b.path([6, 1, 1], 'terracotta')
    b.path([7, 1, 1], 'terracotta')
    b.path([7, 1, 2], 'terracotta', { oneWay: '+b' })
    b.path([9, 3, 7], 'rose')
    b.solid([3, 0, 8], 'teal')
    b.solid([3, 0, 2], 'rose')
    b.solid([4, 0, 5], 'rose')
    b.solid([4, 1, 5], 'rose')
    b.solid([5, 0, 5], 'rose')
    b.solid([5, 1, 5], 'rose')
    b.solid([6, 0, 5], 'rose')
    b.solid([6, 1, 5], 'rose')
    b.solid([7, 0, 5], 'rose')
    b.solid([7, 1, 5], 'rose')
    b.solid([8, 0, 4], 'rose')
    b.solid([8, 1, 4], 'rose')
    b.solid([8, 0, 5], 'rose')
    b.solid([8, 1, 5], 'rose')
    b.solid([6, 0, 6], 'rose')
    b.solid([6, 1, 6], 'rose')
    b.solid([7, 0, 6], 'rose')
    b.solid([7, 1, 6], 'rose')
    b.solid([6, 0, 2], 'terracotta')
    b.solid([6, 0, 1], 'terracotta')
    b.solid([7, 0, 1], 'terracotta')
    b.solid([7, 0, 2], 'terracotta')
    b.solid([9, 0, 7], 'rose')
    b.solid([9, 1, 7], 'rose')
    b.solid([9, 2, 7], 'rose')
    b.path([12, 2, 4], 'rose')
    b.solid([12, 1, 4], 'rose')
    b.path([13, 2, 4], 'rose')
    b.solid([13, 1, 4], 'rose')
    b.path([14, 2, 4], 'rose')
    b.solid([14, 1, 4], 'rose')
    b.path([13, 2, 5], 'rose')
    b.solid([13, 1, 5], 'rose')
    b.gate({ id: 'door', tile: [3, 1, 2], mode: 'hold' })
    b.mover({
      id: 'freight',
      origin: [3, 1, 3],
      axis: 'x',
      stops: [0, 2, 6],
      blocks: [
        { offset: [0, 0, 0] },
        { offset: [1, 0, 0] },
        { offset: [0, -1, 0], kind: 'solid', color: 'teal' },
        { offset: [1, -1, 0], kind: 'solid', color: 'teal' },
      ],
      handle: { block: [3, 0, 8], face: 'z' },
    })
    b.plate({ id: 'weight', tile: [9, 3, 7], target: 'door', mode: 'hold' })
    b.plate({
      id: 'garden-weight',
      tile: [8, 2, 4],
      target: 'far-hold',
      mode: 'hold',
    })
    b.plate({
      id: 'call-far',
      tile: [7, 1, 1],
      target: 'far-door',
      once: true,
    })
    b.gate({ id: 'far-door', tile: [12, 2, 4], mode: 'toggle' })
    b.gate({ id: 'far-hold', tile: [13, 2, 4], mode: 'hold' })
    b.crate({ mechanism: 'freight', block: 1 })
    b.orb({ tile: [7, 1, 1] })
    b.orb({ tile: [6, 2, 6] })
    b.orb({ tile: [14, 2, 4] })
    b.orb({ tile: [13, 4, 8], optional: true })
    b.path([10, 3, 7], 'rose')
    b.path([10, 3, 6], 'rose', { oneWay: '-b' })
    b.path([10, 3, 8], 'rose')
    b.path([10, 3, 9], 'rose')
    b.path([11, 3, 7], 'rose')
    b.path([13, 4, 8], 'rose')
    for (const [x, y, z] of [
      [10, 3, 7],
      [10, 3, 6],
      [10, 3, 8],
      [10, 3, 9],
      [11, 3, 7],
      [13, 4, 8],
    ])
      b.column({ x, z, from: x >= 11 ? 1 : 0, to: y - 1 }, 'rose')
    b.plate({
      id: 'archive-weight',
      tile: [8, 2, 5],
      target: 'archive-door',
      mode: 'hold',
    })
    b.gate({ id: 'archive-door', tile: [10, 3, 8], mode: 'hold' })
    b.plate({
      id: 'archive',
      tile: [10, 3, 9],
      target: 'home-door',
      once: true,
    })
    b.gate({ id: 'home-door', tile: [2, 0, 0], mode: 'toggle' })
    b.path([2, 0, -1], 'rose')
    b.plate({
      id: 'bonus-weight',
      tile: [7, 2, 5],
      target: 'bonus-door',
      mode: 'hold',
    })
    b.gate({ id: 'bonus-door', tile: [11, 3, 7], mode: 'hold' })
    b.tree([-1, -1, 3])
    b.flower([3, -1, 8])
    b.window({ pos: [9, 1, 7], face: 'x' })
    b.lamp([4, -1, 7])
    b.lamp([7, -1, 8])
    b.lamp([9, -1, 4])
    b.start([1, 0, 3])
    b.goal([2, 0, -1])
  },
  solution: [
    { type: 'walk', to: [3, 1, 3] },
    { type: 'operate', mechanism: 'freight' },
    { type: 'push', crate: 'crate-0' },
    { type: 'walk', to: [6, 2, 6] },
    { type: 'walk', to: [7, 1, 1] },
    { type: 'walk', to: [6, 1, 3] },
    { type: 'operate', mechanism: 'freight' },
    { type: 'walk', to: [14, 2, 4] },
    { type: 'walk', to: [10, 1, 3] },
    { type: 'operate', mechanism: 'freight' },
    { type: 'walk', to: [7, 1, 2] },
    { type: 'push', crate: 'crate-0' },
    { type: 'walk', to: [10, 3, 9] },
    { type: 'walk', to: [8, 2, 4] },
    { type: 'push', crate: 'crate-0' },
    { type: 'walk', to: [6, 1, 3] },
    { type: 'operate', mechanism: 'freight' },
    { type: 'walk', to: [2, 0, -1] },
  ],
})
