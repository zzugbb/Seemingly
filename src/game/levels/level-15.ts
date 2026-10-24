import { defineLevel } from './builders'
import type { Vec3 } from './types'
const p = (a: number, b: number, y: number): Vec3 => [a + y, y, b + y]
export default defineLevel({
  id: 'level-15',
  title: '归来',
  chapter: 5,
  revision: 1,
  soundtrack: 'courtyard',
  hints: [],
  solution: [
    { type: 'walk', to: [5, 1, 0] },
    { type: 'operate', mechanism: 'ferry' },
    { type: 'push', crate: 'crate-0' },
    { type: 'walk', to: [18, 6, 9] },
    { type: 'operate', mechanism: 'lift' },
    { type: 'walk', to: [20, 6, 13] },
    { type: 'walk', to: [18, 6, 13] },
    { type: 'operate', mechanism: 'lift' },
    { type: 'walk', to: [17, 5, 7] },
    { type: 'walk', to: [20, 6, 7] },
    { type: 'push', crate: 'crate-0' },
    { type: 'walk', to: [14, 1, 1] },
    { type: 'operate', mechanism: 'ferry' },
    { type: 'walk', to: [5, 0, -2] },
    { type: 'walk', to: [1, -2, -5] },
  ],
  ending: {
    lanterns: [
      [1, -2, -5],
      [1, -3, 2],
      [2, -3, 2],
      [3, -3, 2],
      [5, -3, 2],
      [9, 0, 2],
      [10, 0, 2],
      [12, 0, 2],
      [9, 0, 0],
      [17, 4, 8],
      [18, 4, 8],
      [19, 4, 8],
      [17, 4, 9],
      [18, 4, 14],
      [19, 4, 14],
    ],
    tower: Array.from({ length: 5 }, (_, i): Vec3 => [10, i + 1, 5]),
  },
  build: (b) => {
    b.island({ x: [0, 6], z: [-5, 3], y: -3, depth: 2 })
    b.island({ x: [7, 15], z: [-1, 7], y: 0, depth: 2 })
    b.island({ x: [17, 19], z: [5, 14], y: 4, depth: 3 })
    const paths: Vec3[] = [
      [5, -1, 3],
      [5, -2, 0],
      [3, 0, 1],
      [2, 1, 0],
      [3, -2, -2],
      [3, -3, -2],
      [11, 1, 1],
      [12, 1, 5],
      [13, 1, 5],
      [14, 0, 6],
      [14, 1, 6],
      [14, 2, 6],
      [12, 2, 5],
      [13, 3, 6],
      [14, 3, 6],
      [13, 7, 6],
      [14, 7, 6],
    ]
    for (const [a, z, y] of paths) {
      b.path(p(a, z, y), 'rose')
      const floor = a < 7 ? (a + y >= 7 ? 1 : -2) : a >= 12 ? 5 : 1
      for (let h = floor; h < y; h++) b.solid([a + y, h, z + y], 'rose')
    }
    b.solid([19, 5, 14], 'teal')
    b.mover({
      id: 'ferry',
      origin: p(4, 0, 1),
      axis: 'x',
      stops: [0, 9],
      blocks: [{ offset: [0, 0, 0] }, { offset: [0, 0, -1] }],
      handle: { block: [4, 0, 1], face: 'z' },
    })
    b.mover({
      id: 'lift',
      origin: p(12, 3, 6),
      axis: 'z',
      stops: [0, 4],
      blocks: [{ offset: [0, 0, 0] }],
      handle: { block: [19, 5, 14], face: 'z' },
    })
    b.crate({ mechanism: 'ferry', block: 0 })
    b.patrol({ mode: 'pingpong', route: [{ tile: p(13, 1, 5) }, { tile: p(12, 1, 5) }, { tile: p(11, 1, 1) }] })
    b.plate({ id: 'weight', tile: p(12, 1, 5), mode: 'hold', target: 'door' })
    b.plate({ id: 'weight-far', tile: p(13, 1, 5), mode: 'hold', target: 'far-door' })
    b.plate({ id: 'home-weight', tile: p(11, 1, 1), mode: 'hold', target: 'home-door' })
    b.gate({ id: 'landing-door', tile: p(14, 0, 6), mode: 'toggle', initiallyOpen: true })
    b.gate({ id: 'door', tile: p(14, 1, 6), mode: 'hold' })
    b.gate({ id: 'far-door', tile: p(13, 7, 6), mode: 'hold' })
    b.gate({ id: 'home-door', tile: p(3, -2, -2), mode: 'hold' })
    b.plate({ id: 'exchange', tile: p(14, 1, 6), target: 'home', once: true })
    b.column({ x: 1, z: -2, from: -2, to: -1 }, 'teal')
    b.rotator({
      id: 'home',
      pivot: p(2, -1, -1),
      initialStep: 3,
      blocks: [{ offset: [1, 0, 0] }],
      links: [{ target: 'veil' }, { target: 'landing-door' }],
    })
    b.mover({
      id: 'veil',
      origin: [15, 4, 5],
      axis: 'z',
      stops: [0, 2],
      blocks: [{ offset: [0, 0, 0], kind: 'solid', color: 'teal' }],
    })
    for (let z = 5; z <= 7; z++) b.solid([15, 3, z], 'rose')
    b.column({ x: 15, z: 5, from: 1, to: 2 }, 'rose')
    b.column({ x: 15, z: 7, from: 1, to: 2 }, 'rose')
    b.column({ x: 10, z: 5, from: 1, to: 5 }, 'rose')
    b.orb({ tile: p(5, -2, 0) })
    b.orb({ tile: p(12, 2, 5) })
    b.orb({ tile: p(14, 7, 6) })
    b.orb({ tile: p(2, 1, 0), optional: true })
    b.tree([1, -3, 1])
    b.flower([6, -3, 2])
    b.window({ pos: [13, 0, 4], face: 'x' })
    b.start(p(5, -1, 3))
    b.goal(p(3, -3, -2))
  },
})
