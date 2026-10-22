# 第 11 关 · 越界

## 状态与教学

T6.13 设计定稿，尚未加入正式运行数据；由用户指定设计者编写，T6.14 按本稿实现。id `level-11`、chapter 4、revision 1，主线 10 步、全收集 11 步。选关主题短句：**转过桥，再换推向**。

教学点：推箱过高低错觉，转盘改变推箱朝向，侧向绕到箱后；首次出现单向入口。

「原来如此」：**箱子随桥转后，原来的后方已经换了方向；要从高侧廊绕到另一侧，再推向压板。**

第十关是直线装卸，本关用转盘改变箱与人的相对推向，并把推箱后的站位变成下一步资源。第十二关再加入有限操作次数。首次教学、音乐及正式接入的共同要求见[第三、四章交接](chapter-3-4.md)，不沿用旧表的第七关升降入门。固定相机、投影连接、遮挡与乘坐规则不变；hints 为空，不恢复每关常驻说明。

## 屏幕草图与机关

屏幕 `(a,b)=(x-y,z-y)`，下图为开局；数字是实际高度。`@`起点、`G`灯笼、`o`必需、`*`选做、`C`箱、`^`压板、`D`门、`v`沿+b进入的箭头格、`p`普通路面、`#`静轴；T=turntable、R=finish，缩写加积木编号（如T0）表示活动路面，冒号后为高度。重叠投影依可见前景标注，不把轴或支撑当道路。

```text
 b\a      1     2     3     4     5     6     7     8
   0      ·   p-1   p-1     ·     ·     ·     ·     ·
   1      ·   C-1   @-1     ·     ·     ·     ·     ·
   2      ·  T0:1  T1:1    #1     ·     ·     ·     ·
   3      ·     ·     ·     ·     ·     ·     ·     ·
   4    *-1   p-1   p-1     ·    o3    p3     ·     ·
   5      ·     ·    ^2    p2    v3    D3     ·     ·
   6      ·     ·     ·     ·     ·    o3  R0:4    #4
   7      ·     ·     ·     ·     ·     ·     ·     ·
   8      ·     ·     ·     ·     ·     ·     ·    G5
```

turntable 的外端#0偏移(-2,0,0)，内端#1偏移(-1,0,0)，两端均可走，无额外下层梁。箱子从低处屏幕(2,1)推到外端(2,2)，人另登内端再转一次；此后箱在(4,4)，人在(4,3)。先向+b推出到转角(4,5)，经(5,4)高廊到(5,5)箱后，再向-a压到(3,5)。箭头在(5,5)、方向+b，只限制进入方向，离开不限；不要写成禁止回头的新规则。

所有岛屿、静态路面、支柱、结构色、机关偏移及把手位置均在下方完整参考实现中逐项列出；`b.island`生成地面结构，`b.column`含上下端点。未声明的档位默认0、把手不限次；无把手的机关不得擅自补把手。没有巡逻者、外部资源或ending。

## 光点、选做与陷阱

- orb-0：(0,-1,3)，选做。
- orb-1：(8,3,7)，必需。
- orb-2：(9,3,9)，必需。

箱子卸到压板后，外端不再被占用，低侧廊三格可通向选做。把光点放在外侧第三格(0,-1,3)，避免箱体遮住实际点击落点；自动寻路会经前两格，无需多点。

逆着初始箱子的方向推，会把箱子推回起点端点，缺少可站的更后方，形成有意死局。最短误操作：走(3,1,3)，推crate-0。提示应显示撤销建议，一次撤销可恢复箱子，不能暗中移动箱子或放宽单向规则。

## 主线标准解法

| 步  | 动作                  | 理由                                       |
| --- | --------------------- | ------------------------------------------ |
| 1   | 走到 `(1,-1,-1)`      | 先绕到低处箱子背后。                       |
| 2   | 推 `crate-0` 一格     | 把箱子跨错觉推上外端，人跟到原箱格。       |
| 3   | 走到 `(4,1,3)`        | 绕开被箱占用的外端，登内端。               |
| 4   | 操作 `turntable` 一次 | 转盘同时运人和箱，朝向改变。               |
| 5   | 推 `crate-0` 一格     | 向+b推到转角，腾出外端。                   |
| 6   | 走到 `(8,3,8)`        | 从高廊收光，沿箭头+b进入新的箱后位置。     |
| 7   | 推 `crate-0` 一格     | 向-a推到双框压板，持续开门。               |
| 8   | 走到 `(11,4,10)`      | 经转盘与侧廊，穿门收第二光点并登后段转盘。 |
| 9   | 操作 `finish` 一次    | 后段转盘载人转向灯塔。                     |
| 10  | 走到 `(13,5,13)`      | 点灯。                                     |

## 全收集标准解法

依次执行下方自动验证基准的 `all` 数组，共 11 步；坐标是该动作发生时的世界坐标。一次行走允许自动经过中间路面，不强制额外点击接点，也不禁止其他同样合法的最优解。

## 指标与验收

| 最少／全收集 | 状态／死局 | 随机50步（500次，种子20261016） | 主线错觉／取舍 |
| ------------ | ---------- | ------------------------------- | -------------- |
| 10／11       | 3368／704  | 0.0%                            | 7／3           |

第三章门槛≥40状态、40步随机≤35%，第四章≥60状态、50步随机≤25%；错觉≥2、取舍≥1。第十关按章节首关允许低2步的规定采用8步。0%是500次固定种子样本中零次通过，不代表概率严格为零。

设计已用实际规则、求解器、完整校验和可达状态的建筑运动采样验证。256组结构转移、1920组角色转移，每组181姿态；覆盖顶板、岩层、其他底盘、同步联动和运载箱体。离散采样不构成连续碰撞证明，也不参与行走／推箱的投影连通。门收入自身路面属于既有设计，未宣称其槽体为连续物理仿真。验证范围和复跑方法见共同交接。

正式实现须按主线／全收集实际点击，并复验本稿干扰和撤销；截图核对起点、全部光点、箱体、把手和关键落脚点。设计预览的手机尺寸是375×667模拟，非真机；正式接线、评价目标、首次教学与章节声音仍由T6.14实现，不能拿临时预览代替正式验收。

## 自动验证基准

```json
{
  "metrics": {
    "minActions": 10,
    "minActionsAll": 11,
    "reachableStates": 3368,
    "deadEndStates": 704,
    "illusions": 7,
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
      "to": [8, 3, 8]
    },
    {
      "type": "push",
      "crate": "crate-0"
    },
    {
      "type": "walk",
      "to": [0, -1, 3]
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
      "to": [13, 5, 13]
    }
  ],
  "clearance": {
    "structuralTransitions": 256,
    "characterTransitions": 1920,
    "samples": 181,
    "issues": []
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
  revision: 1,
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
    b.column({ x: 5, z: 3, from: 0, to: 1 }, 'teal')
    b.solid([5, 1, 9], 'teal')
    b.solid([6, 1, 7], 'rose')
    b.solid([5, 1, 7], 'rose')
    b.column({ x: 8, z: 7, from: 1, to: 2 }, 'rose')
    b.column({ x: 8, z: 8, from: 1, to: 2 }, 'rose')
    b.column({ x: 9, z: 7, from: 1, to: 2 }, 'rose')
    b.column({ x: 9, z: 8, from: 1, to: 2 }, 'rose')
    b.column({ x: 9, z: 9, from: 1, to: 2 }, 'rose')
    b.column({ x: 12, z: 10, from: 3, to: 4 }, 'teal')
    b.solid([14, 3, 13], 'teal')
    b.column({ x: 13, z: 13, from: 3, to: 4 }, 'rose')
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
    b.crate({ tile: [1, -1, 0] })
    b.orb({ tile: [0, -1, 3], optional: true })
    b.orb({ tile: [8, 3, 7] })
    b.orb({ tile: [9, 3, 9] })
    b.tree([10, 0, 7])
    b.flower([10, 0, 9])
    b.window({ pos: [13, 3, 13], face: 'x' })
    b.start([2, -1, 0])
    b.goal([13, 5, 13])
  },
  solution: [
    { type: 'walk', to: [1, -1, -1] },
    { type: 'push', crate: 'crate-0' },
    { type: 'walk', to: [4, 1, 3] },
    { type: 'operate', mechanism: 'turntable' },
    { type: 'push', crate: 'crate-0' },
    { type: 'walk', to: [8, 3, 8] },
    { type: 'push', crate: 'crate-0' },
    { type: 'walk', to: [11, 4, 10] },
    { type: 'operate', mechanism: 'finish' },
    { type: 'walk', to: [13, 5, 13] },
  ],
})
```
