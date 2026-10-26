# 第 4 关 · 换乘

## 状态与目标

正式版本，关卡与声音已获用户试玩确认。关卡 id 为 level-04，revision 3，第二章，courtyard 声景。**短桥送到中转站，人下桥后再换到长臂去灯塔。** 主线 8 步、全收集 12 步。

## 布局与调整

转盘轴由 `(6,2,4)` 沿视线平移到 `(8,4,6)`，静态轴柱同步平移两格；三个路面与折梁的相对偏移不变，把手仍在 `(8,0,6)` z 面。终点岛、柱、路面与窗沿视线平移一格，灯笼成为 `(13,6,8)`。这些平移均为 `(k,k,k)`，屏幕投影、路面连接和显露关系保持，实际纵深让出北台、南台与灯塔的扫掠空间。地面装饰链不随轴平移。

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

净空检查只验证实体运动，不增加三维行走碰撞或改变投影规则。当前revision与历史评价保持，模型和采样边界见[运动净空](../motion-clearance.md)。

机关运动时角色在 0.12 秒内轻微收身到原高度的 94%，足底不动，到位后恢复；正常站立与呼吸不变，剪影跟随同一姿态。此姿态最多让出帽尖附近 0.06 格，不能掩盖身体与建筑相撞。净空检测同时检查收身开始、运动中、到位恢复站立，不能从第一帧就假定角色已收身。具体检测尺寸、轴承例外与采样限制见 [运动净空](../motion-clearance.md)。

验收须包括所有可达机关组合、合法站位的运动采样、主线和全收集、错误操作后的恢复、乘坐及撤销，以及桌面／手机实际点击和中间帧截图。维护时保持规则、targets、音频与存档行为；当前用户试玩确认已完成。

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
