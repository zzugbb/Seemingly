# 第 9 关 · 牵引

## 状态与教学

T6.13a 第二稿，针对结构重复、选做规划和首步容错修订；尚未加入正式运行数据；由用户指定设计者编写，T6.14 按本稿实现。id `level-09`、chapter 3、revision 1，主线 10 步、全收集 13 步。选关主题短句：**停下，召来远台**。

教学点：第一次触发压板、间接召台与切换门；经过单框不触发，停住才触发。

「原来如此」：**压板可以把没有把手的平台召到另一处；离开后结果保留，但换停靠也会交换两条路的门。**

第八关是一把手同步双桥，本关是一座手动桥加一座被压板召来的升降台。主线在南侧召低台取光，最后回北庭点灯；第十关再对比需要持续重量的双框压板。首次教学、音乐及正式接入的共同要求见[第三、四章交接](chapter-3-4.md)，不沿用旧表的第七关升降入门。固定相机、投影连接、遮挡与乘坐规则不变；hints 为空，不恢复每关常驻说明。

## 屏幕草图与机关

屏幕 `(a,b)=(x-y,z-y)`，下图为开局；数字是实际高度。`@`起点、`G`灯笼、`o`必需、`*`选做、`C`箱、`^`压板、`D`门、`p`普通路面、`>`沿+a进入、`v`沿+b进入、`#`静轴；W=swing、U=receiver；缩写加积木编号（如F0）表示活动路面，冒号后为高度。重叠投影依可见前景标注，不把轴或支撑当道路。

```text
 b\a     -1     0     1     2     3     4     5
  -2      ·     ·     ·    G0     ·     ·     ·
  -1      ·     ·    ^0    D0    D5    *6     ·
   0      ·     ·    p0     ·  U0:6     ·     ·
   1      ·     ·     ·     ·     ·     ·     ·
   2     @0  W0:1     ·    #1     ·     ·     ·
   3      ·     ·     ·     ·     ·     ·    o5
   4      ·     ·     ·     ·     ·     ·     ·
   5      ·     ·     ·    ^2     ·     ·     ·
   6      ·     ·     ·    o2     ·     ·     ·
```

swing为独立转盘，无links。receiver为无把手y轴平移台，origin(9,4,6)、stops[0,2]、初始上站1；两处trigger压板call-south(4,2,7)、call-north(1,0,-1)都驱动receiver，均可重复。receiver.links同时切换door与garden-door：初始上站／归门关／选做门开；下站／归门开／选做门关。门开关与台位只因真实调用同步，不加新规则。低台接必需庭院(10,5,8)，高台接选做门(8,5,4)与高庭(10,6,5)。

所有岛屿、静态路面、支柱、结构色、机关偏移及把手位置均在下方完整参考实现中逐项列出；`b.island`生成地面结构，`b.column`含上下端点。未声明的档位默认0、把手不限次；无把手的机关不得擅自补把手。没有巡逻者、外部资源或ending。

## 光点、选做与陷阱

- orb-0：(4,2,8)，必需。
- orb-1：(10,5,8)，必需。
- orb-2：(10,6,5)，选做。

点灯回应：终点之外，3盏既有庭院灯亮起；只回应通关，不标记正确操作。第9、12关另有章节收束乐句，见共同声音稿。

主线取低庭光后，swing转到北停靠即可回灯笼。全收集先在北压板停下，升台并暂时关归门、开选做门；取高庭选做，再回同一压板停住，降台并恢复归门。最优路线额外两次召台各有不同目标，取代旧稿为恢复相位而转整圈的选做。也允许绕回南压板调用的更长路线，不禁止合法替代解。

可以直接点南庭深处光点，自动经过压板却不触发，台仍在上方；必须返回压板停住。也可先停压板再取光，同为最优，不能禁止这条合法路线。重复召台可恢复，不形成死局。北侧直奔选做会被关门挡住；先抬台会关闭归路，取光后需再停压板恢复。

## 主线标准解法

| 步  | 动作              | 理由                               |
| --- | ----------------- | ---------------------------------- |
| 1   | 走到 `(1,1,3)`    | 登手动桥。                         |
| 2   | 操作 `swing` 一次 | 乘桥到南庭。                       |
| 3   | 走到 `(4,2,8)`    | 先走到深处收光，经过压板但不触发。 |
| 4   | 走到 `(4,2,7)`    | 回压板停住，召下低台并打开归门。   |
| 5   | 走到 `(3,1,5)`    | 回到手动桥。                       |
| 6   | 操作 `swing` 一次 | 乘桥接低台接口。                   |
| 7   | 走到 `(10,5,8)`   | 经低台到必需庭院取光。             |
| 8   | 走到 `(5,1,3)`    | 返回手动桥。                       |
| 9   | 操作 `swing` 一次 | 乘桥回到北停靠。                   |
| 10  | 走到 `(2,0,-2)`   | 穿已开归门点灯，三处庭院灯回应。   |

## 全收集标准解法

依次执行下方自动验证基准的 `all` 数组，共 13 步；坐标是该动作发生时的世界坐标。一次行走允许自动经过中间路面，不强制额外点击接点，也不禁止其他同样合法的最优解。

## 指标与验收

| 最少／全收集 | 状态／死局 | 随机40步（500次，种子20261016） | 主线错觉／取舍 |
| ------------ | ---------- | ------------------------------- | -------------- |
| 10／13       | 544／0     | 1.8%                            | 8／3           |

第三章门槛≥40状态、40步随机≤35%，第四章≥60状态、50步随机≤25%；错觉≥2、取舍≥1。第十关按章节首关允许低2步的规定采用8步。0%是500次固定种子样本中零次通过，不代表概率严格为零。

设计已用实际规则、求解器、完整校验和可达状态的建筑运动采样验证。16组结构转移、92组角色转移，每组181姿态；覆盖顶板、岩层、其他底盘、同步联动和运载箱体。离散采样不构成连续碰撞证明，也不参与行走／推箱的投影连通。门收入自身路面属于既有设计，未宣称其槽体为连续物理仿真。验证范围和复跑方法见共同交接。

正式实现须按主线／全收集实际点击，并复验本稿干扰和撤销；截图核对起点、全部光点、箱体、把手和关键落脚点。设计预览的手机尺寸是375×667模拟，非真机；正式接线、评价目标、首次教学与章节声音仍由T6.14实现，不能拿临时预览代替正式验收。

## 自动验证基准

```json
{
  "metrics": {
    "minActions": 10,
    "minActionsAll": 13,
    "reachableStates": 544,
    "deadEndStates": 0,
    "illusions": 8,
    "tradeoffs": 3,
    "randomSteps": 40,
    "randomRate": 0.018
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
    "characterTransitions": 92,
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
  revision: 1,
  soundtrack: 'courtyard',
  hints: [],
  build: (b) => {
    b.island({ x: [-2, 0], z: [1, 3], y: -1, depth: 2 })
    b.island({ x: [1, 6], z: [-2, 8], y: -1, depth: 3 })
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
    b.column({ x: 3, z: 3, from: 0, to: 1 }, 'teal')
    b.solid([2, 0, 8], 'teal')
    b.column({ x: 4, z: 7, from: 0, to: 1 }, 'rose')
    b.column({ x: 4, z: 8, from: 0, to: 1 }, 'rose')
    b.column({ x: 10, z: 8, from: 3, to: 4 }, 'rose')
    b.column({ x: 8, z: 4, from: 3, to: 4 }, 'rose')
    b.column({ x: 10, z: 5, from: 3, to: 5 }, 'rose')
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
      links: [{ target: 'door' }, { target: 'garden-door' }],
    })
    b.gate({ id: 'garden-door', tile: [8, 5, 4], mode: 'toggle', initiallyOpen: true })
    b.orb({ tile: [4, 2, 8] })
    b.orb({ tile: [10, 5, 8] })
    b.orb({ tile: [10, 6, 5], optional: true })
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
    { type: 'walk', to: [4, 2, 8] },
    { type: 'walk', to: [4, 2, 7] },
    { type: 'walk', to: [3, 1, 5] },
    { type: 'operate', mechanism: 'swing' },
    { type: 'walk', to: [10, 5, 8] },
    { type: 'walk', to: [5, 1, 3] },
    { type: 'operate', mechanism: 'swing' },
    { type: 'walk', to: [2, 0, -2] },
  ],
})
```
