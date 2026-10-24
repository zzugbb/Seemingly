import { defineLevel } from './builders'
import type { Vec3 } from './types'
const p = (a: number, b: number, y: number): Vec3 => [a + y, y, b + y]
export default defineLevel({
  id: 'level-14',
  title: '相守',
  chapter: 5,
  revision: 1,
  soundtrack: 'courtyard',
  hints: [],
  solution: [
    { type: 'walk', to: [4, 1, 4] },
    { type: 'walk', to: [7, 1, 2] },
    { type: 'operate', mechanism: 'ferry' },
    { type: 'push', crate: 'crate-0' },
    { type: 'walk', to: [16, 4, 7] },
    { type: 'operate', mechanism: 'lift' },
    { type: 'walk', to: [19, 5, 12] },
    { type: 'walk', to: [16, 4, 11] },
    { type: 'operate', mechanism: 'lift' },
    { type: 'walk', to: [16, 2, 3] },
    { type: 'walk', to: [12, 1, 2] },
    { type: 'operate', mechanism: 'ferry' },
    { type: 'walk', to: [2, 0, 2] },
  ],
  build: (b) => {
    b.island({ x: [1, 6], z: [1, 5], y: -1, depth: 2 })
    b.island({ x: [9, 12], z: [1, 5], y: 0, depth: 2 })
    b.island({ x: [13, 16], z: [2, 7], y: 1, depth: 2 })
    b.island({ x: [17, 19], z: [11, 13], y: 4, depth: 3 })
    const paths: [number, number, number][] = [
      [2, 2, 0],
      [3, 2, 0],
      [4, 2, 2],
      [3, 3, 1],
      [12, 0, 1],
      [12, 1, 2],
      [13, 1, 2],
      [14, 1, 2],
      [11, 2, 3],
      [12, 2, 3],
      [13, 2, 3],
      [14, 2, 3],
      [13, 7, 5],
      [14, 7, 5],
    ]
    for (const [a, z, y] of paths) {
      b.path(p(a, z, y), 'rose')
      const floor = a >= 12 && z >= 7 ? 5 : a < 5 ? 0 : a + y >= 13 && z + y >= 2 ? 2 : 1
      for (let h = floor; h < y; h++) b.solid([a + y, h, z + y], 'rose')
    }
    b.solid([4, 0, 5], 'teal')
    b.mover({
      id: 'ferry',
      origin: p(4, 1, 1),
      axis: 'x',
      stops: [0, 4],
      blocks: [{ offset: [0, 0, 0] }, { offset: [1, 0, 0] }, { offset: [2, 0, 0] }, { offset: [3, 0, 0] }],
      handle: { block: [4, 0, 5], face: 'z' },
    })
    b.mover({
      id: 'lift',
      origin: p(12, 3, 4),
      axis: 'z',
      stops: [0, 4],
      blocks: [{ offset: [0, 0, 0] }],
      handle: { block: [16, 1, 7], face: 'x' },
    })
    b.crate({ mechanism: 'ferry', block: 3 })
    b.patrol({
      mode: 'pingpong',
      route: [{ tile: p(12, 1, 2) }, { tile: p(13, 1, 2) }, { tile: p(14, 1, 2) }],
    })
    b.plate({ id: 'weight', tile: p(12, 1, 2), target: 'door', mode: 'hold' })
    b.plate({
      id: 'weight-far',
      tile: p(13, 1, 2),
      target: 'far-door',
      mode: 'hold',
    })
    b.gate({ id: 'door', tile: p(11, 2, 3), mode: 'hold' })
    b.gate({ id: 'far-door', tile: p(13, 7, 5), mode: 'hold' })
    b.orb({ tile: p(3, 3, 1) })
    b.orb({ tile: p(14, 1, 2) })
    b.orb({ tile: p(14, 7, 5) })
    b.orb({ tile: p(12, 1, 2), optional: true })
    b.tree([1, -1, 5])
    b.flower([6, -1, 5])
    b.window({ pos: [14, 1, 3], face: 'x' })
    b.lamp([19, 4, 13])
    b.lamp([15, 1, 7])
    b.start(p(3, 2, 0))
    b.goal(p(2, 2, 0))
  },
})
