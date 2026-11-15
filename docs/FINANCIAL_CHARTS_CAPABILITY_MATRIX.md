# Financial & Quant Charts Capability Matrix

Status date: 2026-11-14

This document is the implementation ledger for Luc UI's financial chart lane. It
is deliberately stricter than a feature brochure: a capability is only
`WRAPPED`, `PARTIAL`, or `NATIVE_SUPPORTED` when the repository contains the
typed React path or access surface named below. A raw engine API being reachable
through `onReady` does not mean Luc UI has productised that capability.

## Status vocabulary

| Status | Meaning |
| --- | --- |
| `NATIVE_SUPPORTED` | Lightweight Charts v5.3 supplies the interaction or rendering primitive and LUC intentionally preserves it. |
| `WRAPPED` | Luc UI owns a typed React component/controller path over the engine capability. |
| `PARTIAL` | A useful path exists, but coverage, product semantics, persistence, or acceptance work remains. |
| `MISSING` | The intended LUC capability has not been implemented. Upstream examples may exist. |
| `NOT_IN_LIBRARY` | The capability is not a charting-engine responsibility and must not be promised by Luc UI charts. |

## Eight product scopes

| Scope | Current status | Delivered path | Remaining work / honest boundary |
| --- | --- | --- | --- |
| 1. Lightweight Charts v5.3 native API coverage | `PARTIAL` | `LightweightSurface`, typed `createLightweightController`, `onReady`, exported v5.3 engine types | Native handles expose the full engine API, but not every method has a stable high-level React prop/controller method. Do not call the typed wrapper "complete API coverage" until a generated/contract-tested method map exists. |
| 2. Official plugins | `MISSING` | No official plugin package is installed or wrapped | Review publication/licence status per plugin, then add opt-in adapters. `createSeriesMarkers`, text/image watermarks and up/down markers are v5 built-ins reachable through the escape hatch, not product-owned components. |
| 3. Official plugin examples productisation | `MISSING` | None | Trendline, rectangle, volume profile, heatmap, price bands and price alert remain upstream examples/plans, not Luc UI claims. |
| 4. Financial analysis | `PARTIAL` | Candles, OHLC tooltips, volume, multi-pane price/indicator charts; ECharts families cover depth, positions, returns and several risk views | Trade signals, provider sessions, macro ingestion and a cohesive market-analysis workflow are not complete. |
| 5. Quant research | `PARTIAL` | Close-only multi-series, prepared Sharpe/rolling panes, drawdown and rolling-metric chart families | Luc UI does not calculate Sharpe, factors, portfolio weights or backtests. A caller/research service prepares values and semantics. |
| 6. Drawing, tooltip, legend, sync, layout, export | `PARTIAL` | Native crosshair; frame-coalesced tooltip; legend/visibility controls; sync bus; fullscreen shell; image export wrapper | Persistent drawings, drawing toolbar, saved layout documents and plugin-state serialization are missing. |
| 7. Typed React API, theme, docs, Showcase | `WRAPPED` | `FinancialChart` discriminated candles/series API, typed overlays/indicators/controller, semantic Light/Dark tokens, explicit Catppuccin Mocha preset, `/charts/financial`, `/charts/architecture` | Public API inventory/docs regeneration and cross-consumer compatibility still need their normal release gates. |
| 8. Interaction smoothness | `PARTIAL` | Native pan/zoom/crosshair; stable subscriptions; latest-frame tooltip batching; unchanged history skips `setData`; viewport-preserving builds; keyboard fallback | Browser FPS/INP budgets and 100k-point acceptance must remain measured on target hardware. Passing unit-level coalescing tests is not a 60 FPS guarantee. |

## Native and wrapped financial surface

| Capability | Status | Luc UI path | Required acceptance |
| --- | --- | --- | --- |
| Candlestick, line, area, histogram, baseline, bar series | `NATIVE_SUPPORTED` / `WRAPPED` | OHLC or close-only `FinancialChart`; all six definitions through `LightweightSurface` or `onReady` | Valid v5 data, whitespace, pane index, theme, price format |
| Multiple panes with a shared native time scale | `WRAPPED` | Prepared `indicators`, logical `paneIndex`, volume visibility | Continuous pane packing when volume/indicator toggles; no empty strip |
| Native crosshair, wheel zoom, drag/pan, pinch and axis drag | `NATIVE_SUPPORTED` | No React override on pointer movement; `LightweightSurface` gesture settings | Hover, wheel, drag, touch, time-axis sync; viewport does not jump |
| Crosshair inspection tooltip | `WRAPPED` | Stable latest-state subscription plus one RAF-coalesced DOM write | OHLC, close series, volume, overlays and indicator values; no XSS from colours/labels |
| Time and price scales, linear/log mapping | `WRAPPED` | `priceScale`, scale selector in Showcase | Log only where all values are log-eligible; viewport survives theme/data changes |
| Reference price lines | `WRAPPED` | `IndicatorReferenceLines` lifecycle | Create once when stable; update theme; remove only stale levels |
| Last-price line and label | `WRAPPED` | `showPriceLine` | Toggle applies in place without fitting or blanking the plot |
| Image export | `PARTIAL` | `exportChartImage` accepts the chart's `takeScreenshot()` | PNG is non-empty; errors are recoverable |
| Keyboard pan/zoom/reset | `WRAPPED` | Focused `LightweightSurface` | Arrow/Shift+Arrow, `+`/`-`, Home and Escape do not steal text-editor keys |
| TradingView attribution | `NATIVE_SUPPORTED` | `layout.attributionLogo: true` and library link | Link remains visible in every financial chart state that creates an engine |

## Official plugin and example tracking

The installed `lightweight-charts@5.3.0` README points to the official plugin
catalog and plugin examples, and confirms that custom plugins are built on
primitives. Network access was unavailable in this workspace on 2026-11-14, so
current release dates/package names for each external plugin could not be
verified online. That uncertainty is recorded rather than hidden.

| Upstream feature | Current status | Release/publication review | Planned LUC component | Acceptance case |
| --- | --- | --- | --- | --- |
| Series markers | `PARTIAL` | Built into v5.3; not wrapped | `FinancialMarkersAdapter` | Append/remove markers, pane association, tooltip hit area |
| Text/image watermark | `PARTIAL` | Built into v5.3; not wrapped | `FinancialWatermarkAdapter` | Theme swap, resize, disposal |
| Up/down markers | `PARTIAL` | Built into v5.3; not wrapped | `FinancialMovementMarkersAdapter` | Price update and direction changes |
| Trendline | `MISSING` | Upstream plugin example; package release unverified | `TrendlineTool` | Drag endpoints, keyboard edit, serialize/restore |
| Rectangle | `MISSING` | Upstream plugin example; package release unverified | `RectangleTool` | Drag/resize, clipping, serialize/restore |
| Volume profile | `MISSING` | Upstream plugin example; package release unverified | `VolumeProfileStudy` | Visible-range recompute, pane ownership, empty data |
| Heatmap | `MISSING` | Upstream plugin example; package release unverified | `FinancialHeatmapPrimitive` | z-order, hit testing, legend/scale |
| Price bands | `MISSING` | Upstream plugin example; package release unverified | `PriceBandsOverlay` | Upper/lower ordering, autoscale, theme |
| Price alert | `MISSING` | Upstream plugin example; package release unverified | `PriceAlertLine` | Create/edit/remove lifecycle, persistence, accessible controls |

Plugin work must be opt-in and tree-shakable. A single `plugins` prop on
`FinancialChart` should accept a versioned adapter contract rather than importing
every official example into the base bundle.

## Financial and quant domains

| Domain | Status | Current component/path | Boundary |
| --- | --- | --- | --- |
| OHLC and volume | `WRAPPED` | `FinancialChart` | Validation and rendering only |
| Depth and term structure | `WRAPPED` | `DepthChart`, `TermStructureChart` on ECharts | Prepared rows only |
| Trade signals and order flow | `MISSING` | Marker primitives only through escape hatch | No execution/order service in Luc UI |
| Positions and PnL | `PARTIAL` | `HistoricalPositionChart`, `PnlAttributionChart` | Prepared snapshots; no ledger |
| Returns and drawdown | `PARTIAL` | `DrawdownChart`, financial chart families | No portfolio accounting |
| Risk / rolling metrics | `PARTIAL` | Prepared Sharpe, volatility, drawdown and rolling panes | No statistical calculation |
| Correlation / factors | `PARTIAL` | ECharts correlation and factor chart families | Prepared matrices/exposures |
| Portfolio / backtest | `MISSING` / `NOT_IN_LIBRARY` | None | Portfolio construction, execution and backtest engines remain external |
| Macro | `PARTIAL` | General time-series charts | No macro feed, revision handling or point-in-time store |

## Explicit non-library responsibilities

The following are `NOT_IN_LIBRARY` and must not be presented as missing chart
widgets or silently implemented in a UI component:

- Pine Script parsing/execution or TradingView script compatibility.
- Market-data acquisition, exchange sessions, corporate actions or real-time feeds.
- Indicator mathematics, risk-model validation and portfolio accounting.
- Backtesting, fills, transaction costs, slippage or strategy evaluation.
- Investment advice, signal validation or provider endorsement.

## Validation plan and evidence

The focused local suite for this iteration covers:

| Case | Verification |
| --- | --- |
| `FC-HARDEN-01` | Native crosshair subscription uses latest props and disposes the exact handler |
| `FC-HARDEN-02` | Tooltip DOM writes are coalesced to the latest pointer event per frame |
| `FC-HARDEN-03` | Same prepared array reference skips `setData`; changed reference writes once |
| `FC-HARDEN-04` | Price-line, whitespace, OHLC, range and pane-index tests remain green |
| `FC-UI-01` | Volume/indicator/overlay/price-line controls leave a nonblank chart |
| `FC-UI-02` | Close-only log/linear and two-pane Sharpe view remain time-synchronized |
| `FC-UI-03` | Light/Dark inherit tokens; Catppuccin Mocha is explicit only |
| `FC-A11Y-01` | Attribution remains visible; chart label/description/focus/keyboard controls work |
| `FC-RESP-01` | Desktop and phone widths have no horizontal overflow or zero-height plot |
| `FC-PERF-01` | 10k-row preparation benchmark and unchanged-history render path are measured |
| `FC-PERF-02` | 100k-row pressure benchmark remains isolated and reports timing; it is not an FPS claim |

### 2026-11-14 local result

- Focused Vitest: 39 financial/runtime/controller/data/pane/range tests passed.
- Showcase component Vitest: 2 `ChartPanel` tests passed for actionable empty
  state and fullscreen control propagation.
- Data preparation across four focused local runs: 10k OHLC **2.45–6.16 ms**;
  isolated 100k close-only **14.51–30.98 ms**. These are preparation timings,
  not paint/FPS measurements.
- Tooltip coalescing test: 10,000 queued pointer events produced **one** latest
  frame payload before the frame callback.
- Unchanged-history controller test: a repeated theme/option update now performs
  **zero** additional `setData()` calls after the initial write (the prior
  implementation wrote the same data again).
- Range presets now change a controlled viewport while keeping the 900-row
  fixture references mounted; the old Showcase sliced candles, volume and
  overlays and therefore replaced every series on each preset.
- The Chromium smoke test was authored at
  `apps/showcase/tests/financial.smoke.spec.mjs`, but could not execute in this
  environment: Chromium aborted before page navigation on macOS MachPort
  rendezvous permission (`Permission denied (1100)`), and the sandbox also
  denied local HTTP listening. **Browser smoke, FPS/INP, desktop/mobile geometry
  and visual review remain unverified and must be run by the outer operator.**

## Completion policy

This scope is not COMPLETE. It is an interaction and UI hardening milestone.
Complete means every scope in the eight-row matrix has a typed path, documented
limitations, Showcase coverage, and a corresponding acceptance test on supported
hardware. "Most capabilities are available through the raw engine" does not meet
that bar.

### 2026-11-15 技术验收追加

已完成有针对性的组件/Showcase/Chromium 浏览器验收，并发现、修复金融入口 bundle 基线及硬上限、组件目录过期与 3 条缺失中文翻译。实际验证记录见 [FINANCIAL_CHARTS_ACCEPTANCE_2026-11-15.md](FINANCIAL_CHARTS_ACCEPTANCE_2026-11-15.md)。**已实现的功能已进入用户视觉验收阶段，但完整官方 Plugin 封装范围仍是 PARTIAL/MISSING，发布产物仍未就绪。**

### 2026-11-15 导航与示例交付

Charts Sidebar 现在分为原有 Financial & quantitative（保留 ECharts / Quant 图表）与独立 Lightweight Charts（原生 TradingView 图表）。后者提供独立 Gallery、六个可运行的示例页面及 19 个官方插件的逐项状态清单；未集成的插件只出现在 roadmap，不能冒充 Live。交付契约及完整实施阶段记录在 [LIGHTWEIGHT_CHARTS_DELIVERY_PLAN_2026-11-15.md](LIGHTWEIGHT_CHARTS_DELIVERY_PLAN_2026-11-15.md)。这不表示高层 API parity 或全部插件已经完成。
