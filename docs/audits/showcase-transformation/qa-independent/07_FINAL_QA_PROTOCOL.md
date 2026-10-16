# 07 — 最终验收协议（可重复执行）

目的：让"这个 Showcase 是否可以发布"变成一个可复现、不可绕过的判定，并且**专门覆盖上一轮
漏掉的那一类缺陷（交互正确但视觉不可接受）**。

## 0. 前置

启动预览并读取 Docker 实际分配的端口（端口每次重建都会变，不得沿用旧值）：

```
cd luc-ui
docker compose -p luc-ui-local -f docker-compose.yml -f docker-compose.local.yml up -d --build
docker port luc-ui-showcase-local 3000
```

记录快照身份：`git rev-parse HEAD`、镜像构建时间、最后一个源文件 mtime。
**必须满足：最后一个源文件 mtime < 镜像构建时间**，否则证据属于旧快照，作废重来。

## 1. 版本可复现性（GO/NO-GO 第一道门）

1. 用 `git archive HEAD luc-ui/packages/visuals luc-ui/apps/showcase | tar -x -C <临时目录>` 取纯 HEAD 快照；
2. 解析快照内所有 `from "./…"` 相对导入 —— **必须 0 处无法解析**；
3. `git status --porcelain | grep '^??' | grep -E '\.(ts|tsx|css)$'` —— **必须为空**。

**NO-GO**：任一未跟踪源文件存在，或 HEAD 快照有无法解析的相对导入（当前 = C-01）。

## 2. 工程门禁（必须全绿，且由验收者本人执行）

```
cd apps/showcase
node qa/route-health.mjs              # 326/326, exit 0
node qa/outline.mjs --all --max-rows=12
node qa/navigation.mjs                # UX-005 + WB-005 + CHT-002 + IA-005 头部
node qa/playground.mjs                # silent=0
node qa/motion.mjs                    # 26 tiles
node qa/preview-check.mjs             # 6/6
node qa/standalone.mjs
node qa/locale.mjs --all              # 必须 0 offender
pnpm --filter @luc/ui test:showcase
pnpm verify:i18n                      # 并且必须跑一次 §5 的负例
```

## 3. 视觉验收（本轮新增，不可省略）

对每个"有默认视觉"的组件，**必须看图**，不能只看索引变化：

| 组件 | 断言 | 判定方式 |
|---|---|---|
| CardStack | 前景有可见表面；后景与前景的 opacity/对比不同；任意两层文本包围盒垂直间距 ≥ 24px 或不产生视觉穿插；控件距牌堆 ≤ 32px | 桌面 + 390px 稳定态截图人工评审 |
| MorphingDialog | 稳定态面板中心与视口中心偏差 ≤ 5%；面板 background 非透明；Escape 后焦点回到触发器 | 两视口稳定态截图 + 焦点断言 |
| 任何 `data-slot=demo` 组件 | 首屏内出现（≤900px）；无控制台错误；无横向溢出 | 自动 + 人工 |

采集脚本参考 `artifacts/qa-independent/probe.mjs`（场景 cardstack / morphing /
morphing-focus / detail）。

## 4. 浏览器旅程（真实点击 × 五个视口）

在 1440 / 1280 / 1024 / 768 / 390 各执行一遍：

1. **找**：`/` → 头部或移动菜单 → Components → 目录搜索 → 打开详情。
2. **试**：改一个控件 → 代码面板变化 → 预览变化 → Reset 还原。
3. **配**：应用预设 → 检查禁用控件是否给出原因 → 切 Dark → 跳到同族另一页验证主题跟随。
4. **复制**：复制代码；复制 AI 提示词。
5. **返回**：Back → Forward → 直接打开深链（含 `#anchor`）。
6. **中文**：切到中文，检查正文是中文、内部链接全部 `/zh` 前缀、刷新仍中文、
   英文→中文→英文不出环。

**NO-GO**：任一步出现死链、白屏、hydration 控制台错误、中文页出现英文正文、
或中文页出现无前缀内部链接。

## 5. 反作弊检查（防止"绿色但骗人"）

1. `verify:i18n` 负例：临时删掉词典里一条已知在用的句子 → **必须变红**；
   否则说明提取器有盲区（当前确实有，见 C-04）。
2. `qa/locale.mjs --all` 负例：把某页一个内部链接改成无前缀 → **必须报 offender**。
3. 视觉门禁负例：把 CardStack 三层 opacity 都设为 1 且背景透明 → **必须报失败**。

## 6. GO / NO-GO 汇总

必须全部满足才可 GO：

- [ ] §1 版本可复现（当前 **NO**，C-01）
- [ ] §2 全部工程门禁绿（当前 locale 一项 **NO**，C-07）
- [ ] §3 CardStack 与 MorphingDialog 视觉通过（当前 **NO**，C-02 / C-03）
- [ ] §4 六个旅程 × 五视口通过，中文页无英文正文（当前 **NO**，C-04）
- [ ] §5 三个负例都能变红（当前 i18n 负例 **NO**）
- [ ] Explore 统计口径正确（当前 **NO**，C-05）
- [ ] Motion 已归入 Components 且深链仍可用（当前 **NO**，C-06）

任一项为 NO → 只能给出 **CONDITIONAL ACCEPT**，并附该项对应的 WP 编号。
