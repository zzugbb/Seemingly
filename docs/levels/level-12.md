# 第 12 关 · 重量

## 状态与教学

T6.13 设计定稿，尚未加入正式运行数据；由用户指定设计者编写，T6.14 按本稿实现。id `level-12`、chapter 4、revision 1，主线 13 步、全收集 14 步。选关主题短句：**留箱，再送自己**。

教学点：三站运输台与两次把手；箱先留在中站，人再独自乘第二程。

「原来如此」：**两次不是往返两次：第一程带箱，第二程只带人；箱子必须留在中站替自己守门。**

综合第七关的中站离台、第十关的重量与第十一关的绕后推箱；此关结束阶段一，后续第五章才引入巡逻者。首次教学、音乐及正式接入的共同要求见[第三、四章交接](chapter-3-4.md)，不沿用旧表的第七关升降入门。固定相机、投影连接、遮挡与乘坐规则不变；hints 为空，不恢复每关常驻说明。

## 屏幕草图与机关

屏幕 `(a,b)=(x-y,z-y)`，下图为开局；数字是实际高度。`@`起点、`G`灯笼、`o`必需、`*`选做、`C`箱、`^`压板、`D`门、`v`沿+b进入的箭头格、`p`普通路面、`#`静轴；F=freight、R=finish，缩写加积木编号（如F0）表示活动路面，冒号后为高度。重叠投影依可见前景标注，不把轴或支撑当道路。

```text
 b\a      0     1     2     3     4     5     6     7     8     9    10    11
   0      ·     ·     ·     ·    *1    p1    o1     ·     ·     ·     ·     ·
   1      ·     ·     ·     ·     ·    p1    v1     ·     ·     ·     ·     ·
   2     p0    C0  F0:1  F1:1     ·     ·    p2     ·     ·    p2     ·     ·
   3     o0    @0     ·     ·     ·     ·    p2     ·     ·    D2     ·     ·
   4      ·     ·     ·     ·     ·     ·    ^3     ·     ·    o2  R0:4    #4
   5      ·     ·     ·     ·     ·     ·     ·     ·     ·     ·     ·     ·
   6      ·     ·     ·     ·     ·     ·     ·     ·     ·     ·     ·    G5
```

freight 为 x 轴三站[0,2,5]，uses=2，只有#0入口与#1前沿，无后翼。中站先向+a卸到转角(6,2)，经北侧单向入口(6,1)绕后，再向+b推两次，直到双框压板(6,4)。人回前沿才用第二次把手到远站；门在(9,3)，后段 finish 独立不限次。压板后移一格，给回台触点让出箱体遮挡净空。

所有岛屿、静态路面、支柱、结构色、机关偏移及把手位置均在下方完整参考实现中逐项列出；`b.island`生成地面结构，`b.column`含上下端点。未声明的档位默认0、把手不限次；无把手的机关不得擅自补把手。没有巡逻者、外部资源或ending。

## 光点、选做与陷阱

- orb-0：(0,0,3)，必需。
- orb-1：(7,1,1)，必需。
- orb-2：(5,1,1)，选做。
- orb-3：(11,2,6)，必需。

北侧选做应在第二程之前完成；从中站侧廊取光，再回运输台。两次把手耗尽后不能把台拉回中站，漏掉选做不妨碍主线，但本局全收集需撤销第二程或重开。

开局就拉运输台会把唯一装载口送走，余下一次无法完成箱与人的两段运输，属于明确的限次资源死局。把手亮点熄灭可见；提示只建议撤销，不高亮无解动作。撤销恢复用量、台位、箱位、门与步数，重开恢复两次。

## 主线标准解法

| 步  | 动作                | 理由                                       |
| --- | ------------------- | ------------------------------------------ |
| 1   | 走到 `(0,0,2)`      | 绕到装载方向，取得起点光点。               |
| 2   | 推 `crate-0` 一格   | 把箱子推上入口。                           |
| 3   | 推 `crate-0` 一格   | 再推到前沿，人停在入口。                   |
| 4   | 操作 `freight` 一次 | 第一次把手，人箱到中站。                   |
| 5   | 推 `crate-0` 一格   | 向+a卸到转角。                             |
| 6   | 走到 `(7,1,2)`      | 经北侧收光，从+b箭头进入箱后。             |
| 7   | 推 `crate-0` 一格   | 第一次向+b推向压板。                       |
| 8   | 推 `crate-0` 一格   | 再推一次，箱子留在压板，门打开。           |
| 9   | 走到 `(6,1,3)`      | 离开静台，重新登运输台前沿。               |
| 10  | 操作 `freight` 一次 | 第二次把手只运人到远站，两点用尽。         |
| 11  | 走到 `(14,4,8)`     | 经门与必需光点，登后段转盘。               |
| 12  | 操作 `finish` 一次  | 后段短桥载人接灯塔。                       |
| 13  | 走到 `(16,5,11)`    | 点灯；完成卡回到选关，显示第五章即将开放。 |

## 全收集标准解法

依次执行下方自动验证基准的 `all` 数组，共 14 步；坐标是该动作发生时的世界坐标。一次行走允许自动经过中间路面，不强制额外点击接点，也不禁止其他同样合法的最优解。

## 指标与验收

| 最少／全收集 | 状态／死局 | 随机50步（500次，种子20261016） | 主线错觉／取舍 |
| ------------ | ---------- | ------------------------------- | -------------- |
| 13／14       | 686／340   | 0.0%                            | 6／2           |

第三章门槛≥40状态、40步随机≤35%，第四章≥60状态、50步随机≤25%；错觉≥2、取舍≥1。第十关按章节首关允许低2步的规定采用8步。0%是500次固定种子样本中零次通过，不代表概率严格为零。

设计已用实际规则、求解器、完整校验和可达状态的建筑运动采样验证。104组结构转移、568组角色转移，每组181姿态；覆盖顶板、岩层、其他底盘、同步联动和运载箱体。离散采样不构成连续碰撞证明，也不参与行走／推箱的投影连通。门收入自身路面属于既有设计，未宣称其槽体为连续物理仿真。验证范围和复跑方法见共同交接。

正式实现须按主线／全收集实际点击，并复验本稿干扰和撤销；截图核对起点、全部光点、箱体、把手和关键落脚点。设计预览的手机尺寸是375×667模拟，非真机；正式接线、评价目标、首次教学与章节声音仍由T6.14实现，不能拿临时预览代替正式验收。

## 自动验证基准

```json
{
  "metrics": {
    "minActions": 13,
    "minActionsAll": 14,
    "reachableStates": 686,
    "deadEndStates": 340,
    "illusions": 6,
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
      "to": [14, 4, 8]
    },
    {
      "type": "operate",
      "mechanism": "finish"
    },
    {
      "type": "walk",
      "to": [16, 5, 11]
    }
  ],
  "clearance": {
    "structuralTransitions": 104,
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
  id: 'level-12',
  title: '重量',
  chapter: 4,
  revision: 1,
  soundtrack: 'courtyard',
  hints: [],
  build: (b) => {
    b.island({ x: [-1, 2], z: [1, 4], y: -1, depth: 2 })
    b.island({ x: [3, 6], z: [1, 4], y: -1, depth: 2 })
    b.island({ x: [7, 9], z: [4, 7], y: 0, depth: 3 })
    b.island({ x: [14, 16], z: [6, 11], y: 3, depth: 3 })
    b.path([0, 0, 2], 'terracotta')
    b.path([0, 0, 3], 'terracotta')
    b.path([1, 0, 2], 'terracotta')
    b.path([1, 0, 3], 'terracotta')
    b.path([5, 1, 1], 'terracotta')
    b.path([8, 2, 4], 'rose')
    b.path([6, 1, 2], 'terracotta')
    b.path([6, 1, 1], 'terracotta')
    b.path([7, 1, 1], 'terracotta')
    b.path([7, 1, 2], 'terracotta', { oneWay: '+b' })
    b.path([11, 2, 4], 'rose')
    b.path([11, 2, 5], 'rose')
    b.path([11, 2, 6], 'rose')
    b.path([16, 5, 11], 'rose')
    b.path([8, 2, 5], 'rose')
    b.path([9, 3, 7], 'rose')
    b.solid([3, 0, 4], 'teal')
    b.solid([8, 1, 4], 'rose')
    b.solid([5, 0, 1], 'terracotta')
    b.solid([11, 1, 4], 'rose')
    b.solid([11, 1, 5], 'rose')
    b.solid([11, 1, 6], 'rose')
    b.solid([15, 4, 8], 'teal')
    b.solid([14, 4, 11], 'teal')
    b.solid([16, 4, 11], 'rose')
    b.solid([8, 1, 5], 'rose')
    b.column({ x: 9, z: 7, from: 1, to: 2 }, 'rose')
    b.mover({
      id: 'freight',
      origin: [3, 1, 3],
      axis: 'x',
      stops: [0, 2, 5],
      blocks: [
        { offset: [0, 0, 0] },
        { offset: [1, 0, 0] },
        { offset: [0, -1, 0], kind: 'solid', color: 'teal' },
        { offset: [1, -1, 0], kind: 'solid', color: 'teal' },
      ],
      handle: { block: [3, 0, 4], face: 'z', uses: 2 },
    })
    b.plate({ id: 'weight', tile: [9, 3, 7], mode: 'hold', target: 'door' })
    b.gate({ id: 'door', tile: [11, 2, 5], mode: 'hold' })
    b.rotator({
      id: 'finish',
      pivot: [15, 4, 8],
      blocks: [{ offset: [-1, 0, 0] }],
      handle: { block: [14, 4, 11], face: 'z' },
    })
    b.crate({ tile: [1, 0, 2] })
    b.orb({ tile: [0, 0, 3] })
    b.orb({ tile: [7, 1, 1] })
    b.orb({ tile: [5, 1, 1], optional: true })
    b.orb({ tile: [11, 2, 6] })
    b.tree([-1, -1, 4])
    b.flower([9, 0, 7])
    b.window({ pos: [16, 4, 11], face: 'x' })
    b.start([1, 0, 3])
    b.goal([16, 5, 11])
  },
  solution: [
    { type: 'walk', to: [0, 0, 2] },
    { type: 'push', crate: 'crate-0' },
    { type: 'push', crate: 'crate-0' },
    { type: 'operate', mechanism: 'freight' },
    { type: 'push', crate: 'crate-0' },
    { type: 'walk', to: [7, 1, 2] },
    { type: 'push', crate: 'crate-0' },
    { type: 'push', crate: 'crate-0' },
    { type: 'walk', to: [6, 1, 3] },
    { type: 'operate', mechanism: 'freight' },
    { type: 'walk', to: [14, 4, 8] },
    { type: 'operate', mechanism: 'finish' },
    { type: 'walk', to: [16, 5, 11] },
  ],
})
```
