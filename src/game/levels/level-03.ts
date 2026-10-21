import { defineLevel } from './builders'

export default defineLevel({
  id: 'level-03',
  title: '随行',
  chapter: 1,
  revision: 3,
  soundtrack: 'courtyard',
  hints: ['浅色顶板是可以站立的路面', '站在移动的积木上，小人会随它一起移动'],
  build: (b) => {
    b.island({ x: [-1, 1], z: [1, 3], y: -1, depth: 2 })
    b.path([0, 0, 2], 'terracotta')
    b.island({ x: [2, 6], z: [2, 6], y: -1, depth: 3 })
    b.column({ x: 3, z: 3, from: 0, to: 1 }, 'rose')
    b.solid([6, 0, 5], 'terracotta')
    b.rotator({
      id: 'ferry',
      pivot: [3, 1, 3],
      blocks: [{ offset: [-1, 0, 0] }, { offset: [-1, -1, 0], kind: 'solid', color: 'teal' }],
      handle: { block: [6, 0, 5], face: 'z' },
    })
    b.orb({ mechanism: 'ferry', block: 0 })
    b.column({ x: 4, z: 6, from: 0, to: 1 }, 'rose')
    b.path([4, 2, 6], 'rose')
    b.column({ x: 6, z: 4, from: 0, to: 1 }, 'rose')
    b.path([6, 2, 4], 'rose')
    b.tree([-1, -1, 3])
    b.flower([5, -1, 5])
    b.window({ pos: [6, 0, 4], face: 'x' })
    b.start([0, 0, 2])
    b.goal([6, 2, 4])
  },
  solution: [
    { type: 'walk', to: [2, 1, 3] },
    { type: 'operate', mechanism: 'ferry' },
    { type: 'operate', mechanism: 'ferry' },
    { type: 'walk', to: [6, 2, 4] },
  ],
})
