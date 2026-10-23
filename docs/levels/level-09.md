# 第 9 关 · 牵引

## 状态与教学

**T6.14a 难度衔接修订，第三稿，2026-10-23。** 本稿替代本关T6.13a第二稿；仅设计和隔离原型已验证，正式运行仍为revision 1。本稿目标revision **2**，由T6.14c实施，不能把文档完成当成正式开发完成。主线 **13步**，全收集 **14步**。选关主题短句：**召来远台，再恢复归路**。

教学点：触发压板、上下两处必需庭院、互斥门及回程状态恢复。

「原来如此」：**主线既要低庭的光，也要高庭的光；召高台会关归门，取光后必须再次召低台恢复归路。**

承接第五关升降、第六关返程、第八关间接操作。本关保持单框压板首次出现，主线从一次召台扩展为低台取光、北庭召高台、恢复低台三次有目的的调用；增加的是目标之间的状态依赖。

共同合同见[第三、四章交接](chapter-3-4.md)。不改固定相机、投影连通、遮挡与乘坐规则；沿用当前音乐、首次能力教学与简洁完成卡。hints为空，不恢复常驻解法说明。

## 屏幕草图

屏幕`(a,b)=(x-y,z-y)`，为初始状态。`@`起点、`G`灯笼、`o`必需、`*`选做、`C`箱、`p`普通路面、`t`触发压板、`h`按住压板、`D`关闭门、`d`初始开门、`>`沿+a进入、`v`沿+b进入、`#`静轴；字母加编号为活动路面，冒号后是高度。机关代号见下方清单，支撑不当道路。

```text
 b\a       -1      0      1      2      3      4      5
  -2        ·      ·      ·     G0      ·      ·      ·
  -1        ·      ·     t0     D0     d5     o6      ·
   0        ·      ·     p0      ·   U0:6      ·      ·
   1        ·      ·      ·      ·      ·      ·      ·
   2       @0   W0:1      ·     #1      ·      ·      ·
   3        ·      ·      ·      ·      ·      ·     o5
   4        ·      ·      ·      ·      ·      ·      ·
   5        ·      ·      ·     t2     D2     *3      ·
   6        ·      ·      ·     o2      ·      ·      ·
```

## 机关、结构与站位

swing仍是独立手动转盘。receiver仍为无把手y轴两站台，初始上站；南、北两处trigger都驱动receiver。receiver.links切换door、garden-door和新增south-door。初始高台：归门关、高庭门开、南选做门关；低台：归门开、高庭门关、南选做门开。

原高庭(10,6,5)光点改为必需。新增南选做门(5,2,7)、选做光点(7,3,8)，为与必需南庭分开的支路；中部岛屿扩展至x=7支撑侧翼。三处必需、一处选做，总数4。

所有静态路面、支柱、岛屿范围、颜色、机关偏移、把手面与次数、光点、箭头和装饰在完整参考实现中逐项给出，这是实现的唯一数据依据。不得自行加路、添把手或改targets来修正谜题。没有巡逻者、外部资源或ending。

## 光点、干扰与恢复

- `orb-0`：`(4,2,8)`，必需。
- `orb-1`：`(10,5,8)`，必需。
- `orb-2`：`(10,6,5)`，必需。
- `orb-3`：`(7,3,8)`，选做。

经过南压板不召台，停住才召台。到高庭后若直接回灯笼，归门仍关着，需再次停北压板；重复调用可恢复，零死局。可以绕回南压板完成更长的合法替代路线，不禁止它来强迫北庭操作。

选做门在低台状态开启。须先停压板，再单独去南侧支路；去选做不会自动经过南庭必需光，完整收集需要照顾两个目的地。

点灯回应保留：终点之外3盏庭院灯；第九、十二关2.2秒后出现简洁完成卡，减少动态效果0.2秒。声音维持T6.14当前实现，新章试听状态仍单独等待用户确认。

## 主线标准解法

一次行走允许自动经过中间路面。下表是经验证的最优解，不排斥同样合法的其他最优路线，不强迫逐格点击。

| 步  | 动作            | 理由                                         |
| --- | --------------- | -------------------------------------------- |
| 1   | 走到 `(1,1,3)`  | 登手动桥。                                   |
| 2   | 操作 `swing`    | 乘桥接南庭。                                 |
| 3   | 走到 `(4,2,7)`  | 在单框上停住，召低台；归门和南侧选做门打开。 |
| 4   | 走到 `(4,2,8)`  | 取南庭必需光；允许先取光再回压板，同为最优。 |
| 5   | 走到 `(3,1,5)`  | 回手动桥。                                   |
| 6   | 操作 `swing`    | 乘桥接低台接口。                             |
| 7   | 走到 `(10,5,8)` | 经低台取第二处必需光。                       |
| 8   | 走到 `(5,1,3)`  | 返回手动桥。                                 |
| 9   | 操作 `swing`    | 乘桥接北庭。                                 |
| 10  | 走到 `(1,0,-1)` | 停北压板召高台，关闭归门并打开高庭门。       |
| 11  | 走到 `(10,6,5)` | 进入高庭，取得第三处必需光。                 |
| 12  | 走到 `(1,0,-1)` | 回北压板停住，恢复低台与归门。               |
| 13  | 走到 `(2,0,-2)` | 穿归门点灯。                                 |

## 全收集标准解法

按下方自动验证基准的`all`数组执行，共14步；每一步坐标都是当时的世界坐标。主线与全收集评价仍可分两局累计，不要求界面增加解释长文。

## 指标与验收

| 主线／全收集 | 状态／死局 | 随机40步（500次，种子20261016） | 主线错觉／取舍 |
| ------------ | ---------- | ------------------------------- | -------------- |
| 13／14       | 1184／0    | 0.0%                            | 16／3          |

章节门槛保持：第三章7～16步、≥40状态、40步随机≤35%；第四章10～20步、≥60状态、50步随机≤25%，错觉≥2、取舍≥1。没有放宽门槛；0%是固定样本零次通过。指标是技术保底，不能单凭步数、状态或死局数宣称体验更难。

运动净空覆盖16组结构转移、100组角色转移，每组181个姿态，包含人物、顶板、岩层、其他底盘、同步联动、运载箱与门包络。零采样相交不构成连续碰撞证明，也不改变错觉连接；未把行走／推箱做成三维碰撞规则。

正式实现须通过默认设计检查、对应关卡全部校验、行为与存档回归；第八至十二关全部接入后再通过`node docs/levels/check-designs.mjs --runtime`。桌面与手机实际点击主线／全收集及干扰，核对关键顶板、把手、箱子、灯笼可见可点；手机尺寸模拟不是真机。详细接线、截图和用户体验门槛见共同交接。

## 自动验证基准

```json
{
  "metrics": {
    "minActions": 13,
    "minActionsAll": 14,
    "reachableStates": 1184,
    "deadEndStates": 0,
    "illusions": 16,
    "tradeoffs": 3,
    "randomSteps": 40,
    "randomRate": 0
  },
  "all": [
    {
      "type": "walk",
      "to": [1, 1, 3]
    },
    {
      "type": "operate",
      "mechanism": "swing"
    },
    {
      "type": "walk",
      "to": [4, 2, 7]
    },
    {
      "type": "walk",
      "to": [4, 2, 8]
    },
    {
      "type": "walk",
      "to": [7, 3, 8]
    },
    {
      "type": "walk",
      "to": [3, 1, 5]
    },
    {
      "type": "operate",
      "mechanism": "swing"
    },
    {
      "type": "walk",
      "to": [10, 5, 8]
    },
    {
      "type": "walk",
      "to": [5, 1, 3]
    },
    {
      "type": "operate",
      "mechanism": "swing"
    },
    {
      "type": "walk",
      "to": [1, 0, -1]
    },
    {
      "type": "walk",
      "to": [10, 6, 5]
    },
    {
      "type": "walk",
      "to": [1, 0, -1]
    },
    {
      "type": "walk",
      "to": [2, 0, -2]
    }
  ],
  "clearance": {
    "structuralTransitions": 16,
    "characterTransitions": 100,
    "samples": 181,
    "issues": []
  }
}
```

## 完整参考实现

```ts
import { defineLevel } from './builders'

export default defineLevel({
  id: 'level-09',
  title: '牵引',
  chapter: 3,
  revision: 2,
  soundtrack: 'courtyard',
  hints: [],
  build: (b) => {
    b.island({ x: [-2, 0], z: [1, 3], y: -1, depth: 2 })
    b.island({ x: [1, 7], z: [-2, 8], y: -1, depth: 3 })
    b.island({ x: [8, 12], z: [3, 9], y: 2, depth: 3 })
    b.path([-1, 0, 2], 'terracotta')
    b.path([4, 2, 7], 'rose')
    b.path([4, 2, 8], 'rose')
    b.path([2, 0, -1], 'terracotta')
    b.path([2, 0, -2], 'terracotta')
    b.path([1, 0, -1], 'terracotta')
    b.path([1, 0, 0], 'terracotta')
    b.path([10, 5, 8], 'rose')
    b.path([8, 5, 4], 'rose')
    b.path([10, 6, 5], 'rose')
    b.solid([3, 0, 3], 'teal')
    b.solid([3, 1, 3], 'teal')
    b.solid([2, 0, 8], 'teal')
    b.solid([4, 0, 7], 'rose')
    b.solid([4, 1, 7], 'rose')
    b.solid([4, 0, 8], 'rose')
    b.solid([4, 1, 8], 'rose')
    b.solid([10, 3, 8], 'rose')
    b.solid([10, 4, 8], 'rose')
    b.solid([8, 3, 4], 'rose')
    b.solid([8, 4, 4], 'rose')
    b.solid([10, 3, 5], 'rose')
    b.solid([10, 4, 5], 'rose')
    b.solid([10, 5, 5], 'rose')
    b.path([5, 2, 7], 'rose')
    b.solid([5, 0, 7], 'rose')
    b.solid([5, 1, 7], 'rose')
    b.path([7, 3, 8], 'rose')
    b.solid([7, 0, 8], 'rose')
    b.solid([7, 1, 8], 'rose')
    b.solid([7, 2, 8], 'rose')
    b.rotator({
      id: 'swing',
      pivot: [3, 1, 3],
      blocks: [
        { offset: [-2, 0, 0] },
        { offset: [-1, 0, 0], kind: 'solid', color: 'teal' },
        { offset: [-2, -1, 0], kind: 'solid', color: 'teal' },
        { offset: [-1, -1, 0], kind: 'solid', color: 'teal' },
      ],
      handle: { block: [2, 0, 8], face: 'z' },
    })
    b.plate({ id: 'call-south', tile: [4, 2, 7], target: 'receiver' })
    b.gate({ id: 'door', tile: [2, 0, -1], mode: 'toggle' })
    b.plate({ id: 'call-north', tile: [1, 0, -1], target: 'receiver' })
    b.mover({
      id: 'receiver',
      origin: [9, 4, 6],
      axis: 'y',
      stops: [0, 2],
      initialStop: 1,
      blocks: [{ offset: [0, 0, 0] }, { offset: [0, -1, 0], kind: 'solid', color: 'teal' }],
      links: [{ target: 'door' }, { target: 'garden-door' }, { target: 'south-door' }],
    })
    b.gate({ id: 'garden-door', tile: [8, 5, 4], mode: 'toggle', initiallyOpen: true })
    b.gate({ id: 'south-door', tile: [5, 2, 7], mode: 'toggle' })
    b.orb({ tile: [4, 2, 8] })
    b.orb({ tile: [10, 5, 8] })
    b.orb({ tile: [10, 6, 5], optional: false })
    b.orb({ tile: [7, 3, 8], optional: true })
    b.tree([-2, -1, 3])
    b.flower([6, -1, 8])
    b.window({ pos: [10, 4, 5], face: 'x' })
    b.lamp([4, -1, -2])
    b.lamp([6, -1, 0])
    b.lamp([8, 2, 8])
    b.start([-1, 0, 2])
    b.goal([2, 0, -2])
  },
  solution: [
    { type: 'walk', to: [1, 1, 3] },
    { type: 'operate', mechanism: 'swing' },
    { type: 'walk', to: [4, 2, 7] },
    { type: 'walk', to: [4, 2, 8] },
    { type: 'walk', to: [3, 1, 5] },
    { type: 'operate', mechanism: 'swing' },
    { type: 'walk', to: [10, 5, 8] },
    { type: 'walk', to: [5, 1, 3] },
    { type: 'operate', mechanism: 'swing' },
    { type: 'walk', to: [1, 0, -1] },
    { type: 'walk', to: [10, 6, 5] },
    { type: 'walk', to: [1, 0, -1] },
    { type: 'walk', to: [2, 0, -2] },
  ],
})
```
