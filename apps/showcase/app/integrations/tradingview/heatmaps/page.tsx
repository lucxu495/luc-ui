import { EntryApiSection } from "@/components/docs/entry-api";
import TradingViewHeatmapsPage from "./page-client";

export default function Page() {
  return <TradingViewHeatmapsPage api={<EntryApiSection entryId="tradingview-heatmaps" primary="TradingViewStockHeatmap" />} />;
}
