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
docs/levels/                   关卡设计稿 level-01.md … level-15.md、challenge-1.md … challenge-5.md（设计者编写）
src/
├── main.tsx
├── app/                       页面与界面（React DOM）
│   ├── App.tsx                按 store.screen 切换页面
│   ├── store.ts               zustand：页面、当前关卡、存档、静音、画质
│   ├── save.ts                本地存储读写，键名 seemingly:save:v2
│   ├── sounds.ts              模拟器事件 → 音效
│   ├── hint.worker.ts         后台线程：计算整关最优策略
│   ├── hints.ts               与提示 Worker 通信
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
│   ├── instruments.ts         主题音乐柔和键盘、持续声层、木质触感缓冲合成与缓存
│   ├── reverb.ts              生成混响脉冲响应
│   ├── music.ts               生成式环境音乐（调度器、铺底、低音、八音盒、换章）
│   └── sfx.ts                 带音高的操作音
└── game/
    ├── core/                  纯 TypeScript，禁止导入 three / react
    │   ├── iso.ts             屏幕坐标、连通、寻路、移动插值
    │   ├── mechanisms.ts      机关积木位置、平移台往返
    │   ├── rules.ts           规则层：游戏状态与瞬时状态转移
    │   ├── sim.ts             LevelSim：在规则层上做动画、撤销
    │   ├── solver.ts          求解器：最优解、难度指标、提示
    │   ├── metrics.ts         指标报告与固定种子随机模拟参数
    │   ├── visibility.ts      顶面可见性射线检测
    │   ├── validate.ts        关卡校验
    │   ├── solve.ts           按标准解法运行模拟器
    │   └── *.test.ts
    ├── levels/
    │   ├── types.ts
    │   ├── builders.ts
    │   ├── targets.ts         每关难度目标（设计者给出）
    │   ├── index.ts           导出 mainLevels（15 关）与 challengeLevels（5 关）
    │   ├── level-01.ts … level-15.ts
    │   ├── challenge-1.ts … challenge-5.ts
    │   └── levels.test.ts     校验加难度指标
    └── render/
        ├── Scene.tsx          一关的完整场景，每帧驱动模拟器
        ├── CameraRig.tsx
        ├── Lights.tsx
        ├── Blocks.tsx
        ├── Mechanisms.tsx     转盘、平移台、压板、把手；提示高亮
        ├── Orbs.tsx           光点与收集动画
        ├── Crates.tsx         积木箱与推动动画
        ├── Gates.tsx          开关门
        ├── Patrols.tsx        巡逻者
        ├── Character.tsx
        ├── Lantern.tsx        亮度随光点递增
        ├── Finale.tsx
        ├── ending.ts
        ├── Decor.tsx
        ├── quality.ts
        ├── feedback.ts        提示目标与渲染反馈时间戳
        ├── materials.ts
        └── palette.ts
```

依赖方向只能是：`app → render → core`、`app → audio`、`render → levels → core`。`core` 和 `levels` 不能导入 `render`、`app`、`audio`。

## 关卡数据

T6.14已按[第二稿](levels/chapter-3-4.md)把第7～12关写入正式mainLevels和targets。设计验证器`docs/levels/check-designs.mjs`仍可单独核对文档；`--runtime`比对12关顺序、前六关revision、新六关完整定义与targets，再对正式对象复跑规则和净空。新章谱面数据写在`audio/theory.ts`，正式模块不导入docs。循环、和弦时长、拍点和调度一起读取章节速度：前两章保持80 BPM／96秒，第三章88 BPM，第四章96 BPM。第9、12关的章末四音走音效总线，撤销、静音、重开和换关沿用既有清理。新听感仍待试听。

第五关已学集合固定为walk、collect、rotate、ride、lift，不随后来追加的教学标识扩张。推箱开始事件只记候选；联动、召台、推动、按住和限次在模拟器空闲且状态已经提交后才写入。单向格在成功踏入箭头格时记录。详见[开发前复核](levels/chapter-3-4.md#开发前复核t613b)。

`src/game/levels/types.ts`。注释中「T6.2」「T6.6」表示已实现，「T6.16」表示后续任务中新增：

```ts
export type Vec3 = [number, number, number]
export type Axis = 'x' | 'y' | 'z'
export type Face = 'x' | 'z'
export type ColorName = 'sand' | 'terracotta' | 'rose' | 'teal' | 'tealLight' | 'plum' | 'cream'
export type ScreenDir = '+a' | '-a' | '+b' | '-b' // T6.6：屏幕方向，+a 即 +x 方向（右下），+b 即 +z 方向（左下）

export interface BlockDef {
  pos: Vec3
  color: ColorName
  kind: 'path' | 'solid'
  oneWay?: ScreenDir // T6.6：单向格，只能沿该屏幕方向进入
}

export interface MechBlockDef {
  offset: Vec3
  color?: ColorName // 默认 tealLight
  kind?: 'path' | 'solid' // 默认 path
}

export interface HandleDef {
  block: Vec3 // 把手所在的静态结构积木
  face: Face
  uses?: number // T6.6：限次把手的可用次数，省略为不限
}

export interface LinkDef {
  // T6.2
  target: string // 被联动的转盘、平移台或切换门（T6.6）
  reverse?: boolean // 只对转盘有效：逆时针
}

export interface RotatorDef {
  type: 'rotator'
  id: string
  pivot: Vec3
  blocks: MechBlockDef[]
  initialStep?: 0 | 1 | 2 | 3
  handle?: HandleDef // T6.2：可选，没有把手时只能被联动或压板触发
  links?: LinkDef[] // T6.2
}

export interface MoverDef {
  type: 'mover'
  id: string
  origin: Vec3
  axis: Axis
  stops: number[]
  initialStop?: number
  blocks: MechBlockDef[]
  handle?: HandleDef // T6.2：可选
  links?: LinkDef[] // T6.2
}

export interface PlateDef {
  type: 'plate'
  id: string
  tile: Vec3
  target: string
  once?: boolean // 只对触发压板有效
  mode?: 'trigger' | 'hold' // T6.6：默认 trigger
}

export interface GateDef {
  // T6.6
  type: 'gate'
  id: string
  tile: Vec3 // 门所在的静态路面
  mode: 'toggle' | 'hold' // toggle 由把手、触发压板、联动切换；hold 只受按住压板控制（按住压板的 target 指向它）
  initiallyOpen?: boolean // 只对 toggle 有效
  handle?: HandleDef // 只对 toggle 有效
}

export type MechanismDef = RotatorDef | MoverDef | PlateDef | GateDef

export type TileRef = { tile: Vec3 } | { mechanism: string; block: number } // 静态路面或机关积木

export type OrbDef = TileRef & { optional?: boolean } // T6.2

export type CrateDef = TileRef // T6.6

export interface PatrolDef {
  // T6.16
  route: TileRef[] // 开局时相邻两格屏幕相邻
  mode: 'pingpong' | 'loop'
}

export type SolutionStep =
  | { type: 'walk'; to: Vec3 }
  | { type: 'operate'; mechanism: string }
  | { type: 'push'; crate: string } // T6.6

export interface LevelDef {
  id: string // 'level-01' … 'level-15'，'challenge-1' … 'challenge-5'
  title: string
  chapter: 1 | 2 | 3 | 4 | 5 // T6.2 为 1～4，T6.6 扩展到 5
  challenge?: boolean // T6.6
  revision?: number // T6.12a：未写为 1，用于使旧谜题评价失效
  soundtrack?: 'courtyard' // 校准关卡的主题乐句；章节 1 为启程，2 为空庭，省略沿用生成式音乐
  blocks: BlockDef[]
  mechanisms: MechanismDef[]
  orbs: OrbDef[] // T6.2
  crates?: CrateDef[] // T6.6
  patrols?: PatrolDef[] // T6.16
  start: Vec3
  goal: Vec3
  decor: DecorDef
  hints?: string[]
  solution: SolutionStep[]
  ending?: EndingDef // 最终关：15 盏灯笼与塔
}
```

约定：

- 静态路面的格子编号是 `"x,y,z"`，机关积木的编号是 `"机关id#下标"`。机关积木的编号与位置无关，所以小人乘坐时编号不变。
- 光点编号：`orb-0`、`orb-1`……按 `orbs` 数组顺序；光点所在格子编号按上一条规则。光点不能放在起点。
- 积木箱编号 `crate-0`……，巡逻者编号 `patrol-0`……，按数组顺序。
- `builders.ts` 已有 `orb(def)` 与 `chapter`；T6.6 新增 `crate`、`gate`、`oneWay` 选项和 `challenge` 参数，T6.16 新增 `patrol`。
- 单向路面的 builder 写法为 `b.path(pos, color, { oneWay: '+a' })`；未放箱子时 builder 生成空的 `crates` 数组。

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
  // 以下由 T6.6 / T6.16 新增
  gates: Record<string, boolean> // 切换门是否打开（按住门不存，由按住压板实时算出）
  handleUses: Record<string, number> // 限次把手已用次数
  crates: Record<string, string> // 积木箱编号 → 所在格子编号
  patrols: Record<string, { index: number; direction: 1 | -1 }> // 巡逻者在路线上的位置
}

export type Action =
  | { type: 'walk'; tileId: string }
  | { type: 'operate'; mechanism: string }
  | { type: 'push'; crate: string } // T6.6

export interface Transition {
  state: GameState
  route: string[] // walk：经过的格子（不含起点）；push：[积木箱原来的格子]；operate：空
  collected: string[] // 本次收集的光点
  moved: string[] // 本次运动的机关（含联动、压板触发、按住压板引起的变化）
  plate: string | null // 本次触发的触发压板
  goalLocked: number // 走到灯笼但必需光点不足时，缺少的数量；否则为 0
  pushed: { crate: string; from: string; to: string } | null // T6.6
  gatesChanged: string[] // T6.6：开关状态发生变化的门
  patrolMoves: { patrol: string; from: string; to: string }[] // T6.16
}

export function initialState(level: LevelDef): GameState
export function tilesOf(level: LevelDef, state: GameState): Map<string, Tile>
export function visibleTilesOf(level: LevelDef, state: GameState): Set<string> // 遮挡规则的只读视图，渲染用于点击过滤
export function occupiedOf(level: LevelDef, state: GameState): Set<string>
export function tileRefId(ref: TileRef): string
export function gatesOf(level: LevelDef, state: GameState, departing?: boolean): Record<string, boolean>
export function walkGraph(level: LevelDef, state: GameState): Graph
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
- **operate**：机关必须有把手，且限次把手还有剩余次数。触发集合 = 该机关 + 其 `links` 中的机关（只展开一层）。转盘档位 +1（`reverse` 时 −1，取模 4）；平移台按往返规则前进一站；切换门开关取反。限次把手的已用次数 +1。
- **乘坐**无需特殊处理：小人、积木箱、巡逻者的格子编号不变，位置随机关状态重新计算。
- `won` 为真后不再有合法动作。
- `gatesOf` 派生所有门的开关状态；`departing = true` 时忽略小人对按住压板的压力，供寻路与离开压板的动画使用。`walkGraph` 在 `buildGraph` 的邻居顺序上过滤不可进入的边，`findPath` 与 `reachableFrom` 使用同一张图。只有限次把手记录 `handleUses`，不限次把手不累加计数，以保持状态空间有限。

T6.6 新增：

- **不可进入的格子**：有积木箱、关着的门（含此刻未被按住的按住门）、巡逻者的格子，不能作为路线中的任何一格，也不能作为行走目标。
- **单向格**：只能从箭头的反方向那一格、沿箭头方向进入；从其他方向进入的边在寻路时视为不存在。离开不受限制。积木箱同样受约束。
- **push**：小人与积木箱屏幕相邻（积木箱所在格的屏幕坐标 = 小人屏幕坐标 + 方向 `d`）。目标格 = 积木箱格的屏幕坐标再加 `d` 处的路面；目标格必须存在、可行走（顶上无积木），且不是不可进入的格子；若目标格是单向格，`d` 必须与箭头一致。成立时积木箱移到目标格，小人移到积木箱原来的格子（这一格的光点照常收集）。
- **按住压板**：在静止状态下被小人、积木箱或巡逻者占着即为「按下」，按住门在按下时打开。按住压板只能绑定按住门。
- **自己压着不算**：计算 walk 的可达路线、判断 push 的目标格时，小人当前所在的按住压板按「没有小人」重新计算（只剩积木箱、巡逻者算数），由此得出的关闭的门视为不可进入。模拟器在小人离开压板格的第一步就播放关门动画。
- **门里有东西时不关**：门所在格有小人、积木箱或巡逻者时门保持打开。切换门在此时被切换为「关」：这次切换对该门无效（`gates` 不变），同一次触发的其他机关照常运动。按住门在这一格空出来后的下一次求值时再关闭。
- **遮挡断路**：路面顶面中心沿 `(1, 1, 1)` 的射线碰到任何积木（静态积木与机关积木，不含积木箱、门、巡逻者）时，这一格不能进入、不能作为行走目标、不能作为推动目标。小人所在格不受此限，仍可离开。射线检测复用 `visibility.ts`。

T6.16 新增：

- **巡逻者**：沿 `route` 移动。下一格 = `route[index + direction]`（环形路线首尾相接；往返路线到端点时先反向再取下一格）。下一格与当前格此刻屏幕相邻且相连、可进入（不被小人、积木箱、其他巡逻者、关着的门占据，未被遮挡，不逆着单向格）时移动过去，否则原地等待。

**每个动作的求值顺序**（必须严格遵守，求解器与模拟器一致）：

1. 执行动作本身（walk 的路线与光点收集、push、operate 及其联动）。
2. walk 的终点若是触发压板，触发它（等同 operate 其目标，含联动）。
3. 重新计算所有按住压板，更新按住门（遵守「门里有东西时不关」）。
4. 每个巡逻者按编号顺序走一格（T6.16）。
5. 再次重新计算按住压板与按住门。
6. 判断通关：小人在终点、必需光点已齐、本次动作是 walk 且终点为灯笼。

## 模拟器

T6.12v1 的角色遮挡提示只属于渲染层：PlayScreen 的 WebGL 画布启用 stencil；世界不写模板位，正常角色在不被场景遮住的像素写模板位 1。共享剪影材质使用反向深度测试、只读取模板位 0、不写深度或模板缓冲，排除角色自身重叠。角色在普通场景之后绘制，剪影随后绘制；几何体与材质均由 materials.ts 共享，不增加每帧射线搜索或 React 状态更新。Scene 仅在 interactive 时启用，标题与选关预览关闭。此渲染信息不返回规则层或作为可点击路面的依据。

`src/game/core/sim.ts` 在规则层之上负责动画、事件和撤销。

```ts
export type Command = Action // 与规则层的 Action 相同（walk、operate、push）

export type CommandResult =
  | 'ok'
  | 'busy'
  | 'unreachable'
  | 'no-handle'
  | 'unknown-target'
  | 'handle-used-up' // T6.6
  | 'cannot-push' // T6.6：不相邻或前方过不去

export type SimEvent =
  | { type: 'walk-start'; route: string[] }
  | { type: 'step'; tileId: string }
  | { type: 'orb'; id: string } // 动画走到光点格时发出
  | { type: 'goal-locked'; missing: number }
  | { type: 'mechanism-start'; id: string }
  | { type: 'mechanism-tick'; id: string }
  | { type: 'mechanism-end'; id: string }
  | { type: 'plate'; id: string; triggered: boolean }
  | { type: 'push'; crate: string } // T6.6
  | { type: 'gate'; id: string; open: boolean } // T6.6
  | { type: 'patrol-move'; patrol: string } // T6.16
  | { type: 'undo' }
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
  characterPose(): { position: Vec3; heading: number; walking: boolean; pushing?: boolean }
  mechanismPose(id: string): { rotationY: number } | { offset: Vec3 }
  orbPose(id: string): { position: Vec3; collected: boolean }
  cratePose(id: string): { position: Vec3 } // T6.6
  gatePose(id: string): { open: number } // T6.6：0 关闭，1 完全打开
  platePose(id: string): { pressed: boolean; spent: boolean } // T6.7：当前展示的静止压力与一次性状态
  patrolPose(id: string): { position: Vec3; heading: number } // T6.16
}
```

行为要求：

- `command` 在空闲时调用 `applyAction` 得到转移结果，把动作前的状态压入撤销记录，然后按结果播放动画；动画结束时提交新状态。
- 小人行走中发出新的 `walk`：当前这一格走完后改走新路线，替换撤销记录中的最后一项（不增加步数）。
- 行走中或机关运动中，`operate` 返回 `busy`；机关运动中，`walk` 返回 `busy`。
- 多个机关同时运动（联动），全部结束后才发出最后一个 `mechanism-end` 并接受新指令。
- **乘坐**：小人所在格属于正在运动的机关时，`characterPose` 按该机关当前动画姿态计算小人位置；转盘还要把转过的角度加到朝向上。
- 撤销立即恢复状态，不播放动画，发出 `undo` 事件。
- 一个动作的动画按规则层求值顺序依次播放：行走或推动 → 触发压板引起的机关运动 → 按住压板引起的门变化 → 巡逻者移动。前一段结束再播下一段，全部结束后才接受新指令。
- 推动：积木箱滑动 0.35 秒，小人同步跟进；跨越错觉连接时积木箱同样用 `segmentPoint` 插值。
- 开关门 0.4 秒；巡逻者每格 0.3 秒。
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
export function reachableStates(level: LevelDef): ReadonlyArray<Readonly<GameState>> // 校验器使用完整可达状态
export function randomWinRate(level: LevelDef, opts: { runs: number; maxActions: number; seed: number }): number
export function buildPolicy(level: LevelDef): Map<string, Action | null> // 状态键 → 最优下一步；死局为 null
export function nextHint(level: LevelDef, state: GameState): Action | null // 测试用；游戏内用 buildPolicy 的结果
```

- 广度优先搜索全部可达状态；每个状态的行走动作用 `reachableFrom` 一次算出，不要对每个目标单独寻路。
- 规则层复用同一关卡、同一状态的可达路线供动作枚举与执行使用，对外返回的路线保持独立；关卡定义在查询期间视为只读，状态变化会使旧路线失效。T6.14f为三站运输规模增加几何结果复用：按关卡身份、转盘档位及平移停靠位缓存路面／积木／占位与可见性，最多64个布局；initialState开始新局或搜索时清理对应关卡缓存。人物、箱子、门及按住压力仍逐状态求值，不缓存进入许可。公开路面坐标与集合均返回独立副本，不能污染后续查询；不改规则或邻居次序。求解器的状态扩展只调用 `legalActions`、`applyAction`、`stateKey`；标准解法指标复用 `tilesOf`、`reachableFrom` 的只读视图，不另写规则。
- 死局：建出状态图后，从所有通关状态反向搜索，搜不到的可达状态即死局。
- 随机通关率用固定种子的伪随机数（如 mulberry32），不用 `Math.random`。
- 「取舍」：一次操作或推动前后，从小人当前位置可达的路面集合，既有新增又有减少。
- 状态键必须包含 `GameState` 的全部字段；新增字段时同步更新 `stateKey`，否则求解器会把不同状态当成同一个。
- 「错觉连接」：路线上相邻两格的三维坐标差不是水平单位向量。
- 性能要求：每关 `analyze` 在测试中不超过 2 秒；规模上限见 [level-design.md](level-design.md#规模上限)。
- 所有状态搜索在发现第 30001 个主线状态或第 100001 个挑战状态前抛出 `StateLimitError`，校验器将其报告为「规模上限」，避免先穷举超大状态图再检查。元素数量限制在搜索前检查；巡逻者的数量与安全检查随 T6.16 接入。
- `npm run metrics` 通过根目录 `metrics.mjs` 复用 Vite 加载 TypeScript 模块，输出全部关卡的指标表；随机模拟统一使用种子 `20261016`、500 次，步数预算采用目标表的 `randomWin.steps`，缺省为 30。`core/metrics.ts` 共享这些参数，供指标命令与难度校验使用。
- `validateLevels(levels, targets)` 只对目标表登记的关卡强制检查难度指标和标准解法最优步数；首版九关不登记目标，仍接受结构、安全与可见性等校验。组合数超过 64 时，无重叠检查覆盖全部可达布局；乘坐安全始终检查全部可达状态；光点检查开局路面顶面中心的可见性。引用错误在模拟和求解前返回，避免无效引用导致异常。
- **游戏内提示**：`src/app/hint.worker.ts` 是一个 Web Worker（Vite 原生支持，不需要依赖）。进入关卡时把关卡编号发给它，它调用 `buildPolicy` 算出整关的最优策略并保存；点击提示时把当前状态键发过去，立即得到下一步。策略还没算完时，提示按钮显示「思考中…」，算完后自动给出结果。`src/app/hints.ts` 封装与 Worker 的通信。

## 渲染与驱动

- `PlayScreen` 用 `useMemo` 按关卡和重开次数创建 `LevelSim`，传给 `Scene`。
- `Scene` 的 `useFrame` 是唯一调用 `sim.update(dt)` 的地方，事件交给 `PlayScreen` 的回调（音效、提示、横幅、HUD 数字）。
- `Scene` 的更新优先级为 `-1`，在其他显示组件读取姿态之前推进模拟器，避免小人与乘坐平台相差一帧；负优先级不接管渲染循环。
- 渲染组件每帧从 `characterPose()`、`mechanismPose()`、`orbPose()` 读取位置，写到 `ref` 上。
- `Crates`、`Gates`、两种压板分别读取 `cratePose`、`gatePose`、`platePose`，不推导游戏规则；箱子推动后、按住门动画尚未结束时，压板已显示按下。`visibleTilesOf` 在规则状态真正改变时刷新，禁止点击被遮挡的路面。
- `Scene` 接受可选 `hint: { action, at }`，`at` 使用 `performance.now()`；路面、箱子、把手按该目标显示 2 秒高亮，提示计算和按钮由 T6.8 接入。光点收集和灯笼闪烁在模拟器事件发生时开始；撤销同步恢复光点、压板、把手和灯笼显示。动画更新只写 ref，几何体与材质由 `materials.ts` 共享，独立颜色或透明度动画使用该模块提供的实例材质并在卸载时释放。
- HUD 的步数和光点数在模拟器事件后更新 React 状态；`Scene.onStateChange` 在规则状态或空闲状态变化时补充通知（含门动画结束），不每帧更新。
- 撤销按钮调用 `sim.undo()`；提示按钮通过 `app/hints.ts` 查询 `stateKey(sim.state())` 的下一步，把结果交给 `Mechanisms`、`Blocks` 或 `Crates` 做 2 秒高亮，并在本局标记「用过提示」。

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
  tutorials?: ('walk' | 'collect' | 'rotate' | 'ride' | 'lift')[] // T6.12v4：已学能力
}

interface AppState {
  screen: 'title' | 'select' | 'play' | 'ending'
  current: { list: 'main' | 'challenge'; index: number } // 替代原来的 levelIndex
  save: SaveData
  quality: 'high' | 'low'
  goTitle(): void
  goSelect(): void
  play(list: 'main' | 'challenge', index: number): void
  completeLevel(id: string, result: { steps: number; allOrbs: boolean; usedHint: boolean }): void
  toggleMute(): void
}

function isUnlocked(save: SaveData, list: 'main' | 'challenge', index: number): boolean
```

- T6.12v3：选关常显数量、三项名称和勾／短横，最少步数并入对应评价；移除“不用提示”和重复已抵达文案。CompleteBanner只接收本次ratings、usedHint与步数，不接收历史记录；历史累计由选关展示。ratingCount只汇总三个既有布尔值，不新增判定、存档字段或修订。
- `completeLevel`：`done = true`；`allOrbs ||= result.allOrbs`；`bestSteps` 取较小值；`parMet ||= !usedHint && steps <= targets[id].minActions`。
- `isUnlocked`：主线第 1 关始终解锁，第 N+1 关在第 N 关 `done` 后解锁；挑战关 N 的规则见[设计稿](design.md#挑战章)——第 1 章挑战在第 1 章全部 `done` 后解锁，第 2～5 章挑战在该章所有关卡 `allOrbs` 后解锁。挑战关的解锁只看存档记录，不依赖当前会话。
- 读取存档：v2 正常读取；v1 只保留 `muted`，其余丢弃；损坏或未知版本用空存档，不报错。本地存储不可用时仍保留当前会话进度。
- T6.11 开发版主线为前两章六关，`mainLevels` 与 `levels` 指向同一列表，`challengeLevels` 为空；第六关完成后显示「后续章节即将开放」。全部关卡使用设计稿给定的 `targets`，通关保存不在主线程搜索状态图。
- 存储的 v2 对象额外记录 `campaign: 'remake'`，区分 T6.8～T6.9 兼容期的同名旧关卡；没有该标记的旧记录仅保留静音。内存中的 `SaveData` 接口与存储键名不变，后续章节沿用该标记，不重复清理重制关卡进度。
- T6.12a：保存对象增加 `revisions`（关卡编号到修订号）；`levels/index.ts` 从关卡的 `revision ?? 1` 导出版本表。读取旧记录时缺省修订号为 1，不匹配的关卡仅清除自身记录。第六关 T6.12a 升级为 2，T6.12b 升级为 3，前五关和静音保留；新评价保存后刷新不再清除。`soundtrack` 与 `revision` 均由 builder 透传，不参与规则状态。

## 首次教学（T6.12v4）

`app/tutorials.ts`仅处理文案和已学能力，不计算动作合法性或路线。PlayScreen消费模拟器实际事件：step、orb、mechanism-end，机关到位且角色格号属于该机关时记录乘坐。只有主线写入教学状态，内部样段和挑战不写。底部优先显示原运动／到位反馈，再显示当前关尚未完成的一句教学；完成后不挂载空底栏，通关不显示底栏。

SaveData增加可选tutorials；缺省为空，读档过滤未知值、去重，不使旧进度失效。T6.14在原有walk／collect／rotate／ride／lift之外增加link／plate／push／hold／oneway／limited。第五关通关只证明前五项。推动要等箱子位置提交，按住要等推箱教学已经记下且箱子静压开门，联动和召台要等到相关机关全部到位，限次把手要等该次操作到位，单向格只在踏入箭头格时记下。只在首次学会新能力时写入，撤销／重开不清除；旧成绩推断已完成关卡证明的能力，不清理评价、静音或修订。该字段不参与规则、求解器、步数或usedHint。

## 音频

- `engine.ts`：唯一的 `AudioContext`，首次真实交互时解锁。信号链：音乐总线（0.18）和音效总线（0.5）→ 主音量（0.28）→ 压缩器 → 输出；混响作为发送效果，两条总线都有发送量。静音时主音量归零并停止音乐调度。
- `theory.ts`：纯函数与数据，可单元测试。MIDI 编号与频率换算；五章的和弦进行与音阶，见[设计稿](design.md#音乐)；给定章节和时间返回当前和弦。
- `reverb.ts`：用双声道指数衰减噪声生成 2.5 秒脉冲响应，交给 `ConvolverNode`。
- 和弦铺底将每个音的双三角波合成到可循环的缓冲波形，低通与包络仍实时处理；每个上下文最多缓存 8 组波形。无需外部音频文件，换和弦及换章时仍可叠加淡化。引擎统一登记、释放音乐与音效音源，含预调度音源在内最多 12 个，超过时略过新音符。
- `music.ts`：`MusicPlayer`，提供 `start(chapter, challenge?, soundtrack?)`、`setChapter(chapter, challenge?, soundtrack?)`（3 秒交叉淡化）、`stop()`、`currentChord()`、`currentScale()`。用前瞻调度：每 100 毫秒安排接下来 0.3 秒内的音符。同一时刻最多 12 个发声音源。
- `sfx.ts`：`step`、`mechanism`、`orb`、`lantern`、`unreachable`、`undo`、`goalLocked`、`push`、`gate`、`patrol`，音高取自 `music.currentChord()` 和 `currentScale()`；音乐未启动时使用第 1 章的和弦。
- `app/sounds.ts`：把模拟器事件映射到音效：`step`→脚步，`mechanism-tick`→机关，`orb`→光点，`goal-locked`→提醒音，`undo`→撤销，`push`→推动，`gate`→开关门，`patrol-move`→巡逻者，`won`→灯笼。
- 静音时立即停止全部音源并清理调度器，混响位于主音量之前，尾音也归零；取消静音时从暂停的和弦位置淡入。章内八音盒间隔随章节略作变化，均在 1.5～4 秒内，挑战关再按 90% 速度延长间隔。
- 删除首版的 `ambient.ts`；旧的音频节点模拟测试随之移除，纯函数由 `theory.test.ts` 验证，音频生命周期及静音输出在真实浏览器中验证。巡逻者事件接线留到 T6.16。
- T6.12b：仅游玩第六关时启用 `courtyard` 配置，`App` 读取关卡字段传给 `MusicPlayer`；同章配置变化也三秒淡化，选关和标题恢复原生成式配置。`theory.ts` 的 `courtyardChordAt`、`courtyardNote` 与周期常量定义 96 秒乐句，实时音乐与效果音共用当前和弦。调度器跳过过去的整周期和音符，静音恢复不重新播放已经过去的音符。
- `instruments.ts` 用 Web Audio 缓冲波形合成音色，不加载外部音频：柔和键盘采用基频加非整数泛音及各自衰减，持续声层用整数周期谐波保证循环接缝连续，木质触感用固定种子噪声与共鸣。缓存按音频上下文分离，键盘最多 12 音、持续层最多 8 和弦、木质触感两种。音乐单音与操作音复用键盘缓存，仍统一受引擎 12 音源上限管理。
- 第六关持续声层不叠加独立低音；四秒起音、五秒释放，层增益 8.8（T6.12c：比上一版增加约 12 dB）。`sounds.ts` 接收关卡定义，只有 `courtyard` 在 `mechanism-start` 发运动材质声，并按机关顺序分配根音与五度音区；其他关卡的事件映射不变。`sfx.ts` 在第六关改用木质脚步和共用键盘回应；不参与任何规则求值。

- T6.12d 将第六关铺底包络电平从 0.32 降到 0.08，并在铺底低通之前串联 180 Hz 高通（Q=0.707）；键盘旋律包络系数从 0.3 提到 1.2，继续乘音符力度。层增益仍为 8.8，操作音及其他关卡保持原值。
- T6.12e：仅第一关新增 `soundtrack: 'courtyard'`，沿用相同音色与混音；`courtyardChordAt(seconds, chapter=2)`、`courtyardNote(index, chapter=2)` 在章节 1 选择 C 大调启程乐句，其他章节保持空庭乐句。实时调度与 `currentChord()` 均传入章节，音效同步使用实际和弦。默认参数保留第六关已有输出；第 2～5 关、标题和选关仍为生成式配置。
- 第一关 `revision: 2`，旧第一关评价独立失效，其他五关记录和静音保留；加载时不级联清空后续已解锁关卡。

- T6.12f：第二关 `revision: 2`，接入章节 1 的 `courtyard` 乐句与材质音效，不新增音频管线；存档按原有修订表仅清除第二关旧评价。第一关迁移测试显式提供第二关当前修订，以验证各关评价相互独立。
- T6.12g：第三关 `revision: 2`，接入章节 1 的主题声景；沿用已有按关修订迁移，不影响其他关卡与静音。
- T6.12h：第四关 `revision: 2`，使用章节 2 的空庭主题。主线保留静态可走中心，转盘定义增加低一格的长臂乘台与实心连接梁；把手移到前方底座，渲染仍完全读取关卡数据。
- T6.12i：第五关 `revision: 2`，第二章主题；一个转盘含短臂、长臂登船位与高平台，中心是实心。长臂下方折形梁不可行走，静态南侧与北台提供两种换乘路线；规则层与渲染无特例。
- T6.12j：标题读取主线第一关的章节与 `soundtrack`，选关读取当前关卡配置；同章返回选关沿用音乐层，跨章与返回标题沿用三秒交叉淡化。前六关已全部接入章节主题，省略 `soundtrack` 的后续关卡仍使用生成式音乐，不更改播放器、合成音色或混音。

### T6.12v6 接线与生命周期

2026-10-22用户已确认本轮声音试听，v6已勾选；随后用户明确确认前六关整体体验，T6.12已通过，下一项为T6.13设计。最新声音目标以[声音设计](design.md#音乐推进与成功反馈t612v6)为准；上方b～j保留历史记录。courtyard的96秒和声结构保持，旋律改为51音；`courtyardNote`与`courtyardPulse`给出纯数据，后者按0.75秒拍长、半拍错位，`pulseActive`与`pulseLevel`定义探索／收集／待点灯／完成层。`MusicPlayer.setProgress`只改变律动密度、强度和完成时的背景让位，不重启乐句。`musicStage`仅接收模拟器已显示的收光计数及won，不查询解法或判断机关连接。

`instruments.pluckedBuffer`按上下文缓存最多12个0.9秒短拨弦，与felt／silk缓存独立；新增律动使用240Hz高通，主旋律也高通180Hz，原铺底0.08／180Hz与主混音参数保持。`renderCourtyardNote`、`renderCourtyardPad`及`sfx.renderSound`可供临时OfflineAudioContext导出调用，复用实际合成代码，不向站点增加音频文件。AudioBus.context使用BaseAudioContext，实际引擎仍只建立一个AudioContext。

`PlayScreen`在实际orb／undo／won事件后更新音乐层；撤销先调用`AudioEngine.stopEffects`取消排程，再以已恢复的收光数回退进度，undo事件播放简短撤销音。Run卸载清理音效并重置探索层，覆盖重开与换关；App导航重置音效，标题／选关重置探索层，原章节和配置同步保持。音乐未解锁或静音时仍保留进度层状态，恢复只安排未来乐句，不补播效果音。

`sounds.orbSound`将普通必需／最后必需／选做映射为orb／ready／optionalOrb，最后必需用ready替代orb。`successNotes`定义三类收光、lantern及rating的实际音序与力度。正式won保存前后比较done／allOrbs／parMet独立新增条件，`playNewRatings`只在新增时发1～3音，约0.85秒后接在点灯琶音之后；重复通关和较差提示局不重复奖励，sample不触发正式评价。

引擎仍登记包括未来排程在内最多12个音源，音乐最多8个；音效在满额时替换最晚排程的音乐音。登记项含总线与排程时间，取消、结束、静音及上下文重建均删除并释放；stopEffects只清理音效，不重启同章音乐。静音将主音量立即归零并停止所有音源，混响自然尾音也不会输出；撤销／换关允许短暂自然混响尾音消散，但不保留未来音效。

## 结尾

最终关（第 15 关）在 `ending` 中列出 15 盏灯笼与塔的静态积木位置，其余时序沿用首版：终点灯笼先亮，其余每隔 0.45 秒点亮；全部亮后 0.6 秒照亮塔，再过 0.9 秒显示「谢谢游玩」和「回到标题」。阶段一版本没有第 15 关，第 12 关通关后按设计稿显示「第五章即将开放」。

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

`visibility.ts` 判断一个点沿 `(1, 1, 1)` 方向的射线是否碰到任何积木，供关卡校验与规则层的遮挡断路判断使用。遮挡断路采样路面顶面中心，解法可见性校验仍采样顶面 5 点；积木箱、门不参与遮挡射线。

### 相机取景

把所有积木（含机关所有可达状态下的位置和岛屿底部）投影到相机的右方向 `(1, 0, -1)/√2` 和上方向 `(-1, 2, -1)/√6`，求包围范围，设置中心和缩放。

## 性能预算

- 首次加载传输量（压缩后）不超过 1 MB。
- 集成显卡笔记本、中端手机保持 60 帧。
- 单关绘制调用不超过 400 次；超出时，同色静态积木改用 `InstancedMesh`。
- 所有积木共用一份几何体，材质按颜色缓存。

首版九关的[性能检查记录](performance.md)：终章最高 360 次调用，首屏约 326 KB。改版后在 T6.15（阶段一）、T6.19（阶段二）和 T6.22（阶段三）重新测量。

## 部署

- `.github/workflows/pages.yml`：推送到 `main` 或提交 PR 时，执行类型检查、格式检查、测试和构建；只有推送到 `main` 时才发布。
- 地址：`https://zzugbb.github.io/Seemingly/`。

## 独立体验样段（T6.12m）

独立样段 T6.12m：`levels/index.ts` 单独导出 `sampleLevels`，不加入主线、挑战或正式修订号表。`sampleTargets` 独立保存难度目标。页面状态增加 `sample`，无需解锁；`completeLevel` 仅接受主线与挑战 ID，样段通关不写评价。T6.12u2 起正常标题不提供样段入口，仅内部 `?sample=1` 控制初始页面；提示 worker 与样段共用现有求解策略。样段页面重试重建模拟器，撤销取消结果计时器。

`DecorDef.lanterns` 与 builder 的 `lamp` 只添加装饰坐标。场景复用灯笼组件，在通关后点亮、撤销后恢复，不生成路面或改变规则。

T6.12n 先由样段通过 `Scene.tactile` 开启操作反馈。T6.12p 起，main 与 sample 游玩显式开启，标题不传该参数因而关闭，挑战关留待以后评估，不按关名判断。`RenderFeedback.mechanisms` 记录模拟器启动、到位事件的时间戳；材质、把手缩放与标记透明度在 `useFrame` 更新 ref，不更改模拟器状态。撤销清空时间戳和目标圆圈；底部文字仅在事件或计时结束时更新。临时材质沿用 `useAnimatedMaterial` 的创建与释放，几何体复用现有缓存。

## 前六关重排的实现边界（T6.12o／o1，已实现）

设计与任务分解见 [opening-plan.md](opening-plan.md)。目标仍为六个主线 ID、两章各三关；新二至六关沿用现有 builder、规则、模拟器、求解器与存档格式，不新增关卡模式或迁移框架。T6.12q～t1 已逐关替换数据与该关目标、修订、行为测试，T6.12u 已完成主线连续回归。

T6.12p 已把现有 tactile 反馈扩大到 main 游玩，并按交接文档切换底部状态与不可达文案；正式 HUD、CompleteBanner、评价与下一关保持。样段独有的免评价、进入卡和完成卡仍按 list 分支，不按关名判断。T6.12t 已实现正式第五关，使用独立 id level-05 的完整定义，sample-01 仍留在 sampleLevels 且不写正式进度。T6.12t1 已将第六关替换为回环、revision 4；不新增联动、镜头或存档格式。T6.12u 在 t3 后从新入口核对新第五、六关连续流程，不能沿用旧版第六关的验收。

## 入口页面实现边界（T6.12o2，已实现）

[entry-design.md](entry-design.md) 为标题／选关的实现合同。t2、t3 已实现标题和选关，u 已回归全流程；u1 修正预览 Canvas 复用，u2 移除正常页面的样段入口。复用现有 store 的 firstPlayableIndex、isUnlocked、play 和 toggleMute；展示统计只遍历实际正式 ID，不新增存档字段、解锁规则、音频或关卡 metadata 字段。主题短句放 app 展示数据，必要纯辅助函数可放既有 app 目录。

标题只渲染 mainLevels[0] 初始场景。选关桌面最多一个 Canvas，初始预览 firstPlayableIndex，hover／focus 只更改本页状态；不能改变 store.current、触发音乐切换、启动提示 Worker 或写存档。窄屏不挂载选关预览画布。复用 Scene／LevelSim／CameraRig、共享材质与几何体；两个非游戏场景均 interactive=false、tactile=false，CameraRig 全局算法与固定方向不变。

DOM 样式限定入口作用域，关内 HUD、评价和样段完成流程保持。docs/assets 的入口图是设计参考，不作为站点资源导入。标题／选关已按稿替换；样段只保留内部直达及存档隔离，不在正常导航中提供重复关卡入口。

## 提交约定

- 提交信息用中文，前缀沿用 `feat:`、`fix:`、`docs:`、`refactor:`、`test:`、`chore:`。
- 一个任务一个提交，提交信息里写上任务编号，例如 `feat: 规则层支持联动（T6.2）`。

## T6.12v2 运动净空修复

第四至六关按当前关卡稿分开实际纵深并修整实心支架，保留换乘／降空台显露／双桥返程及原targets。角色运动时0.12秒轻微收身至94%，到位恢复，足底与剪影对齐；没有新增弹跳、镜头、点击限制或三维行走碰撞。`core/shapes.ts`共享角色姿态参数及岩层尺寸，`core/clearance.ts`只供设计和测试，不进入规则或每帧渲染。完整包络、轴承接缝例外与181姿态采样边界见[运动净空](motion-clearance.md)。第六关旧称“西高台”的接回端现为同实际高度的西远端，以当前level-06稿为准。

## T6.14a 第三稿接入边界（待T6.14b～g）

本轮仅修改设计与文档验证，src仍运行第二稿。新数据只使用既有LevelDef／builder／rules／sim／solver接口，无新规则、依赖、存档版本或目录。第七关revision 1保持，第八至十二关各在实施时升2；现有revisions读取仅清对应旧评价，前七关、muted和tutorials保留。不能清空全存档或预先把未实施关卡的targets改成未来值。

第八关两处手动转盘各links同一remote，单层联动不递归；第九关三处必需光和三门切换；第十关同一hold门改在近岸；第十一关新增trigger→toggle出口门；第十二关三站[0,2,6]、uses=8、两种远庭门和反推恢复侧廊，均由既有接口表达。八次是总额度，最优只使用四次，不能把最后一步剩余亮点当成未完成。各稿完整对象与预期指标是接入合同。

首次教学保留动作提交时点和既有能力记忆，第八关更新为“两个转轮，都能带动远处的桥”，不新增技能或重置旧link。第十二关call-far仍只有停住才触发；路过收光不等于开门。不更改自动寻路或提示动作选择来迎合标准路线。

默认check-designs检查第三稿；--runtime在接入前应明确拒绝旧revision，b～f后g必须全通过正式对象与targets比对。设计原型只在隔离Vite进程替换数据，不能把该预览配置、测试存档或临时文件打入正式构建。新章音乐与事件生命周期保持现实现；听感及难度仍待用户确认。
