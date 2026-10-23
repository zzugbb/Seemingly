import { defineLevel } from './builders'

export default defineLevel({
  id: 'level-09',
  title: '牵引',
  chapter: 3,
  revision: 2,
  soundtrack: 'courtyard',
  hints: [],
  build: (b) => {
    b.island({ x: [-2, 0], z: [1, 3], y: -1, depth: 2 })
    b.island({ x: [1, 7], z: [-2, 8], y: -1, depth: 3 })
    b.island({ x: [8, 12], z: [3, 9], y: 2, depth: 3 })
    b.path([-1, 0, 2], 'terracotta')
    b.path([4, 2, 7], 'rose')
    b.path([4, 2, 8], 'rose')
    b.path([2, 0, -1], 'terracotta')
    b.path([2, 0, -2], 'terracotta')
    b.path([1, 0, -1], 'terracotta')
    b.path([1, 0, 0], 'terracotta')
    b.path([10, 5, 8], 'rose')
    b.path([8, 5, 4], 'rose')
    b.path([10, 6, 5], 'rose')
    b.solid([3, 0, 3], 'teal')
    b.solid([3, 1, 3], 'teal')
    b.solid([2, 0, 8], 'teal')
    b.solid([4, 0, 7], 'rose')
    b.solid([4, 1, 7], 'rose')
    b.solid([4, 0, 8], 'rose')
    b.solid([4, 1, 8], 'rose')
    b.solid([10, 3, 8], 'rose')
    b.solid([10, 4, 8], 'rose')
    b.solid([8, 3, 4], 'rose')
    b.solid([8, 4, 4], 'rose')
    b.solid([10, 3, 5], 'rose')
    b.solid([10, 4, 5], 'rose')
    b.solid([10, 5, 5], 'rose')
    b.path([5, 2, 7], 'rose')
    b.solid([5, 0, 7], 'rose')
    b.solid([5, 1, 7], 'rose')
    b.path([7, 3, 8], 'rose')
    b.solid([7, 0, 8], 'rose')
    b.solid([7, 1, 8], 'rose')
    b.solid([7, 2, 8], 'rose')
    b.rotator({
      id: 'swing',
      pivot: [3, 1, 3],
      blocks: [
        { offset: [-2, 0, 0] },
        { offset: [-1, 0, 0], kind: 'solid', color: 'teal' },
        { offset: [-2, -1, 0], kind: 'solid', color: 'teal' },
        { offset: [-1, -1, 0], kind: 'solid', color: 'teal' },
      ],
      handle: { block: [2, 0, 8], face: 'z' },
    })
    b.plate({ id: 'call-south', tile: [4, 2, 7], target: 'receiver' })
    b.gate({ id: 'door', tile: [2, 0, -1], mode: 'toggle' })
    b.plate({ id: 'call-north', tile: [1, 0, -1], target: 'receiver' })
    b.mover({
      id: 'receiver',
      origin: [9, 4, 6],
      axis: 'y',
      stops: [0, 2],
      initialStop: 1,
      blocks: [{ offset: [0, 0, 0] }, { offset: [0, -1, 0], kind: 'solid', color: 'teal' }],
      links: [{ target: 'door' }, { target: 'garden-door' }, { target: 'south-door' }],
    })
    b.gate({ id: 'garden-door', tile: [8, 5, 4], mode: 'toggle', initiallyOpen: true })
    b.gate({ id: 'south-door', tile: [5, 2, 7], mode: 'toggle' })
    b.orb({ tile: [4, 2, 8] })
    b.orb({ tile: [10, 5, 8] })
    b.orb({ tile: [10, 6, 5], optional: false })
    b.orb({ tile: [7, 3, 8], optional: true })
    b.tree([-2, -1, 3])
    b.flower([6, -1, 8])
    b.window({ pos: [10, 4, 5], face: 'x' })
    b.lamp([4, -1, -2])
    b.lamp([6, -1, 0])
    b.lamp([8, 2, 8])
    b.start([-1, 0, 2])
    b.goal([2, 0, -2])
  },
  solution: [
    { type: 'walk', to: [1, 1, 3] },
    { type: 'operate', mechanism: 'swing' },
    { type: 'walk', to: [4, 2, 7] },
    { type: 'walk', to: [4, 2, 8] },
    { type: 'walk', to: [3, 1, 5] },
    { type: 'operate', mechanism: 'swing' },
    { type: 'walk', to: [10, 5, 8] },
    { type: 'walk', to: [5, 1, 3] },
    { type: 'operate', mechanism: 'swing' },
    { type: 'walk', to: [1, 0, -1] },
    { type: 'walk', to: [10, 6, 5] },
    { type: 'walk', to: [1, 0, -1] },
    { type: 'walk', to: [2, 0, -2] },
  ],
})
