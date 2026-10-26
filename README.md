<h1 align="center">Seemingly</h1>

<p align="center"><strong>积木错位 · 路看似相连，就能走过去。</strong></p>

<p align="center">
  <a href="https://zzugbb.github.io/Seemingly/">在线游玩</a> ·
  <a href="docs/design.md">游戏设计</a> ·
  <a href="docs/levels/README.md">关卡设计</a> ·
  <a href="LICENSE">MIT</a>
</p>

![挑战五「相托」：运回箱子，让出站位](docs/assets/gameplay.png)

一款固定等距视角的浏览器解谜游戏。转动和移动积木，让屏幕上看似相连的路真正可走，再通过乘坐、换乘、推箱和巡逻重量规划抵达灯笼。

五章十五个主线关卡，加五个独立挑战、六十项历史评价。主线结局点亮十五盏灯和一座塔；挑战不影响结局。当前关卡、音乐和整体体验已获用户试玩确认，开发与发布已完成。

## 怎么玩

- 点击浅色路面自动行走，点击金色转轮或拉杆操作机关；小人和箱子可随机关移动，相机保持固定。
- 集齐必需光点后抵达灯笼通关，带细环的是选做光点。后续章节引入压板、门、推箱、单向格、限次把手和按动作前进的巡逻者。
- 第一章通关解锁挑战一，后四章各自全收集解锁对应挑战。下一挑战已解锁时可连续进入，否则回选关。
- 每关分别累计抵达、全收集和最少步数三项评价，可分局补齐；本局用提示会影响本局步数评价，重玩不抹历史。
- 主线全通后可打开“旅程成绩”，保存含建筑和成绩的PNG；支持文件分享的浏览器可调用系统分享，手机也可长按或截图。

电脑和手机均用点击操作。`Z`撤销、`H`提示、`R`重开、`Esc`返回选关；手机菜单中提供重开、选关和静音。进度与静音存在浏览器本地，无账号、后端、统计或广告。

需要支持WebGL2的浏览器。手机默认低画质，也可用 `?quality=low`／`?quality=high` 指定；支持系统减少动态效果。首次交互后播放Web Audio合成音乐和反馈。图片下载通常进入下载列表，分享目标与相册行为由设备／浏览器决定。

<img src="docs/assets/gameplay-mobile.png" alt="手机尺寸下的挑战二「分岸」" width="300" />

## 本地开发

Node.js 24，版本见 `.nvmrc`。

```bash
npm ci
npm run dev           # http://127.0.0.1:5180
npm run typecheck
npm run format:check
npm test
npm run build         # dist/
npm run preview
```

提交前完整执行 `npm run typecheck && npm run format:check && npm test && npm run build`。`npm run format` 自动格式化。

推送main后，GitHub Actions检查并发布到 `/Seemingly/`；PR只检查。资源使用相对路径，保持子路径部署有效。推送和发布须用户明确指示。

## 实现

Vite、React、TypeScript、Three.js、React Three Fiber、drei和zustand；Vitest测试、Prettier格式化。画面由几何体、共享材质和实例化绘制生成，声音由Web Audio合成，不使用外部素材。

```text
src/app/           页面、HUD、存档、提示通信、成绩卡
src/audio/         音频引擎、谱面、混音与合成音效
src/game/core/     纯TypeScript规则、模拟器、求解器与校验
src/game/levels/   关卡类型、builder、正式数据与targets
src/game/render/   固定相机、场景、角色、装饰、几何与配色
docs/             当前设计、约束、正式关卡稿和验收依据
public/           favicon与社交分享图
```

## 文档导航

| 文档 | 内容 |
| --- | --- |
| [开发指南](AGENTS.md) | AI工作规则、必读顺序和提交要求 |
| [项目决策](docs/decisions.md) | 当前产品范围、不可变规则和依赖约束 |
| [游戏设计](docs/design.md) | 玩法、界面、成绩卡、反馈、音乐与视觉规范 |
| [架构说明](docs/architecture.md) | 模块职责、规则／模拟器／提示接口、存档与部署 |
| [关卡制作规范](docs/level-design.md) | 坐标、遮挡、难度门槛、运动净空与校验要求 |
| [正式关卡索引](docs/levels/README.md) | 二十关设计稿、最优步数、修订和验证工具 |
| [验收与性能](docs/performance.md) | 当前有效测量、功能验收和未覆盖设备 |
| [项目状态](docs/roadmap.md) | 已完成里程碑、当前维护任务与暂缓事项 |

已测绘制峰值高／低347／275次，低于400次预算；首屏gzip约357KB，低于1MB。手机目前以尺寸模拟验证，真机分享／保存、Safari兼容及目标设备长期帧率仍待补验，详见验收记录。

## 许可证

[MIT](LICENSE) · zzugbb
