import { ReactNode } from "react";
//#region src/integrations/tradingview/core/types.d.ts
/** Which embedding technology a widget officially provides. */
export type TradingViewWidgetFormat = "web-component" | "iframe";
export type TradingViewCategory = "charts" | "watchlists" | "tickers" | "heatmaps" | "screeners" | "symbol-details" | "news" | "calendars" | "brokers" | "economics";
/**
 * Widget locales TradingView serves.
 *
 * Transcribed from the provider's own widget runtime (`window.locale_domains`
 * on any widget-docs page), which is the authoritative list the embeds validate
 * against — not only the subset that appears in the wizard's language menu.
 * `zh_CN` / `zh_TW` / `fa_IR` are served (they map to cn./tw./www. TradingView
 * domains); a caller that passes a locale the provider does not have must fall
 * back itself, because a bad value breaks the widget's module URL.
 */
export type TradingViewLocale = "ar_AE" | "br" | "ca_ES" | "de_DE" | "en" | "es" | "fa_IR" | "fr" | "he_IL" | "id" | "in" | "it" | "ja" | "kr" | "ms_MY" | "pl" | "ru" | "th_TH" | "tr" | "vi_VN" | "zh_CN" | "zh_TW";
export declare const TRADINGVIEW_LOCALES: readonly TradingViewLocale[];
/** `"auto"` follows the LUC theme; the others pin the widget. */
export type TradingViewTheme = "dark" | "light";
export type TradingViewThemeProp = TradingViewTheme | "auto";
/**
 * The widget lifecycle as the wrapper sees it.
 *
 * `idle`      — waiting for the lazy trigger (nothing has been requested)
 * `loading`   — the provider module/script is in flight
 * `ready`     — the element registered (Web Component) or the embed script ran
 * `error`     — the module failed, or registration never arrived before the
 *               timeout; a retry is available
 */
export type TradingViewStatus = "idle" | "loading" | "ready" | "error";
/** A symbol group, as used by the watchlist and market widgets. */
export interface TradingViewSymbolSector {
  sectionName: string;
  symbols: string[];
}
/**
 * Escape hatch for provider options LUC does not model.
 *
 * It may only carry TradingView's own configuration keys: the loader URL,
 * the wrapper element and the attribution markup are not configurable, so this
 * cannot be used to load a different script or to hide branding.
 */
export type TradingViewRawConfig = Record<string, unknown>;
/** Payload of the Web Components' `tv-link-open` event. */
export interface TradingViewLinkDetail {
  /** The URL the widget would have opened. */
  href: string;
  context: {
    symbol?: string;
    interval?: string;
    widget?: string;
    [key: string]: unknown;
  };
}
export interface TradingViewStatusChange {
  status: TradingViewStatus;
  /** Present when `status === "error"`. */
  error?: Error;
}
/**
 * Props every wrapper shares.
 *
 * Deliberately small: the widget-specific settings are typed per component, and
 * presentation that belongs to the page (grid placement, card styling) stays
 * with the page.
 */
export interface TradingViewWidgetBaseProps {
  /** Height of the widget box. Defaults to the registry's usable minimum. */
  height?: number | string;
  /** Minimum height, so a resizable pane cannot collapse the widget to nothing. */
  minHeight?: number | string;
  className?: string;
  /** Accessible name for the widget box. Defaults to the registry display name. */
  title?: string;
  "aria-label"?: string;
  theme?: TradingViewThemeProp;
  /**
   * Map LUC semantic tokens onto TradingView's public CSS custom properties.
   * Default `true`. Ignored by iframe widgets, which only accept the provider's
   * own theme config — that limit is honest, not papered over.
   */
  inheritTheme?: boolean;
  /**
   * Ask the provider for a transparent background. Ignored by widgets that do
   * not expose the option. LUC defaults to opaque: dense financial content is
   * more readable on its own surface.
   */
  transparent?: boolean;
  /** Defer loading until the widget is near the viewport. Default `"lazy"`. */
  loading?: "lazy" | "eager";
  /** Provider locale. Defaults to `LocaleProvider` when present, else `en`. */
  locale?: TradingViewLocale;
  /**
   * Milliseconds to wait for a Web Component to register before reporting it as
   * unavailable. Default `12000`. iframe widgets report failure from the script
   * load instead.
   */
  timeoutMs?: number;
  /**
   * Advanced: extra provider configuration, merged under LUC's own keys.
   * Cannot change the script URL, the element, or attribution.
   */
  config?: TradingViewRawConfig;
  /** Notified on every lifecycle transition. */
  onStatusChange?: (change: TradingViewStatusChange) => void;
  /**
   * Rendered inside the widget box until the provider takes over. Defaults to a
   * geometry-matched skeleton; an inline widget (Ticker Tag) supplies its own so
   * it can sit inside a paragraph.
   */
  placeholder?: ReactNode;
  /** Rendered instead of the provider widget when the load fails. */
  fallback?: ReactNode;
}
/** Props for widgets that draw one symbol. */
export interface TradingViewSymbolProps {
  symbol: string;
}
/** Props for widgets that draw a list of symbols. */
export interface TradingViewSymbolsProps {
  symbols: readonly string[];
}
/** Props for widgets that follow the provider's symbol-link contract. */
export interface TradingViewSymbolLinkProps {
  /**
   * URL template for *symbol* links only. Placeholders: `{tvsymbol}`,
   * `{tvexchange}`, `{tvprosymbol}`. TradingView's own attribution and legal
   * links are never redirected.
   */
  symbolUrl?: string;
}
//#endregion
//# sourceMappingURL=types.d.ts.map