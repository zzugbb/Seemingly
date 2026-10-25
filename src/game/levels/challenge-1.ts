import { defineLevel } from './builders'
import type { Vec3 } from './types'
const p = (a: number, b: number, y: number): Vec3 => [a + y, y, b + y]
export default defineLevel({
  id: 'challenge-1',
  title: '回针',
  chapter: 1,
  challenge: true,
  revision: 1,
  soundtrack: 'courtyard',
  hints: [],
  solution: [
    { type: 'walk', to: [-1, 1, 1] },
    { type: 'operate', mechanism: 'west' },
    { type: 'walk', to: [3, 3, 6] },
    { type: 'walk', to: [1, 1, 3] },
    { type: 'operate', mechanism: 'west' },
    { type: 'walk', to: [7, 4, 4] },
    { type: 'operate', mechanism: 'middle' },
    { type: 'walk', to: [12, 7, 10] },
    { type: 'operate', mechanism: 'far' },
    { type: 'walk', to: [7, 5, 10] },
    { type: 'walk', to: [10, 7, 12] },
    { type: 'operate', mechanism: 'far' },
    { type: 'operate', mechanism: 'far' },
    { type: 'operate', mechanism: 'far' },
    { type: 'walk', to: [9, 4, 6] },
    { type: 'operate', mechanism: 'middle' },
    { type: 'walk', to: [14, 6, 6] },
    { type: 'walk', to: [11, 4, 4] },
    { type: 'operate', mechanism: 'middle' },
    { type: 'operate', mechanism: 'middle' },
    { type: 'walk', to: [3, 1, 1] },
    { type: 'operate', mechanism: 'west' },
    { type: 'walk', to: [-1, -1, -4] },
  ],
  build: (b) => {
    b.island({ x: [-5, 1], z: [-5, 1], y: -2, depth: 2 })
    b.island({ x: [2, 4], z: [5, 7], y: 1, depth: 2 })
    b.island({ x: [8, 13], z: [3, 7], y: 2, depth: 2.5 })
    b.island({ x: [6, 14], z: [9, 14], y: 4, depth: 2.5 })
    b.path(p(-3, 0, -1), 'terracotta')
    b.path(p(0, -3, -1), 'terracotta')
    b.path(p(0, 3, 3), 'rose')
    b.solid([3, 2, 6], 'rose')
    b.path(p(8, 0, 6), 'rose')
    b.column({ x: 14, z: 6, from: 3, to: 5 }, 'rose')
    b.path(p(2, 5, 5), 'rose')
    b.column({ x: 1, z: 1, from: -1, to: 1 }, 'teal')
    b.column({ x: 9, z: 4, from: 3, to: 4 }, 'teal')
    b.column({ x: 12, z: 12, from: 5, to: 7 }, 'teal')
    b.solid([13, 3, 6], 'rose')
    b.solid([13, 3, 7], 'rose')
    b.solid([14, 3, 7], 'teal')
    b.solid([1, -1, -4], 'teal')
    b.solid([14, 5, 14], 'teal')
    const arms = [
      { offset: [-2, 0, 0] as Vec3 },
      {
        offset: [-1, -1, 0] as Vec3,
        kind: 'solid' as const,
        color: 'teal' as const,
      },
      {
        offset: [-2, -1, 0] as Vec3,
        kind: 'solid' as const,
        color: 'teal' as const,
      },
    ]
    b.rotator({
      id: 'west',
      pivot: p(0, 0, 1),
      blocks: arms,
      handle: { block: [1, -1, -4], face: 'z' },
    })
    b.rotator({
      id: 'middle',
      pivot: p(5, 0, 4),
      blocks: arms,
      handle: { block: [14, 3, 7], face: 'z' },
    })
    b.rotator({
      id: 'far',
      pivot: p(5, 5, 7),
      initialStep: 3,
      blocks: arms,
      handle: { block: [14, 5, 14], face: 'z' },
    })
    b.orb({ tile: p(0, 3, 3) })
    b.orb({ tile: p(8, 0, 6) })
    b.orb({ tile: p(2, 5, 5) })
    b.tree([-5, -2, 1])
    b.flower([4, 1, 7])
    b.window({ pos: [14, 3, 6], face: 'x' })
    b.start(p(-3, 0, -1))
    b.goal(p(0, -3, -1))
  },
})
