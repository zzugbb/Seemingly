# 架构说明

## 技术栈

Vite、React、TypeScript 严格模式、Three.js、React Three Fiber、drei、zustand；测试用 Vitest，格式化用 Prettier。Node 24，版本与依赖以 `.nvmrc`、package.json 和 package-lock.json 为准。

## 目录

```text
src/
├── main.tsx                 React 入口
├── app/
│   ├── App.tsx              页面切换、音频解锁与导航同步
│   ├── store.ts / save.ts   当前关卡、解锁、历史评价、本地存储
│   ├── entry.ts             入口统计、主线续玩、挑战下一关
│   ├── tutorials.ts         首次能力教学与记忆
│   ├── hints.ts / hint.worker.ts  后台提示通信与策略
│   ├── JourneyButton.tsx / JourneyDialog.tsx  成绩卡入口与弹窗
│   ├── journey.ts / journey-image.ts        成绩汇总、分享与PNG
│   ├── screens/             标题、选关、游玩、结局
│   ├── hud/                 游戏工具、评价、完成卡、提示
│   └── styles.css           DOM 样式
├── audio/
│   ├── engine.ts            音频上下文、总线、音源容量与取消
│   ├── music.ts / theory.ts 背景调度、谱面、和声、进展层
│   ├── sfx.ts / instruments.ts / reverb.ts  合成音色与混响
│   └── mix.ts               音量与反馈让位包络
└── game/
    ├── core/                纯逻辑，不导入 Three.js／React
    ├── levels/              类型、builder、十五主线、五挑战、targets
    └── render/              场景、固定相机、几何材质、反馈、角色和装饰
```

## 关卡数据

[types.ts](../src/game/levels/types.ts) 定义 `LevelDef`，包含 ID、中文名、章节、revision、静态积木、机关、光点、箱、巡逻者、起终点、装饰、标准解法及可选 ending。使用 [builders.ts](../src/game/levels/builders.ts) 构造，坐标只写在关卡数据中。

- 静态路面以 `cellId([x,y,z])` 标识；机关路面以 `机制ID#块索引` 标识，机关运动后身份不变。
- `TileRef` 引用静态坐标或机关块；光点、箱和巡逻路线共用该引用。
- 机关为 rotator、mover、plate、gate；把手可省略，links 只做一层联动，不递归。
- `solution` 是 walk／operate／push 序列，walk 的坐标取动作当时的实际位置。
- `ending` 在第十五关列出十五灯及塔，渲染层不写关卡坐标。
- index.ts 导出主线、挑战及修订表。内部 sample-01 复用第五关数据，仅用于回归，不加入正式进度或解锁。

具体布局、完整参考实现、目标与反事实见[关卡索引](levels/README.md)，不得用简化说明替代正式稿。

## 规则层

[rules.ts](../src/game/core/rules.ts) 是唯一游戏规则实现；sim、solver、提示和校验共用。`GameState` 记录人物格、机关档位／往返方向、光点、一次性压板、门、把手用量、箱、巡逻位置／方向与通关状态。

| 接口 | 职责 |
| --- | --- |
| initialState | 初始化状态并清理关卡缓存 |
| tilesOf / visibleTilesOf | 当前路面及可见路面 |
| walkGraph / reachableFrom | 动态可行走图与一次 BFS 得到的全部路线 |
| legalActions | 枚举合法行走、推动、操作 |
| applyAction | 返回独立的 Transition 或 null，不改变输入状态 |
| stateKey | 序列化完整求解状态 |
| gatesOf / patrolTilesOf | 当前门与巡逻占位的只读视图 |

动作先应用玩家变化、收光、停板和联动，再更新压力与门、依编号推进巡逻、重新计算压力，最后判断通关。巡逻受阻会等待，不收光、不触发普通压板。按住门须把人物视为已经离开自己的压板，门内占位保护仍适用。

规则同时处理顶压、遮挡、单向、门及人物／箱／巡逻占位。屏幕连通不得增加三维距离／高度差门槛；“看不见不能进入”不等于运行时实体碰撞。

性能复用限定在 rules.ts：按关卡身份索引只读定义；按机关布局缓存几何、邻接、单向与静态可进入集合，每关最多64布局。动态门、占位和压力逐状态计算。路线缓存校验影响通路的字段及索引身份，公开图返回副本；完整 stateKey 不删字段。不得为缓存命中删合法动作或更改邻居顺序。

## 模拟器

[LevelSim](../src/game/core/sim.ts) 将规则层的瞬时 Transition 展示为动画，整步完成才提交新状态。渲染使用 `state()`、`tiles()`、`characterPose()`、机关／门／箱／巡逻姿态和 `orbProgress()`。

- `command(action)` 返回 ok／busy／unreachable 等结果；`update(delta)` 推进动作并返回事件。
- 先展示人物行走或推动，再展示机关与旧巡逻压力、巡逻移动和新门状态；多机关按各自实际时长插值。
- 机关运动中不接受行走；行走中可改目标，仍记一步，路线与规则层相同。
- `undo()` 恢复人物、机关、箱、门、巡逻朝向、光点及步数；行走可中止，机关运动期间不可撤销。
- `isIdle()`、`steps()`、`canUndo()` 供界面读取，历史成绩不随本局撤销而回退。

## 求解器与校验

solver.ts 仅通过规则层展开状态，BFS 计算最短解，反向搜索计算死局和提示策略。`analyze`、`reachableStates` 不保存未使用的正向动作边，仍展开全部动作并保留反向边；`buildPolicy`、`nextHint`、固定随机模拟保留完整边与动作顺序。

- 每个状态只做一次可达搜索，不对每个目标格单独寻路。
- 冷求解小于两秒，主线／挑战状态上限30000／100000；完整结构、安全、解法和500次随机组合校验使用10秒测试窗口，不能放宽求解预算。
- metrics.ts 与根目录 metrics.mjs 统一输出难度指标，随机种子 `20261016`，每关500次。
- validate.ts 负责结构、引用、可见性、遮挡、乘坐安全、解法与规模检查；运动净空是额外的设计工具，见[规范](motion-clearance.md)。
- 三个 `docs/levels/check-*.mjs` 从正式稿提取 TS／JSON 基准，独立验证设计并在 `--runtime` 下核对源码；谱面基准 `.mjs` 不进入站点运行。

提示 Worker 在进入关卡时预建策略，界面通过 hints.ts 查询。请求序号忽略旧回复，重开／退出释放 Worker。只有获得有效提示或明确无解结果才设置 usedHint；创建或运行失败只显示不可用说明，不影响评价。策略未就绪期间可正常游玩。

## 渲染与驱动

Scene 每帧调用 sim.update，消费真实事件；useFrame 只修改 ref，状态变化时才更新 React。palette.ts 统一颜色，materials.ts 共享几何与材质，同色静态实心积木及灯笼光粒实例化；不在每帧分配几何或材质。

- CameraRig 固定正交方向 `(1,1,1)`，按静态建筑、机关全部位置与岛屿底部包围范围自动取景。
- Character 只在游玩中启用遮挡剪影，不改变规则或可进入格；乘坐与机关动画共用姿态。
- 交互反馈由实际输入／事件触发，不能推断正确解法；非交互预览禁用 tactile。
- 扩大点击范围使用透明且 depthWrite=false 的可见网格，不依赖 visible=false。
- WebGL2 不可用时显示说明；使用默认 shadows，保留已评估的库警告。

## 页面状态与存档

store.ts 只管理 title／select／play／ending、当前列表与索引、历史存档和画质；解锁集中由 `isUnlocked` 决定。标题续玩找首个未抵达主线关，选关预览不写 current 或触发音乐换章。

本地键 `seemingly:save:v2` 保存每关 done／allOrbs／bestSteps／parMet、静音、教学及修订信息。三项评价历史分别取并集，步数取最小值；未知关和 sample 不能写正式成绩。只清除修订不匹配的单关记录，不清空整份存档；存储不可用仍可维持会话进度。

首次教学由 tutorials.ts 选择文案，实际动作提交后记忆，不计提示使用；学过后跨撤销／重开／刷新保持。挑战与内部样段不写主线教学，旧记录只推断其确已接触的能力。

## 界面与成绩卡

标题一个真实首关 Canvas；选关宽度至少960px时只挂一个真实初始状态预览，按关卡切换 Scene／sim，窄屏不挂载预览。它们不建立提示策略、执行解法或写成绩。完成流程与响应式要求见[界面流程](design.md#界面流程)。

主线全通后 JourneyButton 在点击内按需 import 成绩卡模块；捕获网络／分块错误，保留游戏，提示检查网络或刷新。加载中忽略重复请求且保留按钮焦点；卸载后忽略晚到结果。页面、音频与存档不因打开卡片改变。

journey.ts 只汇总正式 ID 的已有历史。journey-image.ts 用独立 LevelSim 执行第十五关正式 solution，Scene.snapshot／Finale.complete 只初始化静态已点亮结局，不触发成绩、声音或演出回调。按1080×1000、DPR1、高画质和减少动态渲染，第四帧显式绘制后同步复制至1080×2100 Canvas2D；不更改游戏的 preserveDrawingBuffer。

导出完成立即卸载额外 Canvas，仅保留 PNG Blob／File 与一个对象URL；预览、下载和系统分享使用同一文件，关闭释放URL并忽略迟到结果。12秒无结果、上下文丢失或生成错误可重试。原生 dialog 隔离游戏输入，Tab循环、Esc关闭并回到入口。canShare 检查文件能力，share 在用户点击内调用；取消静默，其余失败保留图片与下载。

## 音频

正式关卡使用 courtyard 五章谱面，theory.ts 统一实际起音、时值、节拍、和弦、循环和进展层。挑战将整套谱面时钟统一缩放到90%，反馈速度与已确认混音保持。当前参数与听感约束见[音乐](design.md#音乐)。

- AudioEngine 只建立一个上下文；首次可信点击／按键解锁。总线为主音量、音乐、音效和混响，所有当前及未来音源登记管理。
- 最多12源，其中音乐最多8源；反馈优先替换最晚排程的音乐。换章使用既有交叉淡化，同章时钟连续。
- sfx 在真实反馈时调用共享背景让位包络，35ms进入；重叠取较低目标，不叠乘。脚步／巡逻不反复压低背景，恢复期新事件保持连续。
- PlayScreen 消费收光／撤销／通关事件切换进展层和音效；sample不发正式评价奖励。重开／换关／撤销取消旧排程，退出回探索；静音清源并暂停，恢复不补播。
- 第十五关进入可取消的F结局铺底；塔实际亮起才接塔音序，装饰灯不逐灯发成功音。撤销恢复探索，已有历史不回退。

## 核心算法

投影坐标 `(x-y,z-y)` 的上下左右相邻路面建立图，BFS 寻路。三维差分为水平单位方向加 `k×(1,1,1)`；segmentPoint 在中点切到目标侧等价位置，固定正交视角下连续。

遮挡射线沿 `(1,1,1)`：运行规则采样顶面中心，解法可见性校验采样顶面五点；门和箱不参与遮挡射线。取景将全部建筑投到相机右方向 `(1,0,-1)/√2` 与上方向 `(-1,2,-1)/√6`，据包围范围设置中心和缩放。

## 画质档位

| 项目 | 高 | 低 |
| --- | --- | --- |
| DPR 上限 | 2 | 1.5 |
| 阴影 | 2048 | 关闭 |
| 光粒 | 全量 | 减半 |
| 云 | 3朵 | 1朵 |

减少动态效果额外关闭漂浮、云移动和光粒，保留必要位移，收光飞行改为直接消失。

## 性能预算

首次加载 gzip 不超过1MB，单关绘制不超过400次，目标为集显笔记本／中端手机60帧；目标设备长期帧率尚未由真机覆盖。已测数据、方法与限制集中在[验收记录](performance.md)。

## 部署

Vite 使用 `base: './'`；所有资源使用相对路径。main 的推送与手动工作流通过类型、格式、测试、构建后发布 GitHub Pages，PR 只检查不发布；工作流在 `.github/workflows/pages.yml`。推送或发布必须由用户明确指示。
