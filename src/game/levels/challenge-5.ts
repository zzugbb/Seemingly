import { defineLevel } from './builders'
import type { Vec3 } from './types'
const p = (a: number, b: number, y: number): Vec3 => [a + y, y, b + y]
export default defineLevel({
  id: 'challenge-5',
  title: '相托',
  chapter: 5,
  revision: 1,
  challenge: true,
  soundtrack: 'courtyard',
  hints: [],
  solution: [
    { type: 'walk', to: [5, 1, 2] },
    { type: 'operate', mechanism: 'ferry' },
    { type: 'walk', to: [11, 2, 3] },
    { type: 'push', crate: 'crate-0' },
    { type: 'walk', to: [13, 3, 5] },
    { type: 'operate', mechanism: 'lift' },
    { type: 'walk', to: [8, 2, 0] },
    { type: 'walk', to: [13, 6, 5] },
    { type: 'operate', mechanism: 'lift' },
    { type: 'walk', to: [15, 3, 4] },
    { type: 'push', crate: 'crate-0' },
    { type: 'push', crate: 'crate-0' },
    { type: 'push', crate: 'crate-0' },
    { type: 'walk', to: [9, 1, 1] },
    { type: 'operate', mechanism: 'ferry' },
    { type: 'push', crate: 'crate-0' },
    { type: 'walk', to: [8, 3, 4] },
    { type: 'walk', to: [8, 3, 3] },
    { type: 'walk', to: [2, 0, 4] },
  ],
  build: (b) => {
    b.island({ x: [-1, 7], z: [0, 4], y: -1, depth: 2 })
    b.island({ x: [11, 14], z: [1, 6], y: 0, depth: 3 })
    b.island({ x: [8, 10], z: [-1, 1], y: 0, depth: 2 })
    b.island({ x: [15, 16], z: [4, 5], y: 2, depth: 1.4 })
    const paths: [number, number, number][] = [
      [0, 1, 0],
      [1, 1, 0],
      [5, 1, 3],
      [2, 3, 0],
      [2, 1, 0],
      [2, 2, 0],
      [3, 1, 0],
      [3, 2, 0],
      [4, 2, 2],
      [9, 1, 2],
      [10, 1, 2],
      [7, -2, 2],
      [6, -2, 2],
      [11, 1, 2],
      [11, 2, 3],
      [12, 2, 3],
      [12, 1, 3],
      [13, 1, 3],
      [13, 2, 3],
      [9, 0, 2],
      [3, 0, 0],
      [5, 0, 3],
      [2, 4, 0],
    ]
    for (const [a, z, y] of paths) {
      b.path(
        p(a, z, y),
        'rose',
        (a === 13 && z === 1) || (a === 5 && z === 0) ? { oneWay: '-b' } : a === 11 && z === 2 ? { oneWay: '+a' } : {},
      )
      if (y > 0)
        b.column(
          {
            x: a + y,
            z: z + y,
            from: a + y >= 15 ? 3 : a < 6 ? 0 : 1,
            to: y - 1,
          },
          'rose',
        )
    }
    b.solid([4, 0, 3], 'teal')
    b.solid([14, 1, 6], 'teal')
    b.mover({
      id: 'ferry',
      origin: p(4, 1, 1),
      axis: 'x',
      stops: [0, 4],
      blocks: [{ offset: [0, 0, 0] }, { offset: [0, 0, -1] }],
      handle: { block: [4, 0, 3], face: 'z' },
    })
    b.mover({
      id: 'lift',
      origin: p(10, 2, 3),
      axis: 'y',
      stops: [0, 3],
      blocks: [{ offset: [0, 0, 0] }],
      handle: { block: [14, 1, 6], face: 'z' },
    })
    b.patrol({
      mode: 'pingpong',
      route: [{ tile: p(3, 1, 0) }, { mechanism: 'ferry', block: 0 }, { tile: p(5, 1, 3) }],
    })
    b.plate({ id: 'weight', tile: p(3, 1, 0), mode: 'hold', target: 'door' })
    b.gate({ id: 'door', tile: p(9, 1, 2), mode: 'hold' })
    b.crate({ tile: p(10, 1, 2) })
    b.orb({ mechanism: 'ferry', block: 1 })
    b.plate({
      id: 'home-crate',
      tile: p(4, 2, 2),
      target: 'crate-door',
      mode: 'hold',
    })
    b.gate({ id: 'crate-door', tile: p(2, 3, 0), mode: 'hold' })
    b.plate({
      id: 'far-weight',
      tile: p(11, 1, 2),
      mode: 'hold',
      target: 'north-door',
    })
    b.gate({ id: 'north-door', tile: p(7, -2, 2), mode: 'hold' })
    b.plate({
      id: 'bonus-crate',
      tile: p(12, 1, 3),
      mode: 'hold',
      target: 'bonus-door',
    })
    b.gate({ id: 'home-door', tile: p(2, 2, 0), mode: 'hold' })
    b.orb({ tile: p(6, -2, 2) })
    b.plate({
      id: 'bonus-weight',
      tile: p(5, 1, 3),
      mode: 'hold',
      target: 'home-door',
    })
    b.gate({ id: 'bonus-door', tile: p(1, 1, 0), mode: 'hold' })
    b.orb({ tile: p(0, 1, 0), optional: true })
    b.tree([0, -1, 3])
    b.flower([5, -1, 3])
    b.lamp([11, 0, 6])
    b.window({ pos: [11, 1, 3], face: 'x' })
    b.start(p(3, 2, 0))
    b.goal(p(2, 4, 0))
  },
})
