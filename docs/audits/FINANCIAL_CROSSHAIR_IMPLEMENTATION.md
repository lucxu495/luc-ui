# Luc UI Professional Financial Crosshair 实施报告

日期：2026-10-28

分支：`feat/financial-crosshair`

实现提交：`ac96ab3` (`feat(charts): add professional cartesian crosshair and axis labels`)

基线：`main` @ `3c30662f3d850a6790b54b91ad6c5c95dbc1bdbc`

ECharts：`6.1.0`

## 1. Executive Summary

本次实现完成并通过真实 Chromium 验收：

- 所有声明式笛卡尔图表默认启用原生 X/Y Crosshair。
- X 轴显示与垂直准星一致的日期/时间标签。
- 每个 Y 轴显示当前鼠标高度对应的数值标签。
- 双 Y 轴分别按自己的 scale、formatter 和单位换算，独立拖拽、独立双击复位。
- Tooltip 继续读取真实序列值；Y Axis Pointer 读取的是鼠标位置对应的轴坐标，两者职责分离。
- DataZoom、Pan、Brush、Toolbox、Legend、滚轮缩放、响应式与触摸手势均可继续工作。
- Light/Dark 使用 Luc UI theme tokens；非笛卡尔图表不受影响。
- 鼠标移动只更新 chart instance 和轻量 DOM 标签，不触发 React component render，也不重建 series。

最终浏览器 QA 在生产构建上通过，`consoleErrors` 为 `[]`。

## 2. Root Cause

针对性排查确认，原实现不是“某个 chart archetype 把 cross 覆盖回了 line”，而是公共配置本身只实现了单轴辅助线：

1. `tooltipShell()` 的 axis 模式明确设置 `tooltip.axisPointer.type: "line"`；item 模式甚至设为 `none`。
2. `axisFragment()` 只设置 `axisPointer.lineStyle` 和 label 样式，没有声明 `show`、`snap`、`triggerTooltip` 或 axis pointer formatter。
3. 因 Tooltip 只要求 X 轴 trigger，ECharts 只得到垂直 AxisPointer，缺少水平线。
4. ECharts 原生 cross 的 Tooltip 轴信息只可靠地产生第一个 Y 轴的标签；双 Y 轴不能靠单个原生 label 同时显示左右值。
5. 既有轴拖拽基础实现默认只看右侧轴，并将所有 Y 拖拽写入 `yAxisIndex: 0`，因此不具备双轴独立性。
6. Chart surface 没有明确 plot/axis/control cursor state；ZRender 的普通 hover 默认光标会落到 `default` 或交互目标的原生 cursor。
7. Brush 使用 toolbox，但 runtime 只注册了 `BrushComponent`，未注册 `ToolboxComponent`，实际浏览器会报模块错误。
8. 时间 AxisPointer formatter 在初始化阶段收到非有限值时会让 `Intl.DateTimeFormat` 抛 `RangeError`，进而阻断双轴 Tooltip formatter。

`tooltip.axisPointer.type = "cross"` 与单个 axis 的 `axisPointer.type = "cross"` 确实是不同层级语义。本实现没有给每个 X/Y 轴机械设置 `type: "cross"`，而是在 Tooltip 层统一声明 cross，再给各轴设置职责明确的 line、snap、trigger 与 formatter。

## 3. Existing ECharts Configuration Chain

已检查并修改的链路：

1. `ChartSpec.interaction` 公共类型。
2. `packages/ui/src/charts/adapters/echarts/cartesian.ts`。
3. `packages/ui/src/charts/adapters/echarts/option.ts`。
4. `tooltipShell()`。
5. `tooltip.axisPointer`。
6. `xAxis.axisPointer`。
7. `yAxis.axisPointer`。
8. 多 Y 轴生成与 `yAxisIndex` 映射。
9. Axis label / AxisPointer formatter。
10. `EChartSurface` renderer lifecycle。
11. ZRender Canvas cursor。
12. DataZoom、Pan、Brush、Toolbox。
13. Tooltip formatter 与 positioning。
14. Theme token mapping。
15. Showcase chart examples。

配置优先级结论：

- 原根因是公共 builder 缺失，不是 merge 覆盖。
- 新公共片断在 X/Y axis 组装后合并，保留 axis 自己的 formatter。
- `spec.extendOption` 仍具有最终 override 能力；需要特殊 Tooltip 或 AxisPointer 语义的调用方仍可显式覆盖。
- 非笛卡尔 item Tooltip 默认不生成可见 Cartesian pointer。

## 4. Final Architecture / Helper Design

新增单一内部 helper：

```ts
buildCartesianCrosshairOptions(theme, policy)
```

职责：

- 默认启用策略。
- Tooltip 原生 `type: "cross"`。
- `axis: "x"` 明确 Tooltip base axis。
- X snap、Y 连续跟随。
- line/crossStyle 主题与低干扰透明度。
- label 字体、背景、前景、padding、圆角。
- disabled 状态保留 Tooltip 数据模型但隐藏线和标签。
- Cartesian / non-Cartesian 的作用边界。

Axis 合并通过 `withAxisPointer()` 完成，X 保留时间 formatter，Y 保留各轴自己的百分比或货币 formatter。

**轻量 Y label overlay 的必要性**

ECharts 6 的 cross Tooltip 不能稳定地为同一 Grid 的多个 Y plate 分别提供 label。因此：

- 垂直线、水平线、X 标签继续由 ECharts 原生 AxisPointer 绘制。
- Y label 由一个 `pointer-events: none` 的 chart-instance DOM layer 绘制。
- 鼠标移动只改 `textContent` 和 `style.top`，不调用 React state，也不调用 `setOption()`。
- overlay 随 chart instance 创建，随 unmount 移除；没有 window/document 级 mousemove listener。
- Y 数值通过 ECharts `convertFromPixel({ yAxisIndex, gridIndex })` 得到，不自行猜测比例。

## 5. Public API Compatibility

只增加可选字段，不修改现有必填结构：

```ts
interface ChartCrosshairSpec {
  enabled?: boolean;
  snap?: boolean;
}

interface ChartInteractionSpec {
  crosshair?: boolean | ChartCrosshairSpec;
  axisDrag?: boolean;
}
```

默认值：

```ts
crosshair = { enabled: true, snap: true }
axisDrag = true
```

兼容性：

- 原 `ChartSpec`、`SeriesSpec`、`AxisSpec`、数据输入、formatter、Tooltip、legend、annotation 无需改写。
- `crosshair: false` 保留 Tooltip，只关闭可见 Crosshair。
- `axisDrag: false` 不增加只供拖拽使用的隐藏 DataZoom。
- TypeScript、public package build、Showcase consumer 均通过。

## 6. Chart Type Applicability

默认获得专业 Crosshair：

- Line
- Area
- Bar（适用于笛卡尔值/时间轴）
- Time Series
- Candlestick / OHLC adapter path
- Scatter / Bubble（item Tooltip 与 Cartesian pointer 并存）
- Multi-series Cartesian
- Multi-axis Finance
- Composed / mixed Cartesian

保持原语义：

- Pie / Donut
- Gauge
- Treemap
- Sunburst
- Sankey
- Graph / Network
- Radar / Polar
- Geospatial
- Matrix/heatmap 使用自身 cell 语义

非笛卡尔 item Tooltip 默认是 `axisPointer.type: "none"`，已通过 Pie 浏览器验收。

## 7. Cursor Behavior

状态机由 chart instance host 管理，不使用全局 pointer override：

| 状态 | Cursor / 行为 |
|---|---|
| Plot hover | `crosshair` |
| X-axis hover | `ew-resize` |
| Y-axis hover | `ns-resize` |
| X-axis dragging | `ew-resize` + pointer capture |
| Y-axis dragging | `ns-resize` + pointer capture |
| Plot pan | ZRender 原生 `grabbing` |
| Brush | 原生 Brush cursor / selection |
| Legend、Toolbox、DataZoom slider | 原生 control cursor |
| Touch | 不强制桌面 resize cursor |
| Pointer leave / capture lost | 隐藏标签并恢复非拖动状态 |

只对明确 plot 或 axis state 使用 CSS override；可操作控件仍由 ZRender 控制。

## 8. Crosshair X Label

- 使用 ECharts 原生 X AxisPointer label。
- formatter 复用 Luc UI `timeAxisFormatter()`，继续使用 UTC 语义。
- category 轴继续使用 category 文本。
- 时间轴精度由当前 visible span 决定，Zoom 后按当前窗口重新格式化。
- ECharts 负责边缘 confinement，标签不会越出 chart container。
- 默认 `snap: true`：X 准星吸附最近观测，与 Tooltip 日期一致。
- `snap: false`：X 准星连续跟随鼠标；Tooltip 仍通过 ECharts `snapToValue` 读取最近真实 row。
- formatter 对 `NaN` / `Infinity` 返回空字符串，不抛出日期 RangeError。

## 9. Crosshair Y Label

- Y 始终连续跟随鼠标像素，不吸附最近数据点。
- 每个 label 使用对应轴自己的 `convertFromPixel` 与 formatter。
- 支持负数、零、小数、百分比、货币、大数。
- 非有限值不会显示成 `NaN` / `Infinity` / `undefined`。
- 标签位于左右轴 gutter，使用 `--chart-crosshair-label-bg`、`--chart-crosshair-label-fg`。
- 小 padding、4px 圆角、无大面积阴影、tabular nums。
- Tooltip 自动选择鼠标对侧，减少对 axis label 的遮挡。

双轴截图证据中，Tooltip 的 BTC 实际值可与右轴 mouse-coordinate 值不同；这是正确行为。

## 10. Dual-axis Coordinate Correctness

BTC USD Price + Rolling 1Y Up-Day Ratio 验收：

- 左 Y：百分比，`percent / 1 decimal`。
- 右 Y：USD，`currency / USD / 0 decimals`。
- 同一水平线穿越同一 Y 像素。
- 左值由 `yAxisIndex: 0` 换算。
- 右值由 `yAxisIndex: 1` 换算。
- Series 和 `yAxisIndex` 映射未改变。
- DataZoom、Resize、手动 Y scale 后仍用最新坐标系统。
- Log scale 在原值空间与 log 空间中正确往返。
- Inverse 轴使用 ECharts 实际 pixel/data conversion；公共 `AxisSpec` 目前未暴露 `inverse` 配置。
- Multi-grid 按 pointer 所在 grid 解析，不污染其他 grid/chart instance。

浏览器实测（生产构建）：

```text
left drag:
  left  = 24.7120418848,75.2879581152
  right = auto

right drag:
  left  = 24.7120418848,75.2879581152
  right = 65331.7572207,91951.2427793

left double-click:
  left  = auto
  right = 65331.7572207,91951.2427793
```

## 11. Formatter Mapping

顺序保持：

1. `series.formatter`
2. `series.format`
3. axis `format`
4. chart fallback

Tooltip 仍按 series 所属 axis 的 format 显示真实数据；Y crosshair label 使用同一 axis formatter 格式坐标值。不会把 Tooltip 的比特币价格复制到百分比轴。

## 12. Snap Policy

默认：

- X：吸附最近有效观测。
- Y：连续跟随鼠标像素。
- Tooltip：显示 X 时刻的真实序列数据。

明确区分：

1. Crosshair X visual position。
2. Crosshair Y visual position。
3. Tooltip selected data point。
4. Series data value。

Showcase 的 “Snap X to observation” 开关实际修改 ChartSpec interaction，并由浏览器测试确认最终 `tooltip.axisPointer.snap` 从 `true` 切到 `false`。

## 13. Tooltip Behavior

保留：

- 时间 header。
- series name、color、真实 value、unit。
- 现有排序、total、formatter、缺失值语义。
- item / axis / none 模式。

新增定位：

- 鼠标在右边缘时，Tooltip 放到左侧。
- 上下边缘自动 clamp。
- Tooltip 不覆盖左右 Axis Label。
- 鼠标离开后原生 Tooltip 与 AxisPointer 隐藏。
- Crosshair disabled 时仍有 Tooltip，只是不画准星线和坐标标签。

## 14. Zoom / Pan / Brush

- X 轴拖动通过真实 `dataZoom` action 修改 visible window。
- X 轴双击发送 `start: 0, end: 100` 并同步 group range。
- Y 轴拖动只修改目标 `yAxis.min/max`。
- Y 轴双击恢复该轴原始 Auto Scale/domain descriptor。
- 原有 inside zoom、slider、wheel zoom、plot pan 均保留。
- DataZoom slider 命中时优先保留原生 `grab` cursor。
- Toolbox / Brush 命中不进入 axis drag。
- Brush rect 选择与 clear 已在浏览器中真实执行。
- Pointer capture 防止鼠标拖出 chart 后状态永久冻结。

缩放限制：

- Y 最小 span：原 span 的 2%。
- X 最小 window span：0.5%。
- X window clamp 到 `[0, 100]`。
- Log Y 在 log space 中缩放并保持正数边界。
- 不产生 `min >= max`、`NaN`、`Infinity`。

## 15. Theme Compatibility

- 线色：`theme.crosshair`。
- label 背景/前景：`crosshairLabelBg` / `crosshairLabelFg`。
- HTML Y label 读取同名 CSS tokens。
- 没有取代主题系统的硬编码 RGB。
- Light/Dark 均在 Showcase 与 Chromium QA 中切换并截图。
- theme 切换重新生成 ECharts option；DOM overlay 自动继承 CSS token。

## 16. Performance

实现约束：

- mousemove 不触发 React setState。
- mousemove 不执行完整 `setOption()`。
- 不重建 series 数据。
- 不监听全局 window/document mousemove。
- Y 标签只更新 chart instance 内的 DOM text/top。
- axis drag 仅在真实拖动期间更新目标 DataZoom/Y range。
- resize 后重新读取当前 grid/axis coordinate system。

真实 Chromium 10,000 点性能观察：

- Fixture：`/charts/performance`，ECharts 10,000 points。
- 80 次 Playwright mouse move。
- 总耗时：`1320.9 ms`。
- 平均每次：`16.51 ms`。
- Crosshair label 与 Tooltip 持续更新。
- Console error：0。

该数据包含 Playwright IPC，不是 FPS 声明，也不应被解读为浏览器纯渲染基准。

## 17. Test Commands and Results

通过：

```text
pnpm --filter @luc/ui test
101 test files passed
1007 tests passed

pnpm --filter @luc/ui lint
PASS

pnpm --filter @luc/ui typecheck
PASS

pnpm --filter @luc/showcase typecheck
PASS

pnpm --filter @luc/showcase lint
PASS

pnpm --filter @luc/showcase i18n:check
162/162 routes
170547/170547 prose sentences
PASS

pnpm --filter @luc/showcase build
360/360 static pages generated
PASS

pnpm --filter @luc/ui build
TypeScript + package build
PASS

pnpm --filter @luc/showcase qa:financial-crosshair
PASS
```

单元测试覆盖：

- 默认 Cartesian cross。
- 非笛卡尔 item 不启用 cross。
- X/Y pointer snap 分工。
- Axis label show。
- X 日期 formatter。
- Percent 与 USD formatter。
- Dual Y option 与独立 formatter。
- Disabled crosshair。
- AxisPointer precedence。
- DataZoom drag-only fallback。
- Left/right/multi-grid axis hit target。
- Linear / Log value range scaling。
- Toolbox component registration。

## 18. Browser QA Matrix

生产构建 Chromium QA：

| Scenario | Light | Dark |
|---|---|---|
| Single-axis line | PASS | PASS |
| Dual-axis finance | PASS | PASS |
| Multi-series | PASS | PASS |
| Mouse hover / move / leave | PASS | PASS |
| Tooltip | PASS | PASS |
| Zoom / Pan | PASS | PASS |
| DataZoom slider | PASS (native control check) | PASS |
| Brush | PASS | PASS |
| Axis X/Y drag | PASS | PASS |
| Double-click reset | PASS | PASS |
| Disabled Crosshair | PASS | PASS |
| Responsive 1440 / 390 | PASS | PASS |
| Non-Cartesian no-crosshair | PASS | 未单独截图；同一运行时逻辑由 Pie light QA 与 option test 覆盖 |
| Touch tap / pinch emulation | PASS（390px Chromium emulation） | 同一移动端 emulation |

其他 Chromium assertions：

- Dual Y labels 一个含 `%`，一个含 `$`。
- 左右 raw coordinate values 不相同且各自来自对应轴。
- Tooltip 中真实 Series values 与 Crosshair axis coordinate 分离。
- X 反向拖动扩大 visible window。
- DataZoom slider 保留原生 `grab`。
- plot pan 实测 `grabbing`。
- Brush rect 可激活、框选、清除。
- 拖拽中移出 chart 并释放后不残留拖动状态。
- Resize 后两 Y labels 仍存在。
- 390px 无页面横向 overflow。
- Axis label overlay `pointer-events: none`。
- Console errors：`[]`。

## 19. Screenshot Locations

真实截图目录：

`artifacts/qa/financial-crosshair/`

Before（独立 detached worktree，未修改 HEAD）：

- [before-single-hover.png](../../artifacts/qa/financial-crosshair/before-single-hover.png)
- [before-dual-hover.png](../../artifacts/qa/financial-crosshair/before-dual-hover.png)
- [before-single-hover.json](../../artifacts/qa/financial-crosshair/before-single-hover.json)
- [before-dual-hover.json](../../artifacts/qa/financial-crosshair/before-dual-hover.json)

After：

- [after-single-hover-dark.png](../../artifacts/qa/financial-crosshair/after-single-hover-dark.png)
- [after-single-hover-light.png](../../artifacts/qa/financial-crosshair/after-single-hover-light.png)
- [after-dual-hover-dark.png](../../artifacts/qa/financial-crosshair/after-dual-hover-dark.png)
- [after-dual-hover-light.png](../../artifacts/qa/financial-crosshair/after-dual-hover-light.png)
- [after-dual-left-drag-dark.png](../../artifacts/qa/financial-crosshair/after-dual-left-drag-dark.png)
- [after-zoom-crosshair-dark.png](../../artifacts/qa/financial-crosshair/after-zoom-crosshair-dark.png)
- [after-brush-dark.png](../../artifacts/qa/financial-crosshair/after-brush-dark.png)
- [after-brush-light.png](../../artifacts/qa/financial-crosshair/after-brush-light.png)
- [after-multi-hover-light.png](../../artifacts/qa/financial-crosshair/after-multi-hover-light.png)
- [after-mobile-view.png](../../artifacts/qa/financial-crosshair/after-mobile-view.png)
- [after-non-cartesian-light.png](../../artifacts/qa/financial-crosshair/after-non-cartesian-light.png)
- [after-disabled-crosshair-dark.png](../../artifacts/qa/financial-crosshair/after-disabled-crosshair-dark.png)
- [after-disabled-crosshair-light.png](../../artifacts/qa/financial-crosshair/after-disabled-crosshair-light.png)
- [after-10k-crosshair-dark.png](../../artifacts/qa/financial-crosshair/after-10k-crosshair-dark.png)

机器可读证据：

- [qa-report.json](../../artifacts/qa/financial-crosshair/qa-report.json)

浏览器截图本身不包含 OS 鼠标指针，因此测试 JSON 同时记录真实 pointer 坐标。最终生产 QA 中 dark single hover 为 `(795.72, 632.74)`，dark dual 为 `(795.72, 784.87)`。

## 20. Showcase Demo URL

```text
/charts/crosshair
```

本地开发：

```text
http://127.0.0.1:3300/charts/crosshair
```

包含：

- Demo A：单轴时间序列、价格、Crosshair、X/Y labels、Tooltip。
- Demo B：BTC USD Price + Rolling 1Y Up-Day Ratio，双轴、独立单位、独立拖拽。
- Demo C：多 Series、inside zoom、DataZoom slider、Pan、Brush、Axis drag。
- Demo D：Pie / Donut，证明非笛卡尔不受影响。
- Crosshair enabled / disabled。
- Snap on/off。
- Demo Data 明示。
- Light/Dark 使用 Showcase 全局主题控件。

## 21. Changed Files

Core：

- `packages/ui/src/charts/types.ts`
- `packages/ui/src/charts/adapters/echarts/option.ts`
- `packages/ui/src/charts/adapters/echarts/cartesian.ts`
- `packages/ui/src/charts/adapters/echarts/echart-surface.tsx`
- `packages/ui/src/charts/adapters/echarts/runtime.ts`
- `packages/ui/src/charts/components/chart.tsx`
- `packages/ui/src/charts/core/axis-drag.ts`
- `packages/ui/src/charts/core/formatters.ts`
- `packages/ui/src/styles/charts.css`

Tests：

- `packages/ui/src/charts/adapters/echarts/option.test.ts`
- `packages/ui/src/charts/adapters/echarts/runtime.test.ts`
- `packages/ui/src/charts/core/axis-drag.test.ts`
- `packages/ui/src/charts/core/formatters.test.ts`

Showcase：

- `apps/showcase/app/charts/crosshair/page.tsx`
- `apps/showcase/components/charts/financial-crosshair-demo.tsx`
- `apps/showcase/app/charts/interaction/page.tsx`
- `apps/showcase/qa/financial-crosshair.mjs`
- `apps/showcase/package.json`
- `apps/showcase/lib/i18n/prose.zh.ts`
- `apps/showcase/lib/i18n/routes.zh.ts`

本报告：

- `docs/audits/FINANCIAL_CROSSHAIR_IMPLEMENTATION.md`

## 22. Commit SHA / Branch

- Branch：`feat/financial-crosshair`
- Base：`3c30662f3d850a6790b54b91ad6c5c95dbc1bdbc`
- Implementation commit：`ac96ab3`
- 未修改 `main`
- 未 force push
- 未发布 Release
- 未部署 Cloudflare
- 未修改 Luc Web

本报告作为该实现提交后的独立文档提交保存；最终 HEAD SHA 在交付消息中给出。

## 23. Known Limitations

- 没有实体手机/平板；Touch 与 pinch 使用 Chromium mobile emulation，真实设备仍未验证。
- 非笛卡尔 Dark 没有单独截图；其行为由 Pie Light browser QA、runtime option test 与相同非 Cartesian 分支覆盖。
- 公共 `AxisSpec` 未暴露 ECharts `inverse`；若调用方通过 escape hatch 启用，runtime 使用 ECharts 的真实 pixel/data conversion，但没有独立 inverse UI 用例。
- Category Y 轴（horizontal bar 的分类轴）不做 Y 数值缩放；Category X 可继续使用 DataZoom。
- ECharts 原生 cross 不能同时生成多个 Y plate 的独立 label，因此声明式多 Y 轴使用轻量 chart-instance DOM overlay；这不是第二套 Canvas renderer。
- 手工构建 option 的特殊 Cartesian family 会获得统一 cross Tooltip 与轴拖拽，但如果它自行保留原生 Y label，renderer 不会额外叠加第二套 Y DOM label。
- 同侧多个 Y 轴若调用方让轴视觉位置完全重叠，Luc UI 不自动分配额外 gutter。

## 24. Luc Web Adoption Guidance

本任务没有修改 Luc Web，也没有移动既有 `v1.0.1` tag。

后续获取行为需要独立流程：

1. Review 并合并本 feature branch 到 Luc UI `main`（需后续授权）。
2. 发布新的不可变 Git tag（需后续授权）。
3. Luc Web 在单独任务中把 `github:lucxu495/luc-ui#v1.0.1` 升级到新 tag。
4. 在 Luc Web 的真实双轴金融页面重新执行 Crosshair 与 axis-drag QA。

行为边界：

- Luc UI 中通过 ECharts `ChartSpec` / Cartesian adapter 绘制的图表会获得本实现。
- Luc UI 中通过 TradingView Lightweight Charts 绘制的金融图继续使用其自身原生 Crosshair、pan、zoom 与 price scale；升级 ECharts adapter 不会自动改变它们。
- Luc Web 中直接使用 Lightweight Charts 的图表仍使用自身原生行为，需要单独产品决策与适配。
- 本报告没有声称 Luc Web 的所有金融图已经修改。

## Acceptance Gate

| Requirement | Result |
|---|---|
| Hover crosshair cursor | PASS |
| Vertical line | PASS |
| Horizontal line | PASS |
| Realtime X date/time label | PASS |
| Realtime Y value label | PASS |
| Dual Y units and coordinate mapping | PASS |
| Labels follow pointer | PASS |
| Tooltip compatible | PASS |
| Zoom / Pan / DataZoom slider | PASS |
| Brush | PASS |
| Mouse leave hides | PASS |
| Light / Dark | PASS |
| Mobile touch / pinch emulation | PASS，实体设备未测 |
| Non-Cartesian unaffected | PASS |
| Existing Chart API compatible | PASS |
| Showcase interactive | PASS |
| Browser QA | PASS |
| Before/After screenshots | PASS |
| Git commit | PASS |
| Report | PASS |
