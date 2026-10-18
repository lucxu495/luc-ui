# Luc UI — Cloudflare Workers 1102 / 503 Reliability Hotfix

- 日期：2026-10-18
- 基线：`origin/main` @ `bc7cd49`
- 分支：`fix/cloudflare-worker-reliability`
- 生产域名：`https://ui.lucxu.com`
- Worker：`luc-ui-showcase`
- 本轮未部署生产、未修改 `v1.0.1` tag、未升级 package version、未改公共组件 API。

---

## A. Incident Verification

### 仍可复现

在 2026-10-18 约 13:11 UTC，以 12 次有间隔的顺序 GET 请求检查当前公网，覆盖 `/`、`/zh`、`/date-time/date-picker`、`/components/command`、`/components/ai`、`/application/navigation`、Charts、TradingView 与 cookie 变体：

- 10 次返回 200。
- 2 次返回 503，响应体为 `error code: 1102`：
  - `/zh`，5.038s，`cf-ray: a4c7ca768f761997-FRA`
  - `/application/navigation?probe=nocookie`，4.716s，`cf-ray: a4c7cb0b7cd9155c-FRA`
- 成功页面同样没有边缘 HTML 缓存：`Cache-Control: private, no-cache, no-store, max-age=0, must-revalidate`。
- 成功率较高的请求也常见 3–5.8s wall time。

更早的审计采样还记录了同一错误的截图与可靠性 JSON：

- [503 页面](evidence-cloudflare/incident-503.png)
- [历史公网可靠性采样](evidence-cloudflare/incident-public-reliability.json)
- [本次 12 请求采样摘要](evidence-cloudflare/incident-live-sample.json)

### 结论

故障不是“已自行恢复”，也不是单一路由的偶发网络错误。它在有限顺序采样、不同 locale 与不同重页面上均可出现。

---

## B. Root Cause

### 已确认事实

1. **Cloudflare Free Plan 的 CPU 上限是 10ms。** Cloudflare 官方限制表：Free Plan `CPU time per HTTP request = 10 ms`；错误 1102 定义为 Worker 超过 CPU time limit。
2. **现有公开路由全部是动态 SSR。** 修改前 `next build` 输出 359 个 `ƒ (Dynamic)` 页面；根 layout 调用 `headers()` / `cookies()` 解析 locale，因此没有可复用的静态页面缓存。
3. **本地 workerd CPU profile 显示动态渲染远超 10ms。** 单次采样：

   | 路由 | sampled non-idle CPU |
   | --- | ---: |
   | `/docs` | 31.54ms |
   | `/components/buttons` | 28.17ms |
   | `/components/command` | 28.25ms |
   | `/components/ai` | 27.15ms |
   | `/application/navigation` | 34.51ms |
   | `/charts/financial` | 33.66ms |
   | `/date-time/date-picker` | 75.97ms |
   | `/` | 26.62ms |

   profile 原始数据：[before/docs](evidence-cloudflare/cpu-before-docs.json)、[before/date-picker](evidence-cloudflare/cpu-before-date-picker.json)。
4. **最重页面把问题放大。** `/date-time/date-picker` 生产 HTML 约 665KB；服务端每次展开两套完整 props API 表。它不是唯一有问题的页面，但最先触发 CPU 上限。
5. **路由没有静态增量缓存。** 原 `open-next.config.ts` 使用默认 dummy cache；构建后没有可供 Worker 读取的预渲染页面。
6. **客户端 prefetch 会请求 RSC。** 页面上的 Next Link 会并发请求 `/route?_rsc=...`；这些请求同样进入动态 SSR。生产并发 1102 与这一放大路径一致。

### 根因判断

**主根因是：所有公开文档页面在每个请求（包括 RSC prefetch）都执行完整 Next.js Server Components 渲染；Free Plan 每请求只有 10ms CPU，普通页面已经约 27–35ms，重页面约 76ms，因此 Worker 被 Cloudflare 终止并返回 1102。**

这不是单一 registry 函数或单个 API 表的局部 bug。API payload 是重页面的放大器，真正的架构问题是“可静态的文档被逐请求 SSR”。

### 推断，但尚缺生产 CPU 证据

- 侧栏预取会同时触发多条 RSC 渲染，可能是公网并发时 1102 更集中的原因。
- Worker isolate 冷启动、JS 解析与大型 server bundle 可能进一步抬高首次请求 CPU。

这些推断与本地观测一致，但没有 Workers Metrics 的逐请求 CPU 数据，因此不写成已证实的生产数值。

---

## C. Production Metrics

### 当前不可用

本环境没有 Cloudflare 账号登录：

```text
wrangler whoami -> You are not authenticated.
```

因此没有读取生产 Workers Metrics、Workers Logs、真实 CPU time、错误率、invocation outcome 或 cache hit/miss；报告中没有伪造这些数值。

### 最小数据请求清单

请在 Cloudflare Dashboard 提供以下只读信息，不需要 API token 或账号密钥：

1. **Workers & Pages → luc-ui-showcase → Metrics**
   - Requests
   - Errors
   - Invocation Status：`exceededCpu`
   - 1102 数量与发生时间
2. **Workers & Pages → luc-ui-showcase → Logs / Observability**
   - 失败请求的 pathname
   - `cpuTimeMs`
   - `wallTimeMs`
   - invocation outcome
3. **Account Plan**
   - 当前是否确实是 Workers Free
4. 如果存在：修复前后同一时间窗口的 p50 / p95 CPU 与 error rate 截图。

推荐的 Dashboard 路径：

```text
Workers & Pages
  → luc-ui-showcase
  → Metrics
  → Invocation Statuses
  → Exceeded CPU Time Limits
```

---

## D. Changes

### 1. 公开页面在构建期预渲染两次

- `apps/showcase/lib/i18n/server.ts`
  - 增加 `LUC_STATIC_LOCALE` 构建期 locale。静态构建不读取请求 headers/cookies，因此页面可以在 build time 生成。
  - 运行时没有该环境变量时，仍保留 URL / cookie / Accept-Language 的原始解析。
- `apps/showcase/components/shell/language-control.tsx`
  - 将 `useSearchParams()` 包在 Suspense 中，移除静态预渲染的 CSR bailout。
- `apps/showcase/next.config.ts`
  - 增加 `generateBuildId`，让中英文构建共享固定 build id。
- `apps/showcase/scripts/cloudflare-build.mjs`
  - 依次构建 English 与 zh-CN。
  - 合并两份静态 cache。
  - 将 cache 中的 HTML/RSC 提取为可直接读取的静态资产。
  - 将中文 cache 放到 `zh/` 命名空间，避免英文缓存被 `/zh` 命中。

### 2. Worker 命中静态页面时绕过 React SSR

- `apps/showcase/custom-worker.ts`
  - 对静态页面直接读取 Workers Static Assets 中的 HTML/RSC。
  - 根据原始 URL 的 `/zh` 前缀选择中文资产。
  - 保留中文 cookie redirect：无前缀且 cookie 为 `zh-CN` 时 307 到 `/zh/**`。
  - 处理 `/_next/image` 的本地品牌图片，避免 locale 前缀重定向循环。
  - 处理 `/explore/browse` 旧别名重定向。
- `apps/showcase/lib/cloudflare/request-scope.ts`
  - 用请求唯一的 `cf.lucRequestId` 记录原始 pathname，供 fallback cache 区分语言；没有使用进程级 mutable “current locale”。
- `apps/showcase/lib/cloudflare/locale-aware-static-cache.ts`
  - 只读静态 cache；`/zh/**` 使用 `zh/` key 前缀。
- `apps/showcase/open-next.config.ts`
  - 启用 read-only static assets incremental cache 与 cache interception。
- `apps/showcase/wrangler.jsonc`
  - `main` 指向自定义 Worker。

### 3. 清除最后一个动态页面

- `apps/showcase/app/blocks/page.tsx`
- `apps/showcase/components/blocks/blocks-gallery.tsx`

Block 的分类筛选从 server `searchParams` 改为客户端读取 query；Block 内容仍由 server 渲染，页面本身变为静态。构建输出现在显示 `/blocks` 为 `○ (Static)`。

### 4. 诊断与回归

- `scripts/reliability/cpu-profile.mjs`：本地 workerd inspector CPU self-time profile。
- `apps/showcase/qa/cloudflare-reliability.mjs`：实际 staging/本地 Worker 的 50 次顺序 + 8 路并发、RSC、cookie redirect、hydration 和中英文导航检查。
- `apps/showcase/package.json`：新增 `qa:cloudflare`，`cf:build` 改为双语构建脚本。

### 兼容性影响

- 公共 `@luc/ui` API、package version、安装方式未改变。
- 文档 HTML/RSC 的 URL 与语言语义不变。
- 页面 HTML/RSC 响应改为 `Cache-Control: private, no-cache`；不使用跨语言 CDN HTML 缓存，避免 cookie/locale 污染。
- `/blocks` 查询参数仍在 URL 中保留，筛选变为客户端切换。
- 动态 fallback 仍保留给未知 query、404 与少量非预渲染路径。

---

## E. Verification

### 已通过

| 检查 | 结果 |
| --- | --- |
| `pnpm verify` | 通过；UI 997 tests、Showcase 182 tests、tooling 43 tests，i18n / charts / docs registry / package / consumers / types 全部通过 |
| `pnpm qa:product` | 通过；mobile-overflow 694 次扫描 0 个横向滚动页面，dead-controls、reduced-motion、target-size、brand、i18n live 均完成 |
| `pnpm test:consumers` | Vite pass、Next pass |
| `pnpm --filter @luc/showcase typecheck` | 通过 |
| `pnpm --filter @luc/showcase lint` | 通过 |
| `pnpm --filter @luc/showcase cf:build` | 通过；716 cache files、716 static cache assets、1432 raw page assets |
| `pnpm --filter @luc/showcase cf:check` | 通过；2494 asset files，Worker upload 37,138.54 KiB / gzip 7,278.90 KiB |
| 本地 Wrangler Workers runtime | 通过 |
| 50 次顺序 + 8 路并发 HTML | 58/58 HTTP 200，0 failures |
| RSC 中英文 | `text/x-component`，`X-Luc-Static: rsc`，语言正确 |
| cookie redirect | `luc-ui-locale=zh-CN` 请求 `/docs` → 307 `/zh/docs` |
| Redirect aliases | `/components/button`、`/zh/components/button`、`/explore/browse`、`/zh/explore/browse` 均返回正确 308 目标 |
| hydration / client navigation | 英文与中文均 hydration，导航 H1 正确，无 console/4xx 错误 |
| `/blocks` filter | `/blocks?category=marketing` 生效，`aria-current="page"` 正确 |

回归证据：[cloudflare-regression.json](evidence-cloudflare/cloudflare-regression.json)。

### 未完成

- `pnpm qa:full` 已启动，但本地 Docker rebuild 长时间无进展；在磁盘降到约 2.7GB 后中止，避免继续消耗环境。未将该环境问题写成产品通过。
- 没有真实 Cloudflare staging / production 的 50+8 结果，因为本环境没有 Wrangler 登录或部署权限。

---

## F. Performance

### 动态 SSR（修复前）

本地 workerd profile 的 sampled non-idle CPU：26.62–75.97ms；生产典型成功请求 wall time 3–5.8s，且存在 503/1102。

### 静态 Worker（修复后）

同一本地 workerd inspector 连续 5 次 profile 的中位数：

| 路由 | CPU self median | 最大样本 | wall median |
| --- | ---: | ---: | ---: |
| `/docs` | 4.05ms | 13.33ms* | 9.72ms |
| `/zh/docs` | 3.04ms | 6.05ms | 6.77ms |
| `/date-time/date-picker` | 0.60ms | 16.32ms* | 20.69ms |
| `/components/command` | 2.86ms | 5.67ms | 9.21ms |
| `/components/ai` | 3.35ms | 4.79ms | 9.64ms |
| `/application/navigation` | 2.90ms | 8.52ms | 16.82ms |
| `/blocks` | 3.25ms | 16.91ms* | 8.69ms |

`*` 是 profiler 采样尖峰；同一批请求的 workerd access log 多为 2–5ms wall，静态响应不再执行 React SSR。CPU profile 是相对诊断工具，不等同于 Cloudflare 生产 CPU accounting。

完整摘要：[cpu-comparison.json](evidence-cloudflare/cpu-comparison.json)。

### 本地 50+8 结果

- 50 次顺序 HTML：0 failure。
- 8 路并发 HTML：0 failure。
- 所有 JSON 记录都包含 `X-Luc-Static: html`，没有 `error code: 1102`。

---

## G. Git

- 分支：`fix/cloudflare-worker-reliability`
- 基线：`origin/main` @ `bc7cd49`
- 修复提交：`f95a6f8`（`fix(showcase): prerender public pages for Workers reliability`）
- 远端分支：已推送到 `origin/fix/cloudflare-worker-reliability`
- 本轮未合并 `main`。
- PR：当前环境 `gh` 未登录，未能自动创建；可直接打开
  <https://github.com/lucxu495/luc-ui/pull/new/fix/cloudflare-worker-reliability>

---

## H. Deployment

- 未部署 staging。
- 未触碰生产 `ui.lucxu.com`。
- 未执行 `wrangler deploy`、`cf:deploy` 或修改 Cloudflare 套餐。
- 本地验证使用真实 workerd/Wrangler 预览环境，但不是 Cloudflare 线上资源限制的等价证明。

---

## I. Remaining Actions

### 已解决

- 公开文档主路径不再逐请求执行 React SSR。
- `/zh` 与英文静态缓存分离。
- cookie redirect、HTML/RSC、hydration 与 Block filter 本地 Workers 验证通过。
- 重页面 `date-picker`、`command`、`ai`、`navigation`、Charts、TradingView 均命中静态资产。

### 需要 Cloudflare 数据或权限

1. 在独立 staging Worker（不同 name / URL）部署此分支。
2. 在真实 Workers 环境执行 50 次顺序 + 8 路并发，记录 `cpu_time_ms`、wall time、1102、cache hit。
3. 从 Workers Metrics 读取修复前 / 修复后 `exceededCpu` 与 p95。
4. 若 staging 仍出现 1102，不得合并或发布；需继续拆分/缓存动态 fallback。
5. 创建 PR、等待四项 CI，并保留 staging 结果后，再由用户批准生产发布。

### 观察项

- 未命中静态资产的自定义 query、未知路径和 404 仍走 Next fallback；它们不是本轮核心页面。
- `/blocks` 的客户端 query 筛选需要在真实浏览器中检查历史链接与后退行为。
- 若未来增加需要逐请求个性化的页面，应单独设计缓存键，不能复用当前公开静态路径。
