import { defineLevel } from './builders'

export default defineLevel({
  id: 'level-03',
  title: '随行',
  chapter: 1,
  revision: 4,
  soundtrack: 'courtyard',
  hints: ['浅色顶板是可以站立的路面', '站在移动的积木上，小人会随它一起移动'],
  build: (b) => {
    b.island({ x: [-1, 1], z: [1, 3], y: -1, depth: 2 })
    b.path([0, 0, 2], 'terracotta')
    b.island({ x: [2, 8], z: [2, 8], y: -1, depth: 3 })
    b.column({ x: 3, z: 3, from: 0, to: 1 }, 'rose')
    b.solid([8, 0, 5], 'terracotta')
    b.rotator({
      id: 'ferry',
      pivot: [3, 1, 3],
      blocks: [{ offset: [-1, 0, 0] }, { offset: [-1, -1, 0], kind: 'solid', color: 'teal' }],
      handle: { block: [8, 0, 5], face: 'z' },
    })
    b.column({ x: 4, z: 6, from: 0, to: 1 }, 'rose')
    b.path([4, 2, 6], 'rose')
    b.column({ x: 5, z: 6, from: 0, to: 1 }, 'rose')
    b.path([5, 2, 6], 'rose')
    b.column({ x: 4, z: 7, from: 0, to: 1 }, 'rose')
    b.path([4, 2, 7], 'rose')
    b.orb({ tile: [4, 2, 7] })
    b.column({ x: 6, z: 4, from: 0, to: 1 }, 'rose')
    b.path([6, 2, 4], 'rose')
    b.column({ x: 7, z: 7, from: 0, to: 2 }, 'rose')
    b.path([7, 3, 7], 'rose')
    b.tree([-1, -1, 3])
    b.flower([6, -1, 8])
    b.window({ pos: [7, 1, 7], face: 'x' })
    b.start([0, 0, 2])
    b.goal([7, 3, 7])
  },
  solution: [
    { type: 'walk', to: [2, 1, 3] },
    { type: 'operate', mechanism: 'ferry' },
    { type: 'walk', to: [4, 2, 7] },
    { type: 'walk', to: [7, 3, 7] },
  ],
})
