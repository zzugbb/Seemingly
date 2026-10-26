# 第 13 关 · 留步

## 状态与教学

正式版本：第5章，revision 1，主线 **10步**／全收集 **14步**；关卡与声音已获用户试玩确认。

教学点：巡逻随动作推进，断路会留驻；选做再学习玩家占位与空台可以改变它的停靠位置。承接乘坐、离台、换乘和返程。

「原来如此」：**主线把台移走，让巡逻留在开门板；选做先让出侧位，再送走空台，让它改守另一块板。**

衔接：第十二关的静态重量换成动态重量。保留章首缓冲和两台换乘，不重新教授行走；选做必须改变巡逻所在压板，不能在原主线末尾直接绕去收光。 共同范围与当前状态见[章节衔接](README.md#章节衔接与恢复边界)。

## 屏幕草图

`(a,b)=(x-y,z-y)`；数字为高度。@起点、G灯笼、o必需、*选做、h按住板、t触发板、D关闭门、d初始开门、M活动路面、p普通路面。同格优先标光点；这是规则层初始路面快照，岛屿和结构不当道路。全部坐标及停靠位以下方完整实现为准。

```text
 b\a      0    1    2    3    4    5    6    7    8    9   10
  -2      ·    ·    ·    ·    ·    ·   o2   p2    ·    ·    ·
  -1      ·    ·    ·    ·    ·    ·    ·    ·    ·    ·    ·
   0      ·    ·    ·    ·    ·    ·    ·    ·    ·    ·    ·
   1     *0   D0   p0   h0   M1   h2    ·    ·    ·   D2   o2
   2      ·    ·   p0   @0   p2   p2    ·    ·    ·    ·   M3
   3      ·    ·   G0    ·    ·    ·    ·    ·    ·    ·    ·
```

## 积木清单与构图

三个高度的庭院与升降台；近庭新增一格侧廊，既供让路，也避免角色被巡逻困在尽头。 沿用暖色积木、浅色路面、青绿活动结构和固定镜头。完整实现逐项给出静态路面、柱体、岛屿、颜色、活动偏移和装饰；`p(a,b,y)`严格转换为`[a+y,y,b+y]`，不另补路或改高度。

## 机关清单

| ID           | 精确定义                                                                                                                   |
| ------------ | -------------------------------------------------------------------------------------------------------------------------- |
| ferry        | mover；`{"origin":[5,1,2],"axis":"x","stops":[0,4],"blocks":[{"offset":[0,0,0]}],"handle":{"block":[4,0,3],"face":"z"}}`   |
| lift         | mover；`{"origin":[13,3,5],"axis":"y","stops":[0,3],"blocks":[{"offset":[0,0,0]}],"handle":{"block":[14,1,6],"face":"z"}}` |
| weight       | plate；`{"tile":[3,0,1],"mode":"hold","target":"door"}`                                                                    |
| door         | gate；`{"tile":[11,2,3],"mode":"hold"}`                                                                                    |
| bonus-weight | plate；`{"tile":[7,2,3],"mode":"hold","target":"bonus-door"}`                                                              |
| bonus-door   | gate；`{"tile":[1,0,1],"mode":"hold"}`                                                                                     |

## 光点与其他元素

```json
{
  "orbs": [
    {
      "tile": [12, 2, 3]
    },
    {
      "tile": [8, 2, 0]
    },
    {
      "tile": [0, 0, 1],
      "optional": true
    }
  ],
  "crates": [],
  "patrols": [
    {
      "mode": "pingpong",
      "route": [
        {
          "tile": [2, 0, 1]
        },
        {
          "tile": [3, 0, 1]
        },
        {
          "mechanism": "ferry",
          "block": 0
        },
        {
          "tile": [7, 2, 3]
        }
      ]
    }
  ]
}
```

巡逻严格按固定路线随每个完成动作推进；路过普通触发板不触发，停住才触发。投影跨高度连接保留，不加入三维连通条件。

## 主线标准解法

以下为最优路线之一，不禁止其他合法顺序或自动经过中间格；逐步坐标均是当时的世界坐标。

| 步  | 动作              | 目的                     |
| --- | ----------------- | ------------------------ |
| 1   | 走到 `(5, 1, 2)`  | 登台，使巡逻前进到主板。 |
| 2   | 操作 `ferry`      | 乘台去远庭，主板留驻。   |
| 3   | 走到 `(13, 3, 5)` | 穿门收光，再登升降台。   |
| 4   | 操作 `lift`       | 乘到上方支路。           |
| 5   | 走到 `(8, 2, 0)`  | 离台取北侧光。           |
| 6   | 走到 `(13, 6, 5)` | 回台准备返程。           |
| 7   | 操作 `lift`       | 恢复下层停靠。           |
| 8   | 走到 `(9, 1, 2)`  | 穿门登回运输台。         |
| 9   | 操作 `ferry`      | 返回近庭。               |
| 10  | 走到 `(2, 0, 3)`  | 回庭院点灯。             |

## 选做、干扰与恢复

- 等现实时间不会推进巡逻，整段行走也只推进一次。门是否保持打开取决于当下哪块板有重量。
- 选做在另一扇门后，主线留驻状态不能直接取得。先登上侧位让巡逻登台，再沿侧廊让出位置，巡逻走上bonus-weight后移开空台。
- 无限操作、零死局。空送、带走巡逻、选做先做／后做均可恢复；侧廊允许在巡逻堵住台时离开侧位。
- 选做基准在主线返回近岸后完成，不强迫该顺序；主线与全收集分别保留自动寻路。

## 指标与验收

主线／全收集 **10／14**；可达状态 **2390**，死局 **0**；60步固定随机500次（种子20261016）通过率0%；主线错觉／取舍 **10／4**。0%只表示固定样本没有通关，不等于数学概率为零。

第五章门槛保持：第十三关使用10步章首缓冲例外，其余12～24步；≥80状态、60步随机≤20%、错觉≥2、取舍≥2，主线状态≤30000、单次求解<2秒。不能用死局或步数代替发现深度。

当前难度目标：

```json
{
  "minActions": 10,
  "minActionsAll": 14,
  "reachableStatesMin": 80,
  "randomWin": {
    "steps": 60,
    "maxRate": 0.2
  },
  "illusionsMin": 2,
  "tradeoffsMin": 2
}
```

运动净空72组结构／1240组角色，每组181采样姿态，零采样问题；包含人物、箱、巡逻、门、岩层及差时长联动。它是离散检查，不是连续碰撞证明，也不把错觉行走改为三维碰撞。

全收集逐步解法在下方基准all中，必须用同一规则层验证。正式实现仍须默认与--runtime、全部四项检查、桌面1280×720主线及手机375×667低画质全收集、干扰恢复、旧存档保持与用户体验确认。

## 自动验证基准

```json
{
  "metrics": {
    "minActions": 10,
    "minActionsAll": 14,
    "reachableStates": 2390,
    "deadEndStates": 0,
    "illusions": 10,
    "tradeoffs": 4,
    "randomSteps": 60,
    "randomRate": 0
  },
  "all": [
    {
      "type": "walk",
      "to": [5, 1, 2]
    },
    {
      "type": "operate",
      "mechanism": "ferry"
    },
    {
      "type": "walk",
      "to": [13, 3, 5]
    },
    {
      "type": "operate",
      "mechanism": "lift"
    },
    {
      "type": "walk",
      "to": [8, 2, 0]
    },
    {
      "type": "walk",
      "to": [13, 6, 5]
    },
    {
      "type": "operate",
      "mechanism": "lift"
    },
    {
      "type": "walk",
      "to": [9, 1, 2]
    },
    {
      "type": "operate",
      "mechanism": "ferry"
    },
    {
      "type": "walk",
      "to": [7, 2, 3]
    },
    {
      "type": "walk",
      "to": [7, 2, 4]
    },
    {
      "type": "operate",
      "mechanism": "ferry"
    },
    {
      "type": "walk",
      "to": [0, 0, 1]
    },
    {
      "type": "walk",
      "to": [2, 0, 3]
    }
  ],
  "clearance": {
    "structuralTransitions": 72,
    "characterTransitions": 1240,
    "samples": 181,
    "issues": []
  }
}
```

## 完整参考实现

```ts
import { defineLevel } from './builders'
import type { Vec3 } from './types'
const p = (a: number, b: number, y: number): Vec3 => [a + y, y, b + y]
export default defineLevel({
  id: 'level-13',
  title: '留步',
  chapter: 5,
  revision: 1,
  soundtrack: 'courtyard',
  hints: [],
  solution: [
    { type: 'walk', to: [5, 1, 2] },
    { type: 'operate', mechanism: 'ferry' },
    { type: 'walk', to: [13, 3, 5] },
    { type: 'operate', mechanism: 'lift' },
    { type: 'walk', to: [8, 2, 0] },
    { type: 'walk', to: [13, 6, 5] },
    { type: 'operate', mechanism: 'lift' },
    { type: 'walk', to: [9, 1, 2] },
    { type: 'operate', mechanism: 'ferry' },
    { type: 'walk', to: [2, 0, 3] },
  ],
  build: (b) => {
    b.island({ x: [-1, 7], z: [0, 4], y: -1, depth: 2 })
    b.island({ x: [11, 14], z: [1, 6], y: 0, depth: 3 })
    b.island({ x: [8, 10], z: [-1, 1], y: 0, depth: 2 })
    const paths: [number, number, number][] = [
      [0, 1, 0],
      [1, 1, 0],
      [5, 1, 2],
      [5, 2, 2],
      [2, 3, 0],
      [2, 1, 0],
      [2, 2, 0],
      [3, 1, 0],
      [3, 2, 0],
      [4, 2, 2],
      [9, 1, 2],
      [10, 1, 2],
      [7, -2, 2],
      [6, -2, 2],
    ]
    for (const [a, z, y] of paths) {
      b.path(p(a, z, y), 'rose')
      if (y > 0) b.column({ x: a + y, z: z + y, from: 1, to: y - 1 }, 'rose')
    }
    b.solid([6, 0, 4], 'rose')
    b.solid([4, 0, 3], 'teal')
    b.solid([14, 1, 6], 'teal')
    b.mover({
      id: 'ferry',
      origin: p(4, 1, 1),
      axis: 'x',
      stops: [0, 4],
      blocks: [{ offset: [0, 0, 0] }],
      handle: { block: [4, 0, 3], face: 'z' },
    })
    b.mover({
      id: 'lift',
      origin: p(10, 2, 3),
      axis: 'y',
      stops: [0, 3],
      blocks: [{ offset: [0, 0, 0] }],
      handle: { block: [14, 1, 6], face: 'z' },
    })
    b.patrol({
      mode: 'pingpong',
      route: [{ tile: p(2, 1, 0) }, { tile: p(3, 1, 0) }, { mechanism: 'ferry', block: 0 }, { tile: p(5, 1, 2) }],
    })
    b.plate({ id: 'weight', tile: p(3, 1, 0), mode: 'hold', target: 'door' })
    b.gate({ id: 'door', tile: p(9, 1, 2), mode: 'hold' })
    b.orb({ tile: p(10, 1, 2) })
    b.orb({ tile: p(6, -2, 2) })
    b.plate({ id: 'bonus-weight', tile: p(5, 1, 2), mode: 'hold', target: 'bonus-door' })
    b.gate({ id: 'bonus-door', tile: p(1, 1, 0), mode: 'hold' })
    b.orb({ tile: p(0, 1, 0), optional: true })
    b.tree([0, -1, 3])
    b.flower([5, -1, 3])
    b.lamp([11, 0, 6])
    b.window({ pos: [11, 1, 3], face: 'x' })
    b.start(p(3, 2, 0))
    b.goal(p(2, 3, 0))
  },
})
```
