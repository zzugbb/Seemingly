<h1 align="center">Seemingly</h1>

<p align="center"><strong>积木错位 · 路看似相连，就能走过去。</strong></p>

<p align="center">
  <a href="https://zzugbb.github.io/Seemingly/"><img src="https://img.shields.io/badge/Play-Online-6B8F71" alt="在线游玩"></a>
  <a href="https://github.com/zzugbb/Seemingly/actions/workflows/pages.yml?query=branch%3Amain" title="main 分支最近一次推送的检查与发布"><img src="https://github.com/zzugbb/Seemingly/actions/workflows/pages.yml/badge.svg?branch=main&amp;event=push" alt="检查与 Pages 发布"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-8A667D" alt="MIT 许可证"></a>
  <a href=".nvmrc"><img src="https://img.shields.io/badge/Node.js-24-5F8575" alt="开发环境：Node.js 24"></a>
</p>

<p align="center">
  <a href="https://zzugbb.github.io/Seemingly/">在线游玩</a> ·
  <a href="#项目演示">视频演示</a> ·
  <a href="#本地运行">本地运行</a> ·
  <a href="SUPPORT.md">使用帮助</a> ·
  <a href="CONTRIBUTING.md">参与贡献</a>
</p>

一款固定等距视角的浏览器解谜游戏。转动桥梁、移动平台，让画面中的路面接起来；即使实际高度不同，只要看起来相邻，小人就能走过去，收集光点、抵达灯笼。

![高画质游戏画面：悬浮岛上的积木、桥梁与灯笼](docs/assets/gameplay.png)

- **五章十五个主线关卡，五个独立挑战**：从投影错觉、乘坐换乘，到推箱与机关配合。
- **六十项历史评价**：抵达、全收集、最少步数可分次获得，重玩不覆盖已有成绩。
- **随时试错**：无限撤销与主动提示；挑战不影响主线结局。
- **本地旅程成绩卡**：主线全通后可生成 PNG，按浏览器能力保存或系统分享。

## 项目演示

约 77 秒项目介绍，结合动画讲解投影错觉、机关与实现，并穿插游戏实录。下方可直接播放 720p 版本（约 9.3 MB）。

https://github.com/user-attachments/assets/364dae7d-32f0-47b8-916c-5550bc07dfbc

[下载 1080p 原片（约 14.3 MB）](https://github.com/zzugbb/Seemingly/raw/refs/heads/main/docs/assets/seemingly-promo-v6-1080p.mp4) · [直接游玩](https://zzugbb.github.io/Seemingly/)

## 怎么玩

点击浅色路面行走，点击金色转轮或拉杆操作机关。集齐必需光点后抵达灯笼通关，带细环的是选做光点；小人可站在移动积木上随它一起移动，相机保持固定。

电脑点击、手机轻触即可操作。电脑可用 `Z` 撤销、`H` 提示、`R` 重开、`Esc` 返回选关；手机菜单提供重开、选关和静音。使用主动提示后，本局不授予最少步数评价，已有历史评价保留。

需要支持 WebGL2 的浏览器，首次交互后播放声音。进度保存在当前浏览器本地，无账号、云存档、统计或广告。解锁、声音、画质与图片保存等问题见[使用与求助](SUPPORT.md)；设备兼容与实测边界见[验收记录](docs/performance.md#仍未覆盖)。

<details>
<summary>查看手机尺寸游戏截图</summary>

<img src="docs/assets/gameplay-mobile.png" alt="手机尺寸模拟下的高画质游戏画面" width="300" />

</details>

## 本地运行

使用 Node.js 24（见 `.nvmrc`）：

```bash
git clone https://github.com/zzugbb/Seemingly.git
cd Seemingly
npm ci
npm run dev
```

默认开发端口为 5180，打开终端输出的地址。生产构建使用 `npm run build`，输出到 `dist/`；`npm run preview` 可本地预览构建结果。完整检查与提交要求见[贡献指南](CONTRIBUTING.md)。

## 设计与实现

基于 React、TypeScript、Three.js 和 React Three Fiber。画面由代码生成，声音由 Web Audio 合成；纯静态站点，通过 GitHub Pages 部署。

正式内容已完成并发布，当前以问题修复、兼容性和文档维护为主。

| 想了解 | 阅读入口 |
| --- | --- |
| 玩法、界面、音乐与美术 | [游戏设计](docs/design.md) |
| 规则、模块与存档 | [架构说明](docs/architecture.md) |
| 谜题设计与验证（含剧透） | [正式关卡稿](docs/levels/README.md)与[关卡规范](docs/level-design.md) |
| 维护范围与任务 | [项目决策](docs/decisions.md)与[维护任务](docs/roadmap.md) |
| 已验证结果与限制 | [验收记录](docs/performance.md) |

## 参与与反馈

欢迎[报告问题](https://github.com/zzugbb/Seemingly/issues/new/choose)、修正文档和贡献代码，请先阅读[贡献指南](CONTRIBUTING.md)。交流遵循[行为准则](CODE_OF_CONDUCT.md)，安全问题按[安全政策](SECURITY.md)私密报告；解法与关键截图请标注“含剧透”。

## 许可证

[MIT](LICENSE) · zzugbb
