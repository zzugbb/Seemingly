# 第 10 关 · 推动

## 状态与教学

**T6.14a 难度衔接修订，第三稿，2026-10-23。** 本稿替代本关T6.13a第二稿；仅设计和隔离原型已验证，正式运行仍为revision 1。本稿目标revision **2**，由T6.14d实施，不能把文档完成当成正式开发完成。主线 **12步**，全收集 **13步**。选关主题短句：**把箱留下，人再回来**。

教学点：推箱和按住压板首次出现，并组合已学乘坐、返程和再次换乘。

「原来如此」：**箱子留在远岸压板上，打开的却是近岸庭院的门；先独自回去取光，再乘空出的运输台走向出口。**

第九关证明单框触发后效果保留，本关对比双框必须持续压住。推箱入门仍只有一条清楚的装载方向；难度承接放在远岸重量、近岸取光和最后换乘的三地关系。

共同合同见[第三、四章交接](chapter-3-4.md)。不改固定相机、投影连通、遮挡与乘坐规则；沿用当前音乐、首次能力教学与简洁完成卡。hints为空，不恢复常驻解法说明。

## 屏幕草图

屏幕`(a,b)=(x-y,z-y)`，为初始状态。`@`起点、`G`灯笼、`o`必需、`*`选做、`C`箱、`p`普通路面、`t`触发压板、`h`按住压板、`D`关闭门、`d`初始开门、`>`沿+a进入、`v`沿+b进入、`#`静轴；字母加编号为活动路面，冒号后是高度。机关代号见下方清单，支撑不当道路。

```text
 b\a        0      1      2      3      4      5      6      7
   0        ·     o0      ·      ·     *1      ·      ·      ·
   1        ·     D0   F2:1      ·      ·      ·      ·      ·
   2       p0     C0   F0:1   F1:1      ·      ·     h2      ·
   3       o0     @0      ·      ·      ·     p2      ·      ·
   4        ·      ·      ·      ·      ·     p2      ·      ·
   5        ·      ·      ·      ·      ·     o2   E0:4     #4
   6        ·      ·      ·      ·      ·      ·      ·      ·
   7        ·      ·      ·      ·      ·      ·      ·     G5
```

## 机关、结构与站位

freight仍为x轴两站[0,2]、三块可走台面，不限次；finish及全部运输几何保持。weight仍在(8,2,4)，但其hold门door从远岸(7,2,6)移到近岸(1,0,1)。原远岸门格变回普通道路。新增近庭必需光(1,0,0)，入口岛屿z范围扩展为[-1,4]。

共三处必需、一处选做。主线freight三次分别承担人箱去程、人独自回近庭、人再次赴远岸，非空台凑往返；不新增联动、单向或次数规则。

所有静态路面、支柱、岛屿范围、颜色、机关偏移、把手面与次数、光点、箭头和装饰在完整参考实现中逐项给出，这是实现的唯一数据依据。不得自行加路、添把手或改targets来修正谜题。没有巡逻者、外部资源或ending。

## 光点、干扰与恢复

- `orb-0`：`(0,0,3)`，必需。
- `orb-1`：`(7,2,7)`，必需。
- `orb-2`：`(5,1,1)`，选做。
- `orb-3`：`(1,0,0)`，必需。

自己站到weight时虽会开门，离开就关，不能自行压着自己过门。箱子只装到后端就送台，需要找回重装；不限次、零死局。过早到灯笼会缺近庭光。

选做仍在(5,1,1)，可在远岸停靠期间从后翼探入，允许第一次或第二次到岸时取，不强迫额外往返。这一关的主要进阶已经在主线中。

点灯回应保留：终点之外1盏庭院灯；第九、十二关2.2秒后出现简洁完成卡，减少动态效果0.2秒。声音维持T6.14当前实现，新章试听状态仍单独等待用户确认。

## 主线标准解法

一次行走允许自动经过中间路面。下表是经验证的最优解，不排斥同样合法的其他最优路线，不强迫逐格点击。

| 步  | 动作              | 理由                               |
| --- | ----------------- | ---------------------------------- |
| 1   | 走到 `(0,0,2)`    | 绕到箱后，沿途收入口光点。         |
| 2   | 推 `crate-0` 一格 | 跨错觉把箱推上运输台入口。         |
| 3   | 推 `crate-0` 一格 | 再推到前沿，人停在后端。           |
| 4   | 操作 `freight`    | 人箱同乘到远岸。                   |
| 5   | 推 `crate-0` 一格 | 卸箱到weight，打开近岸的按住门。   |
| 6   | 操作 `freight`    | 人仍在运输台前沿，独自乘回近岸。   |
| 7   | 走到 `(1,0,0)`    | 下台穿门，到近庭取得新必需光。     |
| 8   | 走到 `(3,1,2)`    | 从后翼回运输台；不能把箱搬离远岸。 |
| 9   | 操作 `freight`    | 再次去远岸，箱子仍在原位守门。     |
| 10  | 走到 `(10,4,9)`   | 经远岸光点登finish。               |
| 11  | 操作 `finish`     | 乘后段转盘接灯塔。                 |
| 12  | 走到 `(12,5,12)`  | 点灯。                             |

## 全收集标准解法

按下方自动验证基准的`all`数组执行，共13步；每一步坐标都是当时的世界坐标。主线与全收集评价仍可分两局累计，不要求界面增加解释长文。

## 指标与验收

| 主线／全收集 | 状态／死局 | 随机50步（500次，种子20261016） | 主线错觉／取舍 |
| ------------ | ---------- | ------------------------------- | -------------- |
| 12／13       | 1012／0    | 0.0%                            | 6／4           |

章节门槛保持：第三章7～16步、≥40状态、40步随机≤35%；第四章10～20步、≥60状态、50步随机≤25%，错觉≥2、取舍≥1。没有放宽门槛；0%是固定样本零次通过。指标是技术保底，不能单凭步数、状态或死局数宣称体验更难。

运动净空覆盖88组结构转移、568组角色转移，每组181个姿态，包含人物、顶板、岩层、其他底盘、同步联动、运载箱与门包络。零采样相交不构成连续碰撞证明，也不改变错觉连接；未把行走／推箱做成三维碰撞规则。

正式实现须通过默认设计检查、对应关卡全部校验、行为与存档回归；第八至十二关全部接入后再通过`node docs/levels/check-designs.mjs --runtime`。桌面与手机实际点击主线／全收集及干扰，核对关键顶板、把手、箱子、灯笼可见可点；手机尺寸模拟不是真机。详细接线、截图和用户体验门槛见共同交接。

## 自动验证基准

```json
{
  "metrics": {
    "minActions": 12,
    "minActionsAll": 13,
    "reachableStates": 1012,
    "deadEndStates": 0,
    "illusions": 6,
    "tradeoffs": 4,
    "randomSteps": 50,
    "randomRate": 0
  },
  "all": [
    {
      "type": "walk",
      "to": [0, 0, 2]
    },
    {
      "type": "push",
      "crate": "crate-0"
    },
    {
      "type": "push",
      "crate": "crate-0"
    },
    {
      "type": "operate",
      "mechanism": "freight"
    },
    {
      "type": "push",
      "crate": "crate-0"
    },
    {
      "type": "operate",
      "mechanism": "freight"
    },
    {
      "type": "walk",
      "to": [1, 0, 0]
    },
    {
      "type": "walk",
      "to": [3, 1, 2]
    },
    {
      "type": "operate",
      "mechanism": "freight"
    },
    {
      "type": "walk",
      "to": [5, 1, 1]
    },
    {
      "type": "walk",
      "to": [10, 4, 9]
    },
    {
      "type": "operate",
      "mechanism": "finish"
    },
    {
      "type": "walk",
      "to": [12, 5, 12]
    }
  ],
  "clearance": {
    "structuralTransitions": 88,
    "characterTransitions": 568,
    "samples": 181,
    "issues": []
  }
}
```

## 完整参考实现

```ts
import { defineLevel } from './builders'

export default defineLevel({
  id: 'level-10',
  title: '推动',
  chapter: 4,
  revision: 2,
  soundtrack: 'courtyard',
  hints: [],
  build: (b) => {
    b.island({ x: [-1, 2], z: [-1, 4], y: -1, depth: 2 })
    b.island({ x: [3, 6], z: [1, 4], y: -1, depth: 2 })
    b.island({ x: [7, 9], z: [4, 7], y: 0, depth: 3 })
    b.island({ x: [10, 14], z: [7, 12], y: 2, depth: 3 })
    b.path([0, 0, 2], 'terracotta')
    b.path([0, 0, 3], 'terracotta')
    b.path([1, 0, 2], 'terracotta')
    b.path([1, 0, 3], 'terracotta')
    b.path([8, 2, 4], 'rose')
    b.path([7, 2, 5], 'rose')
    b.path([7, 2, 6], 'rose')
    b.path([7, 2, 7], 'rose')
    b.path([12, 5, 12], 'rose')
    b.path([5, 1, 1], 'terracotta')
    b.solid([3, 0, 4], 'teal')
    b.solid([8, 1, 4], 'rose')
    b.solid([7, 1, 5], 'rose')
    b.solid([7, 1, 6], 'rose')
    b.solid([7, 1, 7], 'rose')
    b.solid([11, 3, 9], 'teal')
    b.solid([11, 4, 9], 'teal')
    b.solid([14, 3, 12], 'teal')
    b.solid([12, 3, 12], 'rose')
    b.solid([12, 4, 12], 'rose')
    b.solid([5, 0, 1], 'terracotta')
    b.path([1, 0, 1], 'terracotta')
    b.path([1, 0, 0], 'terracotta')
    b.mover({
      id: 'freight',
      origin: [3, 1, 3],
      axis: 'x',
      stops: [0, 2],
      blocks: [
        { offset: [0, 0, 0] },
        { offset: [1, 0, 0] },
        { offset: [0, 0, -1] },
        { offset: [0, -1, 0], kind: 'solid', color: 'teal' },
        { offset: [1, -1, 0], kind: 'solid', color: 'teal' },
        { offset: [0, -1, -1], kind: 'solid', color: 'teal' },
      ],
      handle: { block: [3, 0, 4], face: 'z' },
    })
    b.plate({ id: 'weight', tile: [8, 2, 4], mode: 'hold', target: 'door' })
    b.gate({ id: 'door', tile: [1, 0, 1], mode: 'hold' })
    b.rotator({
      id: 'finish',
      pivot: [11, 4, 9],
      blocks: [{ offset: [-1, 0, 0] }],
      handle: { block: [14, 3, 12], face: 'z' },
    })
    b.crate({ tile: [1, 0, 2] })
    b.orb({ tile: [0, 0, 3] })
    b.orb({ tile: [7, 2, 7] })
    b.orb({ tile: [5, 1, 1], optional: true })
    b.orb({ tile: [1, 0, 0] })
    b.tree([-1, -1, 4])
    b.flower([9, 0, 7])
    b.window({ pos: [12, 3, 12], face: 'x' })
    b.lamp([14, 2, 8])
    b.start([1, 0, 3])
    b.goal([12, 5, 12])
  },
  solution: [
    { type: 'walk', to: [0, 0, 2] },
    { type: 'push', crate: 'crate-0' },
    { type: 'push', crate: 'crate-0' },
    { type: 'operate', mechanism: 'freight' },
    { type: 'push', crate: 'crate-0' },
    { type: 'operate', mechanism: 'freight' },
    { type: 'walk', to: [1, 0, 0] },
    { type: 'walk', to: [3, 1, 2] },
    { type: 'operate', mechanism: 'freight' },
    { type: 'walk', to: [10, 4, 9] },
    { type: 'operate', mechanism: 'finish' },
    { type: 'walk', to: [12, 5, 12] },
  ],
})
```
