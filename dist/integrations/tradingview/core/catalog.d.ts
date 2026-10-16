import { TradingViewCategory, TradingViewLocale, TradingViewSymbolSector, TradingViewWidgetFormat } from "./types.js";
//#region src/integrations/tradingview/core/catalog.d.ts
export interface TradingViewAttributeSpec {
  /** Attribute name on the custom element, kebab-cased. */
  attribute: string;
  /** How the value is serialised into the attribute. */
  encoding: "string" | "boolean" | "list" | "json" | "upper" | "lower";
}
export interface TradingViewWidgetDefinition {
  id: string;
  /** Display name. The React component is `TradingView` + this name. */
  name: string;
  category: TradingViewCategory;
  format: TradingViewWidgetFormat;
  /** Canonical documentation page. */
  docsUrl: string;
  /** Official module URL template. `{locale}` is substituted for Web Components. */
  moduleUrl?: string;
  /** Custom-element tag, for `web-component` widgets. */
  element?: string;
  /** Official embed script, for `iframe` widgets. */
  scriptUrl?: string;
  /**
   * Smallest size that still renders the widget honestly. Below this the
   * wrapper warns instead of pretending the layout fits.
   */
  minSize: {
    width: number;
    height: number;
  };
  /** Default box height used when the caller does not set one. */
  defaultHeight: number;
  supports: {
    /** Accepts `theme` (Web Components) / `colorTheme` (iframe). */
    theme: boolean;
    /** Has an official transparency option. */
    transparent: boolean;
    /** Draws one symbol and accepts `symbol`. */
    symbol: boolean;
    /** Draws a list of symbols. */
    symbols: boolean;
    /** Accepts `symbolUrl` / `symbol-url` redirect templates. */
    symbolUrl: boolean;
    /** Accepts `locale`. */
    locale: boolean;
  };
  /** Attribute contract, for Web Components. */
  attributes?: Record<string, TradingViewAttributeSpec>;
  /** A one-line description used by the catalog. */
  summary: string;
  /**
   * What this widget replaced. Present on canonical widgets whose predecessor
   * is still served by TradingView; absent otherwise.
   */
  replaces?: readonly string[];
}
export declare const TRADINGVIEW_SCRIPT_HOST = "https://s3.tradingview.com/external-embedding";
export declare const TRADINGVIEW_MODULE_HOST = "https://widgets.tradingview-widget.com";
export declare const TRADINGVIEW_WIDGET_HOST = "https://www.tradingview-widget.com";
export declare const TRADINGVIEW_SITE_HOST = "https://www.tradingview.com";
export declare const TRADINGVIEW_CATALOG: readonly TradingViewWidgetDefinition[];
/**
 * Widgets TradingView still serves but has replaced.
 *
 * Recorded so a future reader does not "restore" one of them, and so the
 * Showcase can explain why the catalog has no wrapper for them. None of these
 * get a component: the rule is one wrapper per capability.
 */
export declare const TRADINGVIEW_LEGACY_EMBEDS: readonly {
  script: string;
  replacedBy: string;
  status: "served" | "withdrawn";
  note: string;
}[];
export declare const TRADINGVIEW_CATEGORIES: readonly {
  id: TradingViewCategory;
  label: string;
  description: string;
}[];
export declare function tradingViewWidgetById(id: string): TradingViewWidgetDefinition | undefined;
export declare function tradingViewWidgetsByCategory(category: TradingViewCategory): readonly TradingViewWidgetDefinition[];
/**
 * Resolve a module URL template. `{locale}` comes from the caller; any other
 * placeholder (currently only `{broker}`) must be supplied in `extras`.
 */
export declare function tradingViewModuleUrl(definition: TradingViewWidgetDefinition, locale: TradingViewLocale, extras?: Record<string, string>): string;
/** The provider's own default sectors, used when a caller supplies none. */
export declare const TRADINGVIEW_DEFAULT_SECTORS: readonly TradingViewSymbolSector[];
//#endregion
//# sourceMappingURL=catalog.d.ts.map