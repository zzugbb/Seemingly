# 架构说明

> M0～M5 已完成首版九关。2026-10-16 起进行可玩性改版（[路线图 M6](roadmap.md#m6-可玩性改版)），本文的接口定义是改版的目标；与现有代码不一致时，以本文为准逐步改造。

## 技术栈

| 层 | 选择 |
| --- | --- |
| 构建 | Vite 8，开发端口 5180，`base: './'` |
| 界面 | React 19 + TypeScript（严格模式） |
| 3D | Three.js + React Three Fiber 9 + drei 10 |
| 页面状态 | zustand |
| 测试 | Vitest |
| 格式化 | Prettier（无分号、单引号、行宽 120） |
| 部署 | GitHub Actions + GitHub Pages |

## 目录

```text
docs/levels/                   关卡设计稿 level-01.md … level-14.md（设计者编写）
src/
├── main.tsx
├── app/                       页面与界面（React DOM）
│   ├── App.tsx                按 store.screen 切换页面
│   ├── store.ts               zustand：页面、当前关卡、存档、静音、画质
│   ├── save.ts                本地存储读写，键名 seemingly:save:v2
│   ├── sounds.ts              模拟器事件 → 音效
│   ├── screens/
│   │   ├── TitleScreen.tsx    含评价总数
│   │   ├── LevelSelect.tsx    按章分行，卡片含三项评价
│   │   ├── PlayScreen.tsx     创建模拟器，挂载画布与 HUD
│   │   └── Ending.tsx
│   ├── hud/
│   │   ├── Hud.tsx            关名、步数、光点、撤销、提示、重新开始、选关、静音
│   │   ├── Toast.tsx
│   │   └── CompleteBanner.tsx 三项评价与步数
│   └── styles.css
├── audio/                     Web Audio 合成，不依赖 React
│   ├── engine.ts              AudioContext、主音量、压缩器、音乐与音效总线、静音
│   ├── theory.ts              纯函数：音名、频率、各章和弦与音阶
│   ├── reverb.ts              生成混响脉冲响应
│   ├── music.ts               生成式环境音乐（调度器、铺底、低音、八音盒、换章）
│   └── sfx.ts                 带音高的操作音
└── game/
    ├── core/                  纯 TypeScript，禁止导入 three / react
    │   ├── iso.ts             屏幕坐标、连通、寻路、移动插值
    │   ├── mechanisms.ts      机关积木位置、平移台往返、联动展开
    │   ├── rules.ts           规则层：游戏状态与瞬时状态转移
    │   ├── sim.ts             LevelSim：在规则层上做动画、撤销
    │   ├── solver.ts          求解器：最优解、难度指标、提示
    │   ├── visibility.ts      顶面可见性射线检测
    │   ├── validate.ts        关卡校验
    │   ├── solve.ts           按标准解法运行模拟器
    │   └── *.test.ts
    ├── levels/
    │   ├── types.ts
    │   ├── builders.ts
    │   ├── targets.ts         每关难度目标（设计者给出）
    │   ├── index.ts           按顺序导出 14 关
    │   ├── level-01.ts … level-14.ts
    │   └── levels.test.ts     校验加难度指标
    └── render/
        ├── Scene.tsx          一关的完整场景，每帧驱动模拟器
        ├── CameraRig.tsx
        ├── Lights.tsx
        ├── Blocks.tsx
        ├── Mechanisms.tsx     转盘、平移台、压板、把手；提示高亮
        ├── Orbs.tsx           光点与收集动画
        ├── Character.tsx
        ├── Lantern.tsx        亮度随光点递增
        ├── Finale.tsx
        ├── ending.ts
        ├── Decor.tsx
        ├── quality.ts
        ├── materials.ts
        └── palette.ts
```

依赖方向只能是：`app → render → core`、`app → audio`、`render → levels → core`。`core` 和 `levels` 不能导入 `render`、`app`、`audio`。

## 关卡数据

`src/game/levels/types.ts`（在现有定义上的改动用注释标出）：

```ts
export type Vec3 = [number, number, number]
export type Axis = 'x' | 'y' | 'z'
export type Face = 'x' | 'z'
export type ColorName = 'sand' | 'terracotta' | 'rose' | 'teal' | 'tealLight' | 'plum' | 'cream'

export interface BlockDef {
  pos: Vec3
  color: ColorName
  kind: 'path' | 'solid'
}

export interface MechBlockDef {
  offset: Vec3
  color?: ColorName // 默认 tealLight
  kind?: 'path' | 'solid' // 默认 path
}

export interface HandleDef {
  block: Vec3 // 把手所在的静态结构积木
  face: Face
}

export interface LinkDef {
  // 新增
  target: string // 被联动的转盘或平移台
  reverse?: boolean // 只对转盘有效：逆时针
}

export interface RotatorDef {
  type: 'rotator'
  id: string
  pivot: Vec3
  blocks: MechBlockDef[]
  initialStep?: 0 | 1 | 2 | 3
  handle?: HandleDef // 改为可选：没有把手时只能被联动或压板触发
  links?: LinkDef[] // 新增
}

export interface MoverDef {
  type: 'mover'
  id: string
  origin: Vec3
  axis: Axis
  stops: number[]
  initialStop?: number
  blocks: MechBlockDef[]
  handle?: HandleDef // 改为可选
  links?: LinkDef[] // 新增
}

export interface PlateDef {
  type: 'plate'
  id: string
  tile: Vec3
  target: string
  once?: boolean
}

export type MechanismDef = RotatorDef | MoverDef | PlateDef

export type OrbDef = // 新增
  ({ tile: Vec3 } | { mechanism: string; block: number }) & { optional?: boolean }

export type SolutionStep = { type: 'walk'; to: Vec3 } | { type: 'operate'; mechanism: string }

export interface LevelDef {
  id: string // 'level-01' … 'level-14'
  title: string
  chapter: 1 | 2 | 3 | 4 // 新增
  blocks: BlockDef[]
  mechanisms: MechanismDef[]
  orbs: OrbDef[] // 新增，可为空数组
  start: Vec3
  goal: Vec3
  decor: DecorDef
  hints?: string[]
  solution: SolutionStep[]
  ending?: EndingDef // 最终关：14 盏灯笼与塔
}
```

约定：

- 静态路面的格子编号是 `"x,y,z"`，机关积木的编号是 `"机关id#下标"`。机关积木的编号与位置无关，所以小人乘坐时编号不变。
- 光点编号：`orb-0`、`orb-1`……按 `orbs` 数组顺序；光点所在格子编号按上一条规则。光点不能放在起点。
- `builders.ts` 新增 `orb(def)`，`defineLevel` 新增 `chapter` 参数。

`src/game/levels/targets.ts`：

```ts
export interface LevelTarget {
  minActions: number // 精确值，同时作为「步数」评价的标准
  minActionsAll: number // 精确值
  reachableStatesMin?: number
  randomWin?: { steps: number; maxRate: number }
  illusionsMin: number
  tradeoffsMin?: number
}

export const targets: Record<string, LevelTarget>
```

`targets.ts` 由设计者根据关卡设计稿填写，实现者不得为通过测试而修改。

## 规则层

`src/game/core/rules.ts` 定义游戏状态和**瞬时**的状态转移，不涉及时间和动画。模拟器、求解器、提示、标准解法验证都调用它，保证规则只有一份。

```ts
export interface GameState {
  at: string // 小人所在格子编号
  rotator: Record<string, number> // 档位，0～3
  mover: Record<string, { stopIndex: number; direction: 1 | -1 }>
  orbs: string[] // 已收集的光点编号，升序
  spentPlates: string[] // 已用掉的一次性压板编号，升序
  won: boolean
}

export type Action = { type: 'walk'; tileId: string } | { type: 'operate'; mechanism: string }

export interface Transition {
  state: GameState
  route: string[] // walk：经过的格子（不含起点）；operate：空
  collected: string[] // 本次收集的光点
  moved: string[] // 本次运动的机关（含联动、压板触发）
  plate: string | null // 本次触发的压板
  goalLocked: number // 走到灯笼但必需光点不足时，缺少的数量；否则为 0
}

export function initialState(level: LevelDef): GameState
export function tilesOf(level: LevelDef, state: GameState): Map<string, Tile>
export function occupiedOf(level: LevelDef, state: GameState): Set<string>
export function reachableFrom(level: LevelDef, state: GameState): Map<string, string[]> // 目标格 → 路线
export function legalActions(level: LevelDef, state: GameState): Action[]
export function applyAction(level: LevelDef, state: GameState, action: Action): Transition | null // 非法动作返回 null
export function stateKey(state: GameState): string
```

规则：

- **walk**：目标必须可达且不是当前格。路线与 `findPath` 完全一致（`reachableFrom` 必须给出相同路线，用测试保证）。沿路线进入的每一格，若有未收集的光点则收集。路线终点：
  - 是终点且必需光点已齐：`won = true`；
  - 是终点但必需光点不齐：`goalLocked = 缺少数量`；
  - 是压板：按压板规则触发目标机关（等同 operate，含联动）。
- **operate**：机关必须有把手。触发集合 = 该机关 + 其 `links` 中的机关（只展开一层）。转盘档位 +1（`reverse` 时 −1，取模 4）；平移台按往返规则前进一站。
- **乘坐**无需特殊处理：小人的格子编号不变，位置随机关状态重新计算。
- `won` 为真后不再有合法动作。

## 模拟器

`src/game/core/sim.ts` 在规则层之上负责动画、事件和撤销。

```ts
export type Command = { type: 'walk'; tileId: string } | { type: 'operate'; mechanism: string }

export type CommandResult = 'ok' | 'busy' | 'unreachable' | 'no-handle' | 'unknown-target'

export type SimEvent =
  | { type: 'walk-start'; route: string[] }
  | { type: 'step'; tileId: string }
  | { type: 'orb'; id: string } // 新增：动画走到光点格时发出
  | { type: 'goal-locked'; missing: number } // 新增
  | { type: 'mechanism-start'; id: string }
  | { type: 'mechanism-tick'; id: string }
  | { type: 'mechanism-end'; id: string }
  | { type: 'plate'; id: string; triggered: boolean }
  | { type: 'undo' } // 新增
  | { type: 'won' }

export class LevelSim {
  constructor(level: LevelDef)
  readonly level: LevelDef
  readonly status: 'playing' | 'won'

  command(cmd: Command): CommandResult
  update(dt: number): SimEvent[]
  isIdle(): boolean

  undo(): boolean // 机关运动中或没有记录时返回 false
  canUndo(): boolean
  steps(): number // = 撤销记录长度
  state(): Readonly<GameState> // 当前已提交的规则状态
  orbProgress(): { required: number; requiredCollected: number; total: number; collected: number }

  tiles(): Map<string, Tile>
  tileAt(pos: Vec3): Tile | undefined
  characterPose(): { position: Vec3; heading: number; walking: boolean }
  mechanismPose(id: string): { rotationY: number } | { offset: Vec3 }
  orbPose(id: string): { position: Vec3; collected: boolean }
}
```

行为要求：

- `command` 在空闲时调用 `applyAction` 得到转移结果，把动作前的状态压入撤销记录，然后按结果播放动画；动画结束时提交新状态。
- 小人行走中发出新的 `walk`：当前这一格走完后改走新路线，替换撤销记录中的最后一项（不增加步数）。
- 行走中或机关运动中，`operate` 返回 `busy`；机关运动中，`walk` 返回 `busy`。
- 多个机关同时运动（联动），全部结束后才发出最后一个 `mechanism-end` 并接受新指令。
- **乘坐**：小人所在格属于正在运动的机关时，`characterPose` 按该机关当前动画姿态计算小人位置；转盘还要把转过的角度加到朝向上。
- 撤销立即恢复状态，不播放动画，发出 `undo` 事件。
- 所有时长常量定义在 `sim.ts` 顶部，和设计稿一致。

## 求解器

`src/game/core/solver.ts` 只依赖规则层。

```ts
export interface LevelMetrics {
  minActions: number | null // 无解为 null
  minActionsAll: number | null
  reachableStates: number
  deadEndStates: number
  illusions: number // 标准解法中的错觉连接次数
  tradeoffs: number // 标准解法中的取舍次数
}

export function analyze(level: LevelDef): LevelMetrics
export function randomWinRate(level: LevelDef, opts: { runs: number; maxActions: number; seed: number }): number
export function nextHint(level: LevelDef, state: GameState): Action | null // 无法通关时返回 null
```

- 广度优先搜索全部可达状态；每个状态的行走动作用 `reachableFrom` 一次算出，不要对每个目标单独寻路。
- 死局：建出状态图后，从所有通关状态反向搜索，搜不到的可达状态即死局。
- 随机通关率用固定种子的伪随机数（如 mulberry32），不用 `Math.random`。
- 「取舍」：一次操作前后，从小人当前位置可达的路面集合，既有新增又有减少。
- 「错觉连接」：路线上相邻两格的三维坐标差不是水平单位向量。
- 性能要求：每关 `analyze` 在测试中不超过 2 秒；提示在浏览器中不超过 100 毫秒。

## 渲染与驱动

- `PlayScreen` 用 `useMemo` 按关卡和重开次数创建 `LevelSim`，传给 `Scene`。
- `Scene` 的 `useFrame` 是唯一调用 `sim.update(dt)` 的地方，事件交给 `PlayScreen` 的回调（音效、提示、横幅、HUD 数字）。
- 渲染组件每帧从 `characterPose()`、`mechanismPose()`、`orbPose()` 读取位置，写到 `ref` 上。
- HUD 的步数和光点数在 `step`、`orb`、`undo`、`mechanism-end` 事件后更新 React 状态，不每帧更新。
- 撤销按钮调用 `sim.undo()`；提示按钮调用 `nextHint(level, sim.state())`，把结果交给 `Mechanisms` 或 `Blocks` 做 2 秒高亮，并在本局标记「用过提示」。

## 页面状态与存档

```ts
interface LevelRecord {
  done: boolean
  allOrbs: boolean
  bestSteps: number | null
  parMet: boolean
}

interface SaveData {
  version: 2
  levels: Record<string, LevelRecord>
  muted: boolean
}

interface AppState {
  screen: 'title' | 'select' | 'play' | 'ending'
  levelIndex: number
  save: SaveData
  quality: 'high' | 'low'
  goTitle(): void
  goSelect(): void
  play(levelIndex: number): void
  completeLevel(id: string, result: { steps: number; allOrbs: boolean; usedHint: boolean }): void
  toggleMute(): void
}
```

- `completeLevel`：`done = true`；`allOrbs ||= result.allOrbs`；`bestSteps` 取较小值；`parMet ||= !usedHint && steps <= targets[id].minActions`。
- 读取存档：v2 正常读取；v1 只保留 `muted`，其余丢弃；损坏或未知版本用空存档，不报错。

## 音频

- `engine.ts`：唯一的 `AudioContext`，首次真实交互时解锁。信号链：音乐总线（0.18）和音效总线（0.5）→ 主音量（0.28）→ 压缩器 → 输出；混响作为发送效果，两条总线都有发送量。静音时主音量归零并停止音乐调度。
- `theory.ts`：纯函数与数据，可单元测试。MIDI 编号与频率换算；四章的和弦进行与音阶，见[设计稿](design.md#音乐)；给定章节和时间返回当前和弦。
- `reverb.ts`：用双声道指数衰减噪声生成 2.5 秒脉冲响应，交给 `ConvolverNode`。
- `music.ts`：`MusicPlayer`，提供 `start(chapter)`、`setChapter(chapter)`（3 秒交叉淡化）、`stop()`、`currentChord()`、`currentScale()`。用前瞻调度：每 100 毫秒安排接下来 0.3 秒内的音符。同一时刻最多 12 个发声音源。
- `sfx.ts`：`step`、`mechanism`、`orb`、`lantern`、`unreachable`、`undo`、`goalLocked`，音高取自 `music.currentChord()` 和 `currentScale()`；音乐未启动时使用第 1 章的和弦。
- `app/sounds.ts`：把模拟器事件映射到音效：`step`→脚步，`mechanism-tick`→机关，`orb`→光点，`goal-locked`→提醒音，`undo`→撤销，`won`→灯笼。
- 删除首版的 `ambient.ts`。

## 结尾

最终关在 `ending` 中列出 14 盏灯笼与塔的静态积木位置，其余时序沿用首版：终点灯笼先亮，其余每隔 0.45 秒点亮；全部亮后 0.6 秒照亮塔，再过 0.9 秒显示「谢谢游玩」和「回到标题」。

## 画质档位

| 项目 | 高 | 低 |
| --- | --- | --- |
| 像素比上限 | 2 | 1.5 |
| 阴影 | 2048 | 关闭 |
| 光点粒子 | 全量 | 减半 |
| 云 | 3 朵 | 1 朵 |

开启「减少动态效果」时，额外关闭场景漂浮、云朵移动和光点粒子；收集光点的飞行动画改为直接消失。

## 核心算法

### 屏幕坐标与连通

积木 `(x, y, z)` 的屏幕坐标为 `(x - y, z - y)`。`buildGraph` 收集当前所有路面，过滤顶上压着积木的格子，屏幕坐标上下左右相邻的格子互相连通；`findPath` 做广度优先搜索。

### 跨越错觉连接的移动

两格的三维差分解为水平单位方向 `d` 加 `k × (1, 1, 1)`。`segmentPoint` 前半程沿 `d` 走到中点，过中点后切到目标一侧的等价位置继续走，正交视角下看不出跳变。

### 可见性检测

`visibility.ts` 判断一个点沿 `(1, 1, 1)` 方向的射线是否碰到任何积木，供关卡校验使用。

### 相机取景

把所有积木（含机关所有可达状态下的位置和岛屿底部）投影到相机的右方向 `(1, 0, -1)/√2` 和上方向 `(-1, 2, -1)/√6`，求包围范围，设置中心和缩放。

## 性能预算

- 首次加载传输量（压缩后）不超过 1 MB。
- 集成显卡笔记本、中端手机保持 60 帧。
- 单关绘制调用不超过 400 次；超出时，同色静态积木改用 `InstancedMesh`。
- 所有积木共用一份几何体，材质按颜色缓存。

首版九关的[性能检查记录](performance.md)：终章最高 360 次调用，首屏约 326 KB。改版后重新测量（T6.17）。

## 部署

- `.github/workflows/pages.yml`：推送到 `main` 或提交 PR 时，执行类型检查、格式检查、测试和构建；只有推送到 `main` 时才发布。
- 地址：`https://zzugbb.github.io/Seemingly/`。

## 提交约定

- 提交信息用中文，前缀沿用 `feat:`、`fix:`、`docs:`、`refactor:`、`test:`、`chore:`。
- 一个任务一个提交，提交信息里写上任务编号，例如 `feat: 规则层支持联动（T6.2）`。
