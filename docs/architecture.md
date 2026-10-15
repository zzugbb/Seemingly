# 架构说明

> M3 已完成。M4 开发中：音频引擎和音效已接入，环境和弦按路线图继续实现。

## 技术栈

| 层 | 选择 |
| --- | --- |
| 构建 | Vite 8，开发端口 5180，`base: './'` |
| 界面 | React 19 + TypeScript（严格模式） |
| 3D | Three.js + React Three Fiber 9 + drei 10 |
| 页面状态 | zustand（M1 引入） |
| 测试 | Vitest |
| 格式化 | Prettier（无分号、单引号、行宽 120） |
| 部署 | GitHub Actions + GitHub Pages |

## 目标架构

### 目录

```text
src/
├── main.tsx
├── app/                       页面与界面（React DOM）
│   ├── App.tsx                按 store.screen 切换页面
│   ├── store.ts               zustand：页面、当前关卡、存档、静音、画质
│   ├── save.ts                本地存储读写，键名 seemingly:save:v1
│   ├── screens/
│   │   ├── TitleScreen.tsx
│   │   ├── LevelSelect.tsx
│   │   ├── PlayScreen.tsx     创建模拟器，挂载画布与 HUD
│   │   └── Ending.tsx         同一游戏场景上的结尾文字与按钮
│   ├── hud/
│   │   ├── Hud.tsx            关名、重新开始、选关、静音
│   │   ├── Toast.tsx
│   │   └── CompleteBanner.tsx
│   └── styles.css
├── audio/                     Web Audio 合成，不依赖 React
│   ├── engine.ts              AudioContext、主音量、静音
│   ├── sfx.ts                 脚步、机关、走不通、点亮灯笼
│   └── ambient.ts             环境和弦
└── game/
    ├── core/                  纯 TypeScript，禁止导入 three / react
    │   ├── iso.ts             屏幕坐标、连通、寻路、移动插值
    │   ├── mechanisms.ts      转盘、平移台、压板的状态与积木位置计算
    │   ├── sim.ts             LevelSim 模拟器
    │   ├── visibility.ts      顶面可见性射线检测
    │   ├── validate.ts        关卡校验
    │   ├── solve.ts           按解法运行模拟器
    │   └── *.test.ts
    ├── levels/
    │   ├── types.ts           关卡数据类型
    │   ├── builders.ts        defineLevel 与搭建辅助函数
    │   ├── index.ts           按顺序导出 9 个关卡
    │   ├── level-00.ts … level-08.ts
    │   └── levels.test.ts     对全部关卡运行校验
    └── render/                Three.js / React Three Fiber
        ├── Scene.tsx          一关的完整场景，每帧驱动模拟器
        ├── CameraRig.tsx
        ├── Lights.tsx
        ├── Blocks.tsx         静态积木
        ├── Mechanisms.tsx     转盘、平移台、压板、把手的显示
        ├── Character.tsx
        ├── Lantern.tsx        终点灯笼
        ├── Finale.tsx         最终关灯笼与塔的点亮
        ├── ending.ts          结尾时序
        ├── Decor.tsx          岛屿岩层、树、花、窗、云、光点
        ├── quality.ts         画质档位
        ├── materials.ts
        └── palette.ts
```

依赖方向只能是：`app → render → core`、`app → audio`、`render → levels → core`。`core` 和 `levels` 不能导入 `render`、`app`、`audio`。

### 关卡数据

`src/game/levels/types.ts` 的目标定义：

```ts
export type Vec3 = [number, number, number]
export type Axis = 'x' | 'y' | 'z'
export type Face = 'x' | 'z' // 只允许可见的 +x、+z 两个侧面

export type ColorName = 'sand' | 'terracotta' | 'rose' | 'teal' | 'tealLight' | 'plum' | 'cream'

export interface BlockDef {
  pos: Vec3
  color: ColorName
  kind: 'path' | 'solid'
}

export interface MechBlockDef {
  offset: Vec3 // 相对于转盘中心或平移台原点
  color?: ColorName // 默认 tealLight
  kind?: 'path' | 'solid' // 默认 path
}

export interface HandleDef {
  block: Vec3 // 把手所在的静态结构积木
  face: Face
}

export interface RotatorDef {
  type: 'rotator'
  id: string
  pivot: Vec3 // 必须是一块静态积木，本身不转
  blocks: MechBlockDef[]
  initialStep?: 0 | 1 | 2 | 3
  handle: HandleDef
}

export interface MoverDef {
  type: 'mover'
  id: string
  origin: Vec3
  axis: Axis
  stops: number[] // 沿 axis 的整数偏移，升序，如 [0, 2, 3]
  initialStop?: number // stops 的下标，默认 0
  blocks: MechBlockDef[]
  handle: HandleDef
}

export interface PlateDef {
  type: 'plate'
  id: string
  tile: Vec3 // 必须是一块静态路面
  target: string // 被触发的转盘或平移台的 id
  once?: boolean
}

export type MechanismDef = RotatorDef | MoverDef | PlateDef

export interface IslandDef {
  x: [number, number]
  z: [number, number]
  y: number
  depth: number
}

export interface DecorDef {
  islands: IslandDef[]
  trees: Vec3[]
  flowers: Vec3[]
  windows: { pos: Vec3; face: Face }[]
}

export type SolutionStep = { type: 'walk'; to: Vec3 } | { type: 'operate'; mechanism: string }

export interface LevelDef {
  id: string // 'level-00' … 'level-08'
  title: string // 中文关名
  blocks: BlockDef[]
  mechanisms: MechanismDef[]
  start: Vec3
  goal: Vec3
  decor: DecorDef
  hints?: string[] // 底部操作提示，只在教学关使用
  solution: SolutionStep[]
  ending?: { lanterns: Vec3[]; tower: Vec3[] } // 最终关布景，第一盏灯笼为终点
}
```

约定：

- 静态路面的格子编号是 `"x,y,z"`，机关积木的编号是 `"机关id#下标"`。
- 转盘积木的世界坐标 = `pivot + rotateOffset(offset, step)`。
- 平移台积木的世界坐标 = `origin + offset + 轴方向单位向量 × stops[stopIndex]`。
- `palette.ts` 必须为每个 `ColorName` 提供颜色。

### 模拟器

`src/game/core/sim.ts` 是唯一的游戏逻辑来源。渲染层、界面和测试都只通过它读写游戏状态。

```ts
export type Command = { type: 'walk'; tileId: string } | { type: 'operate'; mechanism: string }

export type CommandResult = 'ok' | 'busy' | 'unreachable' | 'standing-on-mechanism' | 'unknown-target'

export type SimEvent =
  | { type: 'walk-start'; route: string[] }
  | { type: 'step'; tileId: string } // 每到达一格
  | { type: 'mechanism-start'; id: string }
  | { type: 'mechanism-tick'; id: string } // 转盘每 90 度、平移台每 1 格
  | { type: 'mechanism-end'; id: string }
  | { type: 'plate'; id: string; triggered: boolean }
  | { type: 'won' }

export class LevelSim {
  constructor(level: LevelDef)
  readonly level: LevelDef
  readonly status: 'playing' | 'won'

  command(cmd: Command): CommandResult
  update(dt: number): SimEvent[] // dt 单位秒，内部上限 1/30
  isIdle(): boolean // 没有行走、没有机关在动

  tiles(): Map<string, Tile> // 当前静止状态下的全部路面
  tileAt(pos: Vec3): Tile | undefined
  characterPose(): { position: Vec3; heading: number; walking: boolean }
  mechanismPose(id: string): { rotationY: number } | { offset: Vec3 }
}
```

行为要求：

- `command` 立即返回结果，不推进时间；动作在后续的 `update` 中进行。
- 机关运动中或小人行走中，`operate` 返回 `busy`；机关运动中，`walk` 返回 `busy`；小人行走中发出新的 `walk`，在当前这一格走完后改走新路线。
- 小人所在格子属于目标机关时，`operate` 返回 `standing-on-mechanism`。
- 压板在小人停在其上、路线走完时触发，规则见[设计稿](design.md#压板)。
- 抵达终点且路线走完时，产生 `won` 事件，此后拒绝所有指令。
- 所有时长常量（行走速度、动画时长）定义在 `sim.ts` 顶部，和设计稿一致。

### 渲染与驱动

- `PlayScreen` 用 `useMemo` 按关卡和重开次数创建 `LevelSim`，传给 `Scene`。
- `Scene` 的 `useFrame` 是**唯一**调用 `sim.update(dt)` 的地方。返回的事件交给 `PlayScreen` 传入的回调，回调负责播放音效和更新界面。
- 渲染组件每帧从 `characterPose()`、`mechanismPose()` 读取位置，写到 `ref` 上，不经过 React 状态。
- 机关积木作为一个组渲染：转盘组放在 `pivot`，设置 `rotation.y`；平移台组放在 `origin`，设置 `position` 偏移。
- 点击路面调用 `sim.command({ type: 'walk', tileId })`；点击把手调用 `sim.command({ type: 'operate', mechanism })`；返回值不是 `ok` 时显示对应提示。

### 结尾

最终关在 `ending` 数据中列出九盏灯笼与序章塔的静态积木位置。通关时切换到 `ending` 页面状态，但 `App` 对 `play` 和 `ending` 共用同一个 `PlayScreen` 挂载分支，保留 Canvas、模拟器和相机。场景停止漂浮，终点灯笼先亮，其余每隔 0.45 秒点亮；全部亮后 0.6 秒照亮塔，再过 0.9 秒显示「谢谢游玩」和「回到标题」。`Finale` 每帧只累计 ref，在点亮阈值变化时更新 React 状态。发光材质由 `materials.ts` 缓存。

### 页面状态

`src/app/store.ts`：

```ts
interface SaveData {
  version: 1
  completed: string[] // 已通关的关卡 id
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
  completeLevel(id: string): void // 写入存档
  toggleMute(): void // 写入存档
}
```

- 存档读写集中在 `save.ts`；读取失败或版本不符时使用空存档，不报错。
- 画质初始值见 `render/quality.ts`：网址参数 `quality` 优先，其次粗指针设备为 `low`，其余为 `high`。

### 音频引擎

`audio/engine.ts` 不依赖 React。模块加载只创建管理对象；`App` 在首次真实点击或键盘交互中调用 `unlock()` 创建并恢复唯一的 `AudioContext`。所有声音经过同一 master Gain（音量 0.28），存档静音值在解锁前应用。静音立即将 master 设为 0，取消静音用 0.015 秒时间常数恢复音量，避免突变；静音或上下文尚未运行时，`getBus()` 不提供输出，不排队补播声音。后续交互重试恢复挂起的上下文，音频能力缺失或恢复失败不阻断游戏。

音效由页面层的 `app/sounds.ts` 将模拟器 `step`、`mechanism-tick`、`won` 事件分别映射到脚步、机关和灯笼声。`Scene` 只上报事件、不可达结果与结尾点灯，不导入音频模块；通关负责第一盏灯，其余八盏由 `Finale` 的点亮阈值各触发一次。

`audio/sfx.ts` 的合成参数（均经过 master）：

| 声音 | 合成 | 时长与音量 |
| --- | --- | --- |
| 脚步 | 850 Hz 低通噪声 | 35 ms，峰值增益 0.065 |
| 机关 | 160→65 Hz 三角波，叠加 600 Hz 低通噪声 | 140 ms，三角波 0.075、噪声 0.045 |
| 走不通 | 440→220 Hz 下行正弦音 | 300 ms，峰值增益 0.09 |
| 灯笼 | 523.25、659.25、783.99 Hz 正弦琶音 | 每音 360 ms，间隔 120 ms，峰值增益 0.12 |

每个短音都有起落包络并预定停止，结束后断开音源、滤波器和增益节点；噪声缓存在对应上下文中。静音时不创建新音源。

### 画质档位

| 项目 | 高 | 低 |
| --- | --- | --- |
| 像素比上限 | 2 | 1.5 |
| 阴影 | 2048 | 关闭 |
| 光点粒子 | 全量 | 减半 |
| 云 | 3 朵 | 1 朵 |

开启「减少动态效果」时，额外关闭场景漂浮、云朵移动和光点粒子。

## 核心算法

### 屏幕坐标与连通

积木 `(x, y, z)` 的屏幕坐标为 `(x - y, z - y)`，见 `screenKey`。`buildGraph`：

1. 收集当前所有路面（静态路面加机关路面的当前位置）。
2. 过滤掉顶上压着积木的格子。
3. 屏幕坐标上下左右相邻的格子互相连通。

`findPath` 做广度优先搜索，返回最少步数的路线。

### 跨越错觉连接的移动

两格的三维差可以分解为水平单位方向 `d` 加 `k × (1, 1, 1)`。`segmentPoint` 前半程沿 `d` 走到中点，过中点后切到目标一侧的等价位置继续走。两点只差 `k × (1, 1, 1)`，正交视角下投影相同，看不出跳变。

### 可见性检测

`visibility.ts` 判断一个点沿 `(1, 1, 1)` 方向的射线是否碰到任何积木（射线与立方体的分轴相交测试），供关卡校验使用，规则见 [level-design.md](level-design.md#校验)。

### 相机取景

把所有积木（含机关所有状态下的位置和岛屿底部）投影到相机的右方向 `(1, 0, -1)/√2` 和上方向 `(-1, 2, -1)/√6`，求包围范围，设置中心和缩放；窗口尺寸变化时重新计算。

## 性能预算

- 首次加载传输量（压缩后）不超过 1 MB。小样为 320 KB。
- 集成显卡笔记本、中端手机保持 60 帧。
- 单关绘制调用不超过 400 次；超出时，同色静态积木改用 `InstancedMesh`。
- 所有积木共用一份几何体，材质按颜色缓存；不在渲染或每帧中新建几何体和材质。

## 部署

- `.github/workflows/pages.yml`：推送到 `main` 或提交 PR 时，执行类型检查、格式检查、测试和构建；只有推送到 `main` 时才发布到 GitHub Pages。
- 仓库的 Pages 来源已设为 GitHub Actions。
- 地址：`https://zzugbb.github.io/Seemingly/`（已上线）。

## 提交约定

- 提交信息用中文，前缀沿用 `feat:`、`fix:`、`docs:`、`refactor:`、`test:`、`chore:`。
- 一个任务一个提交，提交信息里写上任务编号，例如 `feat: 实现转盘机关的模拟逻辑（T1.3）`。
