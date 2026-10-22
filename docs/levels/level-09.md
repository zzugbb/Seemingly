# 第 9 关 · 牵引

## 状态与教学

T6.13 设计定稿，尚未加入正式运行数据；由用户指定设计者编写，T6.14 按本稿实现。id `level-09`、chapter 3、revision 1，主线 9 步、全收集 15 步。选关主题短句：**留在远处的开关**。

教学点：第一次触发压板与切换门；停到压板才生效，经过不生效。

「原来如此」：**走过压板不等于按下开关，要停住一次；门打开后，即使离开压板也会保持。**

沿用第八关的联动语法，将一条选做支路替换成必须专门落脚的开门操作；第十关对比“切换后保留”与“双框压着才保留”。首次教学、音乐及正式接入的共同要求见[第三、四章交接](chapter-3-4.md)，不沿用旧表的第七关升降入门。固定相机、投影连接、遮挡与乘坐规则不变；hints 为空，不恢复每关常驻说明。

## 屏幕草图与机关

屏幕 `(a,b)=(x-y,z-y)`，下图为开局；数字是实际高度。`@`起点、`G`灯笼、`o`必需、`*`选做、`C`箱、`^`压板、`D`门、`p`普通路面、`#`静轴；P=pair、R=remote，缩写加积木编号（如P0）表示活动路面，冒号后为高度。重叠投影依可见前景标注，不把轴或支撑当道路。

```text
 b\a     -1     0     1     2     3     4     5     6     7
  -1      ·     ·     ·    *0     ·     ·     ·     ·     ·
   0      ·     ·     ·     ·     ·     ·    ^3     ·     ·
   1      ·     ·     ·     ·     ·     ·     ·     ·     ·
   2     @0  P0:1     ·    #1     ·     ·     ·    #4  R0:4
   3      ·     ·     ·     ·     ·     ·     ·     ·  R1:4
   4      ·     ·     ·     ·     ·     ·     ·    D5     ·
   5      ·     ·     ·    o2     ·     ·     ·    G5     ·
```

pair 与 remote 的两档相差关系沿用联动语法，pair 的把手改挂在必需庭院柱脚。latch 在后庭(8,3,3)，mode省略即trigger，once省略；它绑定无把手、初始关闭的 toggle 门 door。门在原灯塔落脚点(11,5,9)，灯笼后移一格到(11,5,10)。只改变门，不联动转盘；反复落脚会再次切换。

所有岛屿、静态路面、支柱、结构色、机关偏移及把手位置均在下方完整参考实现中逐项列出；`b.island`生成地面结构，`b.column`含上下端点。未声明的档位默认0、把手不限次；无把手的机关不得擅自补把手。没有巡逻者、外部资源或ending。

## 光点、选做与陷阱

- orb-0：(4,2,7)，必需。
- orb-1：(2,0,-1)，选做。

北侧选做只在 pair 档3接上。主线本来从档2换乘，必须暂缓换乘，带着近桥去北侧，再转回档2。额外四次转动是绕回换乘相位的结果，并非主线强迫空转；两个进度分别历史累计，不要求一次拿全。

越过 latch 后直接点远桥，压板不触发，门仍关；需单独停下再离开。开门后再踩一次会关门，仍可第三次打开，零死局。北侧选做不能从起点隔空点击。

## 主线标准解法

| 步  | 动作             | 理由                                 |
| --- | ---------------- | ------------------------------------ |
| 1   | 走到 `(1,1,3)`   | 登近桥。                             |
| 2   | 操作 `pair` 一次 | 两桥转至收光停靠。                   |
| 3   | 走到 `(4,2,7)`   | 收必需光点。                         |
| 4   | 走到 `(3,1,5)`   | 回到近桥。                           |
| 5   | 操作 `pair` 一次 | 两桥对齐换乘接口。                   |
| 6   | 走到 `(8,3,3)`   | 经远桥后翼，专门停在压板上开门。     |
| 7   | 走到 `(9,4,5)`   | 离压板回到远桥后翼；切换门保持打开。 |
| 8   | 操作 `pair` 一次 | 同一把手载人转至出口。               |
| 9   | 走到 `(11,5,10)` | 穿过已开的门到灯笼。                 |

## 全收集标准解法

依次执行下方自动验证基准的 `all` 数组，共 15 步；坐标是该动作发生时的世界坐标。一次行走允许自动经过中间路面，不强制额外点击接点，也不禁止其他同样合法的最优解。

## 指标与验收

| 最少／全收集 | 状态／死局 | 随机40步（500次，种子20261016） | 主线错觉／取舍 |
| ------------ | ---------- | ------------------------------- | -------------- |
| 9／15        | 224／0     | 7.2%                            | 7／3           |

第三章门槛≥40状态、40步随机≤35%，第四章≥60状态、50步随机≤25%；错觉≥2、取舍≥1。第十关按章节首关允许低2步的规定采用8步。0%是500次固定种子样本中零次通过，不代表概率严格为零。

设计已用实际规则、求解器、完整校验和可达状态的建筑运动采样验证。8组结构转移、64组角色转移，每组181姿态；覆盖顶板、岩层、其他底盘、同步联动和运载箱体。离散采样不构成连续碰撞证明，也不参与行走／推箱的投影连通。门收入自身路面属于既有设计，未宣称其槽体为连续物理仿真。验证范围和复跑方法见共同交接。

正式实现须按主线／全收集实际点击，并复验本稿干扰和撤销；截图核对起点、全部光点、箱体、把手和关键落脚点。设计预览的手机尺寸是375×667模拟，非真机；正式接线、评价目标、首次教学与章节声音仍由T6.14实现，不能拿临时预览代替正式验收。

## 自动验证基准

```json
{
  "metrics": {
    "minActions": 9,
    "minActionsAll": 15,
    "reachableStates": 224,
    "deadEndStates": 0,
    "illusions": 7,
    "tradeoffs": 3,
    "randomSteps": 40,
    "randomRate": 0.072
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
      "type": "operate",
      "mechanism": "pair"
    },
    {
      "type": "walk",
      "to": [2, 0, -1]
    },
    {
      "type": "walk",
      "to": [3, 1, 1]
    },
    {
      "type": "operate",
      "mechanism": "pair"
    },
    {
      "type": "operate",
      "mechanism": "pair"
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
      "to": [11, 5, 10]
    }
  ],
  "clearance": {
    "structuralTransitions": 8,
    "characterTransitions": 64,
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
    b.island({ x: [1, 6], z: [-1, 7], y: -1, depth: 3 })
    b.island({ x: [8, 12], z: [3, 10], y: 2, depth: 3 })
    b.path([-1, 0, 2], 'terracotta')
    b.path([4, 2, 7], 'rose')
    b.path([8, 3, 3], 'terracotta')
    b.path([11, 5, 9], 'rose')
    b.path([2, 0, -1], 'terracotta')
    b.path([11, 5, 10], 'rose')
    b.column({ x: 3, z: 3, from: 0, to: 1 }, 'teal')
    b.column({ x: 4, z: 7, from: 0, to: 1 }, 'rose')
    b.column({ x: 10, z: 6, from: 3, to: 4 }, 'teal')
    b.column({ x: 11, z: 9, from: 3, to: 4 }, 'rose')
    b.column({ x: 11, z: 10, from: 3, to: 4 }, 'rose')
    b.rotator({
      id: 'pair',
      pivot: [3, 1, 3],
      blocks: [
        { offset: [-2, 0, 0] },
        { offset: [-1, 0, 0], kind: 'solid', color: 'teal' },
        { offset: [-2, -1, 0], kind: 'solid', color: 'teal' },
        { offset: [-1, -1, 0], kind: 'solid', color: 'teal' },
      ],
      handle: { block: [4, 0, 7], face: 'z' },
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
    b.plate({ id: 'latch', tile: [8, 3, 3], target: 'door' })
    b.gate({ id: 'door', tile: [11, 5, 9], mode: 'toggle', initiallyOpen: false })
    b.orb({ tile: [4, 2, 7] })
    b.orb({ tile: [2, 0, -1], optional: true })
    b.tree([-2, -1, 3])
    b.flower([6, -1, 7])
    b.window({ pos: [11, 3, 10], face: 'x' })
    b.start([-1, 0, 2])
    b.goal([11, 5, 10])
  },
  solution: [
    { type: 'walk', to: [1, 1, 3] },
    { type: 'operate', mechanism: 'pair' },
    { type: 'walk', to: [4, 2, 7] },
    { type: 'walk', to: [3, 1, 5] },
    { type: 'operate', mechanism: 'pair' },
    { type: 'walk', to: [8, 3, 3] },
    { type: 'walk', to: [9, 4, 5] },
    { type: 'operate', mechanism: 'pair' },
    { type: 'walk', to: [11, 5, 10] },
  ],
})
```
