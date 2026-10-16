import { TradingViewLinkDetail, TradingViewWidgetBaseProps } from "../core/types.js";
import { TradingViewWidgetDefinition } from "../core/catalog.js";
import { ReactNode } from "react";
//#region src/integrations/tradingview/web-components/web-component.d.ts
export interface TradingViewWebComponentProps extends TradingViewWidgetBaseProps {
  definition: TradingViewWidgetDefinition;
  /** Typed provider settings, keyed by the widget's documented setting names. */
  settings?: Record<string, unknown>;
  /** Values that are derived by LUC rather than passed by the consumer. */
  derived?: Record<string, unknown>;
  /**
   * Placeholders for the provider's module URL, currently only `{broker}`.
   */
  urlParams?: Record<string, string>;
  /** `tv-link-open` handler. Calling it stops the provider opening TradingView. */
  onSymbolNavigate?: (detail: TradingViewLinkDetail) => void;
  /** Provider `symbol-url` template, when the widget supports it. */
  symbolUrl?: string;
  children?: ReactNode;
}
/**
 * The one Web Component adapter.
 *
 * The custom element is rendered by React (in SSR markup too), so before the
 * provider module arrives the browser simply paints the placeholder children —
 * TradingView's own documented graceful-degradation path. When the element
 * upgrades, its closed shadow root takes over and the light DOM stops painting,
 * which is why no overlay is needed and why the provider's UI can never be
 * covered by LUC.
 */
export declare function TradingViewWebComponent({ definition, settings, derived, urlParams, onSymbolNavigate, symbolUrl, height, minHeight, className, title, theme: themeProp, inheritTheme, transparent, loading, locale, timeoutMs, config, onStatusChange, placeholder, fallback, children, ...aria }: TradingViewWebComponentProps): import("react").JSX.Element;
//#endregion
//# sourceMappingURL=web-component.d.ts.map