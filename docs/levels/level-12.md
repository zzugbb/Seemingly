# 第 12 关 · 重量

## 状态与教学

正式版本：第4章，revision 2，主线 **16步**／全收集 **17步**；关卡与声音已获用户试玩确认。

教学点：三站有限运输、临时重量、单框开门和回入口的完整计划。

「原来如此」：**去远庭时箱要留中站开门；取光返回后，再把同一个箱推去守归门，最后一程载人回家。**

承接第七关三站、第八关间接控制、第九关停板、第十关人箱分工、第十一关临时停箱与换推向。四段运输和两阶段箱位共同构成章末，保留一次完整往返的四次余量。

共同合同见[章节衔接](README.md#章节衔接与恢复边界)。不改固定相机、投影连通、遮挡与乘坐规则；沿用当前音乐、首次能力教学与简洁完成卡。hints为空，不恢复常驻解法说明。

## 屏幕草图

屏幕`(a,b)=(x-y,z-y)`，为初始状态。`@`起点、`G`灯笼、`o`必需、`*`选做、`C`箱、`p`普通路面、`t`触发压板、`h`按住压板、`D`关闭门、`d`初始开门、`>`沿+a进入、`v`沿+b进入、`#`静轴；字母加编号为活动路面，冒号后是高度。机关代号见下方清单，支撑不当道路。

```text
 b\a        1      2      3      4      5      6      7      8      9     10     11     12
   0        ·     G0      ·      ·     p1     o1      ·      ·      ·      ·      ·      ·
   1        ·     D1      ·      ·     p1     v1      ·      ·      ·      ·      ·      ·
   2       p0   F0:1     C1      ·      ·     h2      ·      ·      ·     D2     D2     o2
   3       @0     >2     >2     p2     p2     p2      ·      ·      ·      ·     *2      ·
   4        ·      ·      ·     o2     p2     h3      ·      ·      ·      ·      ·      ·
   5        ·      ·      ·      ·     p3     p3      ·      ·      ·      ·      ·      ·
```

草图同格优先显示光点：北侧`o1`同时是单框call-far，完整实现必须保留压板。

## 机关、结构与站位

freight改为x轴三站[0,2,6]，handle.uses=8；往返为0→2→6→2→0，之后继续往返但总共只允许8次。最优用4次，并非要求把所有亮点用光。返程到中站后下一站仍是近岸，不能直接调头；补访远庭需经近岸、中站再赴远站，这四次额外操作真实计入额度。箱预装#1。

garden-weight仍在(8,2,4)，现绑定远庭hold门far-hold(13,2,4)。原garden-door移除。北侧(7,1,1)新增trigger压板call-far，驱动远庭toggle门far-door(12,2,4)；路过该处仍收光，但不触发。两门串联，远庭必需光(14,2,4)在门后，选做(13,2,5)是另一支路，不能一走顺带收齐两处。

主线weight(9,3,7)仍开近岸door(3,1,2)。原(8,3,8)保留为普通侧廊，增加(9,3,8)恢复站位，可以绕到最终箱位后面把箱推回转角，避免过早推进只能撤销。远庭新增第三座岛屿，其他完整数据见参考实现。

所有静态路面、支柱、岛屿范围、颜色、机关偏移、把手面与次数、光点、箭头和装饰在完整参考实现中逐项给出，这是实现的唯一数据依据。不得自行加路、添把手或改targets来修正谜题。没有巡逻者、外部资源或ending。

## 光点、干扰与恢复

- `orb-0`：`(7,1,1)`，必需。
- `orb-1`：`(6,2,6)`，必需。
- `orb-2`：`(14,2,4)`，必需。
- `orb-3`：`(13,2,5)`，选做。

首先14种合法动作、其后共147种两步合法前缀均仍有解。第一下空人送箱仍可走单向廊追台；连送两下到远站也可回中站卸箱，用满8次走完，无需重开或撤销。单向箭头维持原进入规则。

如果只路过call-far便赴远站，切换门没开；可用四次余量补一次完整往返，再赴远庭，仍能完成。过早把箱推到最终weight，可经侧廊到(9,3,8)从南侧反推两次，恢复中站重量，再安排运输。恢复路线只用已有推动和连通规则。

在已没有足够回程次数时继续拉杆会形成有意死局，主动提示建议撤销，撤销恢复次数、台位、箱位及门；不自动赠送次数。选做须在远庭停靠期间完成，离台与返航要照顾两个目的地；错过后是否仍能补取取决于剩余次数，不能额外加禁路。

点灯回应保留：终点之外3盏庭院灯；第九、十二关2.2秒后出现简洁完成卡，减少动态效果0.2秒。当前音乐与混音已获用户确认，见[音乐设计](../design.md#音乐)。

## 主线标准解法

一次行走允许自动经过中间路面。下表是经验证的最优解，不排斥同样合法的其他最优路线，不强迫逐格点击。

| 步  | 动作              | 理由                                        |
| --- | ----------------- | ------------------------------------------- |
| 1   | 走到 `(3,1,3)`    | 登预装箱的后端。                            |
| 2   | 操作 `freight`    | 第一程到中站。                              |
| 3   | 推 `crate-0` 一格 | 卸箱到garden-weight，保持远庭的按住门打开。 |
| 4   | 走到 `(6,2,6)`    | 离台取中庭必需光。                          |
| 5   | 走到 `(7,1,1)`    | 停北侧call-far，取光并打开远庭切换门。      |
| 6   | 走到 `(6,1,3)`    | 回运输台前沿，箱继续留中站。                |
| 7   | 操作 `freight`    | 第二程人独自赴远站。                        |
| 8   | 走到 `(14,2,4)`   | 穿两种门，取远庭必需光。                    |
| 9   | 走到 `(10,1,3)`   | 返回远站前沿。                              |
| 10  | 操作 `freight`    | 第三程回中站，准备继续使用原箱。            |
| 11  | 走到 `(7,1,2)`    | 沿北侧箭头绕到箱后；经过call-far不再触发。  |
| 12  | 推 `crate-0` 一格 | 把箱向+b推一格，远庭按住门关闭。            |
| 13  | 推 `crate-0` 一格 | 再推到weight，打开近岸归门。                |
| 14  | 走到 `(6,1,3)`    | 回中站前沿。                                |
| 15  | 操作 `freight`    | 第四程回近岸；最优还剩四次试错余量。        |
| 16  | 走到 `(2,0,0)`    | 回入口旁点灯，三处庭院灯回应。              |

## 全收集标准解法

按下方自动验证基准的`all`数组执行，共17步；每一步坐标都是当时的世界坐标。主线与全收集评价仍可分两局累计，不要求界面增加解释长文。

## 指标与验收

| 主线／全收集 | 状态／死局 | 随机50步（500次，种子20261016） | 主线错觉／取舍 |
| ------------ | ---------- | ------------------------------- | -------------- |
| 16／17       | 9194／5186 | 0.0%                            | 9／6           |

章节门槛保持：第三章7～16步、≥40状态、40步随机≤35%；第四章10～20步、≥60状态、50步随机≤25%，错觉≥2、取舍≥1。没有放宽门槛；0%是固定样本零次通过。指标是技术保底，不能单凭步数、状态或死局数宣称体验更难。

运动净空覆盖163组结构转移、1026组角色转移，每组181个姿态，包含人物、顶板、岩层、其他底盘、同步联动、运载箱与门包络。零采样相交不构成连续碰撞证明，也不改变错觉连接；未把行走／推箱做成三维碰撞规则。

维护时须通过设计与正式对象比对，复验主线／全收集、干扰、存档及撤销。检查命令和设备限制见[关卡索引](README.md#校验工具)与[验收记录](../performance.md)。

## 自动验证基准

```json
{
  "metrics": {
    "minActions": 16,
    "minActionsAll": 17,
    "reachableStates": 9194,
    "deadEndStates": 5186,
    "illusions": 9,
    "tradeoffs": 6,
    "randomSteps": 50,
    "randomRate": 0
  },
  "all": [
    {
      "type": "walk",
      "to": [3, 1, 3]
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
      "type": "walk",
      "to": [6, 2, 6]
    },
    {
      "type": "walk",
      "to": [7, 1, 1]
    },
    {
      "type": "walk",
      "to": [6, 1, 3]
    },
    {
      "type": "operate",
      "mechanism": "freight"
    },
    {
      "type": "walk",
      "to": [14, 2, 4]
    },
    {
      "type": "walk",
      "to": [13, 2, 5]
    },
    {
      "type": "walk",
      "to": [10, 1, 3]
    },
    {
      "type": "operate",
      "mechanism": "freight"
    },
    {
      "type": "walk",
      "to": [7, 1, 2]
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
      "type": "walk",
      "to": [6, 1, 3]
    },
    {
      "type": "operate",
      "mechanism": "freight"
    },
    {
      "type": "walk",
      "to": [2, 0, 0]
    }
  ],
  "clearance": {
    "structuralTransitions": 163,
    "characterTransitions": 1026,
    "samples": 181,
    "issues": []
  },
  "recovery": {
    "twoEmpty": [
      {
        "type": "operate",
        "mechanism": "freight"
      },
      {
        "type": "operate",
        "mechanism": "freight"
      },
      {
        "type": "walk",
        "to": [6, 2, 6]
      },
      {
        "type": "operate",
        "mechanism": "freight"
      },
      {
        "type": "walk",
        "to": [5, 1, 3]
      },
      {
        "type": "operate",
        "mechanism": "freight"
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
        "type": "walk",
        "to": [7, 1, 1]
      },
      {
        "type": "walk",
        "to": [6, 1, 3]
      },
      {
        "type": "operate",
        "mechanism": "freight"
      },
      {
        "type": "walk",
        "to": [14, 2, 4]
      },
      {
        "type": "walk",
        "to": [10, 1, 3]
      },
      {
        "type": "operate",
        "mechanism": "freight"
      },
      {
        "type": "walk",
        "to": [7, 1, 2]
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
        "type": "walk",
        "to": [6, 1, 3]
      },
      {
        "type": "operate",
        "mechanism": "freight"
      },
      {
        "type": "walk",
        "to": [2, 0, 0]
      }
    ],
    "missedPlate": [
      {
        "type": "walk",
        "to": [3, 1, 3]
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
        "type": "walk",
        "to": [6, 2, 6]
      },
      {
        "type": "walk",
        "to": [7, 1, 2]
      },
      {
        "type": "walk",
        "to": [6, 1, 3]
      },
      {
        "type": "operate",
        "mechanism": "freight"
      },
      {
        "type": "operate",
        "mechanism": "freight"
      },
      {
        "type": "walk",
        "to": [7, 1, 1]
      },
      {
        "type": "walk",
        "to": [6, 1, 3]
      },
      {
        "type": "operate",
        "mechanism": "freight"
      },
      {
        "type": "operate",
        "mechanism": "freight"
      },
      {
        "type": "operate",
        "mechanism": "freight"
      },
      {
        "type": "walk",
        "to": [14, 2, 4]
      },
      {
        "type": "walk",
        "to": [10, 1, 3]
      },
      {
        "type": "operate",
        "mechanism": "freight"
      },
      {
        "type": "walk",
        "to": [7, 1, 2]
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
        "type": "walk",
        "to": [6, 1, 3]
      },
      {
        "type": "operate",
        "mechanism": "freight"
      },
      {
        "type": "walk",
        "to": [2, 0, 0]
      }
    ],
    "earlyCrate": [
      {
        "type": "walk",
        "to": [3, 1, 3]
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
        "type": "walk",
        "to": [6, 2, 6]
      },
      {
        "type": "walk",
        "to": [7, 1, 1]
      },
      {
        "type": "walk",
        "to": [7, 1, 2]
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
        "type": "walk",
        "to": [9, 3, 8]
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
        "type": "walk",
        "to": [6, 1, 3]
      },
      {
        "type": "operate",
        "mechanism": "freight"
      },
      {
        "type": "walk",
        "to": [14, 2, 4]
      },
      {
        "type": "walk",
        "to": [10, 1, 3]
      },
      {
        "type": "operate",
        "mechanism": "freight"
      },
      {
        "type": "walk",
        "to": [7, 1, 2]
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
        "type": "walk",
        "to": [6, 1, 3]
      },
      {
        "type": "operate",
        "mechanism": "freight"
      },
      {
        "type": "walk",
        "to": [2, 0, 0]
      }
    ]
  },
  "deadPrefixes": {
    "exhausted": [
      {
        "type": "operate",
        "mechanism": "freight"
      },
      {
        "type": "operate",
        "mechanism": "freight"
      },
      {
        "type": "operate",
        "mechanism": "freight"
      },
      {
        "type": "operate",
        "mechanism": "freight"
      },
      {
        "type": "operate",
        "mechanism": "freight"
      },
      {
        "type": "operate",
        "mechanism": "freight"
      },
      {
        "type": "operate",
        "mechanism": "freight"
      },
      {
        "type": "operate",
        "mechanism": "freight"
      }
    ]
  }
}
```

## 完整参考实现

```ts
import { defineLevel } from './builders'

export default defineLevel({
  id: 'level-12',
  title: '重量',
  chapter: 4,
  revision: 2,
  soundtrack: 'courtyard',
  hints: [],
  build: (b) => {
    b.island({ x: [-1, 2], z: [0, 4], y: -1, depth: 2 })
    b.island({ x: [3, 9], z: [1, 8], y: -1, depth: 3 })
    b.island({ x: [11, 14], z: [3, 6], y: 0, depth: 2.5 })
    b.path([1, 0, 3], 'terracotta')
    b.path([1, 0, 2], 'terracotta')
    b.path([2, 0, 0], 'rose')
    b.path([3, 1, 2], 'rose')
    b.path([4, 2, 5], 'rose', { oneWay: '+a' })
    b.path([5, 2, 5], 'rose', { oneWay: '+a' })
    b.path([6, 2, 5], 'rose')
    b.path([7, 2, 5], 'rose')
    b.path([8, 2, 4], 'rose')
    b.path([8, 2, 5], 'rose')
    b.path([6, 2, 6], 'rose')
    b.path([7, 2, 6], 'rose')
    b.path([6, 1, 2], 'terracotta')
    b.path([6, 1, 1], 'terracotta')
    b.path([7, 1, 1], 'terracotta')
    b.path([7, 1, 2], 'terracotta', { oneWay: '+b' })
    b.path([9, 3, 7], 'rose')
    b.path([8, 3, 8], 'rose')
    b.solid([3, 0, 8], 'teal')
    b.solid([3, 0, 2], 'rose')
    b.solid([4, 0, 5], 'rose')
    b.solid([4, 1, 5], 'rose')
    b.solid([5, 0, 5], 'rose')
    b.solid([5, 1, 5], 'rose')
    b.solid([6, 0, 5], 'rose')
    b.solid([6, 1, 5], 'rose')
    b.solid([7, 0, 5], 'rose')
    b.solid([7, 1, 5], 'rose')
    b.solid([8, 0, 4], 'rose')
    b.solid([8, 1, 4], 'rose')
    b.solid([8, 0, 5], 'rose')
    b.solid([8, 1, 5], 'rose')
    b.solid([6, 0, 6], 'rose')
    b.solid([6, 1, 6], 'rose')
    b.solid([7, 0, 6], 'rose')
    b.solid([7, 1, 6], 'rose')
    b.solid([6, 0, 2], 'terracotta')
    b.solid([6, 0, 1], 'terracotta')
    b.solid([7, 0, 1], 'terracotta')
    b.solid([7, 0, 2], 'terracotta')
    b.solid([9, 0, 7], 'rose')
    b.solid([9, 1, 7], 'rose')
    b.solid([9, 2, 7], 'rose')
    b.solid([8, 0, 8], 'rose')
    b.solid([8, 1, 8], 'rose')
    b.solid([8, 2, 8], 'rose')
    b.path([9, 3, 8], 'rose')
    b.solid([9, 0, 8], 'rose')
    b.solid([9, 1, 8], 'rose')
    b.solid([9, 2, 8], 'rose')
    b.path([12, 2, 4], 'rose')
    b.solid([12, 1, 4], 'rose')
    b.path([13, 2, 4], 'rose')
    b.solid([13, 1, 4], 'rose')
    b.path([14, 2, 4], 'rose')
    b.solid([14, 1, 4], 'rose')
    b.path([13, 2, 5], 'rose')
    b.solid([13, 1, 5], 'rose')
    b.gate({ id: 'door', tile: [3, 1, 2], mode: 'hold' })
    b.mover({
      id: 'freight',
      origin: [3, 1, 3],
      axis: 'x',
      stops: [0, 2, 6],
      blocks: [
        { offset: [0, 0, 0] },
        { offset: [1, 0, 0] },
        { offset: [0, -1, 0], kind: 'solid', color: 'teal' },
        { offset: [1, -1, 0], kind: 'solid', color: 'teal' },
      ],
      handle: { block: [3, 0, 8], face: 'z', uses: 8 },
    })
    b.plate({ id: 'weight', tile: [9, 3, 7], target: 'door', mode: 'hold' })
    b.plate({ id: 'garden-weight', tile: [8, 2, 4], target: 'far-hold', mode: 'hold' })
    b.plate({ id: 'call-far', tile: [7, 1, 1], target: 'far-door' })
    b.gate({ id: 'far-door', tile: [12, 2, 4], mode: 'toggle' })
    b.gate({ id: 'far-hold', tile: [13, 2, 4], mode: 'hold' })
    b.crate({ mechanism: 'freight', block: 1 })
    b.orb({ tile: [7, 1, 1] })
    b.orb({ tile: [6, 2, 6] })
    b.orb({ tile: [14, 2, 4] })
    b.orb({ tile: [13, 2, 5], optional: true })
    b.tree([-1, -1, 3])
    b.flower([3, -1, 8])
    b.window({ pos: [9, 1, 7], face: 'x' })
    b.lamp([4, -1, 7])
    b.lamp([7, -1, 8])
    b.lamp([9, -1, 4])
    b.start([1, 0, 3])
    b.goal([2, 0, 0])
  },
  solution: [
    { type: 'walk', to: [3, 1, 3] },
    { type: 'operate', mechanism: 'freight' },
    { type: 'push', crate: 'crate-0' },
    { type: 'walk', to: [6, 2, 6] },
    { type: 'walk', to: [7, 1, 1] },
    { type: 'walk', to: [6, 1, 3] },
    { type: 'operate', mechanism: 'freight' },
    { type: 'walk', to: [14, 2, 4] },
    { type: 'walk', to: [10, 1, 3] },
    { type: 'operate', mechanism: 'freight' },
    { type: 'walk', to: [7, 1, 2] },
    { type: 'push', crate: 'crate-0' },
    { type: 'push', crate: 'crate-0' },
    { type: 'walk', to: [6, 1, 3] },
    { type: 'operate', mechanism: 'freight' },
    { type: 'walk', to: [2, 0, 0] },
  ],
})
```
