# 第 4 关 · 换乘

## 状态、来源与范围

T6.12s 已按本稿实现。运行中的第四关为「换乘」、revision 3，谜题来自基线旧第五关。

## 教学点与原来如此

第二章起点，玩家已经会乘坐单平台。本关教 **同一平台不能带人去所有地方，静态落脚点可以成为换船站**。短臂取光，离桥站在南台，等长臂转来，再登船去高台。选做北台则提供另一条完成换乘的路线。

## 屏幕草图与清单

`(a,b)=(x-y,z-y)`；转盘实心轴 `(4,2)`，高度 2。

```text
入口末端 (2,2)@0    南台 (3,3)@1    北台 (4,0)@1，选做光点
短臂 (3,2)→(4,3)→(5,2)→(4,1)，高度2，必需光点
长臂登船位 (5,2)→(4,1)→(3,2)→(4,3)，高度2
长臂高台 (6,2)→(4,-2)→(0,0)→(2,4)，高度3
灯笼塔 (7,2)@5
```

- 三基座分别承接入口、转盘与南北落脚、灯笼塔，完整范围、深度和垫块见参考实现。
- `ferry` 中心 `(6,2,4)`、初始档 0、无限次、无联动；把手 `(8,0,6)` 的 z 面。
- 路面偏移：#0 `(-1,0,0)`，#1 `(1,0,0)`，#2 `(3,1,1)`。#3～7 为实心折梁；不能改 kind。
- 入口 `(0,0,2)`，南台 `(4,1,4)`，北台 `(5,1,1)`，终点 `(12,5,7)`。必需光点在 ferry#0，选做光点在北台。
- 无箱子、门、压板、单向格或巡逻者；树、花、窗均保留来源坐标。

## 主线标准解法

| 步 | 动作 |
| --- | --- |
| 1 | 走到 `(5,2,4)`，登短臂取必需光点 |
| 2 | ferry 一次，随短臂到南侧 |
| 3 | 走到 `(4,1,4)`，离桥留在静态南台 |
| 4～5 | ferry 两次，让长臂登船位来到南侧 |
| 6 | 走到 `(6,2,5)`，登 ferry#1 |
| 7 | ferry 一次，随长臂到东侧 |
| 8 | 经 ferry#2 高台走到 `(12,5,7)` 点灯 |

## 全收集标准解法

| 步 | 动作 |
| --- | --- |
| 1 | 走到 `(5,2,4)` |
| 2～4 | ferry 三次 |
| 5 | 走到 `(5,1,1)`，收选做光点并留在北台 |
| 6～7 | ferry 两次 |
| 8 | 走到 `(6,2,3)`，登 ferry#1 |
| 9～11 | ferry 三次 |
| 12 | 走到 `(12,5,7)` 点灯 |

## 干扰与反事实

只坐短臂绕圈，无法跨过中心与空隙到高台；中心和折梁无顶板。南台和北台转错档可以继续转回或撤销，无死局。北台选做不是主线之后重复一整圈，而是另一处换乘站。将 ferry 的 blocks[1].kind 改为 solid 后应无解；该变换只在反事实测试副本进行，不改变正式参考实现。

## 指标与难度目标

目标版已重新校验主线与全收集，随机种子 20261016、500 次、30 步。

| 最少 / 全收集 | 状态 / 死局 | 随机通关率 | 错觉 / 取舍 |
| --- | --- | --- | --- |
| 8 / 12 | 110 / 0 | 14.4% | 5 / 3 |

```ts
'level-04': { minActions: 8, minActionsAll: 12, reachableStatesMin: 16, randomWin: { steps: 30, maxRate: 0.6 }, illusionsMin: 1, tradeoffsMin: 1 },
```

## 实现验收

只让旧第四关评价失效，不把旧第五关的进度按名称搬来。第一章与第二章切换沿用现有三秒淡化，本关为 chapter 2 的 courtyard 声景，不重写音频。迁移旧「乘风」的南台主线、北台选做、乘坐和撤销测试到 mainLevels[3] 及 level-04 目标；旧 level-05 的测试在 T6.12t 前保留。替换旧第四关下层乘台专属用例，不能把核心乘坐规则测试删掉。

手机实玩 12 步全收集，检查两种桥臂、南北落脚、高台与灯笼可辨，把手无遮挡。正式三项评价仍按 8 步主线计算，12 步全收集不承诺同次得到最少步数评价。四项检查通过后勾选 T6.12s，更新本稿状态。

## 参考实现

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
    b.column({ x: 6, z: 4, from: 0, to: 2 }, 'teal')
    for (const pos of [
      [6, 0, 5],
      [6, 0, 6],
      [7, 0, 6],
      [8, 0, 6],
    ] as const)
      b.solid([...pos], 'teal')
    b.rotator({
      id: 'ferry',
      pivot: [6, 2, 4],
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
    b.island({ x: [11, 13], z: [6, 8], y: -1, depth: 5 })
    b.column({ x: 12, z: 7, from: 0, to: 4 }, 'rose')
    b.path([12, 5, 7], 'rose')
    b.tree([-1, -1, 3])
    b.flower([7, -1, 8])
    b.window({ pos: [12, 2, 7], face: 'x' })
    b.start([0, 0, 2])
    b.goal([12, 5, 7])
  },
  solution: [
    { type: 'walk', to: [5, 2, 4] },
    { type: 'operate', mechanism: 'ferry' },
    { type: 'walk', to: [4, 1, 4] },
    { type: 'operate', mechanism: 'ferry' },
    { type: 'operate', mechanism: 'ferry' },
    { type: 'walk', to: [6, 2, 5] },
    { type: 'operate', mechanism: 'ferry' },
    { type: 'walk', to: [12, 5, 7] },
  ],
})
```
