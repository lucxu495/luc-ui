/**
 * `@luc/ui/tradingview` — TradingView widget integrations.
 *
 * Provider-hosted market data as LUC-shaped React components. The wrappers are
 * deliberately absent from the root barrel's critical path: importing
 * `@luc/ui/components/button` must never pull this module, and this module must
 * never load a TradingView script until a wrapper actually renders.
 *
 * Use these widgets when the provider's own market data and standard market
 * views are what you need. Use `@luc/ui/charts` (FinancialChart / research
 * charts) when the data is yours.
 */

/* Contracts */
export * from "./core/types";
export {
  TRADINGVIEW_CATALOG,
  TRADINGVIEW_CATEGORIES,
  TRADINGVIEW_LEGACY_EMBEDS,
  TRADINGVIEW_DEFAULT_SECTORS,
  TRADINGVIEW_MODULE_HOST,
  TRADINGVIEW_SCRIPT_HOST,
  TRADINGVIEW_SITE_HOST,
  TRADINGVIEW_WIDGET_HOST,
  tradingViewModuleUrl,
  tradingViewWidgetById,
  tradingViewWidgetsByCategory,
  type TradingViewAttributeSpec,
  type TradingViewWidgetDefinition,
} from "./core/catalog";
export {
  assertTradingViewSymbol,
  isValidTradingViewSymbol,
  tradingViewSymbolHref,
  type TradingViewSymbol,
} from "./core/markup";
export {
  TradingViewRetryAction,
  TradingViewSymbolError,
  TradingViewWidgetError,
  TradingViewWidgetFrame,
  TradingViewWidgetSkeleton,
  type TradingViewWidgetFrameProps,
} from "./core/surface";
export { TradingViewBoundary, type TradingViewBoundaryProps } from "./core/boundary";
export { TRADINGVIEW_TOKEN_BRIDGE } from "./core/theme";
export {
  resetTradingViewLoad,
  type TradingViewLoadState,
} from "./core/loader";

/* Adapters (advanced — the typed widgets below cover the normal surface) */
export {
  TradingViewIframe,
  type TradingViewIframeProps,
} from "./iframe/iframe-embed";
export {
  TradingViewWebComponent,
  type TradingViewWebComponentProps,
} from "./web-components/web-component";

/* Typed widgets */
export * from "./widgets";
