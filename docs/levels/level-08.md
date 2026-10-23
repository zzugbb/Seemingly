# 第 8 关 · 联动

## 状态与教学

**T6.14a 难度衔接修订，第三稿，2026-10-23。** 本稿替代本关T6.13a第二稿。T6.14b已按本稿接入正式关卡，revision **2**，主线 **13步**，全收集 **14步**。选关主题短句：**两处转轮，共用一座远桥**。新章听感与最终难度仍待用户确认。

教学点：两个输入各驱动自己和remote；观察自己乘坐哪座桥，以及远桥何时接岸。

「原来如此」：**换到中继桥后，第二个转轮同样会改变远桥；先让远桥接岸取光，再回到中继桥乘向北庭。**

第六关已教双桥接力，本关增加共享接收桥的两个控制源。不是把“一个把手两桥”做完就结束；主线必须使用pair和relay两个把手。第九关再将间接操作放到压板和两门交换中。

共同合同见[第三、四章交接](chapter-3-4.md)。不改固定相机、投影连通、遮挡与乘坐规则；沿用当前音乐、首次能力教学与简洁完成卡。hints为空，不恢复常驻解法说明。

## 屏幕草图

屏幕`(a,b)=(x-y,z-y)`，为初始状态。`@`起点、`G`灯笼、`o`必需、`*`选做、`C`箱、`p`普通路面、`t`触发压板、`h`按住压板、`D`关闭门、`d`初始开门、`>`沿+a进入、`v`沿+b进入、`#`静轴；字母加编号为活动路面，冒号后是高度。机关代号见下方清单，支撑不当道路。

```text
 b\a       -1      0      1      2      3      4      5      6
  -2        ·      ·      ·      ·      ·     G2      ·      ·
  -1        ·      ·      ·      ·      ·      ·      ·      ·
   0        ·      ·      ·      ·      ·     p7     *7      ·
   1        ·      ·      ·   E0:4      ·     #4      ·      ·
   2       @0   P0:1      ·     #1      ·      ·      ·     #8
   3        ·      ·      ·      ·      ·      ·   R1:8   R0:8
   4        ·      ·      ·      ·      ·      ·      ·     o9
   5        ·      ·      ·     o2      ·      ·      ·      ·
```

## 机关、结构与站位

pair初始0、remote初始1、relay初始0。pair.links=[remote]，relay.links=[remote]；remote无把手、无links。联动只传一层，沿用原规则。两把手分别保持另一座主动桥不动，remote始终满足`(pair + relay + 1) mod 4`。

pair仍仅#0可走，三块下部结构不得改为路面。relay中心为(8,4,5)，单可走块偏移(-2,0,0)。远桥及远庭沿(1,1,1)整体分开真实纵深，不改变投影接口；北庭灯笼(6,2,0)。选做经新增(11,7,7)折廊，下面(11,6,7)为与远庭相接的悬臂结构。

也存在从近桥东口先用relay校准、再换远桥的合法同长路线；不为强迫本稿动作顺序封路。标准解选取完整可见的近桥北端换乘路线。

所有静态路面、支柱、岛屿范围、颜色、机关偏移、把手面与次数、光点、箭头和装饰在完整参考实现中逐项给出，这是实现的唯一数据依据。不得自行加路、添把手或改targets来修正谜题。没有巡逻者、外部资源或ending。

## 光点、干扰与恢复

- `orb-0`：`(4,2,7)`，必需。
- `orb-1`：`(12,7,7)`，选做。
- `orb-2`：`(15,9,13)`，必需。

只重复一个把手不能完成：pair无法单独送到北庭，relay也不能替代近桥收光。把自己留在南庭或远庭时转走连接，会暂时离台，需将桥找回；不限次且零死局。两处转轮可远程点击，不能增加操作距离限制。

选做位于上侧折廊，主线到relay档3即可去灯笼；全收集先朝另一侧离台取光再回北庭。额外一走是空间探索，不宣称增加一整层控制规划。

点灯回应保留：终点之外2盏庭院灯；第九、十二关2.2秒后出现简洁完成卡，减少动态效果0.2秒。声音维持T6.14当前实现，新章试听状态仍单独等待用户确认。

## 主线标准解法

一次行走允许自动经过中间路面。下表是经验证的最优解，不排斥同样合法的其他最优路线，不强迫逐格点击。

| 步  | 动作             | 理由                                      |
| --- | ---------------- | ----------------------------------------- |
| 1   | 走到 `(1,1,3)`   | 登近桥唯一可走的外端。                    |
| 2   | 操作 `pair`      | pair与remote同时转，近桥接南庭。          |
| 3   | 走到 `(4,2,7)`   | 离桥收南庭必需光点。                      |
| 4   | 走到 `(3,1,5)`   | 回到近桥，下一次仍要乘坐。                |
| 5   | 操作 `pair`      | 乘到东侧接口，暂不在这里换桥。            |
| 6   | 操作 `pair`      | 继续乘到北侧，接上中继桥的初始端。        |
| 7   | 走到 `(6,4,5)`   | 换乘relay；站位改变了接下来应使用的转轮。 |
| 8   | 操作 `relay`     | relay与remote同时转，接通远庭路线。       |
| 9   | 走到 `(15,9,13)` | 经远桥前后两格到远庭收第二处必需光。      |
| 10  | 走到 `(8,4,7)`   | 回到relay，不能留在远庭直接转向出口。     |
| 11  | 操作 `relay`     | 乘中继桥过第一段回转，同时远桥断开。      |
| 12  | 操作 `relay`     | 继续乘到北庭出口方向。                    |
| 13  | 走到 `(6,2,0)`   | 离台点灯。                                |

## 全收集标准解法

按下方自动验证基准的`all`数组执行，共14步；每一步坐标都是当时的世界坐标。主线与全收集评价仍可分两局累计，不要求界面增加解释长文。

## 指标与验收

| 主线／全收集 | 状态／死局 | 随机40步（500次，种子20261016） | 主线错觉／取舍 |
| ------------ | ---------- | ------------------------------- | -------------- |
| 13／14       | 1064／0    | 0.2%                            | 9／2           |

章节门槛保持：第三章7～16步、≥40状态、40步随机≤35%；第四章10～20步、≥60状态、50步随机≤25%，错觉≥2、取舍≥1。没有放宽门槛；0%是固定样本零次通过。指标是技术保底，不能单凭步数、状态或死局数宣称体验更难。

运动净空覆盖32组结构转移、320组角色转移，每组181个姿态，包含人物、顶板、岩层、其他底盘、同步联动、运载箱与门包络。零采样相交不构成连续碰撞证明，也不改变错觉连接；未把行走／推箱做成三维碰撞规则。

正式实现须通过默认设计检查、对应关卡全部校验、行为与存档回归；第八至十二关全部接入后再通过`node docs/levels/check-designs.mjs --runtime`。桌面与手机实际点击主线／全收集及干扰，核对关键顶板、把手、箱子、灯笼可见可点；手机尺寸模拟不是真机。详细接线、截图和用户体验门槛见共同交接。

## 自动验证基准

```json
{
  "metrics": {
    "minActions": 13,
    "minActionsAll": 14,
    "reachableStates": 1064,
    "deadEndStates": 0,
    "illusions": 9,
    "tradeoffs": 2,
    "randomSteps": 40,
    "randomRate": 0.002
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
      "to": [6, 4, 5]
    },
    {
      "type": "operate",
      "mechanism": "relay"
    },
    {
      "type": "walk",
      "to": [15, 9, 13]
    },
    {
      "type": "walk",
      "to": [8, 4, 7]
    },
    {
      "type": "operate",
      "mechanism": "relay"
    },
    {
      "type": "operate",
      "mechanism": "relay"
    },
    {
      "type": "walk",
      "to": [12, 7, 7]
    },
    {
      "type": "walk",
      "to": [6, 2, 0]
    }
  ],
  "clearance": {
    "structuralTransitions": 32,
    "characterTransitions": 320,
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
  revision: 2,
  soundtrack: 'courtyard',
  hints: [],
  build: (b) => {
    b.island({ x: [-2, 0], z: [1, 3], y: -1, depth: 2 })
    b.island({ x: [1, 6], z: [0, 7], y: -1, depth: 3 })
    b.island({ x: [12, 16], z: [7, 13], y: 6, depth: 3 })
    b.island({ x: [7, 10], z: [-1, 6], y: -1, depth: 2.5 })
    b.path([-1, 0, 2], 'terracotta')
    b.path([4, 2, 7], 'rose')
    b.path([12, 7, 7], 'terracotta')
    b.path([15, 9, 13], 'rose')
    b.solid([3, 0, 3], 'teal')
    b.solid([3, 1, 3], 'teal')
    b.solid([5, 0, 7], 'teal')
    b.solid([4, 0, 7], 'rose')
    b.solid([4, 1, 7], 'rose')
    b.solid([14, 7, 10], 'teal')
    b.solid([14, 8, 10], 'teal')
    b.solid([15, 7, 13], 'rose')
    b.solid([15, 8, 13], 'rose')
    b.path([6, 2, 0], 'rose')
    b.solid([6, 0, 0], 'rose')
    b.solid([6, 1, 0], 'rose')
    b.path([11, 7, 7], 'terracotta')
    b.solid([11, 6, 7], 'sand')
    b.solid([8, 0, 5], 'teal')
    b.solid([8, 1, 5], 'teal')
    b.solid([8, 2, 5], 'teal')
    b.solid([8, 3, 5], 'teal')
    b.solid([8, 4, 5], 'teal')
    b.solid([10, 0, 0], 'teal')
    b.solid([10, 1, 0], 'teal')
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
      pivot: [14, 8, 10],
      initialStep: 1,
      blocks: [
        { offset: [-1, 0, 0] },
        { offset: [-1, 0, -1] },
        { offset: [-1, -1, 0], kind: 'solid', color: 'teal' },
        { offset: [-1, -1, -1], kind: 'solid', color: 'teal' },
      ],
    })
    b.rotator({
      id: 'relay',
      pivot: [8, 4, 5],
      blocks: [{ offset: [-2, 0, 0] }],
      handle: { block: [10, 1, 0], face: 'z' },
      links: [{ target: 'remote' }],
    })
    b.orb({ tile: [4, 2, 7] })
    b.orb({ tile: [12, 7, 7], optional: true })
    b.orb({ tile: [15, 9, 13] })
    b.tree([-2, -1, 3])
    b.flower([6, -1, 7])
    b.window({ pos: [15, 7, 13], face: 'x' })
    b.lamp([12, 6, 13])
    b.lamp([16, 6, 11])
    b.start([-1, 0, 2])
    b.goal([6, 2, 0])
  },
  solution: [
    { type: 'walk', to: [1, 1, 3] },
    { type: 'operate', mechanism: 'pair' },
    { type: 'walk', to: [4, 2, 7] },
    { type: 'walk', to: [3, 1, 5] },
    { type: 'operate', mechanism: 'pair' },
    { type: 'operate', mechanism: 'pair' },
    { type: 'walk', to: [6, 4, 5] },
    { type: 'operate', mechanism: 'relay' },
    { type: 'walk', to: [15, 9, 13] },
    { type: 'walk', to: [8, 4, 7] },
    { type: 'operate', mechanism: 'relay' },
    { type: 'operate', mechanism: 'relay' },
    { type: 'walk', to: [6, 2, 0] },
  ],
})
```
