# 贡献指南

欢迎为 Seemingly（积木错位）报告问题、修正文档和提交改进。参与交流请遵循[行为准则](CODE_OF_CONDUCT.md)；使用问题见[求助说明](SUPPORT.md)，安全问题见[安全政策](SECURITY.md)。

## 贡献范围

当前十五主线、五挑战、结局和音乐已完成，维护以可复现缺陷、兼容性、可访问性和文档修正为主。新功能或会改变核心玩法、关卡难度、画面风格、目录结构、依赖的改动，请先开 Issue 与维护者讨论，确认范围后再实现。

固定相机、投影连通、遮挡断路和乘坐是既定规则；不通过修改谜题、targets 或放宽预算来消除测试失败。不增加外部模型、贴图、音频、后端、统计或广告。完整约束以[项目决策](docs/decisions.md)和[开发指南](AGENTS.md)为准。

## 开发准备

使用 Node.js 24（见 `.nvmrc`）及仓库锁文件：

```bash
git clone https://github.com/zzugbb/Seemingly.git
cd Seemingly
npm ci
npm run dev
```

默认地址为 `http://127.0.0.1:5180`，已有服务时先检查再复用。自动化验收使用隔离端口和浏览器上下文，例如 `npm run dev -- --port 5182 --strictPort`；不要清空、预置或覆盖日常游玩的存档。

动手前按[开发指南的必读顺序](AGENTS.md#必读文档)了解决策、任务和相关规范，沿用现有模块与写法。游戏规则只写在 `src/game/core/rules.ts`，关卡数据和渲染分离。

## 提交与验证

1. 先搜索已有 Issue；外部贡献可 Fork 后创建分支，保持一个 PR 解决一个明确问题。
2. 缺陷说明触发条件及修改后的行为；新增或调整逻辑时补能验证问题的测试，避免机械重复实现。
3. 同步受影响文档。维护任务记录在[任务列表](docs/roadmap.md)，已完成过程从 Git 历史查询，不另建开发流水账。
4. 所有提交前通过以下完整检查，使用简体中文 Conventional Commits；维护任务带任务编号，例如 `docs: 补齐开源协作资料（T7.4）`。

```bash
npm run typecheck && npm run format:check && npm test && npm run build
```

`npm run format` 可格式化源码；Markdown 和设计稿不在格式检查范围内，须人工核对排版、链接及代码围栏。涉及关卡、规则、求解、净空或谱面时，还须运行[正式设计校验](docs/levels/README.md#校验工具)，不得删减独立基准。

涉及画面或交互的改动，须用浏览器实际操作并附截图，说明尺寸、画质和结果。后台标签页可能暂停动画帧，点击后先截图刷新再判断。手机尺寸模拟、接口替身、真机和真实系统分享须分别说明；测试通过不代表已经完成真机验收。已知边界见[验收记录](docs/performance.md#仍未覆盖)。

创建 PR 时使用[仓库模板](.github/pull_request_template.md)，写明问题、最终改动、实际运行的检查及剩余限制。不要提交 `node_modules/`、`dist/`、缓存、私人存档、敏感截图或凭据。解法和关键机关截图请标注“含剧透”，避免在标题直接揭示谜底。

贡献按项目现有 [MIT License](LICENSE) 提交。main 推送会触发检查和 Pages 发布，PR 只检查；推送与发布由维护者明确安排。
