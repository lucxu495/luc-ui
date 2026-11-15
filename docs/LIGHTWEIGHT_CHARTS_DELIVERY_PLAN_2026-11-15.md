# Lightweight Charts 导航与插件交付计划（2026-11-15）

## 强制交付契约

图表不只是代码。每个标记为已交付的图表或插件必须同时有：公开且类型安全的 React API、单独可打开的真实 Canvas 示例、Charts Sidebar 入口、中英文支持、桌面及手机验收、单测、Playwright 浏览器测试、包体积及生命周期测试。未实现的官方插件只能进入路线图，不能冒充可运行的演示。

## 分类及路由

- Financial & quantitative / 金融与量化：旧的 ECharts 金融风险、投资组合、因子等图表；原金融图表概览依然在 /charts/financial。
- Lightweight Charts：Charts Sidebar 里的新分类，放在顶部，专属 TradingView 原生金融图表及插件。
- Gallery overview：/charts/lightweight
- 六个已实现独立 Live examples：/charts/lightweight/candles、line、area、comparison、panes、sharpe。
- Official plugins roadmap：/charts/lightweight/plugins；19 个已发布上游包逐项列出，但现阶段尚未封装。

示例路由及 Sidebar 使用同一份 lightweight-examples.ts 配置，插件清单来自 lightweight-plugins.ts。每个示例同时包含真实交互图表、控件和 React API 用法。

## Phase 1 — React API 与 Plugin 生命周期

- [ ] 比较 Lightweight Charts v5.3 官方 API 与 Luc UI 类型化 Controller 能力，生成可审核覆盖矩阵
- [ ] 类型安全的插件生命周期：安装、更新、卸载、Pane/Series ownership、React Strict Mode 和销毁
- [ ] 系列、视口、Pane、Markers、Watermarks 的高层 API 和契约测试
- [ ] 确保插件独立子路径导入且 tree-shakable，遵守现有 bundle 预算

## Phase 2 — 官方插件逐个集成

- [ ] 19 个已发布上游插件逐个接入，均需要独立 Sidebar 示例和完整测试
- [ ] 优先集成 Vertical Line、Session Highlighting、User Price Lines、Accessibility、Heatmap、Scatter
- [ ] 其他按 Custom Series / Primitive 分组实施，每个完成时才标记 Live
- [ ] 对照官方包 Peer Dependency、许可、文档、交互和移动端行为

已发布上游包列表：apps/showcase/lib/charts/lightweight-plugins.ts。
来源：https://tradingview.github.io/lightweight-charts/plugin-examples/

## Phase 3 — 高级研究及绘图

- [ ] Trendline、Rectangle、Volume Profile、Price Bands、Price Alerts
- [ ] 编辑工具栏、选择/拖动、撤销/重做、布局持久化和恢复
- [ ] 每个图表、绘图工具均有独立示例、可复制用法和浏览器验收

## Phase 4 — 验收、版本与发布

- [ ] 100k 行真实渲染预算、浏览器 FPS/INP、移动实机手势、a11y、跨项目消费者测试
- [ ] Release artifact 和外部兼容性审计
- [ ] 用户视觉验收后再 Commit/Push/npm 发布与 Cloudflare 部署

## 本次实际完成范围

- [x] 专属 Sidebar 分类、首页、六个独立 Live Example
- [x] 六个实际 Canvas / 可调控件 / React 示例代码
- [x] 官方已发布 19 个插件的真实集成状态目录
- [x] 独立导航来源与 Playwright 入口/移动端测试
- [x] 原有金融与量化分类与页面不变

提醒：当前只完成导航与基础示例，不应称为全部 19 插件、全量高层 API 或绘图工具已经实现。金融指标由调用方准备；Luc UI 不计算策略或回测。未 Commit、Push 或部署。
