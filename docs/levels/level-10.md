# 第 10 关 · 推动

## 状态与教学

T6.13a 第二稿，针对结构重复、选做规划和首步容错修订；T6.14 已按本稿接入正式运行数据，听感仍待试听。id `level-10`、chapter 4、revision 1，主线 8 步、全收集 9 步。选关主题短句：**随台过岸的重量**。

教学点：第一次推箱、箱子乘坐、按住压板与按住门；本章首关采用允许的8步引入。

「原来如此」：**人和箱子可以一起搭运输台；到岸后把箱子留在双框压板上，人才能离开去过门。**

第九关的单框是一次切换，本关双框需要持续重量。第十一关改为转盘运箱与换推向，不复制同一条运输线。首次教学、音乐及正式接入的共同要求见[第三、四章交接](chapter-3-4.md)，不沿用旧表的第七关升降入门。固定相机、投影连接、遮挡与乘坐规则不变；hints 为空，不恢复每关常驻说明。

## 屏幕草图与机关

屏幕 `(a,b)=(x-y,z-y)`，下图为开局；数字是实际高度。`@`起点、`G`灯笼、`o`必需、`*`选做、`C`箱、`^`压板、`D`门、`p`普通路面、`>`沿+a进入、`v`沿+b进入、`#`静轴；F=freight、E=finish；缩写加积木编号（如F0）表示活动路面，冒号后为高度。重叠投影依可见前景标注，不把轴或支撑当道路。

```text
 b\a      0     1     2     3     4     5     6     7
   0      ·     ·     ·     ·    *1     ·     ·     ·
   1      ·     ·  F2:1     ·     ·     ·     ·     ·
   2     p0    C0  F0:1  F1:1     ·     ·    ^2     ·
   3     o0    @0     ·     ·     ·    p2     ·     ·
   4      ·     ·     ·     ·     ·    D2     ·     ·
   5      ·     ·     ·     ·     ·    o2  E0:4    #4
   6      ·     ·     ·     ·     ·     ·     ·     ·
   7      ·     ·     ·     ·     ·     ·     ·    G5
```

freight 为 x 轴两站 [0,2] 平移台，#0装载入口、#1前沿、#2后翼；下部三块仅是结构。crate-0 从(1,0,2)推上#0，再推到#1，人停在#0后随台运动。远站再推一次到 weight，door 为 hold 且无把手；后段 finish 是不限次的独立短转盘。

所有岛屿、静态路面、支柱、结构色、机关偏移及把手位置均在下方完整参考实现中逐项列出；`b.island`生成地面结构，`b.column`含上下端点。未声明的档位默认0、把手不限次；无把手的机关不得擅自补把手。没有巡逻者、外部资源或ending。

## 光点、选做与陷阱

- orb-0：(0,0,3)，必需。
- orb-1：(7,2,7)，必需。
- orb-2：(5,1,1)，选做。

点灯回应：终点之外，1盏既有庭院灯亮起；只回应通关，不标记正确操作。第9、12关另有章节收束乐句，见共同声音稿。

选做保留为卸箱后从运输台后翼探出的短支路。本关只承担推箱与持续压力的首次发现，选做不叠加新门或资源，给玩家喘息；更深的箱位规划由第十一、十二关承担。

玩家自己站到双框压板，门会打开，但离开即关闭，不能自己压着自己过门。把箱子只推到装载入口就开台，人和箱子分在两岸，需回台重载，零死局。箱子不会代收光点。

## 主线标准解法

| 步  | 动作                | 理由                                         |
| --- | ------------------- | -------------------------------------------- |
| 1   | 走到 `(0,0,2)`      | 绕到箱子背后，沿途取得起点庭院的必需光点。   |
| 2   | 推 `crate-0` 一格   | 跨错觉把箱子推到运输台入口，人跟到原箱格。   |
| 3   | 推 `crate-0` 一格   | 再推到前沿，人站在入口台面上。               |
| 4   | 操作 `freight` 一次 | 人和箱子同时运到对岸。                       |
| 5   | 推 `crate-0` 一格   | 把箱子推上双框压板，门持续打开。             |
| 6   | 走到 `(10,4,9)`     | 经空出的前沿、已开门与必需光点，登后段转盘。 |
| 7   | 操作 `finish` 一次  | 随转盘接灯塔。                               |
| 8   | 走到 `(12,5,12)`    | 点灯。                                       |

## 全收集标准解法

依次执行下方自动验证基准的 `all` 数组，共 9 步；坐标是该动作发生时的世界坐标。一次行走允许自动经过中间路面，不强制额外点击接点，也不禁止其他同样合法的最优解。

## 指标与验收

| 最少／全收集 | 状态／死局 | 随机50步（500次，种子20261016） | 主线错觉／取舍 |
| ------------ | ---------- | ------------------------------- | -------------- |
| 8／9         | 564／0     | 0.0%                            | 4／2           |

第三章门槛≥40状态、40步随机≤35%，第四章≥60状态、50步随机≤25%；错觉≥2、取舍≥1。第十关按章节首关允许低2步的规定采用8步。0%是500次固定种子样本中零次通过，不代表概率严格为零。

设计已用实际规则、求解器、完整校验和可达状态的建筑运动采样验证。88组结构转移、520组角色转移，每组181姿态；覆盖顶板、岩层、其他底盘、同步联动和运载箱体。离散采样不构成连续碰撞证明，也不参与行走／推箱的投影连通。门收入自身路面属于既有设计，未宣称其槽体为连续物理仿真。验证范围和复跑方法见共同交接。

正式实现须按主线／全收集实际点击，并复验本稿干扰和撤销；截图核对起点、全部光点、箱体、把手和关键落脚点。设计预览的手机尺寸是375×667模拟，非真机；正式接线、评价目标、首次教学与章节声音仍由T6.14实现，不能拿临时预览代替正式验收。

## 自动验证基准

```json
{
  "metrics": {
    "minActions": 8,
    "minActionsAll": 9,
    "reachableStates": 564,
    "deadEndStates": 0,
    "illusions": 4,
    "tradeoffs": 2,
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
    "characterTransitions": 520,
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
  revision: 1,
  soundtrack: 'courtyard',
  hints: [],
  build: (b) => {
    b.island({ x: [-1, 2], z: [1, 4], y: -1, depth: 2 })
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
    b.column({ x: 11, z: 9, from: 3, to: 4 }, 'teal')
    b.solid([14, 3, 12], 'teal')
    b.column({ x: 12, z: 12, from: 3, to: 4 }, 'rose')
    b.solid([5, 0, 1], 'terracotta')
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
    b.gate({ id: 'door', tile: [7, 2, 6], mode: 'hold' })
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
    { type: 'walk', to: [10, 4, 9] },
    { type: 'operate', mechanism: 'finish' },
    { type: 'walk', to: [12, 5, 12] },
  ],
})
```
