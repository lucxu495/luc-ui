//#region src/charts/adapters/echarts/echart-init.ts
/**
* The engine configuration every LUC chart is created and rendered with.
*
* Two objects, because ECharts splits the decision in two and the split is not
* obvious: `init` takes drawing flags, `setOption` takes everything else — and
* `useUTC` is an *option*, despite reading like an engine setting. It was tried
* at `init` first and did nothing; `axisHelper.ts` reads it from
* `ecModel.get("useUTC")`.
*
* One definition each, because there is one behaviour: the interactive surface,
* the server-rendered path and the axis tests have to be the *same* engine
* configuration, or a test stops describing the product.
*/
/**
* Options that belong to the *option*, applied to every chart we render.
*
* `useUTC: true` is the load-bearing one. Every date in LUC is formatted in UTC
* — `formatChartValue` defaults to it, and so do the axis labels
* (`TIME_AXIS_LABEL_OPTIONS`), because a chart's data has a timezone and the
* reader's laptop does not. ECharts, left alone, aligns time-axis ticks to
* **local** calendar boundaries while we print those instants in UTC. East of
* UTC that puts the February tick at 16:00 on the 31st of January, which the
* formatter prints as "Jan": measured on this machine (Asia/Singapore), a
* 119-day daily series read
*
*   Jan | Jan | Feb | Mar | Apr | May
*
* where it should read `Jan | Feb | Mar | Apr | May`, and a two-year window
* repeated the year at the same offset. It is the Phase 7 symptom — a date axis
* that lost its dates — from a different cause, and it is invisible on a machine
* set to UTC, which is why it survived. Setting the option makes the ticks the
* engine chooses and the labels we print agree.
*/
const ECHARTS_GLOBAL_OPTION = { useUTC: true };
/**
* Options that belong to `init`.
*
* `useDirtyRect: false` is deliberately off, for the reason recorded at the call
* site: see `echart-surface.tsx`.
*/
const ECHARTS_INIT_OPTIONS = { useDirtyRect: false };
//#endregion
export { ECHARTS_GLOBAL_OPTION, ECHARTS_INIT_OPTIONS };

//# sourceMappingURL=echart-init.js.map