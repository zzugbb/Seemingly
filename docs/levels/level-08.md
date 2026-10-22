# 第 8 关 · 联动

## 状态与教学

T6.13 设计定稿，尚未加入正式运行数据；由用户指定设计者编写，T6.14 按本稿实现。id `level-08`、chapter 3、revision 1，主线 8 步、全收集 9 步。选关主题短句：**一处转轮，两座桥**。

教学点：第一次一个把手同时驱动两座转盘；被联动桥不设独立把手。

「原来如此」：**第二座桥没有自己的转轮：换乘后仍要点击同一个转轮，才能由它送向灯塔。**

第七关可分别调台与桥；本关取消第二把手，练习同时观察两处响应；第九关再把操作位置与门的状态分开。首次教学、音乐及正式接入的共同要求见[第三、四章交接](chapter-3-4.md)，不沿用旧表的第七关升降入门。固定相机、投影连接、遮挡与乘坐规则不变；hints 为空，不恢复每关常驻说明。

## 屏幕草图与机关

屏幕 `(a,b)=(x-y,z-y)`，下图为开局；数字是实际高度。`@`起点、`G`灯笼、`o`必需、`*`选做、`C`箱、`^`压板、`D`门、`p`普通路面、`#`静轴；P=pair、R=remote，缩写加积木编号（如P0）表示活动路面，冒号后为高度。重叠投影依可见前景标注，不把轴或支撑当道路。

```text
 b\a     -1     0     1     2     3     4     5     6     7
   0      ·     ·     ·     ·     ·     ·    *3     ·     ·
   1      ·     ·     ·     ·     ·     ·     ·     ·     ·
   2     @0  P0:1     ·    #1     ·     ·     ·    #4  R0:4
   3      ·     ·     ·     ·     ·     ·     ·     ·  R1:4
   4      ·     ·     ·     ·     ·     ·     ·    G5     ·
   5      ·     ·     ·    o2     ·     ·     ·     ·     ·
```

pair 初始0、remote 初始2；pair.links=[{target:"remote"}]，同向同时转动，两者永远相差两档。pair 仅#0可走，其余三块是支撑，禁止补为路面；remote 有前沿#0与后翼#1，无把手。pair 档1接必需庭院，档2接 remote 档0，随后两者再转一次，remote 档1接出口。

所有岛屿、静态路面、支柱、结构色、机关偏移及把手位置均在下方完整参考实现中逐项列出；`b.island`生成地面结构，`b.column`含上下端点。未声明的档位默认0、把手不限次；无把手的机关不得擅自补把手。没有巡逻者、外部资源或ending。

## 光点、选做与陷阱

- orb-0：(4,2,7)，必需。
- orb-1：(8,3,3)，选做。

在 remote 档0，后翼接低一层的后庭。先离桥收取，再回后翼，仍用唯一转轮转向出口；不能为了简化而给 remote 加把手。

只盯着近桥会以为远桥缺少操作入口；转动同一转轮可观察两处同时提亮。留在 pair 上继续转到档3会离开换乘口，但四档循环可找回，零死局。

## 主线标准解法

| 步  | 动作             | 理由                                   |
| --- | ---------------- | -------------------------------------- |
| 1   | 走到 `(1,1,3)`   | 登近桥唯一可走端点。                   |
| 2   | 操作 `pair` 一次 | 两桥一起转，近桥接收光庭院。           |
| 3   | 走到 `(4,2,7)`   | 离桥收必需光点，远桥仍保持同步。       |
| 4   | 走到 `(3,1,5)`   | 回到近桥端点。                         |
| 5   | 操作 `pair` 一次 | 近桥档2与远桥档0同时到位，形成换乘口。 |
| 6   | 走到 `(9,4,6)`   | 换乘远桥前沿。                         |
| 7   | 操作 `pair` 一次 | 继续点击同一转轮，远桥载人到出口方向。 |
| 8   | 走到 `(11,5,9)`  | 点灯。                                 |

## 全收集标准解法

依次执行下方自动验证基准的 `all` 数组，共 9 步；坐标是该动作发生时的世界坐标。一次行走允许自动经过中间路面，不强制额外点击接点，也不禁止其他同样合法的最优解。

## 指标与验收

| 最少／全收集 | 状态／死局 | 随机40步（500次，种子20261016） | 主线错觉／取舍 |
| ------------ | ---------- | ------------------------------- | -------------- |
| 8／9         | 90／0      | 18.8%                           | 5／3           |

第三章门槛≥40状态、40步随机≤35%，第四章≥60状态、50步随机≤25%；错觉≥2、取舍≥1。第十关按章节首关允许低2步的规定采用8步。0%是500次固定种子样本中零次通过，不代表概率严格为零。

设计已用实际规则、求解器、完整校验和可达状态的建筑运动采样验证。4组结构转移、28组角色转移，每组181姿态；覆盖顶板、岩层、其他底盘、同步联动和运载箱体。离散采样不构成连续碰撞证明，也不参与行走／推箱的投影连通。门收入自身路面属于既有设计，未宣称其槽体为连续物理仿真。验证范围和复跑方法见共同交接。

正式实现须按主线／全收集实际点击，并复验本稿干扰和撤销；截图核对起点、全部光点、箱体、把手和关键落脚点。设计预览的手机尺寸是375×667模拟，非真机；正式接线、评价目标、首次教学与章节声音仍由T6.14实现，不能拿临时预览代替正式验收。

## 自动验证基准

```json
{
  "metrics": {
    "minActions": 8,
    "minActionsAll": 9,
    "reachableStates": 90,
    "deadEndStates": 0,
    "illusions": 5,
    "tradeoffs": 3,
    "randomSteps": 40,
    "randomRate": 0.188
  },
  "all": [
    {
      "type": "walk",
      "to": [1, 1, 3]
    },
    {
      "type": "operate",
      "mechanism": "pair"
    },
    {
      "type": "walk",
      "to": [4, 2, 7]
    },
    {
      "type": "walk",
      "to": [3, 1, 5]
    },
    {
      "type": "operate",
      "mechanism": "pair"
    },
    {
      "type": "walk",
      "to": [8, 3, 3]
    },
    {
      "type": "walk",
      "to": [9, 4, 5]
    },
    {
      "type": "operate",
      "mechanism": "pair"
    },
    {
      "type": "walk",
      "to": [11, 5, 9]
    }
  ],
  "clearance": {
    "structuralTransitions": 4,
    "characterTransitions": 28,
    "samples": 181,
    "issues": []
  }
}
```

## 完整参考实现

```ts
import { defineLevel } from './builders'

export default defineLevel({
  id: 'level-08',
  title: '联动',
  chapter: 3,
  revision: 1,
  soundtrack: 'courtyard',
  hints: [],
  build: (b) => {
    b.island({ x: [-2, 0], z: [1, 3], y: -1, depth: 2 })
    b.island({ x: [1, 6], z: [0, 7], y: -1, depth: 3 })
    b.island({ x: [8, 12], z: [3, 9], y: 2, depth: 3 })
    b.path([-1, 0, 2], 'terracotta')
    b.path([4, 2, 7], 'rose')
    b.path([8, 3, 3], 'terracotta')
    b.path([11, 5, 9], 'rose')
    b.column({ x: 3, z: 3, from: 0, to: 1 }, 'teal')
    b.solid([5, 0, 7], 'teal')
    b.column({ x: 4, z: 7, from: 0, to: 1 }, 'rose')
    b.column({ x: 10, z: 6, from: 3, to: 4 }, 'teal')
    b.column({ x: 11, z: 9, from: 3, to: 4 }, 'rose')
    b.rotator({
      id: 'pair',
      pivot: [3, 1, 3],
      blocks: [
        { offset: [-2, 0, 0] },
        { offset: [-1, 0, 0], kind: 'solid', color: 'teal' },
        { offset: [-2, -1, 0], kind: 'solid', color: 'teal' },
        { offset: [-1, -1, 0], kind: 'solid', color: 'teal' },
      ],
      handle: { block: [5, 0, 7], face: 'z' },
      links: [{ target: 'remote' }],
    })
    b.rotator({
      id: 'remote',
      pivot: [10, 4, 6],
      initialStep: 2,
      blocks: [
        { offset: [-1, 0, 0] },
        { offset: [-1, 0, -1] },
        { offset: [-1, -1, 0], kind: 'solid', color: 'teal' },
        { offset: [-1, -1, -1], kind: 'solid', color: 'teal' },
      ],
    })
    b.orb({ tile: [4, 2, 7] })
    b.orb({ tile: [8, 3, 3], optional: true })
    b.tree([-2, -1, 3])
    b.flower([6, -1, 7])
    b.window({ pos: [11, 3, 9], face: 'x' })
    b.start([-1, 0, 2])
    b.goal([11, 5, 9])
  },
  solution: [
    { type: 'walk', to: [1, 1, 3] },
    { type: 'operate', mechanism: 'pair' },
    { type: 'walk', to: [4, 2, 7] },
    { type: 'walk', to: [3, 1, 5] },
    { type: 'operate', mechanism: 'pair' },
    { type: 'walk', to: [9, 4, 6] },
    { type: 'operate', mechanism: 'pair' },
    { type: 'walk', to: [11, 5, 9] },
  ],
})
```
