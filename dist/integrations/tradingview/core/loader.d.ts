import "./types.js";
//#region src/integrations/tradingview/core/loader.d.ts
export type TradingViewLoadState = "pending" | "ready" | "failed";
/**
 * Forget a URL so the next attempt runs again. Used by the error surface's
 * retry: the browser may still serve a cached rejection, and a timeout recovers
 * immediately — both outcomes are honest and neither is hidden.
 */
export declare function resetTradingViewLoad(url: string): void;
//#endregion
//# sourceMappingURL=loader.d.ts.map