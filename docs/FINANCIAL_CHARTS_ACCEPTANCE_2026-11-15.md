# Luc UI 金融图表技术验收（2026-11-15）

## 验收结论

**状态：READY_FOR_USER_REVIEW（已实现范围内的技术验收）；NOT_READY_FOR_RELEASE（发布产物未同步）。**

本次验收针对 `main` 工作区内尚未提交的 Lightweight Charts v5.3 / FinancialChart / Showcase 改动。
没有 Commit、Push、npm 发布或 Cloudflare 部署。现有路线图的“全部官方插件封装、完整高层 API”**仍未完成**，不能因为本轮测试通过而宣称全面实现。

## 本地验收结果

| 验收项 | 结果 | 命令或证据 |
|---|---|---|
| `@luc/ui` TypeScript | PASS | `pnpm --filter @luc/ui typecheck` |
| `@luc/ui` ESLint | PASS | `pnpm --filter @luc/ui lint` |
| `@luc/ui` 全量单测 | PASS · 1,058/1,058 | `pnpm --filter @luc/ui test` |
| 金融图表定向单测 | PASS · 39/39 | FinancialChart、data、controller、pane、range、perf |
| Showcase TypeScript 与 ESLint | PASS | `pnpm --filter @luc/showcase typecheck`, `lint` |
| Showcase 全量单测 | PASS · 184/184 | `pnpm --filter @luc/ui test:showcase` |
| `@luc/ui` 构建 | PASS | `pnpm --filter @luc/ui build` |
| Chromium 财务图表桌面/390px 手机 Smoke | PASS · 2/2 | `apps/showcase/tests/financial.smoke.spec.mjs` |
| Crosshair 浏览器 QA（ECharts 旧路线） | PASS | `pnpm --filter @luc/showcase qa:financial-crosshair`；包含桌面/触屏仿真、缩放与轴控制 |
| 依赖类型/子路径与 tarball | PASS | `verify:types`, `verify:package` |
| Tree-shaking 消费者隔离 | PASS（经审计后更新金融图表基线） | `pnpm --filter @luc/ui test:consumer` |
| 中英文文案覆盖 | PASS · 162/162 路由，187,978/187,978 句 | `pnpm verify:i18n` |
| 图表数学/数据契约 | PASS · 11/11 | `pnpm verify:charts` |
| Docs / Registry / Package | PASS | `verify:docs`, `verify:registry`, `verify:package` |
| 已提交 release artifact 一致性 | **BLOCKED** | `pnpm verify:release-artifact`：新源文件未形成已提交的正式发布快照，需发布阶段 `release:build` 并审核、提交 |

## 本轮定位和修复

1. **FinancialChart bundle budget 超限**：此前消费者预算为 37,613 raw / 11,686 gzip bytes。新增 Chart 类型、指标/Pane 控制、Crosshair 及性能防护后，测得 58,625 raw / 17,289 gzip bytes。其他 16 个消费者入口保持隔离且未超限；增加的体积与此轮新功能相对应，未发现错误引入 ECharts 或 TradingView provider 的情况。
   - 不只是放宽旧预算：仅重标定 `financial-engine` 一项，另外在 `consumer-test.mjs` 加入独立 **60 KiB raw / 18 KiB gzip** 硬限制，即使设置 `LUC_UPDATE_BASELINE=1` 也不能绕开。
   - 新功能有实际体积成本；后续需求必须考虑按需拆分，不能持续增长。
2. **Public Component Catalog 陈旧**：重新生成 `docs/component-catalog.json` 与 `docs/COMPONENT_CATALOG.md`；`catalog:check` 已通过。
3. **Showcase 金融图表 3 句英文未译**：补入 `apps/showcase/lib/i18n/prose.zh.ts`，双语校验恢复完整通过。

## 视觉、设备与性能边界

- Chromium 已验证桌面（1440 × 1000）和手机（390 × 844）图表可见、Canvas 容器尺寸、无页面横向溢出、成交量/Sharpe Pane 开关、对数/线性刻度、主题开关、Tooltip 与页面错误。
- 旧版 Crosshair 浏览器 QA 通过触屏与捏合缩放仿真；**没有实机 iPhone/Android 手势验收**。
- 数据准备压力测试：10k OHLC 约 4.37ms；100k close-only 约 10.77ms（本机当前一次运行样本）。**这不是 60 FPS、INP 或实际 GPU 渲染承诺**。
- 组件库范围内的 TradingView Lightweight Charts 官方 Plugin 高层封装、持久化绘图与多种专业金融画笔仍是 `MISSING/PARTIAL`；详见 `FINANCIAL_CHARTS_CAPABILITY_MATRIX.md`，不要宣称“官方全功能已封装”。

## 下一步

- **用户产品验收**：打开本地 Showcase 的 `/charts/financial` 与 `/charts/architecture`，检查实际美观程度、操作手感、桌面/手机布局、Light/Dark/Catppuccin 及多 Pane 交互。此步骤不等于上述自动化检查。
- **发布阶段**：经用户确认后，清理临时研究文件，审查 Git diff 和版本策略，执行 `pnpm --filter @luc/ui release:build`、正式 release artifact 比对、提交与发布流程。**在用户授权之前不执行这一步。**

本轮工作区保持未提交、未推送、未部署。
