# 贡献指南

欢迎报告问题、修正文档和贡献代码。使用问题见[求助说明](SUPPORT.md)，交流遵循[行为准则](CODE_OF_CONDUCT.md)，安全问题按[安全政策](SECURITY.md)处理。

## 贡献范围

维护以缺陷、兼容性、可访问性和文档修正为主。新功能及玩法、关卡难度、画风、目录或依赖变更，先开 Issue 确认范围。

动手前按[开发指南](AGENTS.md#必读文档)阅读决策、任务和相关规范，沿用现有写法；不得通过修改谜题、targets 或放宽预算消除测试失败。

## 开发准备

启动方法见[README](README.md#本地运行)。已有服务先检查再复用；自动化使用隔离端口和浏览器上下文，如 `npm run dev -- --port 5182 --strictPort`，不清空、预置或覆盖日常存档。

## 提交与验证

1. 搜索已有 Issue；外部贡献可 Fork 后创建分支，一个 PR 解决一个问题。
2. 说明触发条件和最终行为，逻辑变更补有意义的测试，同步受影响文档。
3. 使用[PR 模板](.github/pull_request_template.md)，记录实际验证及限制。提交使用简体中文 Conventional Commits，维护任务带[任务编号](docs/roadmap.md)，历史从 Git 查询。

所有提交前执行：

```bash
npm run typecheck && npm run format:check && npm test && npm run build
```

`npm run format` 格式化源码；Markdown 和设计稿需另查排版、链接与围栏。关卡、规则、求解、净空或谱面变更还须运行[正式设计校验](docs/levels/README.md#校验工具)。

画面／交互变更须实际操作并附截图，记录尺寸、画质与结果；后台页点击后先截图刷新。明确区分尺寸模拟、接口替身和真机结果，边界见[验收记录](docs/performance.md#仍未覆盖)。

不提交依赖目录、构建产物、缓存、私人存档或凭据；解法与关键截图标注“含剧透”。

贡献沿用 [MIT License](LICENSE)。main 推送触发检查与发布，PR 只检查；推送与发布须维护者明确安排。
