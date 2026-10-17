import { EntryApiSection } from "@/components/docs/entry-api";
import TradingViewWatchlistsPage from "./page-client";

export default function Page() {
  return <TradingViewWatchlistsPage api={<EntryApiSection entryId="tradingview-watchlists" primary="TradingViewMarketSummary" />} />;
}
