# Luc UI — Product Experience Polish

Phase 1：真实产品体验审计与首批改进路线图

- 审计日期：2026-10-18（Asia/Singapore）
- 审计基线：`origin/main` @ `bc7cd49`（Cloudflare Showcase 合并后）
- 审计分支：`audit/product-experience-polish`
- 发布基线：`v1.0.1` 未移动；本轮不修改 public API、包版本、部署或视觉基线
- 主要审查对象：`https://ui.lucxu.com`、本地生产 Docker `http://127.0.0.1:5300`、真实 Chromium
- 证据目录：[`docs/audits/evidence/`](evidence/)

---

## 仓库与交付基线

| 项目 | 确认结果 |
| --- | --- |
| Git root | `/Users/luc/Documents/luc/luc-ui`；审计在独立 worktree `/Users/luc/Documents/luc/luc-ui-audit` |
| Branch / HEAD | 本地 `main` 原为 `739a951`，落后远端；审计从 `origin/main` @ `bc7cd49` 创建 `audit/product-experience-polish` |
| 发布状态 | `v1.0.1` tag = `b07e0cbcbcc5f57584e986c924598eb6ede0ba74`；本轮未移动 tag |
| Package exports | `packages/ui/package.json`：根入口、styles、tokens、app-shell、workspace、charts、forms、data-table、motion 与多个 component subpath 均存在；本轮未改 |
| Package version | `@luc/ui` = `1.0.1`；未升级 |
| Components registry | 生成链路为 `apps/showcase/lib/docs/generated/` + `apps/showcase/scripts/docs-registry.mjs`；本轮未重新生成或改公共 catalog |
| Showcase routes | Next App Router，`apps/showcase/app/**/page.tsx`；本轮抽样 58 个唯一路由 |
| Playwright | `apps/showcase/playwright.config.mjs` 为视觉基线配置，`snapshotDir = artifacts/baselines`，`maxDiffPixelRatio = 0.02`；本轮未更新基线 |
| 本地生产 Showcase | Docker `http://127.0.0.1:5300`；同路由全量抽样均为 200 |
| Cloudflare 部署路径 | `apps/showcase/open-next.config.ts`、`apps/showcase/next.config.ts`、`apps/showcase/wrangler.jsonc`；本轮不部署、不 dry-run 覆盖线上 |
| 其他项目 | 未触碰 5301 / Luc Visuals / 其他独立项目 |

---

## Executive Summary

Luc UI 已经不是一个“组件存在、API 完整”的文档站，而是一套有明确视觉语言的产品：首页有完整的系统表达，组件页的 Overview → Examples → Usage → API 结构清楚，Light / Dark 与中英文视觉一致，Dialog、Select、Tabs、Menu、表单校验等核心交互的实现质量明显高于一般开源组件库。自动化可访问性抽检在 4 个代表路由上得到 0 个 axe WCAG A/AA violation；Dialog 的焦点陷阱、Escape 关闭与焦点恢复，Select 的键盘选择，菜单关闭后的焦点恢复均通过真实浏览器验证。

但“高质量开源设计系统”还差三层：

1. **生产可用性仍不合格。** 公网 Showcase 在普通并发下会返回 Cloudflare `503 / error code: 1102`（Worker 超出 CPU 限制）。这不是一次偶发网络抖动：同一路径重试常能成功，本地 Docker 全部 200，公网在采样中多次失败。核心文档页无法稳定打开，优先级高于任何视觉打磨。
2. **手机端没有达到桌面端的产品完成度。** 主题切换在 `<640px` 被完全隐藏；API Props 表把 Notes 压成 62px 的逐词竖排；DataTable 只露出前两列且没有横向滚动提示；Finance Experience 的图表以 626px 宽画在 390px 视口里，右侧轴和部分内容直接被裁掉。
3. **内容语义与小型交互仍有“内部工具感”。** 首页目录把同一个父区域计数重复显示为 5 个 `164`、5 个 `34`；文档把 families 数量写成 entries；搜索框显示 `/` 快捷键却不生效；命令面板跳转后焦点落到 `BODY`；复制操作只改变图标，不向屏幕阅读器宣布成功。

当前成熟度判断：

| 维度 | 评分 | 判断 |
| --- | ---: | --- |
| 视觉工艺与设计语言 | 4.2 / 5 | 首页、组件页、Charts、Motion 已形成稳定且有辨识度的系统语汇 |
| 核心交互质量 | 3.7 / 5 | 表单、浮层、选择器强；跳转焦点与触摸反馈仍有缺口 |
| 响应式与移动端 | 2.8 / 5 | 导航抽屉好，但主题、表格、Charts 的关键移动路径不合格 |
| 文档产品体验 | 3.1 / 5 | 信息架构清楚，但移动 API 表、计数语义、快捷键提示拉低可信度 |
| 公网可靠性 | 2.0 / 5 | 多次 503 / 1102，无法作为稳定交付基线 |

问题统计：**P0 = 1，P1 = 5，P2 = 9，P3 = 3，共 18 项。**

本轮最重要的结论不是“找出更多问题”，而是确定下一轮的六个产品支点：**先让公网站点稳定；让手机端能完成同样任务；让文档表格可读；让示例组合不再被裁切；让数字说真话；让小反馈对键盘和屏幕阅读器也成立。**

---

## 审计范围与方法

### 实际访问的 routes

本轮用真实 Chromium 访问了 **58 个唯一路由**，覆盖桌面 1440、手机 390、平板 640、宽屏 1920、英文与中文、暗色与亮色：

**首页与文档入口**

`/`、`/docs`、`/docs/installation`、`/explore`

**核心组件**

`/components`、`/components/buttons`、`/components/inputs`、`/components/select`、`/components/dialog`、`/components/menus`、`/components/tabs`、`/components/cards`、`/components/command`、`/components/overlay`、`/components/empty-state`、`/components/file-upload`、`/data/table`、`/data/statuses`、`/date-time/date-picker`

**组合与差异化能力**

`/forms/validation`、`/patterns/settings-form`、`/patterns/research-workspace`、`/patterns/table-filters`、`/application/workspace`、`/application/navigation`、`/components/ai`、`/motion`、`/motion/kinetic`、`/integrations/tradingview`、`/studios/charts`、`/blocks`、`/templates`

**Charts**

`/charts`、`/charts/financial`

**Experiences**

`/experiences`、`/experiences/general/community`、`/experiences/general/marketing`、`/experiences/general/publishing`、`/experiences/general/saas`、`/experiences/personal/academic`、`/experiences/personal/career`、`/experiences/personal/garden`、`/experiences/personal/portfolio`、`/experiences/vertical/ai`、`/experiences/vertical/commerce`、`/experiences/vertical/education`、`/experiences/vertical/finance`、`/experiences/vertical/forum`、`/experiences/vertical/media`、`/experiences/vertical/productivity`、`/experiences/vertical/science`

**中文**

`/zh`、`/zh/docs`、`/zh/docs/installation`、`/zh/components/buttons`、`/zh/components/dialog`、`/zh/data/table`、`/zh/charts/financial`

### 抽样规模

- 组件/组合矩阵：**17 组**，覆盖 20+ 组件与 5 类页面组合。
- 真实交互流程：**12 条**，包括命令面板打开/搜索/选择、Dialog 打开/编辑/关闭/恢复焦点、Select 键盘选择、Dropdown 关闭恢复、Tabs 键盘切换、表单空提交、Columns 弹层、Sheet、移动导航、复制反馈、Chart hover/range、浅色与 reduced-motion。
- 视口：390、640、1440、1920。
- 主题：Dark 为主，Light 通过真实切换验证；中文页面单独截图核对。
- 辅助检查：axe WCAG A/AA 抽检；控制尺寸、DOM 几何、scrollWidth/clientWidth、控制台错误、请求状态与 HTML 重量。

### 证据规则

报告中的视觉或交互结论至少对应以下之一：截图、可重复 Playwright 探测、DOM/CSS 几何、具体路由与源码位置。没有仅凭源码主观推断的行为被写成已观察事实。对触摸 Tooltip 这类仍需硬件确认的问题，明确标注为“待确认”。

可重跑工具：

- [`scripts/product-audit/capture.mjs`](../../scripts/product-audit/capture.mjs)：路由截图、横向溢出、关键几何、console/request 失败。
- [`scripts/product-audit/interactions.mjs`](../../scripts/product-audit/interactions.mjs)：12 条交互任务序列。
- [`scripts/product-audit/evidence.mjs`](../../scripts/product-audit/evidence.mjs)：本报告关键证据的定点复现。
- [`scripts/product-audit/public-reliability.mjs`](../../scripts/product-audit/public-reliability.mjs)：公网顺序请求与并发请求采样。

---

## Findings

### P0 — Blocking

| ID | 路由 / 组件 | 当前行为 → 预期行为 | 证据 | 影响 / 频率 | 工作量 / 风险 | 建议与验收 |
| --- | --- | --- | --- | --- | --- | --- |
| F-01 | 公网 `/components/ai`、`/date-time/date-picker`、`/components/command`、`/application/navigation`、`/zh/**` 等 | 公网间歇返回 Cloudflare `503`，响应体为 `error code: 1102`；本地 Docker 同路由 200。预期所有公开文档路由在正常流量下稳定 200。 | [503 页面](evidence/public-503.png)、[公网可靠性采样](evidence/public-reliability.json)。早先 20 次顺序采样 7 次 503；保存的采样中，4 路并发第 3 轮仍出现 503。响应 HTML 为 `no-store`；`/date-time/date-picker` 单页 HTML 达 **664,689 bytes**。Cloudflare 官方错误表定义 1102 为 “Worker exceeded CPU time limit”。 | 核心任务无法完成；影响全部内容；在冷启动/并发下反复出现。 | L / M。涉及渲染与部署架构，不是组件样式修复。 | 先做部署/渲染专项：减少每请求服务端计算、评估静态 HTML 缓存或等价方案，并观察 Workers CPU 日志。验收：50 次顺序 + 8 路并发请求 0 个 5xx；`/zh`、`/date-time/date-picker`、`/components/command` 均覆盖；p95 < 2s。不得用视觉基线或错误页美化掩盖。 |

### P1 — High Impact

| ID | 路由 / 组件 | 当前行为 → 预期行为 | 证据 | 影响 / 频率 | 工作量 / 风险 | 建议与验收 |
| --- | --- | --- | --- | --- | --- | --- |
| F-02 | AppShell / 所有文档页 | 键盘聚焦 “Skip to content” 后按 Enter，焦点落到 `BODY`；下一次 Tab 回到 “Luc UI” 品牌链接，而非主内容。预期焦点进入 `<main>`，下一次 Tab 从主内容内开始。 | [interaction-probes.json](evidence/interaction-probes.json) 的 `skipLink`；实现见 `packages/ui/src/app-shell/app-shell.tsx:189-213`，`<main>` 没有可编程焦点目标。 | 对所有键盘和屏幕阅读器用户高频；阻断“跳过导航”这一核心无障碍路径。 | S / L。 | 给 main 提供程序化焦点目标并在跳转时聚焦；保留可见焦点样式。验收：Enter 后 `document.activeElement` 为 main 或 main 内标题；下一 Tab 不经过侧栏。 |
| F-03 | 手机 Header / Theme | 390px 下 System / Light / Dark 三个主题控件的计算尺寸为 `0×0`；视觉上完全没有主题入口，只能通过搜索面板 → “Switch theme” 子页发现。预期手机端有直接、可发现的主题入口。 | [手机 Header](evidence/mobile-header-theme.png)、`interaction-probes.json` 的 `mobileTheme`；实现见 `apps/showcase/components/shell/app-frame.tsx:439-441`（`hidden sm:block`）。 | 手机用户高频；Light / Dark 是产品承诺的能力，不是调试开关。 | S / L。 | 在手机 drawer 或 Appearance popover 内提供同一主题控件，避免头部横向拥挤。验收：390px 可直接切换三种主题；无横向溢出；切换后所有 surface 同步更新。 |
| F-04 | 组件页 API / 所有 390px 文档 | Props 表在 339px 表格宽度内把 Notes 压到 62px，长句逐词竖排；Button 页高度 5,415px，Date Picker 达 13,195px，Date Picker HTML 664KB。预期移动端表格保持可读行宽，或按字段堆叠；继承 props 不应无条件铺满页面。 | [手机 Button Props](evidence/mobile-button-props.png)、`interaction-probes.json` 的 `mobilePropsTable`；实现见 `apps/showcase/components/docs/doc-entry.tsx:282-330`。 | 移动端阅读与检索 API 的核心路径；每个组件页重复出现。 | M / M。 | 390px 以下把 Prop / Type / Default / Notes 改为堆叠定义行，或给表格 44–48rem 最小宽度并提供明确横向滚动；将 inherited props 默认折叠为独立 disclosure。验收：Notes 不再出现逐词竖排；无页面级横向滚动；按入口可找到全部 props；页面高度显著下降。 |
| F-05 | DataTable / 表格组合 | 390px 下表格实际宽 1040px，滚动容器仅 337px；只看到 Symbol、Strategy，Status 之后全部在视口外，且没有可见的滚动提示；SaaS 示例同样只露出前两列。预期用户能立即知道“还有列”，并能读全关键信息。 | [手机表格裁切](evidence/mobile-table-cutoff.png)、`interaction-probes.json` 的 `mobileTable`；实现见 `apps/showcase/components/docs/data-table.tsx:41-47`（`w-full`，无最小列宽/边缘提示）。 | 高频；表格、筛选、TradingView、SaaS 示例都受影响。 | M / M。 | 文档表格使用最小列宽 + 可见滚动阴影/边缘渐隐；首列保持可识别；必要时在窄屏只展示核心列并提供 Columns 入口。验收：390px 能看出可横向滚动；键盘可聚焦滚动区；表头不被截成单词；关键列可通过滚动或列选择到达。 |
| F-06 | `/experiences/vertical/finance` | 390px 下 Canvas 实测宽 **626px**，起始 x=58、right=684；视口仅 390px。图表右侧价格轴不可见，Drawdown 也被裁切，表格与外框被同一 intrinsic width 撑开。预期图表宽度不超过卡片内容宽度，Y 轴与完整图形可见。 | [Finance 手机图表](evidence/finance-mobile-chart.png)、`interaction-probes.json` 的 `financeChart`；实现见 `apps/showcase/app/experiences/vertical/finance/site.tsx:114`。 | 旗舰 Experience 的核心阅读路径；每次手机访问都会出现。 | S / L。 | 将 base grid 显式写为 `minmax(0,1fr)`，`xl` 再启用双列；检查卡片与表格的 min-width 不参与父 grid 的 intrinsic sizing。验收：Canvas right ≤ 卡片内容右边界；Y 轴可见；无内容被不可恢复地裁切。 |

### P2 — Meaningful Polish

| ID | 路由 / 组件 | 当前行为 → 预期行为 | 证据 | 影响 / 频率 | 工作量 / 风险 | 建议与验收 |
| --- | --- | --- | --- | --- | --- | --- |
| F-07 | 首页 “Where to go next” | Foundations / Components / Motion / Data table / Integrations 全部显示 `164 in this area`；Experiences / Studios / Blocks / Templates / Personal sites 全部显示 `34 in this area`。数字技术上来自父区域，但卡片语义让读者以为这是目标页面自身的规模。预期每个数字说明真实 scope，或移除误导性数字。 | [首页资源计数](evidence/home-resource-counts.png)、`homeResources` 探测；实现见 `apps/showcase/components/home/resources-section.tsx:42`。 | 每个首页访客都会看到；降低文档可信度。 | M / L。 | 为每个资源声明准确的计数 scope；若只能取得父区域数字，应明确写 “164 in Components area”，不要复用 “in this area”。验收：不存在两个不同目标出现相同且未解释的数字；中英文语义一致。 |
| F-08 | `/docs` 四板块卡片 | “Components 13 entries / Charts 9 entries / Motion 4 entries / Integrations 1 entries” 实际是 families 数量；同时出现 `1 entries` 复数错误。预期显示 “13 families” 或同时显示 families 与 entries。 | [文档板块计数](evidence/docs-surface-counts.png)；实现见 `apps/showcase/app/docs/page.tsx:82`。 | 文档新用户首次建立规模认知；直接影响信任。 | S / L。 | 使用准确名词并处理单复数；最好从 registry 同时计算 families 与 entries。验收：文案与数据来源同名；`1 entry` 正确；中文为“1 个家族/1 个条目”等一致语义。 |
| F-09 | `/docs` 搜索 | 搜索框下方显示 `/` Kbd，按 `/` 焦点仍是 `BODY`，输入不会进入搜索框。预期 `/` 聚焦搜索，Escape 清空/退出。 | [搜索提示截图](evidence/docs-slash-hint.png)、`interaction-probes.json` 的 `slashShortcut`；实现见 `apps/showcase/components/docs/doc-search.tsx:120-123` 只有提示，没有全局按键处理。 | 键盘用户高频；可见提示与实际行为不一致。 | S / L。 | 实现 `/` 聚焦逻辑，排除输入框/内容可编辑区域，并保留 Meta/Command+K 全局面板。验收：任意文档页按 `/` 进入搜索；在输入框内输入 `/` 不劫持；移动端隐藏或替换键盘提示。 |
| F-10 | Command Palette | 输入 `button` 回车跳转后 URL 和 H1 正确更新，但焦点落到 `BODY`；没有路由切换播报。预期焦点进入新页标题/主内容，或至少通过 live region 宣布新页面。 | `interaction-probes.json` 的 `commandFocusAfterNavigation`；实现见 `apps/showcase/components/shell/command-palette.tsx:117`，路由层没有统一焦点恢复。 | 键盘与屏幕阅读器用户中频；每次搜索跳转发生。 | M / M。 | 在受控路由跳转后聚焦 `main`/H1，并确保不干扰浏览位置。验收：回车后 activeElement 为目标页标题或 main；屏幕阅读器能读出页面标题；Escape 与浏览器后退行为正常。 |
| F-11 | Copy import / Copy code | 点击后视觉上复制图标变勾选，但按钮 `aria-label` 仍为 “Copy import”，live region 为空，Tooltip 未出现。预期屏幕阅读器收到 “Copied” 成功反馈。 | [复制反馈截图](evidence/copy-feedback.png)、`interaction-probes.json` 的 `copyFeedback`；实现见 `apps/showcase/components/docs/copy-button.tsx:17-43`。 | 每个代码复制动作；键盘/屏幕阅读器用户无法确认成功。 | S / L。 | 增加 polite live region 或动态可访问名称；视觉勾选保留。验收：点击/键盘激活后可访问名称或 live 文本变为 Copied；1.4s 后恢复；不重复播报。 |
| F-12 | `/charts/financial` 财务图表 | Volume 轴显示 `$4B`、`$8B`，但 Tooltip 显示 `Volume 5.2B`（无货币符号）。预期同一数据的轴与 Tooltip 使用同一单位。 | [Volume 单位证据](evidence/chart-volume-unit.png)；实现见 `packages/ui/src/charts/financial/financial-chart.tsx:205-208` 与 `:549-550`，整块 plate 共用 price formatter。 | 金融数据语义误导；属于 correctness/formatting issue，而非审美偏好。 | M / M。 | 单独修正 volume scale/tooltip 的 formatter 契约；本轮不修改 chart engine。验收：volume 轴与 Tooltip 同为数量单位；价格轴仍保留货币单位；截图对比明确。 |
| F-13 | 首页 / 安装发现 | 手机首页约 6,037px 高；首屏主 CTA 是 Browse / Charts，安装命令位于页面下半部；顶部没有直接 Installation 入口，需要 More → Docs 或到底部。预期新开发者能在首屏或主导航快速找到 “Get started / Install”。 | 手机首页全页截图；主导航结构；“Install from a Git tag...” 位于约 3/4 页之后。 | 首次访问者高频；影响从“看见”到“实际使用”的转化。 | M / L。 | 在 Hero 次级动作或 Header 中增加明确的 “Get started”，不牺牲 Browse Components 主次。验收：390px 首屏可发现安装/快速开始；点击直达 `/docs/installation`。 |
| F-14 | Button | 计算样式为 `cursor: default`，而可点击 Card、Stepper、Pagination 等大量交互组件使用 pointer。预期 Button 在桌面 pointer 设备上有 pointer 提示，disabled 保持默认/禁用语义。 | Playwright 计算样式：Button `cursor: default`；实现基准 `packages/ui/src/components/button-variants.ts:24-29` 未设置 pointer。 | 所有 Button；视觉反馈一致性。 | S / L。 | 统一 Button family 的 pointer 语义，不改颜色、尺寸或 API。验收：桌面 hover 为 pointer；disabled 不误导为可点击；触屏无影响。 |
| F-15 | Financial Chart 触摸读取 | Playwright 触摸上下文下，单次 tap 和 touch drag 都没有出现 Tooltip；同一坐标 mouse move 能出现。预期触屏用户能点按/拖动读取精确 OHLC。 | `interaction-probes.json` 之外的单次触摸探测日志；鼠标 Tooltip 与触摸无 Tooltip 的截图对比。需在真实 iOS/Android 设备复核。 | 手机金融图表核心任务；频率高，但当前证据仍需硬件确认。 | M / M。 | 先做设备矩阵复验，再决定是否修改 chart interaction；不要仅凭 emulation 改图表引擎。验收：真实触屏上点按或拖动可显示可关闭的 Tooltip，且不阻断页面滚动。 |

### P3 — Optional Refinement

| ID | 路由 / 组件 | 当前行为 → 预期行为 | 证据 | 影响 / 频率 | 工作量 / 风险 | 建议与验收 |
| --- | --- | --- | --- | --- | --- | --- |
| F-16 | Command Palette footer | 面板底部显示内部诊断 “Theme intent: dark · painted dark”。预期终端用户只看到动作或帮助信息。 | 手机/桌面 Command Palette 截图。实现见 `apps/showcase/components/shell/command-palette.tsx:257-261`。 | 中频；让产品像开发调试面板。 | S / L。 | 移除或在仅开发者开关下显示。验收：普通用户打开面板不出现 theme intent/painted 内部词。 |
| F-17 | 手机键盘提示 | 手机搜索按钮与 Command footer 仍显示 `⌘K`、`↑↓`、`↵`、`esc`；触屏用户没有这些键。预期移动端隐藏纯键盘提示或替换为触控说明。 | 手机首页、Command Palette 截图。 | 低到中频；造成桌面优先的疏离感。 | S / L。 | 用 pointer/coarse media query 隐藏键盘 Kbd；保留可访问名称。验收：390px 不展示无意义快捷键；桌面保留。 |
| F-18 | 手机触控尺寸 | Header 图标按钮、Chart range 等实测 28–32px；低于 44px 的舒适触控建议，但满足 24px 的最低线。预期高频触控目标接近 44px，或在密集工具条中明确例外。 | 路由截图与 computed rect；`mobileTable`/chart/controls 采样。 | 低频到中频误触；不是 WCAG 必然失败。 | S–M / L。 | 优先扩大主题、搜索、Chart range 等高频目标；不要全局把所有控制放大 44px。验收：主要触控动作至少 40px，密集表格工具栏可保留 32px 并记录例外。 |

---

## Top 10 体验问题排序

排序同时考虑任务阻断、出现频率、用户群影响、修复可控性：

1. **F-01 公网 503 / 1102**：用户无法稳定打开文档，所有后续体验都失去意义。
2. **F-04 手机 API Props 表**：参考页在手机上退化为逐词竖排文本墙。
3. **F-05 手机 DataTable 可发现性**：真实表格组合只露出前两列且没有滚动提示。
4. **F-06 Finance Experience 图表裁切**：旗舰组合在手机上丢失价格轴与右侧内容。
5. **F-02 Skip link 不聚焦主内容**：键盘用户的核心绕行路径失效。
6. **F-03 手机主题入口消失**：产品承诺的 Light / Dark 在手机上不可发现。
7. **F-07 首页计数重复且 scope 不明**：首页最显眼的数字降低全站可信度。
8. **F-10 Command Palette 跳转后焦点丢失**：搜索是主路径，但其终点没有可访问的落点。
9. **F-12 Volume 轴与 Tooltip 单位不一致**：金融数据可读性影响到 correctness。
10. **F-11 Copy 成功不可被屏幕阅读器感知**：开发者最常用的动作缺少完整反馈。

---

## Component Quality Matrix

评分口径：

- **5**：在本轮抽样场景中达到可发布设计系统水准，没有值得进入首批的明显问题。
- **4**：整体强，存在少量 polish 或边缘场景问题。
- **3**：功能成立，但在真实页面组合或一个关键视口出现明显摩擦。
- **2**：高频路径出现影响任务完成的可用性问题。
- **1**：抽样场景中不可用或核心行为失效。

评分不是“审美印象分”：Visual 看层级/几何/表面；Interaction 看指针、键盘、反馈与流程；Motion 看因果、时长与 reduced motion；Responsive 看 390/640/1440/1920 的任务完成；Accessibility 看焦点、名称、键盘与对比；Composition 看与周边组件的真实组合。

| 组件 / 组合 | Visual | Interaction | Motion | Responsive | Accessibility | Composition | 说明 |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| Button | 4 | 4 | 4 | 4 | 4 | 4 | 层级、尺寸、press/loading/disabled 清楚；pointer 语义与复制反馈影响满分 |
| Input / Field / Validation | 4 | 5 | 4 | 5 | 5 | 4 | 空提交后聚焦首个错误字段，错误消息就地呈现；组合可靠 |
| Select / Combobox | 4 | 5 | 4 | 4 | 5 | 4 | 列表几何、键盘选择、关闭后焦点正常；菜单项触控高度偏紧 |
| Dialog / Sheet | 5 | 5 | 4 | 4 | 5 | 5 | 真实打开/编辑/关闭/恢复焦点通过；移动 Sheet 仍可读 |
| Popover / Menu / Context Menu | 4 | 5 | 4 | 4 | 5 | 5 | 打开、方向键、Escape、焦点恢复正确；移动位置需要结合具体页面看 |
| Tabs | 4 | 5 | 4 | 4 | 5 | 4 | 单一选中态、方向键、面板切换成立；密集页面中信息层级稳定 |
| Card / Panel | 4 | 4 | 4 | 4 | 5 | 4 | default/raised/outline/ghost 有真实差异，非机械同质化 |
| App Shell | 4 | 3 | 4 | 3 | 3 | 3 | 导航映射、drawer 与路由当前态强；Skip link、手机主题入口拉低完成度 |
| DataTable | 4 | 3 | 3 | 2 | 4 | 3 | 桌面排版、排序、列显隐优秀；窄屏不可发现横向滚动且内容被裁 |
| FinancialChart | 4 | 3 | 4 | 4 | 3 | 3 | 桌面可读、range/hover 有效；Volume 单位错误，触摸 Tooltip 待确认 |
| Analytical Charts | 4 | 3 | 3 | 2 | 3 | 3 | 独立页面表现好；Finance Experience 的 626px canvas 暴露组合级响应式缺陷 |
| Motion primitives | 5 | 4 | 5 | 4 | 4 | 4 | 动效有因果，画廊分组清楚；未发现“为动而动”的系统性问题 |
| AI surfaces | 5 | 4 | 4 | 3 | 4 | 4 | 消息层级、tool timeline、composer 有产品真实感；移动 API 表拖累文档 |
| TradingView Integration | 4 | 3 | 3 | 2 | 3 | 3 | 桌面 lane 表与 catalog 清楚；手机表格被压成逐词竖排 |
| Docs page / API | 4 | 3 | 4 | 2 | 4 | 3 | 章节顺序、outline、copy 结构优秀；手机 API 表与 `/` 提示不合格 |
| Homepage / Showcase | 5 | 4 | 4 | 4 | 4 | 3 | 视觉表达强，首屏能说明“是什么”；目录计数与安装发现拖累 |
| Charts gallery | 4 | 4 | 4 | 4 | 4 | 4 | 标题、分组与示例阅读自然；个别单位与 tick 细节仍需专项 |

---

## Showcase UX Review

### 1. 首次访问：清楚“是什么”，但“怎么开始”不够直接

首页首屏的强项很明确：大标题、真实组件 specimen、安装 import 片段和四个规模数字让读者在 3 秒内知道 Luc UI 是 React + TypeScript 设计系统，而不是某个单组件库。视觉节奏、深度与动效都服务于产品表达，没有用渐变、玻璃或浮夸插画代替设计语言。

第一个摩擦是安装路径。新开发者的典型任务是 “我想装它、写一个 Button”，但首屏主 CTA 是 Browse the components / See the charts，安装命令在长页后段。More 菜单里能找到 Docs，电脑端也有侧栏 Installation，但手机首页要滚过约 3/4 页面才看到安装。建议增加一个不抢主 CTA 的 “Get started / Install” 入口。

第二个摩擦是目录数字。首页的 “Where to go next” 卡片本应用规模帮助选择，但多个不同目标重复显示 `164` 或 `34`。这会让第一次看到的用户误以为 Components、Motion、Data Table、Integrations 都同样有 164 项。技术上数字来自父区域，产品上却像错误数据；应在文案和数据结构上明确 scope。

### 2. 搜索与导航：入口丰富，但两个关键承诺没有兑现

全局 Command Palette 的搜索结果分组、路由副标题、键盘循环与选中态都很清楚；输入 `button` 能稳定返回 Button、ButtonGroup、FloatButton、IconButton。移动 drawer 打开后展示当前 area 的完整分组，选择路由后 drawer 关闭，焦点回到移动触发器，符合预期。

但：

- `/docs` 的搜索框显示 `/` 提示，真实按键没有任何反应。
- Command Palette 选择结果后页面正确更新，但焦点落到 `BODY`；屏幕阅读器用户没有明确的页面切换信号。

这两个问题共同削弱了“文档是一套成熟产品”的感受，因为它们不是视觉瑕疵，而是对用户已见提示的不兑现。

### 3. 组件页：信息结构是强项，API 表是移动端短板

组件页的顺序稳定：标题与用途 → 示例 → Show code / Copy → Usage → API → Guidelines → Related。侧栏、面包屑、On this page 三段导航在桌面端非常成熟，当前项、家族层级、前后页都清楚。

桌面 API 表把 Prop / Type / Default / Notes 四列控制得可读；但移动端同一个表把 Notes 压到 62px，长说明逐词换行。Button 的 API 已能让页面达到 5,415px；Date Picker 在 390px 下达到 13,195px，HTML 664KB。这不是“文档很长”的普通问题，而是表格几何错误把参考页变成了几乎不可扫描的文本墙。

### 4. 从组件到真实产品：大部分组合成立，表格与图表组合暴露共享问题

Docs 页、Form Validation、Settings Sheet、Research Workspace、AI Surface、Motion Gallery、SaaS Experience 都证明了组件可以组合成真实产品，而不是孤立 specimen。Form + Label + Validation 的错误定位、Dialog + Form 的焦点恢复、Sheet + Toast 的保存流程都达到可交付水平。

问题集中在两个共享组合：

- DataTable 在 390px 只显示前两列，且用户看不出还能横向滚动；SaaS、Table Filters、TradingView 都受影响。
- Finance Experience 的图表与表格被父 grid 的 intrinsic width 撑到 626px，390px 视口里右侧价格轴直接消失。这说明单个组件在 preview 中“看起来还行”，并不等于组合后响应式成立。

### 5. 中英文与 Light / Dark

中文首页、文档、Button 与 Charts 的视觉层级与英文一致；字体回退、标签换行、按钮文案没有明显破版。语言切换通过 URL 保持语义，是正确设计。

Light 主题不是 Dark 的反相，表面、边框、状态色与 focal ring 都有独立处理；手机 Light 首页同样成立。需要注意的是：手机上目前无法直接切换主题，因此用户实际上很难主动验证这套 Light 设计。

### 6. 完整 journey 判断

理想 journey “进入首页 → 找组件 → 打开示例 → 复制代码 → 读 API → 安装” 在桌面和网络正常时可以完成；主要断点如下：

1. 公网 503 随时中断 journey。
2. 手机端找不到直接主题入口。
3. 手机 API/表格难以阅读。
4. 复制成功对屏幕阅读器不可见。
5. 搜索跳转后焦点丢失。
6. 目录数字降低对文档准确性的信任。

---

## Motion Quality Review

Motion 是 Luc UI 的真实差异化能力，而不是装饰层。抽样看到的动效有以下优点：

- 动效有明确因果：pointer 驱动的 surface、press ripple、entry reveal、number ticker 都与用户动作或数据变化相关。
- 画廊按 Spatial / Signature / Pointer / Feedback / Entrance 分类，用户能理解“为什么这个组件动”。
- Reduced motion 是真开关：页面将 `data-motion="reduced"` 写到 `<html>`；现有 reduced-motion 自动化门禁覆盖 overlay 与 kinetic 路由。
- 没有看到每个组件都被强行加动画；静态 Table、Form、Card 仍保持安静。

本轮未发现需要进入首批的 Motion 质量问题。真正需要后续验证的是触摸设备上的 Chart crosshair/tooltip，以及密集工具栏上的触控目标尺寸；这两项与 Motion 语法本身无关。

---

## Charts & Data Visualization Review

### 做得好

- 图表有标题、副标题、读数和范围控制，Chart 与周围文本关系清楚。
- Axis、Legend、Tooltip 的字号层级在桌面端可读，价格与时间轴对齐稳定。
- Empty / Loading / Error 状态不是空白或 toast，而是带动作的图表内状态；`Retry` 与 `Show series` 都可操作。
- 不同图形有不同处理：时间序列、Candlestick、Drawdown、Factor Exposure 各自保留自己的信息结构。

### 需要修正

1. **单位一致性（correctness）**：Volume 轴是 `$4B`，Tooltip 是 `Volume 5.2B`。同一数据在轴与 Tooltip 上不能一个带货币单位、一个不带。该问题涉及 chart formatter contract，按本轮约束不进入组件重构批次。
2. **触摸读取待确认**：Playwright 触摸上下文下 tap / touch drag 没有显示 Tooltip，mouse move 有；需要在 iOS/Android 真机复验，再决定是否改图表交互。
3. **组合响应式**：Finance Experience 的图表在 390px 被裁切，属于布局组合问题，不是 chart engine 计算问题，应优先修。
4. **Tick 可读性**：1M 范围下出现 `27 / Sep / 4 / 7 ...` 这类混合粒度标签；目前可读，但可列为后续 chart typography 专项，不与语义错误混为一谈。

---

## Benchmarking

只参考产品决策，不复制视觉风格、源码或品牌：

| 来源 | 可借鉴决策 | 对 Luc UI 的启示 |
| --- | --- | --- |
| [Ant Design Table](https://ant.design/components/table) | 宽表通过横向 scroll 与固定列维持可读性，而不是压缩每一列 | DataTable 在窄屏应先保证列宽，再提供滚动与列选择；不要让 Notes 变成竖排 |
| [shadcn/ui Data Table](https://ui.shadcn.com/docs/components/data-table) | 列显隐、排序、分页、行选择作为清晰的任务组合 | Luc UI 的工具栏已具备这些能力；缺失的是窄屏下“还有内容”的可发现性 |
| [React Aria Dialog](https://react-spectrum.adobe.com/react-aria/Dialog.html) | Modal 的焦点进入、陷阱、关闭与恢复是组件契约的一部分 | Luc UI Dialog 已达标，应把同样的严格度应用到 route change 与 skip link |
| [Radix Themes](https://www.radix-ui.com/themes/docs/overview/getting-started) | 尺寸、密度、radius、typography 通过统一 scale 表达，而不是每组件手调 | Luc UI 的 Button / Select / Tab size 已大体协调；不要为了统一而消灭组件差异 |
| [Motion reduced motion](https://motion.dev/docs/react-reduce-motion) | reduced motion 是一等配置，不是额外装饰 | Luc UI 的 reduced-motion 状态与画廊说明已经接近这一标准 |
| [Mantine Table](https://mantine.dev/core/table/) | 表格 spacing、borders、scroll container 是明确的可组合 API | Luc UI 文档表应在容器层给出 scroll 语义与视觉线索，而不仅是 `overflow-x-auto` |

---

## Recommended Changes

按实施顺序和真实收益排序：

1. **公网 1102 / 503 专项**：优先降低每请求 SSR 成本或提供等价的静态缓存；在所有设计工作前完成 staging 压测。
2. **AppShell skip link**：让主内容真正成为焦点目标。
3. **手机主题入口**：在 drawer 或 Appearance 中恢复 System / Light / Dark。
4. **文档表格响应式系统**：DataTable 最小列宽 + 可见滚动提示；PropsTable 手机堆叠/折叠 inherited props。
5. **Finance Experience grid 修正**：消除 `minmax(auto,1fr)` 造成的 intrinsic width 溢出。
6. **计数语义修正**：首页资源计数、Docs families/entries、单复数。
7. **Command Palette 路由焦点与播报**。
8. **Copy 成功反馈的可访问化**。
9. `/` 搜索快捷键真正生效，移动端隐藏无意义键盘提示。
10. Chart Volume 单位一致性；作为 chart correctness 专项，不与视觉 polish 混做。
11. Button pointer 语义统一。
12. Installation 的首屏/主导航发现性。
13. 触摸 Chart Tooltip 真机验证。
14. Command Palette 内部诊断文案与移动键盘提示清理。

---

## First Improvement Batch

第一批选 **8 项**。它们覆盖公网可用性、键盘无障碍、移动端功能对等、文档可读性与真实组合，且公共 API 不变。B1 是部署/渲染专项，其余是低到中等风险的产品修复。

### B1 — 修复公网 503 / Worker 1102

- **问题**：公网核心路由高频返回 503 / 1102；本地 Docker 正常。
- **证据**：[public-503.png](evidence/public-503.png)、[public-reliability.json](evidence/public-reliability.json)。
- **改动范围**：OpenNext / Workers 渲染与缓存策略、重页面 HTML 重量与服务端计算；不改 design tokens，不改 UI 视觉。
- **文件位置**：`apps/showcase/open-next.config.ts`、`apps/showcase/next.config.ts`、`apps/showcase/wrangler.jsonc`，以及实际 Cloudflare 构建/部署配置。
- **预期效果**：公开 Showcase 在正常并发下稳定，429/5xx 不再由 Worker CPU 触发。
- **回归风险**：中高。locale rewrite、`next/headers`、cookie 与缓存命中可能互相影响；必须在 staging 验证中英文、重定向与 canonical URL。
- **QA**：`node scripts/product-audit/public-reliability.mjs`；Workers Logs 观察 1102；抽样 `/`、`/zh`、`/docs`、`/date-time/date-picker`、`/components/command`、`/components/ai`。
- **验收标准**：50 次顺序 + 8 路并发全部 200；p95 < 2s；无 `error code: 1102`；不通过视觉基线或错误页掩盖失败。
- **本轮状态**：只定位，不部署、不重建 Docker。

### B2 — 让 Skip to content 真正跳过导航

- **问题**：Enter 后焦点落在 `BODY`，下一次 Tab 回到品牌链接。
- **证据**：`interaction-probes.json` → `skipLink`。
- **改动范围**：AppShell 主内容焦点管理。
- **文件位置**：`packages/ui/src/app-shell/app-shell.tsx`。
- **预期效果**：键盘用户一次动作进入主内容。
- **回归风险**：低；主要风险是可见 focus ring 过于突兀或与滚动行为冲突。
- **QA**：新增 Playwright keyboard test；覆盖桌面/手机文档页；`pnpm --filter @luc/ui test`。
- **验收标准**：Enter 后 activeElement 为 main/H1；下一 Tab 从主内容内开始；焦点可见；面包屑与侧栏仍可访问。

### B3 — 恢复手机端主题切换

- **问题**：390px 下 System / Light / Dark 控件尺寸为 0×0，视觉无入口。
- **证据**：[mobile-header-theme.png](evidence/mobile-header-theme.png)。
- **改动范围**：Showcase App Shell 的移动 drawer 或 Appearance popover；不改 Theme Provider。
- **文件位置**：`apps/showcase/components/shell/app-frame.tsx`、`apps/showcase/components/shell/appearance-control.tsx` 或 drawer 组件。
- **预期效果**：手机用户可直接切换主题，桌面头部不被挤压。
- **回归风险**：低；注意 Popover 内部滚动与抽屉焦点。
- **QA**：390px 触屏与键盘；三种主题切换；`pnpm --filter @luc/showcase qa:target-size`。
- **验收标准**：390px 可见主题入口；三种主题都可到达；切换后 html data-theme、cookie/localStorage 和 surface 同步；无横向溢出。

### B4 — 修复移动端文档表格的可读性

- **问题**：Props 表 Notes 62px 逐词竖排；DataTable 在 337px 容器内装 1040px 表格且无滚动提示。
- **证据**：[mobile-button-props.png](evidence/mobile-button-props.png)、[mobile-table-cutoff.png](evidence/mobile-table-cutoff.png)、`interaction-probes.json`。
- **改动范围**：Docs 专用 DataTable 与 generated PropsTable；不修改 `@luc/ui` 包对外的 DataTable API。
- **文件位置**：`apps/showcase/components/docs/data-table.tsx`、`apps/showcase/components/docs/doc-entry.tsx`，必要时 `apps/showcase/components/docs/tables.tsx`。
- **预期效果**：390px 下没有逐词竖排；用户明确知道表格可横向滚动；所有 props 仍可访问。
- **回归风险**：中；影响所有文档页的视觉基线与打印样式。
- **QA**：390/640/1440 截图；键盘 focus 滚动区；`pnpm --filter @luc/showcase qa:mobile-a11y`、`qa:overflow`；不得更新现有视觉基线，新增针对性视觉断言时单独评审。
- **验收标准**：Notes 行宽正常；页面级无横向滚动；滚动区有可见提示且可键盘聚焦；Table / Props 的所有列可到达；Button 与 Date Picker 页面高度显著下降。

### B5 — 修正 Finance Experience 的响应式组合

- **问题**：390px 下 Canvas 626px，右侧价格轴不可见，表格也受 intrinsic width 影响。
- **证据**：[finance-mobile-chart.png](evidence/finance-mobile-chart.png)、`financeChart` 探测。
- **改动范围**：Experience 的网格与卡片 min-width；不改 chart engine。
- **文件位置**：`apps/showcase/app/experiences/vertical/finance/site.tsx`。
- **预期效果**：图表、Drawdown、Factor Exposure 与表格完整落在卡片内。
- **回归风险**：低；桌面 xl 双列布局需保持。
- **QA**：390/640/1440 Experience 截图；Canvas right ≤ card content right；`pnpm --filter @luc/showcase qa:overflow`。
- **验收标准**：390px 无不可恢复裁切；Y 轴可见；桌面双列不回退；表格仍可横向滚动。

### B6 — 修正首页与文档的计数语义

- **问题**：首页 5 个 `164`、5 个 `34`；Docs 把 families 写成 entries，并出现 `1 entries`。
- **证据**：[home-resource-counts.png](evidence/home-resource-counts.png)、[docs-surface-counts.png](evidence/docs-surface-counts.png)。
- **改动范围**：资源卡计数数据与文案；Docs 板块统计文案。不要把数字硬编码到 UI。
- **文件位置**：`apps/showcase/components/home/resources-section.tsx`、`apps/showcase/lib/discovery/catalog.ts`、`apps/showcase/app/docs/page.tsx`，以及对应 i18n 文案。
- **预期效果**：数字与 scope 诚实对应；读者能理解 articles/families/pages 的差异。
- **回归风险**：低到中；需要产品确认每个 destination 的最有意义计数。
- **QA**：中英文首页与 Docs；单复数；registry 计数测试；`pnpm --filter @luc/showcase docs:registry:check`。
- **验收标准**：不存在未解释的重复计数；`1 entry` 语法正确；中英文语义一致；所有数字来自可验证数据源。

### B7 — Command Palette 跳转后的焦点与页面播报

- **问题**：搜索结果选择后 H1 更新，但 activeElement 为 BODY。
- **证据**：`interaction-probes.json` → `commandFocusAfterNavigation`。
- **改动范围**：Showcase 路由跳转后的统一焦点目标；不改 Command API。
- **文件位置**：`apps/showcase/components/shell/command-palette.tsx`、`apps/showcase/components/shell/app-frame.tsx`，必要时新增 route-focus hook。
- **预期效果**：屏幕阅读器与键盘用户明确知道页面已切换。
- **回归风险**：中；避免每次导航都抢焦点，或破坏浏览器前进/后退。
- **QA**：Meta+K → button → Enter；检查 activeElement、标题、返回行为；键盘完整 journey。
- **验收标准**：跳转后焦点进入 H1/main 或 live region 播报页面标题；不产生额外 Tab 停靠；后退仍正常。

### B8 — Copy 成功的屏幕阅读器反馈

- **问题**：视觉勾选出现，但可访问名称不变、live region 为空、Tooltip 不在键盘激活后出现。
- **证据**：[copy-feedback.png](evidence/copy-feedback.png)、`interaction-probes.json` → `copyFeedback`。
- **改动范围**：CopyButton 本地状态与可访问名称/live region；不改按钮视觉语言。
- **文件位置**：`apps/showcase/components/docs/copy-button.tsx`。
- **预期效果**：所有用户都能确认复制成功。
- **回归风险**：低；避免与 Tooltip 双重播报。
- **QA**：键盘激活、鼠标激活、屏幕阅读器路径；1.4s 后恢复；多 copy 按钮并存。
- **验收标准**：激活后 live region 或可访问名称包含 Copied/Copied import；恢复后不再播报；视觉勾选仍保留。

---

## Deferred Ideas

这些想法有价值，但当前不应直接改：

- **重做整个 token / radius / shadow 系统**：现有设计语言已经成立，全局统一会把有价值的组件差异抹平。
- **全量重构 233 个 entries**：问题集中在共享表格、计数与少量页面组合，机械改全部页面风险远大于收益。
- **重写 chart engine 或改变所有图表的交互契约**：Volume 单位与触摸 Tooltip 应作为独立 correctness/interaction 提案处理。
- **把所有文档 props 表改成虚拟滚动**：先修正阅读几何与 inherited props，虚拟化只会掩盖信息架构问题。
- **全局把所有控件放大到 44px**：会改变设计系统的密度与金融工具条；应只扩大高频手机触控目标。
- **增加更多动画、渐变、玻璃表面或 Variants**：本轮没有证据表明这些能提升真实任务。
- **重新设计导航 IA**：当前 Components / Charts / More 与侧栏的关系基本成立；先修复焦点、计数与手机主题。
- **全量截图 357 个页面**：应继续按共享组件与真实组合扩展，而不是把截图数量当成审计质量。
- **移动端折叠所有 API**：API 是文档核心，应保留可访问的参考信息，只折叠 inherited 或低价值重复项。

---

## Dependencies & Risks

| 项目 | 依赖 | 主要风险 | 控制方式 |
| --- | --- | --- | --- |
| B1 公网可靠性 | Cloudflare/OpenNext 渲染、缓存、locale 解析 | 改缓存可能破坏中英文与 canonical URL | staging 压测；保留 rewrite/redirect 测试；不在本轮部署 |
| B2 Skip link | AppShell 公共包行为 | 焦点可见性、滚动位置 | 只加焦点目标，不改 DOM 语义与 API |
| B3 手机主题 | Showcase shell/drawer | 头部拥挤、Popover 焦点 | 复用现有 ThemeControl，不新造控件 |
| B4 文档表格 | 全部文档页与视觉基线 | 大量页面视觉变化、打印/键盘 | 以 390px 为主，桌面保持；禁止直接更新基线掩盖回归 |
| B5 Finance 布局 | Experience 页面 | 桌面双列回退 | 只改 base grid/min-width，xl 保持 |
| B6 计数语义 | discovery/registry 数据 | 产品语义选择错误 | 用真实数据源；先定义“entries / families / pages” |
| B7 路由焦点 | App Router 与 full reload 搜索 | 全局抢焦点、后退行为 | 只处理命令面板/受控跳转；加 Playwright |
| B8 Copy 反馈 | live region 与 Tooltip | 双重播报 | 优先一个 polite live region |

第一阶段不应触碰：

- `v1.0.1` tag。
- npm package version。
- 公共 export 签名与默认行为。
- Cloudflare 正式域名发布。
- 其他独立项目或 Luc Visuals Showcase 5301。
- 官方视觉基线文件。

---

## Validation

### 本轮已执行

- 真实 Chromium 浏览 58 个唯一路由，桌面/手机/平板/宽屏。
- 公开站点与本地 Docker 同路由对照。
- 12 条交互任务序列。
- Light / Dark、中文 / 英文。
- axe WCAG A/AA 抽检：`/components/dialog`、`/components/buttons`（390）、`/docs`、`/data/table` 均为 0 violation。
- 公开可靠性请求采样与 503 截图。
- DOM 几何：Canvas、表格、主题控件、Props 列宽、滚动容器。
- 既有视觉基线未修改。

### 下一轮实施 QA 清单

```bash
pnpm typecheck
pnpm lint
pnpm --filter @luc/ui test
pnpm --filter @luc/showcase test
pnpm --filter @luc/showcase qa:mobile-a11y
pnpm --filter @luc/showcase qa:overflow
pnpm --filter @luc/showcase qa:target-size
pnpm --filter @luc/showcase qa:baseline
node scripts/product-audit/evidence.mjs
node scripts/product-audit/public-reliability.mjs
```

视觉回归要求：

- 先审阅 diff，再决定是否需要新增/更新基线。
- 不允许通过更新 baseline 掩盖 B4/B5 的布局变化。
- 关键新截图至少覆盖：390 手机主题入口、390 Button Props、390 Table Filters、390 Finance Experience、1440 DataTable、1440 Finance、中文首页与中文 Docs。

---

## Git / PR Status

- 审计基线：`origin/main` @ `bc7cd49`
- 审计分支：`audit/product-experience-polish`
- 工作区：`/Users/luc/Documents/luc/luc-ui-audit`
- 报告提交：`66f8d0f`（`docs(audit): record product experience findings and first batch`）
- 远端分支：已推送到 `origin/audit/product-experience-polish`
- PR：当前环境的 `gh` 未登录且没有 `GH_TOKEN` / `GITHUB_TOKEN`，因此不能自动创建 PR；可直接打开
  <https://github.com/lucxu495/luc-ui/pull/new/audit/product-experience-polish>
- 未修改 `main`、`v1.0.1`、package version、运行时代码、视觉基线或 Cloudflare 部署。
- 不直接合并 `main`；PR 创建后仅用于审阅。

---

## Next Round Implementation Prompt

可直接用于下一轮实施：

```text
你是 Luc UI 的实现工程师。仓库基线：v1.0.1 之后从 origin/main 创建的新分支。
本轮只实现 Product Experience Audit 的第一批 B1–B8，不扩展到全量组件重构。

硬约束：
- 不移动 v1.0.1 tag；
- 不修改公共 API、包版本、安装方式；
- 不部署 Cloudflare 正式域名；
- 不更新现有视觉基线来掩盖回归；
- 不触碰其他独立项目或 5301；
- 不擅自改 chart engine；F-12/F-15 留作后续专项。

按顺序实现：
B1 公网 503/1102：先调查 OpenNext/Workers 每请求成本与缓存，staging 验证 50 顺序 + 8 并发 0 个 5xx；
B2 AppShell skip link：Enter 后聚焦 main/H1，下一 Tab 从主内容开始；
B3 390px 手机主题入口：System/Light/Dark 可直接发现和切换；
B4 文档表格：DataTable 最小列宽 + 可见横向滚动提示；PropsTable 手机堆叠/折叠 inherited props；无页面级横向滚动；
B5 Finance Experience：base grid 使用 minmax(0,1fr)，390px Canvas right 不超出卡片；
B6 计数语义：首页资源计数与 Docs families/entries 使用准确 scope，处理单复数；
B7 Command Palette 跳转后聚焦 H1/main 或 live 播报；
B8 CopyButton 增加可访问成功反馈。

每项必须补对应 Playwright 或单元测试，并给 390/1440 截图。最后运行：
pnpm typecheck
pnpm lint
pnpm --filter @luc/ui test
pnpm --filter @luc/showcase test
pnpm --filter @luc/showcase qa:mobile-a11y
pnpm --filter @luc/showcase qa:overflow
pnpm --filter @luc/showcase qa:target-size
pnpm --filter @luc/showcase qa:baseline
node scripts/product-audit/evidence.mjs

交付：分支、commit、PR、逐项前后截图、测试结果、风险说明。不要合并 main，不要发布新版本。
```

---

## Evidence Index

| 文件 | 用途 |
| --- | --- |
| [public-503.png](evidence/public-503.png) | 公网 Cloudflare 1102 实际错误页 |
| [public-reliability.json](evidence/public-reliability.json) | 公网顺序/并发请求状态、耗时与响应体 |
| [home-resource-counts.png](evidence/home-resource-counts.png) | 首页资源计数重复 |
| [docs-surface-counts.png](evidence/docs-surface-counts.png) | Docs families/entries 标签错误 |
| [mobile-header-theme.png](evidence/mobile-header-theme.png) | 390px 无主题入口 |
| [mobile-button-props.png](evidence/mobile-button-props.png) | 手机 Props 表逐词竖排 |
| [mobile-table-cutoff.png](evidence/mobile-table-cutoff.png) | 手机 DataTable 列被裁切、无滚动提示 |
| [finance-mobile-chart.png](evidence/finance-mobile-chart.png) | Finance 图表 626px canvas 在 390px 视口被裁 |
| [docs-slash-hint.png](evidence/docs-slash-hint.png) | `/` 搜索提示 |
| [copy-feedback.png](evidence/copy-feedback.png) | 复制视觉反馈但无 a11y 成功文本 |
| [chart-volume-unit.png](evidence/chart-volume-unit.png) | Volume 轴与 Tooltip 单位不一致 |
| [interaction-probes.json](evidence/interaction-probes.json) | Skip link、主题、表格、图表、命令面板、复制、快捷键的实测数据 |
