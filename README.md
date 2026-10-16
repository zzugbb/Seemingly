<h1 align="center">Seemingly</h1>

<p align="center">
  <strong>积木错位 · 一条看起来连着的路</strong>
</p>

<p align="center">
  浏览器里的等距视角解谜游戏：路看似相连，就能走过去。
</p>

<p align="center">
  <a href="https://zzugbb.github.io/Seemingly/">在线试玩</a> ·
  <a href="docs/design.md">设计稿</a> ·
  <a href="docs/roadmap.md">路线图</a> ·
  <a href="LICENSE">MIT</a>
</p>

---

![第 2 关「转动」：桥梁接通后，小人走到桥心](docs/assets/gameplay.png)

从序章「启程」到终章「归来」，共九关。转动桥梁、升起平台、踩下压板，抵达每关的灯笼，最后照亮一座塔。

## 玩法

在等距视角下，两块不相邻的积木只要在屏幕上看起来接在一起，小人就能从一块走到另一块。玩家通过转盘、平移台、压板改变「看起来」的样子，为小人拼出一条通往终点的路。

1. 点击路面，小人自动走过去；看起来相邻的路面就能连通。
2. 点击金色把手操作转盘和平移台，走到压板上停下可触发绑定机关。
3. 抵达灯笼即通关，进度保存在浏览器本地。

电脑和手机都用点击操作。`R` 重新开始，`Esc` 返回选关；右上角可切换静音。首次交互后播放柔和的合成音效与环境和弦，静音选择也会保存。

需要支持 WebGL2 的浏览器。手机默认使用低画质，也可用 `?quality=low` 或 `?quality=high` 指定画质；支持系统的「减少动态效果」设置。

## 技术亮点

- **屏幕上的连通**：用 `(x - y, z - y)` 判断路面是否相邻，以固定等距正交视角呈现跨越三维距离的错觉连接。
- **可验证的关卡**：纯 TypeScript 模拟器与渲染分离，九关均附确定解法，由 Vitest 校验连通、遮挡与机关规则。
- **代码生成的积木世界**：圆角积木、岛屿岩层、树木、角色与灯笼由几何体组成，共享积木几何体并缓存材质。
- **实时合成声音**：Web Audio 生成脚步、机关、走不通、灯笼琶音与环境和弦，无外部音频文件。
- **打开即玩**：纯静态站点，无账号、后端、统计或广告；进度与静音保存在浏览器本地。

首屏压缩资源约 326 KB，九关解法全过程最高 360 次绘制调用（含阴影）。测量范围与真机帧率待验证项见[性能检查](docs/performance.md)。

## 本地运行

需要 Node.js 24（见 `.nvmrc`）。

```bash
npm install
npm run dev           # http://127.0.0.1:5180
npm run typecheck     # 类型检查
npm test              # 单元测试
npm run format        # 格式化
npm run format:check  # 检查格式
npm run build         # 生成静态站点到 dist/
npm run preview       # 预览构建产物
```

GitHub Actions 在推送到 `main` 后执行类型检查、格式检查、测试和构建，再发布到 GitHub Pages 的 `/Seemingly/` 子路径。文档与截图对应当前仓库，在线版本随发布更新。

## 技术栈

- Vite + React 19 + TypeScript
- Three.js + React Three Fiber + drei
- 画面全部由代码生成，声音用 Web Audio 实时合成，不依赖任何外部素材
- 纯静态站点，通过 GitHub Actions 发布到 GitHub Pages

## 目录结构

```text
Seemingly/
├── AGENTS.md            AI 开发指南
├── docs/                设计、决策、架构、关卡规范、美术、路线图
├── public/              原样拷贝到站点根目录的静态资源
└── src/
    ├── main.tsx         入口
    ├── app/             页面外壳与界面
    ├── audio/           Web Audio 引擎、合成音效与环境和弦
    └── game/
        ├── core/        纯逻辑：屏幕坐标、连通、寻路、移动（不依赖 Three.js）
        ├── levels/      关卡数据与类型
        └── render/      3D 场景、角色、装饰、配色
```

目标目录和模块职责见[架构说明](docs/architecture.md)。

## 文档

| 文档 | 内容 |
| --- | --- |
| [AI 开发指南](AGENTS.md) | 开发规则、提交前检查、常见陷阱 |
| [决策记录](docs/decisions.md) | 已定的产品、玩法、声音、技术决策 |
| [设计稿](docs/design.md) | 核心规则、机关、关卡、界面流程、反馈与声音 |
| [关卡制作规范](docs/level-design.md) | 坐标系、遮挡规则、制作步骤、校验 |
| [架构说明](docs/architecture.md) | 目标目录、数据格式、模拟器接口、性能预算、部署 |
| [性能检查](docs/performance.md) | 九关绘制调用、首屏体积、测量环境与限制 |
| [美术方向](docs/art-direction.md) | 配色、积木、角色、机关、灯笼、界面 |
| [路线图](docs/roadmap.md) | 按顺序执行的任务与验收标准 |

## 许可证

[MIT](LICENSE)
