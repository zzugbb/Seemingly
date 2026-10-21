import { defineLevel } from './builders'

export default defineLevel({
  id: 'level-02',
  title: '转动',
  chapter: 1,
  revision: 3,
  soundtrack: 'courtyard',
  hints: ['点击金色转轮，观察路面怎样连接'],
  build: (b) => {
    b.island({ x: [-1, 1], z: [1, 3], y: -1, depth: 2 })
    b.path([0, 0, 2], 'terracotta')
    b.island({ x: [2, 5], z: [0, 4], y: -1, depth: 2.5 })
    b.column({ x: 3, z: 3, from: 0, to: 0 }, 'rose')
    b.path([3, 1, 3], 'rose')
    b.orb({ tile: [3, 1, 3] })
    b.solid([4, 0, 4], 'terracotta')
    b.rotator({
      id: 'bridge',
      pivot: [3, 1, 3],
      blocks: [{ offset: [-1, 0, 0] }, { offset: [1, 0, 0] }],
      handle: { block: [4, 0, 4], face: 'z' },
    })
    b.path([2, 0, 0], 'terracotta')
    b.tree([-1, -1, 3])
    b.flower([5, -1, 0])
    b.window({ pos: [3, 0, 3], face: 'z' })
    b.start([0, 0, 2])
    b.goal([2, 0, 0])
  },
  solution: [
    { type: 'walk', to: [3, 1, 3] },
    { type: 'operate', mechanism: 'bridge' },
    { type: 'walk', to: [2, 0, 0] },
  ],
})
