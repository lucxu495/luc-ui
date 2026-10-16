# 06 — 整改计划（可直接施工）

按依赖顺序排列。每条都写明 owner、文件范围、验收标准与验证命令。
本审计**不修改实现代码**，以下均为交接方案。

---

## WP-0（P0，先做，30 分钟）· 让这棵树可复现

**Owner**：A + B（各自负责自己的文件）

1. B：`git add luc-ui/packages/visuals/src/artifacts/ luc-ui/packages/visuals/src/elements/{analysis,events,learning,relations,report,scientific,study,systems}/ luc-ui/packages/visuals/src/__tests__/ luc-ui/packages/visuals/scripts/lib/`
2. A：`git add luc-ui/apps/showcase/qa/*.mjs luc-ui/apps/showcase/components/demo/islands/*.tsx luc-ui/apps/showcase/components/docs/local-link.tsx luc-ui/apps/showcase/tests/unit/{i18n-prose,summary-budget}.test.ts luc-ui/docker-compose.local.yml luc-ui/docs/{LOCAL_PREVIEW,DEV_MODE}.md luc-ui/docs/audits/**`
3. 提交后立刻验证：`git archive HEAD | tar -x -C <tmp>` → 相对导入解析 0 处失败。

**验收**：`git status --porcelain | grep '^??'` 不再包含任何 `.ts/.tsx/.css`；
HEAD 快照 `pnpm -r typecheck` 通过。

---

## WP-1（P1）· CardStack 默认视觉

**Owner**：A · **范围**：`packages/ui/src/motion/card-stack.tsx`、`lib/demo/motion/spatial.tsx`（示例内容）

建议做法（择一或组合，避免只调 `offsetY` 掩盖问题）：

1. 前景卡给出**可见表面**（`bg-surface-raised` + 边框 + 阴影），后景卡按层降不透明度
   （如 0.75 / 0.5）或降对比，而不是全部 `opacity: 1`。
2. 层间距按**文本高度**推导，而不是固定 14px：至少保证任意两层文本包围盒垂直间距 ≥ 24px；
   或把"Card N of 3"计数**移出卡片**（放到控件旁），从根上消除三层计数叠罗汉。
3. 控件紧贴牌堆（间距 ≤ 32px），并把牌堆在舞台内水平居中或左对齐后不留 500px 空白。

**验收**：桌面与 390px 两张截图人工评审通过；几何断言（任意两层文本垂直间距 ≥ 24px 或不产生视觉穿插）。

**验证**：复用 `artifacts/qa-independent/probe.mjs cardstack` 的几何采集；
**禁止**只用"索引变化"充当证据（这正是上一轮漏掉它的原因）。

---

## WP-2（P1）· MorphingDialog 稳定态布局

**Owner**：A · **范围**：`packages/ui/src/motion/morphing-dialog.tsx`

1. 明确组件契约：是**居中对话框**还是**侧边抽屉**。当前默认是"416×900 透明竖条"，
   两者都不像。
2. 若为对话框：`MorphingDialogContent` 默认给不透明面板（background + radius + shadow + 内边距），
   并在视口内居中（`inset-0 m-auto` 或等价的 transform）；
   若为抽屉：把宽度/高度/贴边写成**显式 prop**，并在示例里演示。
3. 同步更新页面上的可复制示例（它现在就是缺陷的复现步骤）。

**验收**：稳定态中心偏差 ≤ 5% 视口；面板有不透明表面；`shots/morphing-*-settled.png` 可读；
Escape/焦点回归不回归（已有门禁 `morphing-focus` 式断言）。

---

## WP-3（P1）· 中文页面的生成导语

**Owner**：A · **范围**：`components/docs/doc-entry.tsx`、`scripts/i18n-prose.mjs`、`lib/i18n/prose.zh.ts`（或生成的 zh 词典）

1. 最省事且正确：把 `entry.summary` 经 `tcs()` 渲染，并为 157 条 generated 导语提供中文
   （可批量翻译 + 人工抽查，量级约 157 句）。
2. 让提取器覆盖这一类：`extractProse` 需识别"渲染注册表 summary 的位置"，
   否则下一轮还会出现同样的盲区。加一条单测：删除一条字典项 → 门禁必须变红。

**验收**：抽查 10 条 generated 条目，`/zh/...` 首句为中文；负例测试可复现变红。

---

## WP-4（P1）· Explore 统计口径

**Owner**：A · **范围**：`lib/discovery/catalog.ts`（stats）、`app/explore/page.tsx`

把 `visual` / `block` 两项替换为能力数：Visuals 取 `ELEMENT_LIST.length`（79），
Blocks 取 `BLOCKS.length`（12）；若坚持页面口径，则文案必须写 "pages"。
同时统一 Home 与 Explore 的数字体系（`catalog entries 282` 与 Explore 的 106 不同源）。

**验收**：断言"页面显示的数字 == 注册表长度"；两页对同一实体给出相同数字或明确不同口径。

---

## WP-5（P1，产品要求）· Motion 归入 Components

**Owner**：A · **范围**：`lib/discovery/areas.ts`、`lib/navigation.ts`、`components/shell/global-nav.tsx`、`tests/unit/discovery-areas.test.ts`

最小一致改法：

1. `motion.tier` 改回 `secondary`；一级 = Components · Charts · Visuals（+ More）。
2. 在 `components` 区域内新增一个 **Motion & Interaction** 导航组（分类建议：
   Surfaces & pointer · Typography & text · Feedback & presence · Spatial & depth），
   条目指向现有 `/motion/*` 路由。
3. 保留 `/motion/**` 作为兼容路由（不 404、不重定向、面包屑显示为 Components → Motion）。
4. 更新完整性单测（一级项 = 3、Motion 组存在且每条 href 200）。

**验收**：头部一级项 = 3；`/components` 内 Motion 链接 ≥ 5；`/motion/card-stack` 深链 200；
面包屑与 active state 正确；390px 可达。**验证**：四宽度截图 + 链接数 + 深链抽查。

---

## WP-6（P1，B 侧）· Visuals 中文路由与文案

**Owner**：B · **范围**：`app/visuals/**`、`components/visuals/**`、`lib/visuals/**`

1. 所有内部锚点走 `useI18n().href`（客户端）/ `getServerCopy().href`（服务端），
   可复制代码片段保持无前缀。
2. 元素名与描述接入 `tcs()`；`Tables` chip 补中文。

**验收**：zh 探针在 `/visuals`、`/visuals/elements`、`/visuals/docs` 报 0；
卡片文案有 zh；`Tables` 已翻译。

---

## WP-7（P2）· 发现面与密度

| 任务 | Owner | 验收 |
|---|---|---|
| Components 目录加预览（至少每组首条） | A | 每组出现真实预览；390px 不溢出 |
| Motion 图库首个 tile 提到 900px 内 | A | 首景 ≤ 900px |
| 代表页词数压到 detail ≤ 700 | A | line-chart / popover / kinetic / typography 达标且无内容丢失 |
| `/docs/reference` 拆分 | A | 索引 ≤ 400 词 + 每族一页；symbol 不丢失 |

---

## WP-8（Verification）· 让"绿色"重新变得可信

1. **把视觉断言补进门禁**（这是本轮最重要的工程教训）：
   - CardStack：分层可见性（前景 opacity/backdrop 与后景不同）+ 文本包围盒间距断言；
   - MorphingDialog：稳定态中心偏差 + 面板不透明度断言。
2. **i18n 负例测试**：删一条字典项必须让 `verify:i18n` 变红（防"盲区式 100%"）。
3. **旅程级验收（QA-002）**：找→开→试→配→复制→返回，覆盖四个区域。
