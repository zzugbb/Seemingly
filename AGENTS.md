# AI 开发指南

本文件写给参与本项目开发的 AI 助手。开始任何任务前先读完本文件，再按「必读文档」的顺序阅读相关文档。

## 项目一句话

Seemingly（中文名：积木错位）是一款浏览器里的等距视角解谜游戏：路看似相连，就能走过去。纯静态站点，部署在 GitHub Pages。

## 必读文档

| 顺序 | 文档 | 什么时候读 |
| --- | --- | --- |
| 1 | [docs/decisions.md](docs/decisions.md) | 每次都读。所有已定的决策，不要推翻 |
| 2 | [docs/roadmap.md](docs/roadmap.md) | 每次都读。找到你要做的任务编号和验收标准 |
| 3 | [docs/architecture.md](docs/architecture.md) | 写代码前读。目标架构、接口定义、目录规则 |
| 4 | [docs/design.md](docs/design.md) | 涉及玩法、机关、界面流程时读 |
| 5 | [docs/level-design.md](docs/level-design.md) | 制作或修改关卡时必读 |
| 6 | [docs/art-direction.md](docs/art-direction.md) | 涉及画面、角色、配色、界面样式时读 |

## 工作方式

1. **一次只做一个任务**。从 `docs/roadmap.md` 里按顺序取第一个未完成的任务，不要跳着做，也不要顺手做别的任务。
2. **先读后写**。动手前先读任务涉及的现有文件，沿用其中的写法。
3. **按验收标准自检**。任务完成的标准写在 roadmap 里，全部满足才算完成。
4. **更新文档**。完成后在 roadmap 里勾选该任务；如果实现和文档描述不一致，同步修改文档。
5. **小步提交**。每个任务一个提交，提交前必须通过下方的全部检查。

## 常用命令

```bash
npm install          # 安装依赖（Node 版本见 .nvmrc）
npm run dev          # 开发服务器 http://127.0.0.1:5180
npm run typecheck    # 类型检查
npm test             # 单元测试（Vitest）
npm run format       # 自动格式化
npm run format:check # 检查格式
npm run build        # 生产构建到 dist/
```

## 提交前必须通过

```bash
npm run typecheck && npm run format:check && npm test && npm run build
```

任何一项失败都不要提交。GitHub Actions 会在推送后执行同样的检查，失败时不会发布。

## 不可违反的规则

### 玩法

- **连通规则不可改**：两块路面的屏幕坐标 `(x - y, z - y)` 上下左右相邻即相连。不要加入「三维距离」「高度差」之类的额外判断。
- **相机固定**：等距正交视角，方向 `(1, 1, 1)`，玩家不能旋转或缩放相机。所有「换个角度」的效果都通过机关旋转积木实现。
- **机关运动期间**不接受行走指令；**小人站在机关积木上时**，该机关不能操作。
- 关卡必须满足 [docs/level-design.md](docs/level-design.md) 里的全部校验，并附带可自动验证的解法。

### 代码

- `src/game/core/` 只能是纯 TypeScript，**不得导入** `three`、`react`、`@react-three/*`。
- 关卡数据只放在 `src/game/levels/`，渲染代码里不得写死任何坐标。
- 颜色只能来自 `src/game/render/palette.ts`，不要在组件里写十六进制色值（界面 CSS 除外）。
- 共享几何体和材质走 `src/game/render/materials.ts`，不要在每帧或每次渲染时新建几何体、材质。
- 每帧更新写在 `useFrame` 里，修改 `ref`，不要在 `useFrame` 里调用 `setState`；只有状态真正变化（如机关到位、通关）时才更新 React 状态。
- 用 TypeScript 严格模式，不用 `any`，不用 `@ts-ignore`。
- 注释只写代码本身表达不了的约束，不写「这行做什么」。
- 代码标识符用英文；界面文字、文档、提交信息用简体中文。

### 依赖与资源

- 不要新增依赖。确有需要时只允许 [docs/decisions.md](docs/decisions.md) 中「允许的依赖」列出的包。
- 不引入外部模型、贴图、音频文件。画面用代码生成，声音用 Web Audio 合成。
- 不接入任何后端、统计、广告或第三方脚本。

## 画面相关任务的验证

类型检查和测试只能证明代码能跑，证明不了画面对不对。凡是改动画面的任务，都要：

1. 启动 `npm run dev`，在浏览器中打开页面并截图。
2. 按任务验收标准逐条对照截图。
3. 做交互验证时，注意自动化浏览器的后台标签页会暂停动画帧：点击后先截图一次让画面刷新，再判断结果，不要据此误判为逻辑错误。

## 常见陷阱

- **错觉连接的遮挡**：屏幕上相邻的两块路面，靠下的那块必须离相机更近，否则会被另一块的侧面挡住一角。详见 [docs/level-design.md](docs/level-design.md#遮挡规则)。
- **`-0`**：旋转计算可能得到 `-0`，测试比较坐标时先做 `v + 0` 归一化。
- **React Three Fiber 的点击**：只有绑定了事件的物体（或其父级绑定了事件）参与点击检测，没绑定事件的物体不会挡住点击。需要扩大点击范围时，统一用 `transparent`、`opacity={0}`、`depthWrite={false}` 的可见网格，不依赖 `visible={false}` 的行为。
- **Three.js 版本变化**：`PCFSoftShadowMap` 已被移除，阴影直接用默认的 `shadows`。
- **GitHub Pages 子路径**：站点部署在 `/Seemingly/` 下，资源路径一律用相对路径（`./`），不要写以 `/` 开头的绝对路径。

## 遇到不确定的情况

- 文档里有答案的，照文档做。
- 文档没覆盖、但不影响玩法和画面的实现细节，选最简单的做法，并在提交说明里写明。
- 会改变玩法、关卡、画面风格、目录结构或依赖的，**停下来询问用户**，不要自行决定。
