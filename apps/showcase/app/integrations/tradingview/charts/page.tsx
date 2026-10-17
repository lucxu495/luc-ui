import { EntryApiSection } from "@/components/docs/entry-api";
import TradingViewChartsPage from "./page-client";

export default function Page() {
  return <TradingViewChartsPage api={<EntryApiSection entryId="tradingview-charts" primary="TradingViewAdvancedChart" />} />;
}
