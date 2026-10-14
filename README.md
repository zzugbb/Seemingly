<h1 align="center">Seemingly</h1>

<p align="center">
  <strong>积木错位 · 一条看起来连着的路</strong>
</p>

<p align="center">
  浏览器里的等距视角解谜游戏：路看似相连，就能走过去。
</p>

---

![画面小样](docs/assets/prototype-v0.png)

## 项目状态

当前是**画面小样（v0）**：一关可玩，用来验证画面风格和核心玩法。正式开发按[路线图](docs/roadmap.md)推进。

## 玩法

在等距视角下，两块不相邻的积木只要在屏幕上看起来接在一起，小人就能从一块走到另一块。玩家通过转盘、平移台、压板改变「看起来」的样子，为小人拼出一条通往终点的路。

小样这一关：

1. 点击路面，小人走过去。低处的步道和高塔塔顶并不相连，只是看起来相连。
2. 点击立柱上的金色转轮，桥梁转动 90 度，把塔顶和终点接上。
3. 走到发光的门前即通关。

## 本地运行

需要 Node.js 24（见 `.nvmrc`）。

```bash
npm install
npm run dev           # http://127.0.0.1:5180
npm run typecheck     # 类型检查
npm test              # 单元测试
npm run format        # 格式化
npm run build         # 生成静态站点到 dist/
npm run preview       # 预览构建产物
```

## 技术栈

- Vite + React 19 + TypeScript
- Three.js + React Three Fiber + drei
- 画面全部由代码生成，声音计划用 Web Audio 合成，不依赖任何外部素材
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
| [美术方向](docs/art-direction.md) | 配色、积木、角色、机关、灯笼、界面 |
| [路线图](docs/roadmap.md) | 按顺序执行的任务与验收标准 |

## 许可证

[MIT](LICENSE)
