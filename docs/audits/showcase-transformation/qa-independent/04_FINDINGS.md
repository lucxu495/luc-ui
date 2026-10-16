# 04 — 独立缺陷清单（按严重度）

每条都可在当前容器（`127.0.0.1:60835`）复现。截图/JSON 在
`luc-ui/artifacts/qa-independent/`。

严重度：P0 = 发布阻塞；P1 = 明显破坏体验或承诺；P2 = 一致性/密度/次要响应式；P3 = 打磨。

---

## C-01 · P0 · 工作树无法从版本控制复现

**区域**：工程 / 发布 · **路由**：不适用（仓库层面）

**复现**：`git archive HEAD luc-ui/packages/visuals luc-ui/apps/showcase | tar -x -C <临时目录>`，
再解析该快照内所有 `from "./…"` 相对导入。

**期望**：HEAD 快照自洽，`pnpm install && build` 可成功。

**实际**：6 处相对导入无法解析 —— `src/index.ts → ./artifacts/studies`、`./artifacts/skins`；
`src/react/index.ts → ../artifacts/render`；`src/__tests__/catalog.test.tsx` 的 3 处。
`git ls-files .../src/artifacts` = **0**；`src/elements/{analysis,events,learning,relations,report,scientific,study,systems}`
在 HEAD 中不存在。

**证据**：`01_INTEGRATION_BASELINE.md` §1.1。
**来源**：`packages/visuals/**`（B）为主；A 新增的 `qa/*.mjs`、`components/demo/islands/*`、
`docker-compose.local.yml`、`docs/*` 同样未跟踪。
**Owner**：A + B（各自 `git add` 后一次提交）。
**验收**：`git archive HEAD` 后 `pnpm -r typecheck` 通过；`git status` 无未跟踪源文件。

---

## C-02 · P1 · CardStack 默认视觉不可接受（用户投诉复现）

**区域**：Motion（也涉及 `@luc/ui` 组件默认值）· **路由**：`/motion/card-stack`（1440×900 与 390×844 均复现）

**复现**：打开页面看 Live preview；点 `›` 一格再看。

**期望**：三层卡片能区分"当前卡/后景卡"，文字可读，控件紧贴牌堆。

**实际（实测几何）**

1. 三层卡片 `background: rgba(0,0,0,0)`（全透明）、`opacity: 1.00`（前后层一致），仅靠 1px 弱边框区分；
   z-index 4/3/2，scale 1.0/0.95/0.90，纵向偏移 0/20/40px。
2. 每层标签与计数竖直只隔 **15–19px**：Baseline 452 / Trend 471 / Carry 490；
   Card 1 of 3 = 529 / Card 2 of 3 = 544 / Card 3 of 3 = 559。
   文字框本身不交叠（0 对交叠），但三层文字挤成 107px 高的连续块，背景又透明，
   视觉上就是"文字互相穿插"。
3. 牌堆 384px 宽而舞台 901px 宽，右侧大片空白；导航控件是 32px 圆形按钮，位于牌堆下方约 100px。

**证据**：`shots/cardstack-desktop-before.png`、`cardstack-desktop-after-next.png`、
`cardstack-mobile-before.png`、`cardstack.json`。
**来源**：`packages/ui/src/motion/card-stack.tsx`（层样式与层间距）+ `lib/demo/motion/spatial.tsx`（示例内容）。
**Owner**：A。
**验收**：前景为可见表面、后景降透明度或降对比；任意两层文本包围盒垂直间距 ≥ 24px 或不产生视觉穿插；
控件与牌堆间距 ≤ 32px；桌面与 390px 各一张人工评审截图。
**验证**：重复本探针几何采集 + 人工看图；**不得**只用"索引 0→1 变化"作为证据。

---

## C-03 · P1 · MorphingDialog 默认布局不可接受（用户投诉复现）

**区域**：Motion（`@luc/ui` 组件默认值）· **路由**：`/motion/morphing-dialog`（桌面与移动）

**复现**：点示例触发器（如 "Open the panel"），等 900ms 稳定后观察。

**期望**：面板是可读的居中浮层，或明确设计成抽屉/侧栏，且与背景清晰分离。

**实际（实测）**

1. 桌面：`[role="dialog"]` = **416×900**，`top:0 / left:0`，中心偏差 **dx = −512px, dy = 0**
   （贴视口左上角的一条全高竖条）；`background: rgba(0,0,0,0)` 透明；
   标题与描述浮在竖条中上部；整页被 0.64 alpha 遮罩压暗。
2. 移动：320×844 @ left=−14，同样贴左边。
3. **页面上的可复制代码示例就是 `<MorphingDialogContent>` + 标题/描述/关闭**，
   与渲染结果一致 → 属**组件默认值**问题，而非页面样式失误。

**功能面（同时实测，避免误判）**：焦点移入对话框且陷阱成立（Tab 与 Shift+Tab 各 5/3 次均在内）；
背景 `[data-slot="app-shell"]` 得到 `aria-hidden="true"`；`Escape` 关闭并把焦点还给触发器；
无控制台错误。**"交互全绿 + 视觉不可接受"可以同时成立**。

**证据**：`shots/morphing-desktop-{trigger,transition,settled,after-escape}.png`、
`morphing.json`、`morphing-focus.json`。
**来源**：`packages/ui/src/motion/morphing-dialog.tsx`（`MorphingDialogContent` 默认面板样式与最终定位）。
**Owner**：A。
**验收**：稳定态面板与视口中心偏差 ≤ 5% 视口宽高；或显式定义为抽屉并给出不透明面板表面
（背景 + 圆角 + 阴影）；两视口稳定态截图留存；Escape/焦点回归不回归。

---

## C-04 · P1 · 中文页面上注册表生成的导语仍是英文（门禁盲区）

**区域**：Docs / 所有注册表详情页 · **路由**：`/zh/charts/line-chart`（同类影响 157 条 generated 条目）

**复现**：以 `Accept-Language: zh-CN` 打开 `/zh/charts/line-chart`，读标题下第一句。

**期望**：中文页面第一句正文是中文（DOC-005 把"活跃公共组件用法说明"列为必译）。

**实际**：显示 `Draws line with the ECharts engine from the values the caller prepares — the renderer computes no statistic of its own.`，
而同一页小标题（实时预览/用法/安装/配置/无障碍/复制给 AI 智能体）都是中文。

**根因（源码定位）**：`components/docs/doc-entry.tsx:71` 直接渲染 `{entry.summary}`，**没有 `tcs()`**；
`lib/i18n/prose.zh.ts` 中该句出现 **0** 次。所以 `verify:i18n` 报 100%
（它只统计经 `tcs()`／JSX 文本／copy 属性的字符串），生成数据里被直接渲染的句子对提取器不可见。

**证据**：`shots/locale-zh-_charts_line-chart.png`；上述源码行号；`verify:i18n` 输出。
**Owner**：A。
**验收**：任取 10 条 generated 条目，`/zh/...` 首句为中文；提取器覆盖"渲染 summary 的位置"，
或加一条单测断言该句必须经 `tcs()`。
**验证**：浏览器实测 + 删一条字典项应导致门禁变红（负例）。

---

## C-05 · P1 · Explore 统计把"页面"当"能力"计数

**区域**：Explore（发现面）· **路由**：`/explore`

**复现**：打开 `/explore`，读顶部统计卡。

**期望**：统计反映能力数量，或文案明确写"pages"。

**实际**：显示 **`4 visual elements`** 与 **`1 block`**。源码证据：`lib/docs/generated/discovery.ts` 中
`kind:"visual"` = 4 条，全部是 `/visuals`、`/visuals/docs`、`/visuals/elements`、`/visuals/styles`
**页面行**；`kind:"block"` = 1 条（`/blocks`）。而 Visuals 注册 **79** 个能力、`/blocks` 有 **12** 个 Block。

**后果**：读者会判断 Visuals/Blocks 几乎不存在；且与 Home 的
`catalog entries 282 / components 106 / charts 76 / motion 35` 是另一套口径。

**证据**：`shots/area-explore.png`、`areas.json`、`docs-registry.mjs --check` 输出（282 = 217 registry + 65 site）。
**Owner**：A。
**验收**：每个统计项要么等于能力数，要么文案写"pages"；Visuals 数字取自 `ELEMENT_LIST`（79）、
Blocks 取自 `BLOCKS`（12）。

---

## C-06 · P1 · Motion 仍在顶层导航，且 Components 内无 Motion 入口

**区域**：全局 IA · **路由**：任意页面头部 / `/components`

**期望（产品负责人本轮决定）**：一级导航 = Components · Charts · Visuals · More；
Motion 成为 **Components → Motion & Interaction** 的一个族。

**实际**：头部 = `Components · Charts · Visuals · Motion · More`；
`/components` 页面内指向 `/motion` 的链接**只有 1 条**（侧边栏区域行），组件目录内没有 Motion 族。

**证据**：`shots/area-components.png`、`areas.json`（`primaryNav` 数组）、独立探针 `motionLinkCount = 1`。
**Owner**：A（只读审计，方案见 `06_REMEDIATION_PLAN.md`）。
**验收**：头部一级项 = 4（无 Motion）；`/components` 目录出现 Motion 族并列出子类；
`/motion/**` 全部深链仍 200 且重定向不成环；面包屑与 active state 一致；390px 可达。

---

## C-07 · P1 · `/zh/visuals/**` 仍有大量无语言前缀的内部链接（Agent B 侧）

**区域**：Visuals（本地化）· **路由**：`/zh/visuals/elements`（**89**）、`/zh/visuals`（**18**）、`/zh/visuals/docs`（**5**）

**复现**：在 zh 上下文打开这些路由，统计文档内 `a[href^="/"]` 中不以 `/zh`、`/en` 开头者。

**期望**：中文页面的内部链接都是中文 URL。否则点击与 **prefetch** 都会吃一次 307，
而 Next 会缓存该重定向并在点击时重放（这正是此前"浏览器专有跳转"的机制）。

**实际**：89 / 18 / 5 条（例：`/visuals/elements/metric-value`）。
对照：Agent A 的页面（components/buttons、charts/line-chart、motion/card-stack、explore、docs、blocks）**均为 0**。

**附带**：同批页面的**卡片文案未翻译**（"Metric value…" 等），家族 chip 中 `Tables` 仍是英文。

**证据**：`artifacts/qa-independent/locale.json`、`shots/locale-zh-_visuals_elements.png`。
**Owner**：B。
**验收**：locale 探针在这三条路由报 0；卡片文案有 zh 条目；`Tables` chip 已翻译。

---

## C-08 · P2 · Components 目录没有预览

13 组、103 个 chip 全是纯文字链接，没有任何缩略或活体预览；而 LUC 自己的
`/visuals/elements` 每张卡都有真实预览。读者必须逐个点开才能知道长什么样（CP-09 相反）。
**Owner**：A。**验收**：至少每组首个条目带预览，或 chip 带"交互/a11y"标签。

## C-09 · P2 · 手写 Components 页与注册表页结构仍不一致（UX-003 未做）

实测首景：手写页 buttons 478 / inputs 456 / cards 478 / ai 478 / slider 432px，前置词 64–69；
注册表页 native-select / project-showcase / popover / typography = **369px、22–25 词**。
即手写页多约 **40 词 / 100px** 才看到示例，且章节命名不同（Playground/Variants vs Live preview/Usage/API）。
**Owner**：A（UX-003）。

## C-10 · P2 · 长文密度超标

词数：`/charts/line-chart` **1422**、`/components/popover` **1097**、`/motion/kinetic` **1005**、
`/blocks` 968、`/components/typography` 903。DOC-003 的目标是 detail ≤ 700 词，代表页全部超标。
**Owner**：A。

## C-11 · P2 · Motion 图库首个示例在一屏之外

首个 tile 在 **1169px**，前面 213 词（介绍卡 + "Loudness is scoped"）。图库的价值是"扫一眼看到
26 个效果"，建议把首个 tile 提到 900px 内。**Owner**：A。

## C-12 · P2 · Blocks / Templates / Patterns / Experiences 在侧边栏难以区分

区域声明把四个产品合并为一个 build 区域（IA-007 未做），从标签看不出差别。**Owner**：A。

## C-13 · P3 · 局部混排与口径不一致

`/zh/visuals/elements` 的 `Tables` chip 未翻译；中文页面右侧 rail 标题仍是 "ON THIS PAGE"
（全站一致，属统一取舍，值得确认是否有意）。

---

## 未构成缺陷但必须记录的三件事

1. **`/motion/kinetic` 第一个下拉控件改了代码但未改变预览 DOM**：查适配器后判断 `mode`
   只影响动画、不改变 DOM，属预期；因此**不作为缺陷**，但"该页预览随控件变化"这一条我**未能证实**，
   列入待验证。
2. **Home 首屏**：自动度量给 1267px，但截图显示首屏右侧是一个实时组件拼贴 —— 属**正面**发现，
   是我的自动化指标口径不足。
3. **Blocks 首屏**：自动度量找不到 demo slot，但截图显示 ≈558px 处就是真实 Hero Block ——
   同属**正面**发现。
