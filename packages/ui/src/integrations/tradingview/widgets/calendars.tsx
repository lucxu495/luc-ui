"use client";

import { tradingViewWidgetById } from "../core/catalog";
import type { TradingViewWidgetBaseProps } from "../core/types";
import { TradingViewIframe } from "../iframe/iframe-embed";
import { providerConfig, providerLocale, useIframePalette } from "./helpers";

const ECONOMIC_CALENDAR = tradingViewWidgetById("economic-calendar")!;

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
export function TradingViewEconomicCalendar({
  importanceFilter = "-1,0,1",
  countryFilter = "ar,au,br,ca,cn,fr,de,in,id,it,jp,kr,mx,ru,sa,za,tr,gb,us,eu",
  transparent = false,
  locale,
  theme,
  ...base
}: TradingViewEconomicCalendarProps) {
  const { theme: resolvedTheme } = useIframePalette({ theme });
  const config = providerConfig(
    {
      colorTheme: "light",
      isTransparent: false,
      width: "100%",
      height: "100%",
      locale: "en",
      importanceFilter: "-1,0,1",
      countryFilter: "ar,au,br,ca,cn,fr,de,in,id,it,jp,kr,mx,ru,sa,za,tr,gb,us,eu",
    },
    {
      importanceFilter,
      countryFilter,
      locale: providerLocale(locale),
      colorTheme: resolvedTheme,
      isTransparent: transparent,
    },
  );
  return (
    <TradingViewIframe
      {...base}
      definition={ECONOMIC_CALENDAR}
      providerConfig={config}
      theme={theme}
      attribution={{ href: "https://www.tradingview.com/economic-calendar/", label: "Economic Calendar" }}
    />
  );
}
