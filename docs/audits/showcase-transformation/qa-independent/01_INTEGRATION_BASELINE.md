# 01 — 集成基线（实际运行的东西是什么）

审计时间：2026-10-12 01:34–02:40（Asia/Singapore）。全部为只读操作。

## 1. 版本控制状态

| 项目 | 值 |
|---|---|
| HEAD | `83aae8d01a5d25a572d7cf2d1f2dfb2dbf55ba32`（`codex 43`） |
| 分支 | `main` |
| 脏改动 | 147 项 = 105 已跟踪修改 + 42 未跟踪 |
| 未跟踪的**源文件** | **32 个**（另有 21 个文档/报告/配置） |
| 是否有实现工作在进行 | 最后一个源文件改动 00:56:39（`components/shell/demo-shell.tsx`），此后无改动 → **当前视为静止** |

### 1.1 P0：HEAD 自身不自洽（实测证据）

用 `git archive HEAD luc-ui/packages/visuals luc-ui/apps/showcase | tar -x -C <临时目录>`
做了一次**纯 HEAD 快照**（不触碰工作树），然后解析所有相对导入：

```
HEAD copy source files: 90
unresolved relative imports: 6
  src/index.ts         →  ./artifacts/studies
  src/index.ts         →  ./artifacts/skins
  src/react/index.ts   →  ../artifacts/render
  src/__tests__/catalog.test.tsx → ../artifacts/studies | skins | render
```

- `git ls-files luc-ui/packages/visuals/src/artifacts` → **0 个文件被跟踪**；
- 但 HEAD 自己的 `packages/visuals/src/index.ts` 第 58–59 行就 `export * from "./artifacts/studies" | "./artifacts/skins"`；
- 同样，`src/elements/{analysis,events,learning,relations,report,scientific,study,systems}/`
  在 HEAD 快照里**不存在**，只在本地以未跟踪形式存在。

**含义**：任何人 `git clone` + `git checkout 83aae8d0` 之后 `pnpm install && build` 都会失败。
当前产品之所以能跑，只因为这台机器上有 32 个未跟踪源文件。这是**发布阻塞**，
不是"以后再整理"的整洁性问题。（不要求我修复，故只记录。）

## 2. 运行中的预览

| 项目 | 值 |
|---|---|
| 容器 | `luc-ui-showcase-local` |
| Compose project | `luc-ui-local`（`docker-compose.yml` + `docker-compose.local.yml`） |
| 镜像 | `luc-ui/showcase:1.0.0`，构建于 **2026-10-12 00:58:48** |
| 容器创建 | 00:58:51 |
| 端口（Docker 实际分配） | **`127.0.0.1:60835`**（不是任何历史端口） |
| 状态 | `Up (healthy)`，`lsof` 确认仅监听 127.0.0.1 |

**镜像是否代表当前源码**：是。最后一个源文件改动（00:56:39）早于镜像构建（00:58:48），
且 `packages/visuals/**`、`app/visuals/**`、`components/visuals/**`、`lib/visuals/**`
在构建之后**没有任何新改动**。因此本轮所有浏览器证据都对应"当前工作树"这一快照。

> 注意区分：本轮证据 = **本地工作树**（含 32 个未跟踪文件）。
> 它**不等于** HEAD。若日后提交，必须先提交这些文件，否则快照不可复现。

## 3. 内容清单（实测）

| 面 | 数量 | 方法 |
|---|---|---|
| 文档注册表条目 | **223** | `pnpm docs:registry:check`（只读，输出 "up to date"） |
| — components / charts / motion / integrations | 103 / 76 / 35 / 9 | 同上 |
| — curated / generated / reference | 62 / 157 / 4 | 同上 |
| QA 路由总数 | **326** | `qa/route-health.mjs` 自跑 |
| Visuals 注册能力 | **79**，9 个族 | 目录页横幅 + 卡片数 + 详情链接数三者一致 |
| Visuals 详情链接 | 79 | 同上 |
| Blocks 实际数量 | **12**（Marketing 3 / Personal 5 / Product 4） | `/blocks` 过滤 chip |

**关于此前"Visuals 有 92 个契约"的说法**：我用逐文件正则数 `id: "…"` 得到 92，但换成
去重并排除嵌套对象键后是 80，而运行时目录、横幅、详情链接**一致地**给出 79。
结论：**92 是正则把 `id:` 键重复计数造成的假象**，79 才是真实注册数。
（这一点值得写进交付说明，避免下一轮再被"契约数 vs 注册数"误导。）

## 4. 我独立跑过的门禁（第一手结果）

| 门禁 | 结果 |
|---|---|
| `qa/route-health.mjs` | **326/326 healthy**，exit 0 |
| `qa/outline.mjs --all --max-rows=12` | exit 0，无失败项 |
| `qa/navigation.mjs` | exit 0，9/9（含 IA-005 头部四宽度） |
| `qa/playground.mjs` | exit 0，5/5（presets / advanced / disabled=0 silent） |
| `qa/motion.mjs` | exit 0，26 tiles + replay + reduced motion |
| `qa/preview-check.mjs` | exit 0，6/6，0 控制台错误 |
| `qa/standalone.mjs` | exit 0，0 产品导入 / 0 网络请求 / 0 部署变量 |
| `pnpm verify:i18n` | exit 0，`prose sentences 90133/90133 (100%)` |
| `pnpm --filter @luc/ui test:showcase` | 142/142，16 文件 |
| `pnpm --filter @luc/showcase typecheck` | exit 0 |
| `qa/locale.mjs --all`（Agent A 自报的） | 我未复跑其脚本，但用**自写探针**独立得到同样结论（见下） |

## 5. 我自己的独立探针（不复用他们的脚本）

`artifacts/qa-independent/probe.mjs`（场景：areas / detail / cardstack / morphing /
morphing-focus / locale / responsive / targets / workbench）输出 JSON + 截图。

关键独立结果：

- **中文路由**：Agent A 的页面（components/buttons、charts/line-chart、motion/card-stack、
  explore、docs、blocks）在 `/zh` 下**无前缀链接 = 0**（我扫全文档 `a[href^="/"]`，
  范围比他们的 `main` 更宽）；`/visuals/elements` = **89**、`/visuals` = **18**、
  `/visuals/docs` = **5**。
- **首屏示例位置**：注册表页 369px（22–25 词）优于手写页 432–478px（64–69 词）；
  `/motion/kinetic` 500px / 84 词；`/motion` 图库首个示例在 **1169px**（超出一屏）。
- **Workbench**：buttons/line-chart/cards 三项均"控件→代码变化→示例变化→Reset 还原"；
  高级折叠默认关闭；预设 6/4/4/2；跨页持久化（Dark 主题带到 `/charts/bar-chart`，
  stage `data-theme="dark"`）成立。
- **目标尺寸**：390px 与 768px 下，`/visuals/elements`、`/components`、`/blocks`、
  `/motion` 的**真实控件**均无小于 24×24 者。

## 6. 本轮未能验证的部分（诚实记录）

- React Bits 静态 HTML 仅 568 词（客户端渲染），**未能独立观察其 UI**；只用仓库既有研究。
- `/motion/kinetic` 第一个下拉控件改变了代码但**未检测到预览 DOM 变化**。查阅适配器源码后
  判断这属预期（`mode` 只影响动画而非 DOM），故**不作为缺陷**；但也意味着
  "预览确实变了"这一条在该页**未被我证实**，列为待验证。
- 未逐条手工复核 326 条路由的视觉；未做跨浏览器（Firefox/WebKit）复核。
- 未测试真实屏幕阅读器（仅用 DOM 属性推断）。
