# 前六关体验编排与开发交接（T6.12o、T6.12o1、T6.12o2）

2026-10-22 T6.12v5更新：第三关现为revision 4，4／4步、52状态、0死局，光点移至南岸支路；登台后只转一次，接岸后离台取光再点灯。第二关继续在固定中心改变连接，第四关延伸为下桥空转并换长臂，既有targets均保持。只清除旧第三关评价；最新实现依据为[第三关完整稿](levels/level-03.md)。本文件下方以734c8a2为基线的目标表及17状态旧指标是历史交接记录，不覆盖本次修订。

2026-10-21 T6.12v2更新：第四至六关已由当前设计者修订运动净空，当前坐标、实心支架与解法以对应关卡稿为准；此处教学职责及原targets保持。第六关的接回端改称“远端”，与近端实际同高，投影位置不同。详见[运动净空](motion-clearance.md)。原稿“必须先站外角”的说法不准确：自动寻路允许西桥到位后从内端经外角走到西远端，主线同为12步；不得人为禁止或强制多点一次。

2026-10-21，指定设计者编写；T6.12o1 按用户要求重审第五、六关衔接，目标第六关改为「回环」，取代 o 中保留「两难」的结论。T6.12o2 又将标题与选关完善纳入本轮，按 [入口设计稿](entry-design.md) 在 t1 后分别实现 t2、t3，再做 u。**本轮只定稿文档，不修改运行中的关卡、目标表或页面。** 用户准备交由另一位 AI 开发，后续审核可由用户交回本轮设计者。

## 接手先读这里

1. 完整阅读根目录 AGENTS.md，再按其中顺序阅读决策、路线图、架构、设计、关卡规范和美术方向，最后读本文件及当前任务对应的单关稿。
2. 开发基线为 `734c8a2`（已含叠庭样段及操作反馈）。本设计提交在它之后，只改文档。不要把本文件的目标状态误认成代码已经完成。
3. **T6.12p 至 T6.12u** 已在本地完成。第六关是回环、revision 4。T6.12 仍待用户确认，不能因此进入 T6.13。
4. 新第二至第六关的完整参考实现、标准解法、指标与任务验收已写入 `docs/levels/level-02.md`～`level-06.md`。实现者按稿复制，不自行补谜题。第一关保留已有稿与数据。
5. 这些新稿已经用现有规则、求解器和校验器验证。T6.12u 已用隔离存档从新标题连续打通六关主线；这不代替用户对趣味性的确认。

## 为什么这样编排

正式前六关的旧节奏是连续三关静态找路，到第四关才开始操纵建筑。用户仍感到不够好玩。独立样段「叠庭」得到“比之前好不少”的反馈；它把操纵建筑、改变站位、发现前后通路和环境回应连在了一起。T6.12n 又完成把手、运动结构、到位、目标标记的反馈。

本轮将正式开场改为：**短入门 → 改变连接 → 乘坐 → 离桥换乘 → 升降显露 → 双桥接力回环**。第一章快速建立操作语言，第二章开始要求改变原先的想法。每关只承担一个主要认识，不以增加点击数替代发现。

前三关仍然短、容易，不能据此宣称解决了全部可玩性问题。需要检查的是玩家能否在第二关开始主动试验建筑、在第三关理解乘坐，再在第四至第六关遇到不同的空间问题。主观体验仍由用户和后续新手试玩判断。

## 当前代码与目标状态

下表“当前”固定指 `734c8a2`。实施期间，只有已完成对应任务的关卡才使用目标值；其余保留当前值。

| ID | 当前关名、主线／全收集 | 目标关名、主线／全收集 | 处理方式 | 目标修订号 |
| --- | --- | --- | --- | --- |
| level-01 | 启程，3／3 | 启程，3／3 | 保留布局、光点、声音与解法，仅接入共用反馈 | 2，保持 |
| level-02 | 看似，3／3 | 转动，3／3 | 用新稿替换静态三级回廊，提前教一个转盘 | 3 |
| level-03 | 错位，4／4 | 随行，4／4 | 用新稿替换静态巡回，教必须乘坐的单平台 | 3 |
| level-04 | 转动，6／12 | 换乘，8／12 | 复用基线旧第五关的换乘谜题，按新稿落到此 ID | 3 |
| level-05 | 乘风，8／12 | 叠庭，11／12 | 复用独立样段，正式存档仍使用 level-05 | 3 |
| level-06 | 两难，12／15 | 回环，12／14 | 按 o1 新稿替换，双桥取光接力、内端选做与外角返程 | 4 |

主线仍是六个文件、六个 ID，`mainLevels` 顺序不变；两章仍各三关，chapter 依次为 `[1,1,1,2,2,2]`，章名仍为“看似”“转动”。无需改文件名、目录、解锁方式或总评价数 18。新第二关落地后与尚未替换的旧第四关可能暂时同名，这是逐关交付的过渡状态，不因此顺手修改后续关卡。

旧第二、第三、第四关作为历史设计保存在 Git，不新增旧关副本、隐藏关或挑战入口。需要核对时使用 `git show 734c8a2:docs/levels/level-XX.md` 或对应源码。不要从已经被替换的文件猜测原布局。

## 六关各自要让玩家学到什么

### 第一关：启程——先认识“看起来接上就能走”

保留两处光点、入口庭院点灯、两种收集顺序和三步解法。它承接原来第二关的基础静态错觉认识，不再让玩家连续三关只找路。验收重点是能找到浅色路面、高处目标可辨、知道集光后回来点灯，而非卡住玩家。布局与 revision 都不改。

### 第二关：转动——我能改变建筑的连接

一个转轮、两条短臂、一个中央静台、一个光点、一个灯笼。标准解法走到静台、转一次、走向灯笼。入口先转会断开入口，但能恢复；这应成为安全试验，而非惩罚。中央有浅色顶板，主线不要求乘坐，避免一次介绍两个必须掌握的概念。允许玩家站桥臂上得到同样三步解，不限制现有乘坐规则。

### 第三关：随行——自己也能被建筑带走

T6.12v5：一个无可站中心的转盘、一块乘台、南岸光点支路及灯塔。先登台，转一次接南岸，离台取光再点灯，仍为四步；继续乘到东侧只能到空高台，需返回乘台转回南岸。第二关静台可站，第三关中心无顶板、乘坐必要，且正确停站后需要主动离台；不靠多转几圈延长。禁止乘坐时无解，不在中心补顶板，不用常驻停站或解法文字替代观察。第四关进一步要求下桥后空转，换到另一条臂。

### 第四关：换乘——载具也需要中转站

复用旧第五关的南台主线／北台选做结构。玩家先误以为坐短臂就能到终点，随后认识到要离桥、留在静态台、换到长臂。选做北台是另一种换乘站，不让玩家完成主线后再机械绕一整圈。它承担第二章的第一个规划问题，不再重复完整的转轮入门。

### 第五关：叠庭——让出位置，另一条路才显露

复用样段。第四关已经建立“下台再调建筑”的认识，本关新增竖向运动和一个明确的显露关系：乘升降侧翼上层，离台取光，再降空台，露出后方高台。选做要求利用侧翼抵达西台。把手移动与角色乘坐、静态侧廊停留、下降后的可见性应有清晰因果；不能用高亮正确解法代替发现。

### 第六关：回环——借另一座桥，回到原桥的另一层

按 T6.12o1 新稿替换旧两难：西低桥送人到东桥，乘东桥到东庭取第二处必需光点，返程经外角，让西远端接回，最后随长折臂转向后塔。西桥初始档 1，东桥初始档 0，不套用旧关档位或坐标。选做在东桥第一次转动后的内端停靠南庭，随后返程经外角；不再重复第五关的移开遮挡取光。目标 12／14、revision 4。

### 第五、六关为何这样衔接（T6.12o1）

第五关让玩家认识“先离开载具，才能移动空台并显露通路”；第六关把离桥和预先调整用于两座桥的接力，要求理解两桥接回的接口。第五关的纵向上升／显露，接第六关的横向去返／高台大幅转向，主线 11→12、全收集 12→14。操作种类和音乐不增加，以运动轨迹和规划关系区分，不用多加一套机关制造高潮。

这只是设计依据，不能从步数、状态或随机率推出“第六关一定更好玩”。T6.12u 必须连续试玩新五、六关，核对是否仍有新的转念、返程站位是否可推理、长折臂回到灯塔是否形成收束；若只是机械转轮或手机变小难辨，应反馈指定设计者修稿，不因旧第六关曾通过而跳过。

## 已验证的设计指标

目标版完整六关经 `validateLevels` 校验无错误；第二至第六关参考实现另通过严格 TypeScript 检查。随机模拟种子为 20261016，每关 500 次、30 步。下面是目标设计的结果，当前 `npm run metrics` 在代码尚未迁移时仍应打印旧布局结果，这是正常的。

| 目标关卡 | 主线／全收集 | 状态 | 死局 | 随机通关率 | 标准解法错觉／取舍 |
| --- | --- | --- | --- | --- | --- |
| 启程 | 3／3 | 40 | 0 | 71.0% | 2／0 |
| 转动 | 3／3 | 34 | 0 | 87.8% | 2／1 |
| 随行 | 4／4 | 17 | 0 | 56.0% | 2／2 |
| 换乘 | 8／12 | 110 | 0 | 14.4% | 5／3 |
| 叠庭 | 11／12 | 504 | 0 | 0.2% | 6／2 |
| 回环 | 12／14 | 536 | 0 | 0% | 7／4 |

第一章不设随机率与状态数门槛，不能拿第二章门槛反过来修改短教学。新第二、三关的目标来自新稿，不是为了使旧布局通过测试而降低目标。第四、五、六关的全收集路径分别用模拟器走通 12、12、14 步，并独立通过结构、安全、可见性和遮挡校验。

### 最终目标表

下面是 **T6.12t1 完成后的预期值**，本次不写入 `src/game/levels/targets.ts`。实现每关时只更新对应条目，不能提前整表替换。`sampleTargets` 原样保留。

```ts
const openingTargets = {
  'level-01': { minActions: 3, minActionsAll: 3, illusionsMin: 1 },
  'level-02': { minActions: 3, minActionsAll: 3, illusionsMin: 2, tradeoffsMin: 1 },
  'level-03': { minActions: 4, minActionsAll: 4, illusionsMin: 2 },
  'level-04': {
    minActions: 8, minActionsAll: 12, reachableStatesMin: 16,
    randomWin: { steps: 30, maxRate: 0.6 }, illusionsMin: 1, tradeoffsMin: 1,
  },
  'level-05': {
    minActions: 11, minActionsAll: 12, reachableStatesMin: 40,
    randomWin: { steps: 30, maxRate: 0.35 }, illusionsMin: 2, tradeoffsMin: 1,
  },
  'level-06': {
    minActions: 12, minActionsAll: 14, reachableStatesMin: 40,
    randomWin: { steps: 30, maxRate: 0.35 }, illusionsMin: 2, tradeoffsMin: 2,
  },
}
```

## 共用表现与页面边界

### 本轮可直接迁移的反馈

T6.12p 将现有样段反馈接入正式 main 游玩：把手成功操作 0.18 秒、最多 8% 轻压回弹；运动结构轻微提亮，到位 0.9 秒内恢复；目标圆圈保留到抵达后 0.6 秒淡出、带深色外缘并高于悬停顶板。减少动态效果时不增加缩放、扩散、脉动或镜头运动，保留稳定色差和文字。复用已有实现、材质管理和事件，不另造一套反馈系统。

T6.12p 前入口在 `PlayScreen` 的 `tactile={sample}`；实现后 main 与 sample 游玩开启，挑战关未来另行评估，标题背景仍关闭。不要改成按关名等于“叠庭”判断行为。

正式页运动期间以底部状态替换原静态操作提示：转盘为“桥臂转动中／桥臂已到位”，竖向 mover 为“升降台移动中／升降台已到位”，到位文字 1.4 秒后恢复当前关原提示；行走显示“正在前往路面”。不要同时叠两条底部提示。运动中重复点击不排队，提示等待；行走中点把手说明“小人正在行走，请稍候”。撤销和重开清除临时反馈，通关后点击不误报正在运动。

主线不可达文案统一避免暗示旋转镜头：含转盘或平移台时为“这里还没连通，试试调整建筑”，无机关时为“这里还没连通”。只改表现文案，不新增连通判断；目标合法性继续调用规则与模拟器。

### 保持正式游戏流程

正式六关继续使用当前 HUD、步数、三项评价、提示 Worker、下一关和第六关的“后续章节即将开放”。全收集与最少步数可跨次累计，4～6 关不承诺一次全收集就同时获得最少步数评价。不能为了让全收集结果看起来更好而改 parMet 或目标步数。

样段的进入说明、隐藏步数、免正式评价、2.2 秒后显示体验完成卡，仅属于 `list === 'sample'`。第五关复制谜题数据后仍走正式完成分支，装饰灯可亮，但评价和第六关跳转必须正常。独立 sample-01 的列表、内部 `?sample=1` 入口、提示、目标和存档隔离继续保留，作为后续回归基准；T6.12u2 已移除正常标题的样段入口。

T6.12o2 已按用户要求定稿 [标题与选关设计](entry-design.md)，纳入本轮 t2、t3：标题文字与第一关建筑分区，入口区分开始／继续／重访，进度分为抵达关数与评价数；选关保留章节和一按进入，增加下一站、主题文字与桌面单画布预览。每卡缩略图、章节灯光、分层提示和全局完成演出仍不在本轮；不能据旧候选建议自行添加。

## 开发任务拆分

| 任务 | 可修改范围与依赖 | 必须证明的结果 |
| --- | --- | --- |
| T6.12p 正式游玩反馈接入 | 基于现有六关，只改 PlayScreen 与必要渲染接口、对应文档；不改任何谜题、targets、revision 或声音 | 主线与样段反馈一致，标题默认无交互效果；正式三项评价保留；桌面、手机、减少动态效果、撤销、重开验证 |
| T6.12q 实现第二关转动 | p 后，复制 level-02.md；只改 level-02.ts、level-02 目标、该关测试、必要存档用例和设计稿状态 | 3 步、34 状态、零死局，禁用把手无解但不强制乘坐；手机实玩；仅旧第二关评价失效 |
| T6.12r 实现第三关随行 | q 后，复制 level-03.md；对应源码、目标、测试与状态 | 4 步、17 状态、零死局，过滤乘坐操作后无解；乘坐贴合、南台干扰与撤销；仅旧第三关评价失效 |
| T6.12s 实现第四关换乘 | r 后，复制 level-04.md；迁移旧第五关行为测试到第四关，替换旧第四关专属用例 | 主线 8／全收集 12，封长臂后无解；南／北两路线都验收；只清除旧第四关评价 |
| T6.12t 实现第五关叠庭 | s 后，复制 level-05.md；把样段行为验证应用到正式第五关，同时保留样段测试 | 主线 11／全收集 12，禁任一把手无解；遮挡、显露、撤销正确；正式写存档并能去第六关；只清除旧第五关评价 |
| T6.12t1 实现第六关回环 | t 后，复制新 level-06.md；对应源码、目标、存档与行为测试 | 12／14、536 状态、零死局；双把手／高台／乘坐不可绕过；内端南庭反事实成立，返程外角正确；revision 4 只清除旧第六关评价 |
| T6.12t2 标题页入口整理 | t1 后，按 entry-design.md 改 TitleScreen 与入口作用域样式／展示辅助函数及测试 | 文案与建筑分区、三种主入口状态正确，统计不混淆抵达与评价；内部样段隔离、静音、手机可达性正常，关卡与存档不变 |
| T6.12t3 选关页章节与建筑预览 | t2 后，按 entry-design.md 改 LevelSelect 与选关作用域样式／辅助函数及测试 | 下一站、锁定与保留记录正确；单次点击进入；桌面只有一个无交互预览，手机不挂载它；hover不改音乐或进度 |
| T6.12u 六关连续回归 | t3 后，从新标题、选关至六关更新实际状态，修复本轮集成缺陷；不另改谜题 | 新存档 1→6 逐关解锁，返回、刷新、声音衔接、提示、评价及旧存档保留正确；重点复验叠庭→回环的发现和收束 |

每项均须运行 `npm run typecheck && npm run format:check && npm test && npm run build`，全部通过才勾选、中文 Conventional Commit 带任务号，不推送。p～t3 涉及画面须运行 `npm run dev` 并保存截图，u 需完整浏览器回归。本设计文档提交不用为了“完成任务”去修改运行数据。

开发任务不要求实现者另行取得“设计者”身份；本稿已给出谜题。若实际校验失败、参考实现不能直接编译或出现影响玩法／画面的歧义，给出具体反例，交回用户指定设计者修稿。不得通过补路、调整坐标、删光点、削弱 targets 或复制规则来修复。

## 存档、测试与过渡提交

### 存档

保留 v2、`campaign: remake` 和既有逐关 revisions 机制，不做新的迁移框架。目标 revisions 为 `{level-01:2, level-02:3, level-03:3, level-04:3, level-05:3, level-06:4}`，只在对应谜题实现的提交中提号。

第一关始终保留当前评价；第六关在 t1 之前保留，t1 替换后仅其旧 revision 3 及更早评价失效。静音保留。新二至六关不继承旧同名或旧位置关卡的评价，也不把旧第五关评价搬到新第四关。每次修订只使当前被替换的 ID 旧评价失效，不级联删除后续评价来强制重玩。旧记录形成的已解锁状态按现有逻辑处理；首次连续体验用隔离测试存档检查，不清空用户正在使用的浏览器存档。

`save.test.ts` 有针对旧第二关 revision 2、旧第五关 revision 2 的固定数据；实现对应关时更新这些用例的语义：对当前修订可保留，对更早修订清除，对未改关及静音保留，写回刷新后不会反复清除。t1 还须更新现有把第六关 revision 3 当当前值的固定数据，验证旧 3 失效、新 4 保留及写回刷新。不要只把所有数字一律改成 3 或 4。

### 关卡行为测试

- `levels.test.ts` 的关名顺序分提交更新，最终为“启程、转动、随行、换乘、叠庭、回环”。章、ID、空挑战列表和无 ending 断言保持。
- q 替换旧三级回廊专属测试；r 替换旧静态巡回专属测试。用新稿的真实行为断言替换，不能只删旧测试和保留“可通关”。
- s 将当前“乘风”南台／北台换乘测试从 mainLevels[4] 应用到 mainLevels[3]，对应 targets 改 level-04；旧第五关还在运行，保留其测试直至 t。旧第四关下层选做平台不再属于新第四关。
- t 为正式 level-05 增加 sample.test.ts 已证明的乘坐、可见性前后、收光和撤销用例；原 sample.test.ts 和 store 中“样段不写主线进度”测试继续通过。
- t1 替换旧两难的 west#2 遮挡、旧北台与 15 步测试，加入回环的两处必需光点、南庭内端、外角返程、双把手和高台反事实；第一关与核心规则测试保留。测试数量可随有意义的用例迁移变化，不能以减少测试数量作为修复失败的办法。
- 乘坐必要性反事实只过滤规则层枚举出的动作，扩展仍调用 legalActions、applyAction、stateKey，禁止另写连通与高度规则。测试变体不进入正式关卡文件。

## 交付与审核清单

每项提交后，开发者向用户报告以下信息，方便后续设计审核：

1. 任务编号、提交哈希、修改文件、是否推送；说明有无用户原有未提交更改。
2. 本关参考实现与源码逐字段比对结果；metadata 差异只能是该稿明确写明的变换。p、u 应说明关卡数据没有变化。
3. `npm run metrics` 中当前实际关卡的报告；新旧混合阶段不要伪称整套目标已落地。主线与全收集的校验、必要机关／乘坐的反事实结果。
4. 四项检查结果；浏览器控制台有无错误。既有 Three.js 时钟弃用、阴影回退和构建体积警告可明确保留，不据此顺手升级依赖。
5. 桌面 1280×720、手机 375×667 至少开局、关键操作、通关三类截图；乘坐含中间帧，叠庭含空台下降前后。注明是尺寸模拟、低动态组件验收还是真机，不混称。
6. 实玩动作、得到的步数与光点、撤销／重开／提示／静音结果。后台浏览器先刷新画面再判断，不把动画暂停误报成规则问题。
7. 任何偏离设计、未验证项和待用户决定的问题；测试通过不替代“是否更好玩”的体验结论。

审核先检查教学发现是否成立，再查规则、坐标、标准解法、存档及表现证据。若页面看着漂亮但第二关无需转动、第三关无需乘坐、第四关不用换臂、第五关无需让出投影位置、第六关可绕过第二座桥或不必返回西远端，均不算实现合格。

T6.12u 完成后等待用户对完整新开场确认，仍由用户勾选 T6.12。第七关及第五章原先“首次引入升降／遮挡”的教学角色须在 T6.13 设计时重审，不能照旧表重复开一遍教学；这一点不授权当前开发者提前写第七关。

## 接手状态与历史交接指令

当前 q～u 已实现，u1 修复预览并补齐手机全收集，u2 清理正常入口与过时文案；T6.12 仍待用户确认。以下为开发前的历史指令，不能据此重复实施已完成任务；正常页面不再显示样段入口。

> 仓库为 github-space/Seemingly。先完整阅读 AGENTS.md，并按顺序阅读决策、路线图、架构及 docs/opening-plan.md。当前处于 T6.12 内的前六关新编排。T6.12p 已把叠庭操作反馈接入正式主线，不要重复实现，也不要把新关稿当成源码已经完成，不要推进 T6.13。下一项只做 T6.12q：复制 level-02.md，保留目标表中尚未替换的其他关、音乐、三项评价和样段隔离。按该稿与交接文档验收桌面与手机，四项检查全部通过后勾选该子任务，以中文 Conventional Commit 带任务号提交，不推送。交付提交哈希、变更范围、检查结果与截图，供用户安排审核；本次不要顺手实现下一关。以后按 r、s、t、t1、t2、t3、u 顺序逐项实现；新第六关已改为回环、revision 4，不能沿用旧两难保留结论。实现 q～t1 时严格复制对应单关稿，遇到谜题或指标问题反馈，不自行改坐标或 targets；t2、t3 按 docs/entry-design.md 的状态、尺寸与 docs/assets/entry-*.jpg 视觉参考实现，u 放在两页完成之后。

## 复现设计校验

下面的临时脚本从本次设计稿读取参考实现，不覆盖 `src/`。在仓库根目录将代码保存到临时 `.mjs` 后用 Node 运行即可；不需要新依赖。它验证未来六关的主线、指标、第二关替代路线、第三关干扰路线、4～6 关全收集，以及必要机关／乘坐反事实。动画和浏览器仍须开发者另行验收。

```js
import { readFile, writeFile, mkdtemp, rm } from 'node:fs/promises'
import { resolve, join } from 'node:path'
import { tmpdir } from 'node:os'
import { pathToFileURL } from 'node:url'

const root = process.cwd()
const { createServer } = await import(pathToFileURL(resolve(root, 'node_modules/vite/dist/node/index.js')).href)
const folder = await mkdtemp(join(tmpdir(), 'seemingly-opening-'))
const server = await createServer({ root, configFile: false, cacheDir: join(folder, 'vite'), optimizeDeps: { noDiscovery: true, include: [] }, server: { middlewareMode: true, ws: false }, appType: 'custom' })
try {
  const plan = await readFile(resolve(root, 'docs/opening-plan.md'), 'utf8')
  const targetSource = plan.split('### 最终目标表')[1].match(/```ts\n([\s\S]*?)```/)[1]
  const targetFile = join(folder, 'targets.ts')
  await writeFile(targetFile, targetSource + '\nexport default openingTargets\n')
  const { default: targets } = await server.ssrLoadModule(targetFile)
  const levels = []
  for (let index = 1; index <= 6; index++) {
    const id = String(index).padStart(2, '0')
    const doc = await readFile(resolve(root, `docs/levels/level-${id}.md`), 'utf8')
    const code = doc.split('## 参考实现')[1].match(/```ts\n([\s\S]*?)```/)[1]
      .replace(/'\.\/builders'/g, JSON.stringify(resolve(root, 'src/game/levels/builders.ts')))
      .replace(/'\.\/types'/g, JSON.stringify(resolve(root, 'src/game/levels/types.ts')))
    const file = join(folder, `level-${id}.ts`)
    await writeFile(file, code)
    levels.push((await server.ssrLoadModule(file)).default)
  }
  const { validateLevels } = await server.ssrLoadModule('/src/game/core/validate.ts')
  const { measureLevel } = await server.ssrLoadModule('/src/game/core/metrics.ts')
  const { analyze } = await server.ssrLoadModule('/src/game/core/solver.ts')
  const { LevelSim } = await server.ssrLoadModule('/src/game/core/sim.ts')
  const { initialState, legalActions, applyAction, stateKey } = await server.ssrLoadModule('/src/game/core/rules.ts')
  const errors = validateLevels(levels, targets)
  if (errors.length) throw new Error(JSON.stringify(errors))
  const walk = to => ({ type: 'walk', to })
  const op = mechanism => ({ type: 'operate', mechanism })
  const times = (count, mechanism) => Array.from({ length: count }, () => op(mechanism))
  const alternatives = [
    [levels[1], [walk([4,1,3]), op('bridge'), walk([2,0,0])]],
    [levels[2], [walk([2,1,3]), op('ferry'), walk([4,2,6]), walk([3,1,4]), op('ferry'), walk([6,2,4])]],
    [levels[3], [walk([5,2,4]), ...times(3,'ferry'), walk([5,1,1]), ...times(2,'ferry'), walk([6,2,3]), ...times(3,'ferry'), walk([12,5,7])]],
    [levels[4], [...levels[4].solution.slice(0,5), walk([-1,1,0]), ...levels[4].solution.slice(5)]],
    [levels[5], [walk([4,2,5]), op('west'), walk([6,2,4]), op('west'), op('east'), walk([7,2,6]), walk([7,2,5]), op('east'), walk([9,2,5]), walk([8,2,5]), op('east'), walk([10,3,4]), op('west'), walk([2,2,-3])]],
  ]
  for (const [level, solution] of alternatives) {
    const errors = validateLevels([{ ...level, solution }], {})
    if (errors.length) throw new Error(JSON.stringify(errors))
    const sim = new LevelSim(level)
    for (const action of solution) {
      const command = action.type === 'walk' ? { type: 'walk', tileId: sim.tileAt(action.to)?.id } : action
      if (sim.command(command) !== 'ok') throw new Error(`${level.id} 额外路线动作失败`)
      for (let frame = 0; frame < 800 && !sim.isIdle(); frame++) sim.update(1/30)
      if (!sim.isIdle()) throw new Error('动画未完成')
    }
    if (sim.status !== 'won' || sim.orbProgress().collected !== sim.orbProgress().total) throw new Error(`${level.id} 未全收集通关`)
  }
  for (const [index, id] of [[1,'bridge'],[2,'ferry'],[4,'lift'],[4,'ferry'],[5,'east'],[5,'west']]) {
    const copy = structuredClone(levels[index])
    delete copy.mechanisms.find(item => item.id === id).handle
    if (analyze(copy).minActions !== null) throw new Error(`${copy.id} 可绕过 ${id}`)
  }
  const blockedLongArm = structuredClone(levels[3])
  blockedLongArm.mechanisms[0].blocks[1].kind = 'solid'
  if (analyze(blockedLongArm).minActions !== null) throw new Error('换乘可绕过长臂')
  const blockedHigh = structuredClone(levels[5])
  blockedHigh.mechanisms.find(item => item.id === 'west').blocks[1].kind = 'solid'
  if (analyze(blockedHigh).minActions !== null) throw new Error('回环可绕过西远端')
  const canWinWithoutRiding = level => {
    const queue = [initialState(level)], seen = new Set([stateKey(queue[0])])
    for (let index = 0; index < queue.length; index++) {
      const state = queue[index]
      if (state.won) return true
      for (const action of legalActions(level,state)) {
        if (action.type === 'operate' && state.at.startsWith(action.mechanism + '#')) continue
        const next = applyAction(level,state,action).state, key = stateKey(next)
        if (!seen.has(key)) { seen.add(key); queue.push(next) }
      }
    }
    return false
  }
  if (!canWinWithoutRiding(levels[1]) || canWinWithoutRiding(levels[2])) throw new Error('第二／三关乘坐教学边界不成立')
  if (canWinWithoutRiding(levels[5])) throw new Error('回环可绕过乘坐')
  const noSouthDockWin = all => {
    const level = levels[5], start = initialState(level)
    const queue = [{ state: start, depth: 0 }], seen = new Set([stateKey(start)])
    for (let index = 0; index < queue.length; index++) {
      const { state, depth } = queue[index]
      if (state.won && (!all || state.orbs.length === level.orbs.length)) return depth
      for (const action of legalActions(level, state)) {
        const transition = applyAction(level, state, action)
        if (action.type === 'walk' && state.rotator.east === 1 && transition.route.includes('east#0')) continue
        const next = transition.state, key = stateKey(next)
        if (!seen.has(key)) { seen.add(key); queue.push({ state: next, depth: depth + 1 }) }
      }
    }
    return null
  }
  if (noSouthDockWin(false) !== 12 || noSouthDockWin(true) !== null) throw new Error('回环南庭选做层次不成立')
  console.table(levels.map(level => ({ id: level.id, revision: level.revision, ...measureLevel(level) })))
  console.log('设计、额外路线与反事实校验通过；这不表示运行数据已迁移或画面已验收。')
} finally {
  await server.close()
  await rm(folder, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 })
}
```
