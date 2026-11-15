/** Published upstream @tradingview/lwc-plugin-* packages.
 * Source: official TradingView plugin-examples catalogue, verified 2026-11-15.
 * A listing is NOT an implemented Luc UI adapter.
 */
export const officialLightweightPlugins = [
  { id: "brushable-area-series", name: "Brushable Area", family: "custom-series" },
  { id: "dual-range-histogram-series", name: "Dual Range Histogram", family: "custom-series" },
  { id: "grouped-bars-series", name: "Grouped Bars", family: "custom-series" },
  { id: "heatmap-series", name: "Heatmap", family: "custom-series" },
  { id: "hlc-area-series", name: "HLC Area", family: "custom-series" },
  { id: "pretty-histogram-series", name: "Pretty Histogram", family: "custom-series" },
  { id: "lollipop-series", name: "Lollipop", family: "custom-series" },
  { id: "rounded-candles-series", name: "Rounded Candles", family: "custom-series" },
  { id: "scatter-series", name: "Scatter", family: "custom-series" },
  { id: "background-shade-series", name: "Background Shade", family: "custom-series" },
  { id: "stacked-area-series", name: "Stacked Area", family: "custom-series" },
  { id: "stacked-bars-series", name: "Stacked Bars", family: "custom-series" },
  { id: "box-whisker-series", name: "Box & Whisker", family: "custom-series" },
  { id: "accessibility", name: "Accessibility", family: "primitive" },
  { id: "anchored-text", name: "Anchored Text", family: "primitive" },
  { id: "image-watermark", name: "Image Watermark", family: "primitive" },
  { id: "session-highlighting", name: "Session Highlighting", family: "primitive" },
  { id: "vertical-line", name: "Vertical Line", family: "primitive" },
  { id: "user-price-lines", name: "User Price Lines", family: "primitive" },
] as const;

export type OfficialPluginId = (typeof officialLightweightPlugins)[number]["id"];
export const officialPluginPackage = (id: OfficialPluginId) => `@tradingview/lwc-plugin-${id}`;
