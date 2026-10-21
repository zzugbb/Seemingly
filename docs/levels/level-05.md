# 第 5 关 · 叠庭

## 状态、来源与范围

T6.12t 已按本稿实现。运行中的第五关为「叠庭」、revision 3，正式 id 为 level-05。独立 sample-01 仍保留。

## 教学点与原来如此

承接第四关「离开载具，留下静态落脚点」的认识，引入竖向平移与显露：**升降台把人送上去后，必须下台再降空台，露出同一投影位置背后的高台。** 固定相机和全局遮挡规则不变。这是正式前六关提前的一次简单遮挡发现，第五章仍承担复杂遮挡与巡逻的进阶设计。

## 屏幕草图与清单

```text
选做西台 (-2,-1)@1 — 升降侧翼 (-1,-1)@4 — 中央台 (0,-1)@4
                                                        │
                                           侧廊 (0,-2)@2，必需光点
中央台降下后，(0,-1)@3 的转盘高台显露；档2→3→0 后到 (6,3)@3
入口 (0,2)@0 → (1,2)@0 → 升降侧翼低位 (2,2)@1 → 短臂 (3,2)@2，必需光点
终点 (7,3)@5
```

- 三座基座、实心轴、折梁、塔柱、装饰及把手底座完整坐标见参考实现，不删减支持结构以简化画面。
- `ferry` 中心 `(6,2,4)`、档 0；路面偏移 #0 `(-1,0,0)`、#1 `(1,0,0)`、#2 `(3,1,2)`，其余六块均为实心折梁；把手 `(8,0,6)` z 面。
- `lift` 原点 `(4,1,3)`、y 轴 stops `[0,3]`、初始低位；#0 中央路面 `(0,0,0)`、#1 侧翼 `(-1,0,0)`、两块实心支撑 `(0,-1,0)`、`(0,-1,-1)`；把手 `(6,0,6)` z 面。
- 两机关均无限次、独立、无联动。入口 `(0,0,2)`，侧廊 `(2,2,0)`，选做西台 `(-1,1,0)`，终点 `(12,5,8)`。
- 必需光点在 ferry#0 和侧廊，选做光点在西台。无箱子、门、压板、单向格或巡逻者。
- 三盏装饰灯 `(0,-1,3)`、`(8,-1,7)`、`(10,0,8)` 不参与规则，通关亮起、撤销熄灭。

## 标准解法

| 步 | 动作 |
| --- | --- |
| 1 | 走到 `(5,2,4)`，取短臂光点 |
| 2 | 走到 `(3,1,3)`，登 lift#1 侧翼 |
| 3～4 | ferry 两次，高台到档 2 |
| 5 | lift 一次，乘侧翼升到上层 |
| 6 | 走到 `(2,2,0)`，离台取第二处必需光点 |
| 7 | lift 一次，空台下降 |
| 8 | 走到 `(3,3,2)`，登显露的 ferry#2 |
| 9～10 | ferry 两次，高台回到东侧 |
| 11 | 走到 `(12,5,8)`，点灯 |

全收集 12 步：前五步相同，第六步先到 `(-1,1,0)` 取选做，再到侧廊，后续同主线。先降台会暂时断开选做西台；可以恢复或撤销，无永久失败。

## 干扰与反事实

始终留在升降台上只会上下往返；静态侧廊让人能够让出中央投影位置。ferry 不是档 2 时，降低升降台也没有接客高台，可继续调整。低位中央台被短臂挡住，侧翼仍可进入，不得为了让入口“更顺”而补路。

禁止 lift 或 ferry 任一把手操作均无解。站到侧廊、空台下降前，visibleTilesOf 不包含 ferry#2；下降后包含；撤销后恢复遮挡。选做先登上层再去西台，降台前可进入；收集、撤销与再次收集正确。

## 指标与难度目标

目标版主线、全收集均重新校验；随机种子 20261016、500 次、30 步。

| 最少 / 全收集 | 状态 / 死局 | 随机通关率 | 错觉 / 取舍 |
| --- | --- | --- | --- |
| 11 / 12 | 512 / 0 | 0.2% | 6 / 4 |

```ts
'level-05': { minActions: 11, minActionsAll: 12, reachableStatesMin: 40, randomWin: { steps: 30, maxRate: 0.35 }, illusionsMin: 2, tradeoffsMin: 1 },
```

## 实现验收

- 正式第五关以 level-05 写入三项评价、计算解锁及下一关；独立 sample-01 仍不写正式存档。不得移动 sample 到正式列表后删除独立入口，也不能把 sample 的完成处理分支套到所有叠庭对象上。
- revision 3 仅使旧第五关评价失效。已完成新第四关和旧第六关的记录、静音均保留，不把样段试玩记录导入正式第五关。
- 将 sample.test.ts 的乘坐、显露、撤销、双把手反事实与全收集行为断言应用到正式 level-05；保留原 sample.test.ts，确保两份独立数据都可用。
- 本关沿用正式 HUD、CompleteBanner 与下一关跳转，不复制样段隐藏步数、免评价、2.2 秒完成卡分支。三盏庭院灯照常点亮；全收集 12 步与最少 11 步可跨次累计评价。
- 桌面与手机实玩主线和全收集、检查低位／高位、侧廊降台前后、换乘中、点灯和撤销；不把规则校验通过宣称为视觉验收已通过。
- 四项检查通过后勾选 T6.12t，并更新本稿状态。

## 参考实现

```ts
import { defineLevel } from './builders'

export default defineLevel({
  id: 'level-05',
  title: '叠庭',
  chapter: 2,
  revision: 3,
  soundtrack: 'courtyard',
  hints: ['转轮转动桥臂，拉杆升降平台'],
  build: (b) => {
    b.island({ x: [-1, 3], z: [0, 3], y: -1, depth: 2.5 })
    for (const x of [0, 1]) b.path([x, 0, 2], 'terracotta')
    b.island({ x: [4, 9], z: [0, 8], y: -1, depth: 3.5 })
    b.column({ x: 6, z: 4, from: 0, to: 2 }, 'teal')
    for (const pos of [
      [6, 0, 5],
      [6, 0, 6],
      [7, 0, 6],
      [8, 0, 6],
    ] as const)
      b.solid([...pos], 'teal')
    b.rotator({
      id: 'ferry',
      pivot: [6, 2, 4],
      blocks: [
        { offset: [-1, 0, 0] },
        { offset: [1, 0, 0] },
        { offset: [3, 1, 2] },
        { offset: [1, -1, 0], kind: 'solid', color: 'teal' },
        { offset: [1, -1, 1], kind: 'solid', color: 'teal' },
        { offset: [1, -1, 2], kind: 'solid', color: 'teal' },
        { offset: [2, -1, 2], kind: 'solid', color: 'teal' },
        { offset: [3, -1, 2], kind: 'solid', color: 'teal' },
        { offset: [3, 0, 2], kind: 'solid', color: 'teal' },
      ],
      handle: { block: [8, 0, 6], face: 'z' },
    })
    b.orb({ mechanism: 'ferry', block: 0 })
    b.mover({
      id: 'lift',
      origin: [4, 1, 3],
      axis: 'y',
      stops: [0, 3],
      blocks: [
        { offset: [0, 0, 0] },
        { offset: [-1, 0, 0] },
        { offset: [0, -1, 0], kind: 'solid', color: 'teal' },
        { offset: [0, -1, -1], kind: 'solid', color: 'teal' },
      ],
      handle: { block: [6, 0, 6], face: 'z' },
    })
    b.column({ x: 2, z: 0, from: 0, to: 1 }, 'rose')
    b.path([2, 2, 0], 'rose')
    b.orb({ tile: [2, 2, 0] })
    b.solid([-1, 0, 0], 'terracotta')
    b.path([-1, 1, 0], 'terracotta')
    b.orb({ tile: [-1, 1, 0], optional: true })
    b.island({ x: [10, 12], z: [6, 8], y: 0, depth: 4 })
    b.column({ x: 12, z: 8, from: 1, to: 4 }, 'rose')
    b.path([12, 5, 8], 'rose')
    b.tree([-1, -1, 3])
    b.flower([7, -1, 8])
    b.window({ pos: [12, 2, 8], face: 'x' })
    b.lamp([0, -1, 3])
    b.lamp([8, -1, 7])
    b.lamp([10, 0, 8])
    b.start([0, 0, 2])
    b.goal([12, 5, 8])
  },
  solution: [
    { type: 'walk', to: [5, 2, 4] },
    { type: 'walk', to: [3, 1, 3] },
    { type: 'operate', mechanism: 'ferry' },
    { type: 'operate', mechanism: 'ferry' },
    { type: 'operate', mechanism: 'lift' },
    { type: 'walk', to: [2, 2, 0] },
    { type: 'operate', mechanism: 'lift' },
    { type: 'walk', to: [3, 3, 2] },
    { type: 'operate', mechanism: 'ferry' },
    { type: 'operate', mechanism: 'ferry' },
    { type: 'walk', to: [12, 5, 8] },
  ],
})
```
