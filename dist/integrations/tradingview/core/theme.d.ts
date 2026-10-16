import "./types.js";
import "react";
//#region src/integrations/tradingview/core/theme.d.ts
/**
 * Public TradingView CSS custom properties → LUC semantic tokens.
 *
 * Only tokens with a clear semantic counterpart are mapped. TradingView's
 * market-status chips and its positive/negative *areas* are left alone: the
 * provider keeps its own design there, and LUC's up/down axis is expressed
 * through `--chart-positive` / `--chart-negative` only.
 */
export declare const TRADINGVIEW_TOKEN_BRIDGE: Readonly<Record<string, string>>;
//#endregion
//# sourceMappingURL=theme.d.ts.map