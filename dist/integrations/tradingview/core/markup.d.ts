import "./types.js";
import "./catalog.js";
//#region src/integrations/tradingview/core/markup.d.ts
/** The provider's own symbol type, kept deliberately lightweight. */
export type TradingViewSymbol = string;
/**
 * Reject an obviously malformed symbol before it reaches the provider.
 *
 * LUC cannot validate the full symbol space offline (TradingView exposes tens of
 * thousands), so this only catches the cases that would render an error inside
 * the widget: empty values and values with characters that cannot appear in
 * `EXCHANGE:TICKER`.
 */
export declare function isValidTradingViewSymbol(symbol: string): boolean;
export declare function assertTradingViewSymbol(symbol: string): string;
/** The provider link for a symbol page, used by the attribution block. */
export declare function tradingViewSymbolHref(symbol: string, suffix?: string): string;
//#endregion
//# sourceMappingURL=markup.d.ts.map