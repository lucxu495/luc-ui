import { TradingViewWidgetBaseProps } from "../core/types.js";
//#region src/integrations/tradingview/widgets/calendars.d.ts
/** `-1` low, `0` medium, `1` high. */
export type TradingViewImportance = "-1" | "0" | "1";
export interface TradingViewEconomicCalendarProps extends TradingViewWidgetBaseProps {
  /** Comma-separated importance filter, e.g. `"0,1"` for medium and high. */
  importanceFilter?: string;
  /** Comma-separated ISO country codes, or a single code. */
  countryFilter?: string;
  transparent?: boolean;
}
/**
 * The macro event calendar.
 *
 * Named for the provider on purpose: this is not Luc UI's `Calendar`, and the two
 * must never be confused. One shows a date grid the product controls; this one
 * shows TradingView's event data.
 */
export declare function TradingViewEconomicCalendar({ importanceFilter, countryFilter, transparent, locale, theme, ...base }: TradingViewEconomicCalendarProps): import("react").JSX.Element;
//#endregion
//# sourceMappingURL=calendars.d.ts.map