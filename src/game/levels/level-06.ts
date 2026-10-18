import { defineLevel } from './builders'
import type { Vec3 } from './types'

export default defineLevel({
  id: 'level-06',
  title: '两难',
  chapter: 2,
  revision: 2,
  soundtrack: 'courtyard',
  build: (b) => {
    b.island({ x: [1, 9], z: [0, 1], y: -1, depth: 1.8 })
    b.island({ x: [1, 9], z: [6, 7], y: -1, depth: 2.2 })
    b.island({ x: [5, 7], z: [-4, -2], y: -1, depth: 2 })
    for (let z = 2; z <= 5; z++) {
      b.solid([1, -1, z], 'terracotta')
      b.solid([9, -1, z], 'terracotta')
    }
    for (let x = 2; x <= 8; x++) b.solid([x, -1, 4], 'terracotta')

    const platforms: { pos: Vec3; color: 'terracotta' | 'rose' }[] = [
      { pos: [1, 1, 3], color: 'terracotta' },
      { pos: [5, 1, 1], color: 'terracotta' },
      { pos: [10, 3, 5], color: 'rose' },
      { pos: [6, 2, -3], color: 'rose' },
    ]
    for (const {
      pos: [x, y, z],
      color,
    } of platforms) {
      b.column({ x, z, from: 0, to: y - 1 }, color)
      b.path([x, y, z], color)
    }

    b.column({ x: 4, z: 4, from: 0, to: 2 }, 'teal')
    b.solid([6, 0, 7], 'teal')
    const frame: Vec3[] = [
      [1, -1, 0],
      [2, -1, 0],
      [2, -1, -1],
      [3, -1, -1],
      [4, -1, -1],
      [4, -1, 0],
      [4, -1, 1],
      [4, -1, 2],
      [4, -1, 3],
      [4, -1, 4],
      [4, 0, 4],
      [4, 1, 4],
    ]
    b.rotator({
      id: 'west',
      pivot: [4, 2, 4],
      blocks: [
        { offset: [-1, 0, 0] },
        { offset: [4, 2, 4] },
        ...frame.map((offset) => ({ offset, kind: 'solid' as const, color: 'teal' as const })),
      ],
      handle: { block: [6, 0, 7], face: 'z' },
    })

    b.column({ x: 7, z: 4, from: 0, to: 2 }, 'teal')
    b.solid([9, 1, 6], 'teal')
    b.rotator({
      id: 'east',
      pivot: [7, 2, 4],
      initialStep: 3,
      blocks: [{ offset: [-1, 0, 0] }, { offset: [-1, 0, -1] }],
      handle: { block: [9, 1, 6], face: 'z' },
    })

    b.orb({ tile: [5, 1, 1] })
    b.orb({ tile: [10, 3, 5], optional: true })
    b.tree([2, -1, 0])
    b.flower([8, -1, 7])
    b.window({ pos: [10, 1, 5], face: 'x' })
    b.window({ pos: [6, 0, -3], face: 'z' })
    b.start([1, 1, 3])
    b.goal([6, 2, -3])
  },
  solution: [
    { type: 'walk', to: [3, 2, 4] },
    { type: 'operate', mechanism: 'west' },
    { type: 'operate', mechanism: 'west' },
    { type: 'operate', mechanism: 'east' },
    { type: 'walk', to: [5, 1, 1] },
    { type: 'walk', to: [6, 2, 3] },
    { type: 'operate', mechanism: 'west' },
    { type: 'operate', mechanism: 'west' },
    { type: 'operate', mechanism: 'east' },
    { type: 'walk', to: [8, 4, 8] },
    { type: 'operate', mechanism: 'west' },
    { type: 'walk', to: [6, 2, -3] },
  ],
})
