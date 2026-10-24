# 第 15 关 · 归来

## 状态与教学

**T6.17 第五章设计稿，2026-10-24，尚未接入正式主线。** 目标revision 1，chapter 5。主线 **15步**，全收集 **16步**。选关短句：**先守去路，再把重量交给归门**。

教学点：联动揭开北侧箱位，完成远庭后换压归门；返回已经学会的庭院与桥。承接第十二关两阶段箱位、十三关动态压力、十四关双重守门。

「原来如此」：**去远庭时箱子必须留在原板；回来后再推去显露的北侧箱位，才能打开家门。**

衔接：主线在双重压力之上再增加跨阶段换板：home一边调整入口桥，一边移开远处遮挡塔；相同箱子承担去、回两种职责。无需把所有机关都点一遍才算完成。 不能仅凭步数或状态数断言体验更难；与第十二关连续试玩仍是T6.18～19验收项。共同合同见[第五章交接](chapter-5.md)。

文档原型参考（375×667低画质，非正式入口）：

![第15关手机设计参考](../assets/design-15-mobile.png)

## 屏幕草图

`(a,b)=(x-y,z-y)`，数字为高度；@起点、G灯笼、o必需、*选做、h按住板、D按住门、p普通路面。M为初始活动路面；各停靠的精确世界坐标见机关表与完整实现，结构、岛屿不当作道路。可同时有光点／压板时以光点符号优先。

```text
 b\a    0    1    2    3    4    5    6    7    8    9   10   11   12   13   14
   0    ·    ·   G1    ·    ·    ·    ·    ·    ·    ·    ·    ·   h1    ·    ·
   1    ·    ·    ·    ·   M1   M1   M1   M1    ·    ·    ·    ·   h2   h2   *2
   2    ·   M2   p3   D4   @4    ·    ·    ·    ·    ·    ·   D3   o3   p3   p3
   3    ·    ·    ·   o4    ·    ·    ·    ·    ·    ·    ·    ·   M4    ·    ·
   4    ·    ·    ·    ·    ·    ·    ·    ·    ·    ·    ·    ·    ·    ·    ·
   5    ·    ·    ·    ·    ·    ·    ·    ·    ·    ·    ·    ·    ·    ·    ·
   6    ·    ·    ·    ·    ·    ·    ·    ·    ·    ·    ·    ·    ·    ·    ·
   7    ·    ·    ·    ·    ·    ·    ·    ·    ·    ·    ·    ·    ·   D5   o5
```

## 积木清单与构图

完整参考实现中的`p(a,b,y)`严格转换为`[a+y,y,b+y]`；paths逐项列出全部静态路面，for循环只补对应柱体。岛屿范围、颜色、结构、全部活动块偏移与装饰均在同一参考实现中明确给出，实现者不得另补道路或改高度。

主体为两岸运输与后庭；沿用暖色积木、固定镜头、浅色顶板、青绿机关。静态路面rose，支撑与岛屿按代码；未声明的格子不可行走。开局需看清小生物、板、门、箱与光点，移动途中核对实体净空。

## 机关清单

| ID          | 定义                                                                                                        |
| ----------- | ----------------------------------------------------------------------------------------------------------- |
| ferry       | mover，原点[5, 1, 2]、轴x、停靠[0, 4]；把手{'block': [4, 0, 5], 'face': 'z', 'uses': 4}；联动[]             |
| lift        | mover，原点[16, 4, 7]、轴z、停靠[0, 4]；把手{'block': [16, 1, 7], 'face': 'x', 'uses': 2}；联动[]           |
| weight      | plate，路面[14, 2, 3]、hold，目标door                                                                       |
| weight-far  | plate，路面[15, 2, 3]、hold，目标far-door                                                                   |
| door        | gate，路面[14, 3, 5]、hold，目标—                                                                           |
| far-door    | gate，路面[18, 5, 12]、hold，目标—                                                                          |
| home-weight | plate，路面[13, 1, 1]、hold，目标home-door                                                                  |
| home-door   | gate，路面[7, 4, 6]、hold，目标—                                                                            |
| home        | rotator，中心[3, 2, 3]、初始档3；把手{'block': [8, 1, 7], 'face': 'z', 'uses': 1}；联动[{'target': 'veil'}] |
| veil        | mover，原点[18, 6, 3]、轴z、停靠[0, 3]；把手无；联动[]                                                      |

桥接就绪后允许自动寻路过桥到灯笼，不能强迫先登桥再单独点击；合法的提前联动和不同最优顺序必须保留。

## 光点与其他元素

```json
{
  "orbs": [
    {
      "tile": [7, 4, 7]
    },
    {
      "tile": [15, 3, 5]
    },
    {
      "tile": [19, 5, 12]
    },
    {
      "tile": [16, 2, 3],
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

静态光点引用上表世界坐标；巡逻按route顺序、pingpong往返，下一格失连或被占就等待。只按已完成玩家动作推进，不按现实时间，也不逐格推进。没有额外单向格；限次只按把手定义，不赠送次数。

## 主线标准解法

以下是求解器验证的最优路线之一，不禁止等长或更长的合法路线。

| 步  | 动作               | 目的                                             |
| --- | ------------------ | ------------------------------------------------ |
| 1   | 走到 `(7, 1, 2)`   | 登上箱子后方的运输台。                           |
| 2   | 操作 `ferry`       | 人箱同乘去远庭。                                 |
| 3   | 操作 `home`        | 联动接归桥并揭开北侧箱位；也可在返程阶段再做。   |
| 4   | 推 `crate-0` 一格  | 箱压第一板并把巡逻留在第二板，两扇远庭门同时开。 |
| 5   | 走到 `(16, 4, 7)`  | 沿门后路收第二束必需光，登远台。                 |
| 6   | 操作 `lift`        | 乘远台去外庭。                                   |
| 7   | 走到 `(19, 5, 12)` | 穿巡逻守住的门收外庭必需光。                     |
| 8   | 走到 `(16, 4, 11)` | 返回远台，准备完成最后一段远庭运输。             |
| 9   | 操作 `lift`        | 把人带回中庭，先完成远庭目标再换箱。             |
| 10  | 走到 `(15, 3, 5)`  | 绕到箱子南侧，准备向北推。                       |
| 11  | 推 `crate-0` 一格  | 把箱推到已显露的北板，角色跟进；家门打开。       |
| 12  | 走到 `(12, 1, 2)`  | 直接登回运输台；巡逻随后接管旧箱位。             |
| 13  | 操作 `ferry`       | 独自回家，仍保留一次空送往返余量。               |
| 14  | 走到 `(7, 4, 7)`   | 穿过箱子保持的家门，收近庭最后一束光。           |
| 15  | 走到 `(3, 1, 1)`   | 沿已接好的归桥到灯笼，开始十五灯与塔的演出。     |

## 选做、干扰与恢复

- 最可能的错误假设：揭开北位后立即换箱，会解除远庭通路；或者以为入口桥转过后必须把剩余次数用完。可以提前联动，不能提前换压。
- 选做：选做在巡逻远端支路，可以换压前取得，也可以按全收集基准在换压后利用巡逻接管旧板时补取。后者要理解压力交接：箱子去守家门，小生物暂时接管旧门；不能禁止这条合法路线或强迫额外操作。
- 恢复：ferry4次、lift2次、home1次；home一次联动同时揭挡并接归桥，不引入新机制或隐藏条件。用完资源或错误换板时提示建议撤销，撤销恢复全部位置、门、收光及额度。
- 斜对角看似接近不表示相连，移动中不接受新行走／操作；不要扩大点击来让非法路线成功。
- 不直接搬用旧混音、旧第五章方向或临时截图修改本稿；规则只调用core/rules.ts。

## 指标与验收

主线／全收集15／16，可达状态9640、死局8172，固定500次、种子20261016、60步随机通过率0.0%，主线错觉12、取舍4。0%仅表示固定样本零次通过。

第五章门槛保持≥80状态、随机≤20%、错觉≥2、取舍≥2。第十三关使用章首10步缓冲例外，其余仍12～24步。大量有限资源与错误箱位状态会形成死局，不能拿它们代替主观难度或恢复体验。正式实现必须保持本稿对象与指标，并验证提示、撤销、重开、旧十二关存档保留，以及桌面1280×720／手机375×667实际点击主线及全收集。

目标只在T6.18接入对应关卡时写入`src/game/levels/targets.ts`：

```json
{
  "minActions": 15,
  "minActionsAll": 16,
  "reachableStatesMin": 80,
  "randomWin": {
    "steps": 60,
    "maxRate": 0.2
  },
  "illusionsMin": 2,
  "tradeoffsMin": 2
}
```

## 自动验证基准

```json
{
  "metrics": {
    "minActions": 15,
    "minActionsAll": 16,
    "reachableStates": 9640,
    "deadEndStates": 8172,
    "illusions": 12,
    "tradeoffs": 4,
    "randomSteps": 60,
    "randomRate": 0
  },
  "all": [
    {
      "type": "walk",
      "to": [7, 1, 2]
    },
    {
      "type": "operate",
      "mechanism": "ferry"
    },
    {
      "type": "operate",
      "mechanism": "home"
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
      "to": [7, 4, 7]
    },
    {
      "type": "walk",
      "to": [3, 1, 1]
    }
  ],
  "counters": {
    "noPush": {
      "solved": false,
      "states": 300
    },
    "noPatrol": {
      "solved": false,
      "states": 60
    },
    "noHome": {
      "solved": false,
      "states": 60
    }
  },
  "clearance": {
    "structuralTransitions": 404,
    "characterTransitions": 2910,
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
  id: 'level-15',
  title: '归来',
  chapter: 5,
  revision: 1,
  soundtrack: 'courtyard',
  hints: [],
  ending: {
    lanterns: [
      [3, 1, 1],
      [1, -1, 5],
      [2, -1, 5],
      [3, -1, 5],
      [5, -1, 5],
      [9, 0, 7],
      [10, 0, 7],
      [12, 0, 7],
      [9, 0, 5],
      [13, 1, 7],
      [14, 1, 7],
      [15, 1, 7],
      [13, 1, 6],
      [18, 4, 11],
      [18, 4, 13],
    ],
    tower: Array.from({ length: 6 }, (_, i): Vec3 => [11, i + 1, 8]),
  },
  solution: [
    { type: 'walk', to: [7, 1, 2] },
    { type: 'operate', mechanism: 'ferry' },
    { type: 'operate', mechanism: 'home' },
    { type: 'push', crate: 'crate-0' },
    { type: 'walk', to: [16, 4, 7] },
    { type: 'operate', mechanism: 'lift' },
    { type: 'walk', to: [19, 5, 12] },
    { type: 'walk', to: [16, 4, 11] },
    { type: 'operate', mechanism: 'lift' },
    { type: 'walk', to: [15, 3, 5] },
    { type: 'push', crate: 'crate-0' },
    { type: 'walk', to: [12, 1, 2] },
    { type: 'operate', mechanism: 'ferry' },
    { type: 'walk', to: [7, 4, 7] },
    { type: 'walk', to: [3, 1, 1] },
  ],
  build: (b) => {
    b.island({ x: [1, 8], z: [1, 7], y: -1, depth: 2 })
    b.island({ x: [9, 12], z: [1, 8], y: 0, depth: 2 })
    b.island({ x: [13, 15], z: [2, 7], y: 1, depth: 2 })
    b.island({ x: [17, 18], z: [11, 13], y: 4, depth: 3 })
    const paths: [number, number, number][] = [
      [2, 0, 1],
      [2, 2, 3],
      [3, 2, 4],
      [4, 2, 4],
      [3, 3, 4],
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
      const floor = a === 14 && z === 2 ? y : a >= 12 && z >= 7 ? 5 : a < 5 ? 0 : a + y >= 13 && z + y >= 2 ? 2 : 1
      for (let h = floor; h < y; h++) b.solid([a + y, h, z + y], 'rose')
    }
    b.solid([4, 0, 5], 'teal')
    b.mover({
      id: 'ferry',
      origin: p(4, 1, 1),
      axis: 'x',
      stops: [0, 4],
      blocks: [{ offset: [0, 0, 0] }, { offset: [1, 0, 0] }, { offset: [2, 0, 0] }, { offset: [3, 0, 0] }],
      handle: { block: [4, 0, 5], face: 'z', uses: 4 },
    })
    b.mover({
      id: 'lift',
      origin: p(12, 3, 4),
      axis: 'z',
      stops: [0, 4],
      blocks: [{ offset: [0, 0, 0] }],
      handle: { block: [16, 1, 7], face: 'x', uses: 2 },
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
    b.orb({ tile: p(3, 3, 4) })
    b.orb({ tile: p(12, 2, 3) })
    b.orb({ tile: p(14, 7, 5) })
    b.orb({ tile: p(14, 1, 2), optional: true })
    b.tree([1, -1, 4])
    b.flower([6, -1, 3])
    b.window({ pos: [14, 1, 3], face: 'x' })
    b.plate({
      id: 'home-weight',
      tile: p(12, 0, 1),
      mode: 'hold',
      target: 'home-door',
    })
    b.gate({ id: 'home-door', tile: p(3, 2, 4), mode: 'hold' })
    b.column({ x: 3, z: 3, from: 0, to: 2 }, 'teal')
    b.column({ x: 8, z: 7, from: 0, to: 1 }, 'teal')
    b.rotator({
      id: 'home',
      pivot: p(1, 1, 2),
      initialStep: 3,
      links: [{ target: 'veil' }],
      blocks: [{ offset: [1, 0, 0] }],
      handle: { block: [8, 1, 7], face: 'z', uses: 1 },
    })
    b.mover({
      id: 'veil',
      origin: [18, 6, 3],
      axis: 'z',
      stops: [0, 3],
      initialStop: 1,
      blocks: [
        { offset: [0, 0, 0], kind: 'solid', color: 'teal' },
        { offset: [0, 1, 0], kind: 'solid', color: 'teal' },
        { offset: [0, 2, 0], kind: 'solid', color: 'teal' },
      ],
    })
    b.column({ x: 11, z: 8, from: 1, to: 6 }, 'rose')
    b.start(p(4, 2, 4))
    b.goal(p(2, 0, 1))
  },
})
```

## 十五盏灯与塔

ending.lanterns第一个必须与goal完全相同，随后14盏按主线第一至十四关的记忆顺序点亮；它们在现有岛屿地面范围内，不能导入真实存档中的角色中途坐标。ending.tower精确引用(11,1～6,8)六块静态柱体，不能在Finale中写死坐标或新建隐藏路面。整体是第一关暖色庭院与入口灯笼的视觉回响，当前规则下的新谜题不复制旧第一关布局。

保留架构时序：终点先亮，其余每隔0.45秒点一盏；全部亮后0.6秒塔亮，再0.9秒显示“谢谢游玩／回到标题”。减少动态沿用现有简化。通关后不再接受谜题动作；撤销须取消演出、声音和结尾页面计时，恢复所有灯与塔。按住门和巡逻不能额外触发整套成功音。Ending中不再显示“第五章即将开放”，也不自动开放未实现挑战章。
