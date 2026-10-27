# 第 4 关 · 换乘

## 状态与目标

正式版本：level-04，revision 3，第二章，courtyard 声景。**短桥送到中转站，人下桥后再换到长臂去灯塔。** 主线 8 步、全收集 12 步。

## 布局

转盘轴为 `(8,4,6)`，把手在 `(8,0,6)` z 面，灯笼在 `(13,6,8)`。转盘、北台、南台与灯塔沿视线方向错开纵深，保证折梁运动净空；三个活动路面与折梁的完整偏移见参考实现。

静态路面为起点及入口 `(0,0,2)`、`(1,0,2)`、`(2,0,2)`，南台 `(4,1,4)`，北台 `(5,1,1)`，终点 `(13,6,8)`。ferry#0 短端有必需光点；北台一处选做。轴无路面，不能把中心补成道路；完整底座、实体梁和装饰清单见参考实现。

## 主线标准解法（8 步）

1. 走到 `(7,4,6)`，登短端并收必需光点。
2. ferry 一次。
3. 走到南台 `(4,1,4)`，离开转盘。
4. ferry 两次（各计一步）。
5. 走到 `(8,4,7)`，改登长端。
6. ferry 一次。
7. 走到 `(13,6,8)` 点灯。上述序列共 8 个动作。

## 全收集标准解法（12 步）

走 `(7,4,6)` → ferry 三次 → 北台 `(5,1,1)` 取选做 → ferry 两次 → `(8,4,5)` 登长端 → ferry 三次 → 终点 `(13,6,8)`。

## 干扰、指标与验收

一直乘短端旋转不能完成主线；南台和北台均可下桥后重新安排接客。北台收光撤销后恢复光点；主线不能自动获得北台选做。测试副本将 ferry#1 改为 solid 后无解。标准解法、十二步全收集及指标需全部通过。

| 最少／全收集 | 状态／死局 | 随机30步（种子20261016，500次） | 标准解错觉／取舍 |
| --- | --- | --- | --- |
| 8／12 | 110／0 | 14.4% | 5／3 |

## 运动与角色净空

按[运动净空规范](../level-design.md#运动净空)检查折梁扫过北台、南台与灯塔时的间隙，覆盖短端和长端的合法乘坐站位；角色姿态、实体包络和采样边界统一遵循该规范。回归操作与截图要求见[制作步骤](../level-design.md#制作步骤)。

## 完整参考实现

```ts
import { defineLevel } from './builders'

export default defineLevel({
  id: 'level-04',
  title: '换乘',
  chapter: 2,
  revision: 3,
  soundtrack: 'courtyard',
  hints: ['浅色顶板是路面，金色转轮改变建筑'],
  build: (b) => {
    b.island({ x: [-1, 3], z: [1, 3], y: -1, depth: 2.5 })
    for (const x of [0, 1, 2]) b.path([x, 0, 2], 'terracotta')
    b.island({ x: [4, 9], z: [0, 8], y: -1, depth: 3.5 })
    b.column({ x: 8, z: 6, from: 2, to: 4 }, 'teal')
    for (const pos of [
      [6, 0, 5],
      [6, 0, 6],
      [7, 0, 6],
      [8, 0, 6],
    ] as const)
      b.solid([...pos], 'teal')
    b.rotator({
      id: 'ferry',
      pivot: [8, 4, 6],
      blocks: [
        { offset: [-1, 0, 0] },
        { offset: [1, 0, 0] },
        { offset: [3, 1, 1] },
        { offset: [1, -1, 0], kind: 'solid', color: 'teal' },
        { offset: [1, -1, 1], kind: 'solid', color: 'teal' },
        { offset: [2, -1, 1], kind: 'solid', color: 'teal' },
        { offset: [3, -1, 1], kind: 'solid', color: 'teal' },
        { offset: [3, 0, 1], kind: 'solid', color: 'teal' },
      ],
      handle: { block: [8, 0, 6], face: 'z' },
    })
    b.orb({ mechanism: 'ferry', block: 0 })
    b.solid([4, 0, 4], 'terracotta')
    b.path([4, 1, 4], 'terracotta')
    b.solid([5, 0, 1], 'terracotta')
    b.path([5, 1, 1], 'terracotta')
    b.orb({ tile: [5, 1, 1], optional: true })
    b.island({ x: [12, 14], z: [7, 9], y: 0, depth: 5 })
    b.column({ x: 13, z: 8, from: 1, to: 5 }, 'rose')
    b.path([13, 6, 8], 'rose')
    b.tree([-1, -1, 3])
    b.flower([7, -1, 8])
    b.window({ pos: [13, 3, 8], face: 'x' })
    b.start([0, 0, 2])
    b.goal([13, 6, 8])
  },
  solution: [
    { type: 'walk', to: [7, 4, 6] },
    { type: 'operate', mechanism: 'ferry' },
    { type: 'walk', to: [4, 1, 4] },
    { type: 'operate', mechanism: 'ferry' },
    { type: 'operate', mechanism: 'ferry' },
    { type: 'walk', to: [8, 4, 7] },
    { type: 'operate', mechanism: 'ferry' },
    { type: 'walk', to: [13, 6, 8] },
  ],
})
```
