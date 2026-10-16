import { ReactNode } from "react";
//#region src/providers/locale-provider.d.ts
export interface LocaleProviderProps {
  /**
   * BCP-47 locale, e.g. `en-GB`, `de-DE`, `ja-JP`, `ar-EG`.
   *
   * Date and number controls follow the locale for segment order, weekday
   * names, the first day of the week, the 12/24-hour clock and digit grouping.
   * Omit it and the browser's locale wins — which also means the server (no
   * `navigator`) and the client can disagree, so pass it explicitly in a
   * server-rendered app. See docs/DATE_TIME_GUIDE.md §locale.
   */
  locale?: string;
  children: ReactNode;
}
/**
 * Applies a locale to every date, time and number control underneath.
 *
 * It is a thin wrapper — LUC does not own internationalisation data, and React
 * Aria already resolves it correctly — but it gives products one place to set
 * the locale for the whole system and keeps server/client output identical.
 */
export declare function LocaleProvider({ locale, children }: LocaleProviderProps): import("react").JSX.Element;
//#endregion
//# sourceMappingURL=locale-provider.d.ts.map