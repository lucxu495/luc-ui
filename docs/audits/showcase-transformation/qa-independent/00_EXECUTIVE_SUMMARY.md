# Agent C — 独立产品验收总结（LUC UI Showcase）

日期：2026-10-12 · 审计者：Agent C（独立验收，只读，未修改任何实现代码）
证据目录：`luc-ui/artifacts/qa-independent/`（截图、JSON 探针输出）

---

## 1. 结论：**CONDITIONAL ACCEPT（有条件接受）**

LUC UI Showcase 现在**确实是一个可用的组件展示站**，不是一堆绿色测试。核心链路真实可用：
326 条文档路由全部健康且水合、真实组件的活体示例在首屏内出现、Workbench 的
props/代码/Reset/预设真的联动、中文路由在 Agent A 的页面里没有前缀泄漏、搜索与
侧边栏可达九个产品区域。这些是我自己跑出来、自己量出来的，不是引用他们的报告。

但它**还不能作为"完成品"交付**，因为存在一类此前所有门禁都看不见的缺陷：**交互正确而
视觉不可接受**。这恰好就是用户拿截图投诉的那一类。另外还有一个版本控制层面的发布阻塞。

**发布阻塞（必须先修）**

1. **P0 · 工作树无法从 Git 复现**：HEAD `83aae8d0` 自己引用了一个未跟踪的模块目录。
2. **P1 · CardStack 视觉不可接受**（用户投诉复现成功）。
3. **P1 · MorphingDialog 默认布局不可接受**（用户投诉复现成功）。
4. **P1 · 中文页面上，157 条注册表生成的导语仍是英文**，而 i18n 门禁报告 100%。
5. **P1 · `/zh/visuals/**` 仍有 89/18/5 条无语言前缀的内部链接**（Agent B 侧）。

在修完 1–5 之前，建议**不要**对外宣称"Showcase 已完成"。

---

## 2. 当前集成状态（实测）

| 项目 | 实测值 |
|---|---|
| Git HEAD | `83aae8d0`（`codex 43`，`main`），147 项脏改动（105 修改 / 42 未跟踪） |
| Docker 预览 | 容器 `luc-ui-showcase-local`，Compose `luc-ui-local`，`127.0.0.1:60835`，healthy |
| 镜像新鲜度 | 镜像构建于 00:58:48，最后一个源文件改动 00:56:39 → **镜像代表当前源码** |
| 文档条目 | 223（components 103 / charts 76 / motion 35 / integrations 9） |
| Visuals 能力 | 注册 79、目录渲染 79、详情链接 79 —— **三者一致**（"92"是嵌套 `id:` 的正则误计） |

## 3. 我独立复核的门禁结果（全部通过）

```
route-health  exit=0  326/326 healthy
outline --all exit=0  0 failures        navigation  exit=0  9/9
playground    exit=0  5/5 presets/disabled   motion  exit=0  26 tiles
preview-check exit=0  6/6                standalone  exit=0
verify:i18n   exit=0  90133/90133 (100%)  unit tests  142/142  typecheck 0
```

**这些数字是真的** —— 问题不在于门禁撒谎，而在于**门禁没有断言的东西**：
它们测的是"索引是否变化""路由是否 200""字符串是否在词典里"，而不是"画面是否可读"、
"中文读者是否看到中文"、"这棵树能否被别人 clone 出来"。

## 4. 最严重的用户可见缺陷

1. **CardStack**：三层卡片背景全透明、透明度都是 1.00，层与层之间只有 1px 弱边框区分；
   每层的标签与计数彼此只隔 15–19px，于是"Baseline/Trend/Carry"和三个
   "Card N of 3"读起来是一团互相穿插的文字。控件（32px 圆形按钮）位于牌堆下方 ~100px。
2. **MorphingDialog**：打开后是 **416×900 的透明框贴在视口左侧**（中心偏差 dx=−512px），
   页面整体压暗到 0.64 alpha，标题/描述浮在中左侧。**页面上的代码示例就是这么写的**——
   也就是说这是组件默认值的问题，不是某个页面的样式失误。
   功能面是好的：焦点陷阱成立、背景 `aria-hidden="true"`、Escape 关闭并归还焦点。
   所以"绿色交互测试"与"视觉不可接受"可以同时为真。
3. **中文页面上的英文正文**：`/zh/charts/line-chart` 的导语是
   "Draws line with the ECharts engine from the values the caller prepares…"，
   而同一页的小标题（实时预览/用法/安装/配置）都是中文。原因是
   `components/docs/doc-entry.tsx:71` 直接渲染 `{entry.summary}`，**没有经过 `tcs()`**，
   词典里也没有这句话；覆盖检查因此看不见它。
4. **Explore 的统计把"页面"当"能力"**：首页数据显示
   **"4 visual elements"**（注册表实际 79 个能力）和 **"1 block"**（`/blocks` 实际 12 个）。
   读者据此会认为 Visuals 和 Blocks 几乎不存在。

## 5. 对比成熟组件站的差距（独立观测 + 仓库既有研究）

我独立抓取了竞品文档页的初始 HTML：`motion-primitives.com/docs/text-effect` 初始 HTML 里
`Preview`×16 / `Code`×16（**一个页面多个具名示例，各自带预览+代码**）；
`mantine.dev/core/button` `Code`×437 / `Copy`×25 / `Props`×12；`radix-ui.com` 的 Dialog 页
`Code`×97 / `Accessibility`×3。`reactbits.dev` 静态 HTML 仅 568 词（客户端渲染），
**我无法据此判断，故只用仓库既有研究，不编造观测**。

由此得出三条最关键的差距：

- **CP-01/CP-07（每个示例自带 Preview/Code 切换）**：LUC 的 Motion 详情页是"一个大示例 +
  长文"，没有一页做到"多个具名示例、各自可切换预览/代码"。
- **CP-09（目录卡片即发现面）**：`/components` 只有 chip，**没有任何缩略预览**；
  而 LUC 自己的 `/visuals/elements` 反而做对了。
- **CP-06（先用法后 API）**：LUC 已经接近，但**导语过长**（`/charts/line-chart` 1422 词、
  `/components/popover` 1097 词）。

## 6. 建议

**CONDITIONAL ACCEPT**：把这棵树提交进版本控制、修掉 4 个 P1 视觉/本地化问题之后，
它可以作为一个诚实、可用、可复现的组件展示站发布。**REJECT 不成立**——没有结构性死角：
导航通、发现面存在、Workbench 是真控件、九个区域都能到达。

详细证据见本目录其余文档；可执行任务见 `06_REMEDIATION_PLAN.md`。
