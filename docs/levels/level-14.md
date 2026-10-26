# 第 14 关 · 相守

## 状态与教学

正式版本：第5章，revision 1，主线 **13步**／全收集 **15步**；关卡与声音已获用户试玩确认。

教学点：箱子既提供压力，又挡住巡逻退路；两种重量控制不同门。承接第十一、十二关的中途箱位、人箱分工和往返。

「原来如此」：**箱子卸到第一板后，既开门，又挡住巡逻；小生物留守另一板，才有稳定的远庭去返。**

衔接：比十三关多一层相互制约：运输箱子、卸箱位置与巡逻压力必须配合。两台运输取消次数限制，难度集中在双重压力和箱位，普通空送不再立即变成死局。 共同范围与当前状态见[章节衔接](README.md#章节衔接与恢复边界)。

## 屏幕草图

`(a,b)=(x-y,z-y)`；数字为高度。@起点、G灯笼、o必需、*选做、h按住板、t触发板、D关闭门、d初始开门、M活动路面、p普通路面。同格优先标光点；这是规则层初始路面快照，岛屿和结构不当道路。全部坐标及停靠位以下方完整实现为准。

```text
 b\a      2    3    4    5    6    7    8    9   10   11   12   13   14
   0      ·    ·    ·    ·    ·    ·    ·    ·    ·    ·   p1    ·    ·
   1      ·    ·   M1   M1   M1   M1    ·    ·    ·    ·   *2   h2   o2
   2     G0   @0   p2    ·    ·    ·    ·    ·    ·   D3   p3   p3   p3
   3      ·   o1    ·    ·    ·    ·    ·    ·    ·    ·   M4    ·    ·
   4      ·    ·    ·    ·    ·    ·    ·    ·    ·    ·    ·    ·    ·
   5      ·    ·    ·    ·    ·    ·    ·    ·    ·    ·    ·    ·    ·
   6      ·    ·    ·    ·    ·    ·    ·    ·    ·    ·    ·    ·    ·
   7      ·    ·    ·    ·    ·    ·    ·    ·    ·    ·    ·   D5   o5
```

## 积木清单与构图

保留两岸与后庭布局，使注意力集中到箱与巡逻分占两块板。 沿用暖色积木、浅色路面、青绿活动结构和固定镜头。完整实现逐项给出静态路面、柱体、岛屿、颜色、活动偏移和装饰；`p(a,b,y)`严格转换为`[a+y,y,b+y]`，不另补路或改高度。

## 机关清单

| ID         | 精确定义                                                                                                                                                                          |
| ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ferry      | mover；`{"origin":[5,1,2],"axis":"x","stops":[0,4],"blocks":[{"offset":[0,0,0]},{"offset":[1,0,0]},{"offset":[2,0,0]},{"offset":[3,0,0]}],"handle":{"block":[4,0,5],"face":"z"}}` |
| lift       | mover；`{"origin":[16,4,7],"axis":"z","stops":[0,4],"blocks":[{"offset":[0,0,0]}],"handle":{"block":[16,1,7],"face":"x"}}`                                                        |
| weight     | plate；`{"tile":[14,2,3],"target":"door","mode":"hold"}`                                                                                                                          |
| weight-far | plate；`{"tile":[15,2,3],"target":"far-door","mode":"hold"}`                                                                                                                      |
| door       | gate；`{"tile":[14,3,5],"mode":"hold"}`                                                                                                                                           |
| far-door   | gate；`{"tile":[18,5,12],"mode":"hold"}`                                                                                                                                          |

## 光点与其他元素

```json
{
  "orbs": [
    {
      "tile": [4, 1, 4]
    },
    {
      "tile": [16, 2, 3]
    },
    {
      "tile": [19, 5, 12]
    },
    {
      "tile": [14, 2, 3],
      "optional": true
    }
  ],
  "crates": [
    {
      "mechanism": "ferry",
      "block": 3
    }
  ],
  "patrols": [
    {
      "mode": "pingpong",
      "route": [
        {
          "tile": [14, 2, 3]
        },
        {
          "tile": [15, 2, 3]
        },
        {
          "tile": [16, 2, 3]
        }
      ]
    }
  ]
}
```

巡逻严格按固定路线随每个完成动作推进；路过普通触发板不触发，停住才触发。投影跨高度连接保留，不加入三维连通条件。

## 主线标准解法

以下为最优路线之一，不禁止其他合法顺序或自动经过中间格；逐步坐标均是当时的世界坐标。

| 步  | 动作               | 目的                       |
| --- | ------------------ | -------------------------- |
| 1   | 走到 `(4, 1, 4)`   | 取近庭光。                 |
| 2   | 走到 `(7, 1, 2)`   | 站到箱子后方。             |
| 3   | 操作 `ferry`       | 连人带箱赴远庭。           |
| 4   | 推 `crate-0` 一格  | 卸箱守第一板并挡巡逻回路。 |
| 5   | 走到 `(16, 4, 7)`  | 穿第一门，登远台。         |
| 6   | 操作 `lift`        | 乘到外庭。                 |
| 7   | 走到 `(19, 5, 12)` | 穿巡逻守住的第二门取光。   |
| 8   | 走到 `(16, 4, 11)` | 返回远台。                 |
| 9   | 操作 `lift`        | 回内庭。                   |
| 10  | 走到 `(16, 2, 3)`  | 取巡逻端点支路光。         |
| 11  | 走到 `(12, 1, 2)`  | 登回主运输台。             |
| 12  | 操作 `ferry`       | 独自返回近庭。             |
| 13  | 走到 `(2, 0, 2)`   | 点灯。                     |

## 选做、干扰与恢复

- 自己站在按住板上不能同时穿过对应门；需要箱和巡逻分工。主线基准保持两板压力完成远庭。
- 选做在卸箱位下方。基准先取远庭，再绕到南侧推箱向北，释放原位收光；允许利用门内占位或巡逻相位的其他合法顺序，不宣称提前移箱一律无解。
- ferry与lift均不限次；主线ferry两程。全部首步、两步合法前缀以及一次空台往返均仍有解。
- 后期推错箱位仍可能无解，使用现有提示／无限撤销，不暗中返还次数。

## 指标与验收

主线／全收集 **13／15**；可达状态 **10109**，死局 **6662**；60步固定随机500次（种子20261016）通过率0%；主线错觉／取舍 **14／3**。0%只表示固定样本没有通关，不等于数学概率为零。

第五章门槛保持：第十三关使用10步章首缓冲例外，其余12～24步；≥80状态、60步随机≤20%、错觉≥2、取舍≥2，主线状态≤30000、单次求解<2秒。不能用死局或步数代替发现深度。

当前难度目标：

```json
{
  "minActions": 13,
  "minActionsAll": 15,
  "reachableStatesMin": 80,
  "randomWin": {
    "steps": 60,
    "maxRate": 0.2
  },
  "illusionsMin": 2,
  "tradeoffsMin": 2
}
```

运动净空300组结构／3636组角色，每组181采样姿态，零采样问题；包含人物、箱、巡逻、门、岩层及差时长联动。它是离散检查，不是连续碰撞证明，也不把错觉行走改为三维碰撞。

全收集逐步解法在下方基准all中，必须用同一规则层验证。正式实现仍须默认与--runtime、全部四项检查、桌面1280×720主线及手机375×667低画质全收集、干扰恢复、旧存档保持与用户体验确认。

## 自动验证基准

```json
{
  "metrics": {
    "minActions": 13,
    "minActionsAll": 15,
    "reachableStates": 10109,
    "deadEndStates": 6662,
    "illusions": 14,
    "tradeoffs": 3,
    "randomSteps": 60,
    "randomRate": 0
  },
  "all": [
    {
      "type": "walk",
      "to": [4, 1, 4]
    },
    {
      "type": "walk",
      "to": [7, 1, 2]
    },
    {
      "type": "operate",
      "mechanism": "ferry"
    },
    {
      "type": "push",
      "crate": "crate-0"
    },
    {
      "type": "walk",
      "to": [16, 4, 7]
    },
    {
      "type": "operate",
      "mechanism": "lift"
    },
    {
      "type": "walk",
      "to": [19, 5, 12]
    },
    {
      "type": "walk",
      "to": [16, 4, 11]
    },
    {
      "type": "operate",
      "mechanism": "lift"
    },
    {
      "type": "walk",
      "to": [15, 3, 5]
    },
    {
      "type": "push",
      "crate": "crate-0"
    },
    {
      "type": "walk",
      "to": [16, 2, 3]
    },
    {
      "type": "walk",
      "to": [12, 1, 2]
    },
    {
      "type": "operate",
      "mechanism": "ferry"
    },
    {
      "type": "walk",
      "to": [2, 0, 2]
    }
  ],
  "clearance": {
    "structuralTransitions": 300,
    "characterTransitions": 3636,
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
  id: 'level-14',
  title: '相守',
  chapter: 5,
  revision: 1,
  soundtrack: 'courtyard',
  hints: [],
  solution: [
    { type: 'walk', to: [4, 1, 4] },
    { type: 'walk', to: [7, 1, 2] },
    { type: 'operate', mechanism: 'ferry' },
    { type: 'push', crate: 'crate-0' },
    { type: 'walk', to: [16, 4, 7] },
    { type: 'operate', mechanism: 'lift' },
    { type: 'walk', to: [19, 5, 12] },
    { type: 'walk', to: [16, 4, 11] },
    { type: 'operate', mechanism: 'lift' },
    { type: 'walk', to: [16, 2, 3] },
    { type: 'walk', to: [12, 1, 2] },
    { type: 'operate', mechanism: 'ferry' },
    { type: 'walk', to: [2, 0, 2] },
  ],
  build: (b) => {
    b.island({ x: [1, 6], z: [1, 5], y: -1, depth: 2 })
    b.island({ x: [9, 12], z: [1, 5], y: 0, depth: 2 })
    b.island({ x: [13, 16], z: [2, 7], y: 1, depth: 2 })
    b.island({ x: [17, 19], z: [11, 13], y: 4, depth: 3 })
    const paths: [number, number, number][] = [
      [2, 2, 0],
      [3, 2, 0],
      [4, 2, 2],
      [3, 3, 1],
      [12, 0, 1],
      [12, 1, 2],
      [13, 1, 2],
      [14, 1, 2],
      [11, 2, 3],
      [12, 2, 3],
      [13, 2, 3],
      [14, 2, 3],
      [13, 7, 5],
      [14, 7, 5],
    ]
    for (const [a, z, y] of paths) {
      b.path(p(a, z, y), 'rose')
      const floor = a >= 12 && z >= 7 ? 5 : a < 5 ? 0 : a + y >= 13 && z + y >= 2 ? 2 : 1
      for (let h = floor; h < y; h++) b.solid([a + y, h, z + y], 'rose')
    }
    b.solid([4, 0, 5], 'teal')
    b.mover({
      id: 'ferry',
      origin: p(4, 1, 1),
      axis: 'x',
      stops: [0, 4],
      blocks: [{ offset: [0, 0, 0] }, { offset: [1, 0, 0] }, { offset: [2, 0, 0] }, { offset: [3, 0, 0] }],
      handle: { block: [4, 0, 5], face: 'z' },
    })
    b.mover({
      id: 'lift',
      origin: p(12, 3, 4),
      axis: 'z',
      stops: [0, 4],
      blocks: [{ offset: [0, 0, 0] }],
      handle: { block: [16, 1, 7], face: 'x' },
    })
    b.crate({ mechanism: 'ferry', block: 3 })
    b.patrol({
      mode: 'pingpong',
      route: [{ tile: p(12, 1, 2) }, { tile: p(13, 1, 2) }, { tile: p(14, 1, 2) }],
    })
    b.plate({ id: 'weight', tile: p(12, 1, 2), target: 'door', mode: 'hold' })
    b.plate({
      id: 'weight-far',
      tile: p(13, 1, 2),
      target: 'far-door',
      mode: 'hold',
    })
    b.gate({ id: 'door', tile: p(11, 2, 3), mode: 'hold' })
    b.gate({ id: 'far-door', tile: p(13, 7, 5), mode: 'hold' })
    b.orb({ tile: p(3, 3, 1) })
    b.orb({ tile: p(14, 1, 2) })
    b.orb({ tile: p(14, 7, 5) })
    b.orb({ tile: p(12, 1, 2), optional: true })
    b.tree([1, -1, 5])
    b.flower([6, -1, 5])
    b.window({ pos: [14, 1, 3], face: 'x' })
    b.lamp([19, 4, 13])
    b.lamp([15, 1, 7])
    b.start(p(3, 2, 0))
    b.goal(p(2, 2, 0))
  },
})
```
