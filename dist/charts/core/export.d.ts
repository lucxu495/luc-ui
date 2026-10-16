//#region src/charts/core/export.d.ts
/**
 * Chart image export.
 *
 * Both engines can hand back a canvas, so export is one function with two
 * branches and no shared state. Data export (CSV) and shareable URL state are
 * deliberately out of scope — see docs/CHART_GUIDE.md.
 */
export interface ExportImageOptions {
  filename: string;
  /** Background painted behind transparent areas. Defaults to the card surface. */
  backgroundColor?: string;
  pixelRatio?: number;
}
/**
 * Export a chart instance to a PNG download.
 *
 * Accepts an ECharts instance (has `getDataURL`) or a Lightweight Charts chart
 * (has `takeScreenshot`). A target that is neither resolves quietly rather than
 * throwing inside a click handler.
 */
export declare function exportChartImage(target: unknown, options: ExportImageOptions): Promise<boolean>;
//#endregion
//# sourceMappingURL=export.d.ts.map