import { defineLevel } from './builders'
import type { Vec3 } from './types'
export default defineLevel({
  id: 'level-06',
  title: '回环',
  chapter: 2,
  revision: 4,
  soundtrack: 'courtyard',
  hints: ['浅色顶板是路面，金色转轮改变建筑'],
  build: (b) => {
    b.island({ x: [1, 8], z: [0, 1], y: -1, depth: 2 })
    b.island({ x: [6, 14], z: [10, 13], y: 4, depth: 2.5 })
    b.island({ x: [0, 2], z: [-3, -1], y: -1, depth: 3 })
    b.island({ x: [5, 5], z: [3, 3], y: -1, depth: 1.4 })
    for (let z = 2; z <= 4; z++) {
      b.solid([1, -1, z], 'sand')
      b.solid([9, 0, z], 'sand')
      b.solid([4, -1, z], 'sand')
    }
    b.column({ x: 4, z: 4, from: 0, to: 2 }, 'teal')
    b.column({ x: 11, z: 8, from: 3, to: 5 }, 'teal')
    b.solid([6, 5, 13], 'teal')
    b.solid([14, 5, 11], 'teal')
    b.solid([8, 5, 10], 'rose')
    b.path([8, 6, 10], 'terracotta')
    b.solid([14, 5, 10], 'rose')
    b.path([14, 6, 10], 'terracotta')
    b.solid([12, 5, 11], 'rose')
    b.path([12, 6, 11], 'terracotta')
    b.orb({ tile: [12, 6, 11], optional: true })
    b.solid([7, 2, 5], 'terracotta')
    b.path([7, 3, 5], 'terracotta')
    b.solid([1, 0, -2], 'rose')
    b.path([1, 1, -2], 'rose')
    b.tree([1, -1, 0])
    b.flower([13, 4, 12])
    b.window({ pos: [1, 0, -2], face: 'z' })
    b.lamp([7, 4, 12])
    b.lamp([13, 4, 11])
    b.lamp([0, -1, -2])
    b.rotator({
      id: 'west',
      pivot: [4, 2, 4],
      initialStep: 1,
      blocks: [
        { offset: [-1, 0, 0] },
        { offset: [-1, 0, -5] },
        ...Array.from({ length: 6 }, (_, i) => ({
          offset: [-1, -1, -i] as Vec3,
          kind: 'solid' as const,
          color: 'teal' as const,
        })),
      ],
      handle: { block: [6, 5, 13], face: 'z' },
    })
    b.rotator({
      id: 'east',
      pivot: [11, 5, 8],
      initialStep: 0,
      blocks: [{ offset: [-1, 0, 0] }, { offset: [-1, 0, -1] }],
      handle: { block: [14, 5, 11], face: 'z' },
    })
    b.orb({ mechanism: 'east', block: 1 })
    b.orb({ tile: [14, 6, 10] })
    b.start([8, 6, 10])
    b.goal([1, 1, -2])
  },
  solution: [
    { type: 'walk', to: [4, 2, 5] },
    { type: 'operate', mechanism: 'west' },
    { type: 'walk', to: [10, 5, 7] },
    { type: 'operate', mechanism: 'east' },
    { type: 'operate', mechanism: 'east' },
    { type: 'walk', to: [14, 6, 10] },
    { type: 'walk', to: [12, 5, 9] },
    { type: 'operate', mechanism: 'east' },
    { type: 'operate', mechanism: 'west' },
    { type: 'walk', to: [9, 2, 3] },
    { type: 'operate', mechanism: 'west' },
    { type: 'walk', to: [1, 1, -2] },
  ],
})
