# 第 12 关 · 重量

## 状态与教学

T6.13a 第二稿，针对结构重复、选做规划和首步容错修订；尚未加入正式运行数据；由用户指定设计者编写，T6.14 按本稿实现。id `level-12`、chapter 4、revision 1，主线 10 步、全收集 11 步。选关主题短句：**把重量留下，把自己送回**。

教学点：两次把手的往返分配；预装箱、单向追台侧廊、回入口旁点灯。

「原来如此」：**第一程送箱到远庭，箱留远处守门；最后一程把自己送回最初看得见却进不去的灯笼。**

承接第十关人箱同程、第十一关转角换推向与中途停箱；本关用有限往返把远处重量和近处归门联系起来。入口旁灯笼呼应第一关，第十二关只是阶段一收束，十五灯塔结局仍在第十五关。首次教学、音乐及正式接入的共同要求见[第三、四章交接](chapter-3-4.md)，不沿用旧表的第七关升降入门。固定相机、投影连接、遮挡与乘坐规则不变；hints 为空，不恢复每关常驻说明。

## 屏幕草图与机关

屏幕 `(a,b)=(x-y,z-y)`，下图为开局；数字是实际高度。`@`起点、`G`灯笼、`o`必需、`*`选做、`C`箱、`^`压板、`D`门、`p`普通路面、`>`沿+a进入、`v`沿+b进入、`#`静轴；F=freight，C1为freight#1上的箱子；缩写加积木编号（如F0）表示活动路面，冒号后为高度。重叠投影依可见前景标注，不把轴或支撑当道路。

```text
 b\a      1     2     3     4     5     6
   0      ·    G0     ·     ·    p1    o1
   1      ·    D1     ·     ·    p1    v1
   2     p0  F0:1   C1:1     ·     ·    ^2
   3     @0    >2    >2    p2    p2    p2
   4      ·     ·     ·    o2    D2    ^3
   5      ·     ·     ·     ·    *3     ·
```

freight为x轴两站[0,2]，uses=2，#0后端、#1前端，crate-0预装#1。主线先登#0再带箱到远站，也允许先空人运箱、由单向廊追上。侧廊屏幕(2,3)、(3,3)都只能沿+a进入，不能从远庭倒走回家；箭头只限制进入，不是新单行规则。远站向+a卸至(6,2)的garden-weight，再从北侧+b箭头绕后，向+b推两次到weight(6,4)，开近岸door(2,1)。前端空出后登台，用第二次把手返近岸并点灯。取消独立收尾转盘。

所有岛屿、静态路面、支柱、结构色、机关偏移及把手位置均在下方完整参考实现中逐项列出；`b.island`生成地面结构，`b.column`含上下端点。未声明的档位默认0、把手不限次；无把手的机关不得擅自补把手。没有巡逻者、外部资源或ending。

## 光点、选做与陷阱

- orb-0：(7,1,1)，必需。
- orb-1：(6,2,6)，必需。
- orb-2：(8,3,8)，选做。

点灯回应：终点之外，3盏既有庭院灯亮起；只回应通关，不标记正确操作。第9、12关另有章节收束乐句，见共同声音稿。

转角garden-weight控制支廊门garden-door(5,4)，箱先留转角才能进入选做高庭(5,5)。收光后再绕后推往主线压板。若先推到底，选做门会关闭，需撤销该次推进；它不影响主线。主线必需光在(4,4)独立支路，不能把选做变成必需。

初始每一个合法动作都仍有解，尤其第一次直接拉把手只送箱过去，可从单向廊追上，仍能以10步完成。连续空用两次使空台提前返近岸、箱未卸载，有限资源会耗尽；提示建议撤销，撤销恢复次数、台位与箱位。保留需要观察的第二次决定，不把第一次试探当失败。

## 主线标准解法

| 步  | 动作                | 理由                                 |
| --- | ------------------- | ------------------------------------ |
| 1   | 走到 `(3,1,3)`      | 登预装箱子后端。                     |
| 2   | 操作 `freight` 一次 | 第一程人箱一起到远庭。               |
| 3   | 推 `crate-0` 一格   | 向+a把箱子卸到转角压板，选做门打开。 |
| 4   | 走到 `(6,2,6)`      | 先取独立支路的必需光。               |
| 5   | 走到 `(7,1,2)`      | 经北侧收光，从+b箭头绕到箱后。       |
| 6   | 推 `crate-0` 一格   | 向+b推一次，离开转角，选做门关闭。   |
| 7   | 推 `crate-0` 一格   | 再推到主线压板，入口旁归门打开。     |
| 8   | 走到 `(6,1,3)`      | 回运输台已空出的前端，准备返程。     |
| 9   | 操作 `freight` 一次 | 第二次把手载人返近岸，次数用尽。     |
| 10  | 走到 `(2,0,0)`      | 回入口旁灯笼，远近三处庭院灯回应。   |

## 全收集标准解法

依次执行下方自动验证基准的 `all` 数组，共 11 步；坐标是该动作发生时的世界坐标。一次行走允许自动经过中间路面，不强制额外点击接点，也不禁止其他同样合法的最优解。

## 指标与验收

| 最少／全收集 | 状态／死局 | 随机50步（500次，种子20261016） | 主线错觉／取舍 |
| ------------ | ---------- | ------------------------------- | -------------- |
| 10／11       | 626／409   | 0.0%                            | 7／3           |

第三章门槛≥40状态、40步随机≤35%，第四章≥60状态、50步随机≤25%；错觉≥2、取舍≥1。第十关按章节首关允许低2步的规定采用8步。0%是500次固定种子样本中零次通过，不代表概率严格为零。

设计已用实际规则、求解器、完整校验和可达状态的建筑运动采样验证。21组结构转移、84组角色转移，每组181姿态；覆盖顶板、岩层、其他底盘、同步联动和运载箱体。离散采样不构成连续碰撞证明，也不参与行走／推箱的投影连通。门收入自身路面属于既有设计，未宣称其槽体为连续物理仿真。验证范围和复跑方法见共同交接。

正式实现须按主线／全收集实际点击，并复验本稿干扰和撤销；截图核对起点、全部光点、箱体、把手和关键落脚点。设计预览的手机尺寸是375×667模拟，非真机；正式接线、评价目标、首次教学与章节声音仍由T6.14实现，不能拿临时预览代替正式验收。

## 自动验证基准

```json
{
  "metrics": {
    "minActions": 10,
    "minActionsAll": 11,
    "reachableStates": 626,
    "deadEndStates": 409,
    "illusions": 7,
    "tradeoffs": 3,
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
      "to": [8, 3, 8]
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
    "structuralTransitions": 21,
    "characterTransitions": 84,
    "samples": 181,
    "issues": []
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
  revision: 1,
  soundtrack: 'courtyard',
  hints: [],
  build: (b) => {
    b.island({ x: [-1, 2], z: [0, 4], y: -1, depth: 2 })
    b.island({ x: [3, 9], z: [1, 8], y: -1, depth: 3 })
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
    b.column({ x: 4, z: 5, from: 0, to: 1 }, 'rose')
    b.column({ x: 5, z: 5, from: 0, to: 1 }, 'rose')
    b.column({ x: 6, z: 5, from: 0, to: 1 }, 'rose')
    b.column({ x: 7, z: 5, from: 0, to: 1 }, 'rose')
    b.column({ x: 8, z: 4, from: 0, to: 1 }, 'rose')
    b.column({ x: 8, z: 5, from: 0, to: 1 }, 'rose')
    b.column({ x: 6, z: 6, from: 0, to: 1 }, 'rose')
    b.column({ x: 7, z: 6, from: 0, to: 1 }, 'rose')
    b.solid([6, 0, 2], 'terracotta')
    b.solid([6, 0, 1], 'terracotta')
    b.solid([7, 0, 1], 'terracotta')
    b.solid([7, 0, 2], 'terracotta')
    b.column({ x: 9, z: 7, from: 0, to: 2 }, 'rose')
    b.column({ x: 8, z: 8, from: 0, to: 2 }, 'rose')
    b.gate({ id: 'door', tile: [3, 1, 2], mode: 'hold' })
    b.mover({
      id: 'freight',
      origin: [3, 1, 3],
      axis: 'x',
      stops: [0, 2],
      blocks: [
        { offset: [0, 0, 0] },
        { offset: [1, 0, 0] },
        { offset: [0, -1, 0], kind: 'solid', color: 'teal' },
        { offset: [1, -1, 0], kind: 'solid', color: 'teal' },
      ],
      handle: { block: [3, 0, 8], face: 'z', uses: 2 },
    })
    b.plate({ id: 'weight', tile: [9, 3, 7], target: 'door', mode: 'hold' })
    b.plate({ id: 'garden-weight', tile: [8, 2, 4], target: 'garden-door', mode: 'hold' })
    b.gate({ id: 'garden-door', tile: [7, 2, 6], mode: 'hold' })
    b.crate({ mechanism: 'freight', block: 1 })
    b.orb({ tile: [7, 1, 1] })
    b.orb({ tile: [6, 2, 6] })
    b.orb({ tile: [8, 3, 8], optional: true })
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
    { type: 'walk', to: [7, 1, 2] },
    { type: 'push', crate: 'crate-0' },
    { type: 'push', crate: 'crate-0' },
    { type: 'walk', to: [6, 1, 3] },
    { type: 'operate', mechanism: 'freight' },
    { type: 'walk', to: [2, 0, 0] },
  ],
})
```
