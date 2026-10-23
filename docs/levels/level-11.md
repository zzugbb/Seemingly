# 第 11 关 · 越界

## 状态与教学

**T6.14a 难度衔接修订，第三稿，2026-10-23。** 本稿替代本关T6.13a第二稿；T6.14e已将完整参考实现接入正式关卡，revision **2**。主线 **11步**，全收集 **12步**。选关主题短句：**先开出口，再换推向**。

教学点：转盘运箱、单向入口、同一箱子的两段用途与触发效果保留。

「原来如此」：**箱子先临时开低廊，人进去停在单框上打开后段出口；完成这件事后，才能把箱子推到主线压板。**

第十关只需把重量留在一个地方。本关要求临时压住和触发开门先后配合，再绕到箱后改变推向；箭头继续只限制进入方向。主线也必须完成这次中途停箱，不再把它全放在选做里。

共同合同见[第三、四章交接](chapter-3-4.md)。不改固定相机、投影连通、遮挡与乘坐规则；沿用当前音乐、首次能力教学与简洁完成卡。hints为空，不恢复常驻解法说明。

## 屏幕草图

屏幕`(a,b)=(x-y,z-y)`，为初始状态。`@`起点、`G`灯笼、`o`必需、`*`选做、`C`箱、`p`普通路面、`t`触发压板、`h`按住压板、`D`关闭门、`d`初始开门、`>`沿+a进入、`v`沿+b进入、`#`静轴；字母加编号为活动路面，冒号后是高度。机关代号见下方清单，支撑不当道路。

```text
 b\a        1      2      3      4      5      6      7      8      9
   0        ·    p-1    p-1      ·      ·      ·      ·      ·      ·
   1        ·    C-1    @-1      ·      ·      ·      ·      ·      ·
   2        ·   T0:1   T1:1     #1      ·      ·      ·      ·      ·
   3        ·      ·      ·      ·      ·      ·      ·      ·      ·
   4      *-1    t-1    D-1      ·     o3     p3      ·      ·      ·
   5        ·      ·     h2     h2     v3     D3      ·      ·      ·
   6        ·      ·      ·      ·      ·     o3   E0:4     #4      ·
   7        ·      ·      ·      ·      ·      ·      ·      ·      ·
   8        ·      ·      ·      ·      ·      ·      ·     D5     G5
```

## 机关、结构与站位

turntable、garden-weight、garden-door、主线weight/door、箭头和finish几何保持。新增latch为(1,-1,3)上的可重复trigger，驱动新增toggle门exit-door；exit-door位于旧灯笼格(13,5,13)，灯笼移到相邻(14,5,13)，有完整支柱。

garden-door只有箱留转角时才开；exit-door被触发后保持开，不依赖箱继续留在转角。原选做光仍在(0,-1,3)。不增加箱子数或新的机关类型。

所有静态路面、支柱、岛屿范围、颜色、机关偏移、把手面与次数、光点、箭头和装饰在完整参考实现中逐项给出，这是实现的唯一数据依据。不得自行加路、添把手或改targets来修正谜题。没有巡逻者、外部资源或ending。

## 光点、干扰与恢复

- `orb-0`：`(0,-1,3)`，选做。
- `orb-1`：`(8,3,7)`，必需。
- `orb-2`：`(9,3,9)`，必需。

只把箱推到最终weight而没去latch，主线门虽开，出口仍关，低廊又已关闭；提示无解建议撤销，不能自动开出口。最早的反推箱死角仍保留，走(3,1,3)后反推可一次撤销恢复。

去低廊选做会经过latch但不会触发，必须另停一次。全收集先停latch，再去选做，最后回高廊换推向。禁止把“路过”当成“停住”，也不能把箭头改成禁止所有离开方向。

点灯回应保留：终点之外2盏庭院灯；第九、十二关2.2秒后出现简洁完成卡，减少动态效果0.2秒。声音维持T6.14当前实现，新章试听状态仍单独等待用户确认。

## 主线标准解法

一次行走允许自动经过中间路面。下表是经验证的最优解，不排斥同样合法的其他最优路线，不强迫逐格点击。

| 步  | 动作              | 理由                                    |
| --- | ----------------- | --------------------------------------- |
| 1   | 走到 `(1,-1,-1)`  | 绕到低处箱后。                          |
| 2   | 推 `crate-0` 一格 | 跨错觉把箱推到转盘外端。                |
| 3   | 走到 `(4,1,3)`    | 另登内端，避免被箱占住的外端。          |
| 4   | 操作 `turntable`  | 同时转运人和箱，推向改变。              |
| 5   | 推 `crate-0` 一格 | 先卸到garden-weight，暂开低廊门。       |
| 6   | 走到 `(1,-1,3)`   | 进入低廊并停在latch上，打开后段出口门。 |
| 7   | 走到 `(8,3,8)`    | 返回高侧廊，沿箭头进入箱后。            |
| 8   | 推 `crate-0` 一格 | 把同一箱子推到weight，打开主线门。      |
| 9   | 走到 `(11,4,10)`  | 穿门收第二光并登finish。                |
| 10  | 操作 `finish`     | 乘转盘接后段。                          |
| 11  | 走到 `(14,5,13)`  | 穿此前打开的出口门，抵达新灯笼。        |

## 全收集标准解法

按下方自动验证基准的`all`数组执行，共12步；每一步坐标都是当时的世界坐标。主线与全收集评价仍可分两局累计，不要求界面增加解释长文。

## 指标与验收

| 主线／全收集 | 状态／死局 | 随机50步（500次，种子20261016） | 主线错觉／取舍 |
| ------------ | ---------- | ------------------------------- | -------------- |
| 11／12       | 3712／1040 | 0.0%                            | 9／3           |

章节门槛保持：第三章7～16步、≥40状态、40步随机≤35%；第四章10～20步、≥60状态、50步随机≤25%，错觉≥2、取舍≥1。没有放宽门槛；0%是固定样本零次通过。指标是技术保底，不能单凭步数、状态或死局数宣称体验更难。

运动净空覆盖480组结构转移、2496组角色转移，每组181个姿态，包含人物、顶板、岩层、其他底盘、同步联动、运载箱与门包络。零采样相交不构成连续碰撞证明，也不改变错觉连接；未把行走／推箱做成三维碰撞规则。

正式实现须通过默认设计检查、对应关卡全部校验、行为与存档回归；第八至十二关全部接入后再通过`node docs/levels/check-designs.mjs --runtime`。桌面与手机实际点击主线／全收集及干扰，核对关键顶板、把手、箱子、灯笼可见可点；手机尺寸模拟不是真机。详细接线、截图和用户体验门槛见共同交接。

## 自动验证基准

```json
{
  "metrics": {
    "minActions": 11,
    "minActionsAll": 12,
    "reachableStates": 3712,
    "deadEndStates": 1040,
    "illusions": 9,
    "tradeoffs": 3,
    "randomSteps": 50,
    "randomRate": 0
  },
  "all": [
    {
      "type": "walk",
      "to": [1, -1, -1]
    },
    {
      "type": "push",
      "crate": "crate-0"
    },
    {
      "type": "walk",
      "to": [4, 1, 3]
    },
    {
      "type": "operate",
      "mechanism": "turntable"
    },
    {
      "type": "push",
      "crate": "crate-0"
    },
    {
      "type": "walk",
      "to": [1, -1, 3]
    },
    {
      "type": "walk",
      "to": [0, -1, 3]
    },
    {
      "type": "walk",
      "to": [8, 3, 8]
    },
    {
      "type": "push",
      "crate": "crate-0"
    },
    {
      "type": "walk",
      "to": [11, 4, 10]
    },
    {
      "type": "operate",
      "mechanism": "finish"
    },
    {
      "type": "walk",
      "to": [14, 5, 13]
    }
  ],
  "clearance": {
    "structuralTransitions": 480,
    "characterTransitions": 2496,
    "samples": 181,
    "issues": []
  },
  "recovery": {
    "elevenRestored": [
      {
        "type": "walk",
        "to": [1, -1, -1]
      },
      {
        "type": "push",
        "crate": "crate-0"
      },
      {
        "type": "walk",
        "to": [4, 1, 3]
      },
      {
        "type": "operate",
        "mechanism": "turntable"
      },
      {
        "type": "push",
        "crate": "crate-0"
      },
      {
        "type": "walk",
        "to": [8, 3, 8]
      },
      {
        "type": "walk",
        "to": [1, -1, 3]
      },
      {
        "type": "walk",
        "to": [8, 3, 8]
      },
      {
        "type": "push",
        "crate": "crate-0"
      },
      {
        "type": "walk",
        "to": [11, 4, 10]
      },
      {
        "type": "operate",
        "mechanism": "finish"
      },
      {
        "type": "walk",
        "to": [14, 5, 13]
      }
    ]
  },
  "deadPrefixes": {
    "earlyFinalWeight": [
      {
        "type": "walk",
        "to": [1, -1, -1]
      },
      {
        "type": "push",
        "crate": "crate-0"
      },
      {
        "type": "walk",
        "to": [4, 1, 3]
      },
      {
        "type": "operate",
        "mechanism": "turntable"
      },
      {
        "type": "push",
        "crate": "crate-0"
      },
      {
        "type": "walk",
        "to": [8, 3, 8]
      },
      {
        "type": "push",
        "crate": "crate-0"
      }
    ]
  }
}
```

## 完整参考实现

```ts
import { defineLevel } from './builders'

export default defineLevel({
  id: 'level-11',
  title: '越界',
  chapter: 4,
  revision: 2,
  soundtrack: 'courtyard',
  hints: [],
  build: (b) => {
    b.island({ x: [0, 2], z: [-2, 3], y: -2, depth: 2 })
    b.island({ x: [3, 7], z: [1, 5], y: -1, depth: 3 })
    b.island({ x: [5, 10], z: [7, 9], y: 0, depth: 3 })
    b.island({ x: [11, 14], z: [8, 13], y: 2, depth: 3 })
    b.path([1, -1, -1], 'terracotta')
    b.path([2, -1, -1], 'terracotta')
    b.path([1, -1, 0], 'terracotta')
    b.path([2, -1, 0], 'terracotta')
    b.path([2, -1, 3], 'terracotta')
    b.path([1, -1, 3], 'terracotta')
    b.path([0, -1, 3], 'terracotta')
    b.path([6, 2, 7], 'rose')
    b.path([5, 2, 7], 'rose')
    b.path([8, 3, 7], 'rose')
    b.path([8, 3, 8], 'rose', { oneWay: '+b' })
    b.path([9, 3, 7], 'rose')
    b.path([9, 3, 8], 'rose')
    b.path([9, 3, 9], 'rose')
    b.path([13, 5, 13], 'rose')
    b.solid([5, 0, 3], 'teal')
    b.solid([5, 1, 3], 'teal')
    b.solid([5, 1, 9], 'teal')
    b.solid([6, 1, 7], 'rose')
    b.solid([5, 1, 7], 'rose')
    b.solid([8, 1, 7], 'rose')
    b.solid([8, 2, 7], 'rose')
    b.solid([8, 1, 8], 'rose')
    b.solid([8, 2, 8], 'rose')
    b.solid([9, 1, 7], 'rose')
    b.solid([9, 2, 7], 'rose')
    b.solid([9, 1, 8], 'rose')
    b.solid([9, 2, 8], 'rose')
    b.solid([9, 1, 9], 'rose')
    b.solid([9, 2, 9], 'rose')
    b.solid([12, 3, 10], 'teal')
    b.solid([12, 4, 10], 'teal')
    b.solid([14, 3, 13], 'teal')
    b.solid([13, 3, 13], 'rose')
    b.solid([13, 4, 13], 'rose')
    b.path([14, 5, 13], 'rose')
    b.solid([14, 4, 13], 'rose')
    b.rotator({
      id: 'turntable',
      pivot: [5, 1, 3],
      blocks: [{ offset: [-2, 0, 0] }, { offset: [-1, 0, 0] }],
      handle: { block: [5, 1, 9], face: 'z' },
    })
    b.plate({ id: 'weight', tile: [5, 2, 7], target: 'door', mode: 'hold' })
    b.gate({ id: 'door', tile: [9, 3, 8], mode: 'hold' })
    b.rotator({
      id: 'finish',
      pivot: [12, 4, 10],
      blocks: [{ offset: [-1, 0, 0] }],
      handle: { block: [14, 3, 13], face: 'z' },
    })
    b.plate({ id: 'garden-weight', tile: [6, 2, 7], mode: 'hold', target: 'garden-door' })
    b.gate({ id: 'garden-door', tile: [2, -1, 3], mode: 'hold' })
    b.gate({ id: 'exit-door', tile: [13, 5, 13], mode: 'toggle' })
    b.plate({ id: 'latch', tile: [1, -1, 3], target: 'exit-door' })
    b.crate({ tile: [1, -1, 0] })
    b.orb({ tile: [0, -1, 3], optional: true })
    b.orb({ tile: [8, 3, 7] })
    b.orb({ tile: [9, 3, 9] })
    b.tree([10, 0, 7])
    b.flower([10, 0, 9])
    b.window({ pos: [13, 3, 13], face: 'x' })
    b.lamp([11, 2, 13])
    b.lamp([14, 2, 9])
    b.start([2, -1, 0])
    b.goal([14, 5, 13])
  },
  solution: [
    { type: 'walk', to: [1, -1, -1] },
    { type: 'push', crate: 'crate-0' },
    { type: 'walk', to: [4, 1, 3] },
    { type: 'operate', mechanism: 'turntable' },
    { type: 'push', crate: 'crate-0' },
    { type: 'walk', to: [1, -1, 3] },
    { type: 'walk', to: [8, 3, 8] },
    { type: 'push', crate: 'crate-0' },
    { type: 'walk', to: [11, 4, 10] },
    { type: 'operate', mechanism: 'finish' },
    { type: 'walk', to: [14, 5, 13] },
  ],
})
```
