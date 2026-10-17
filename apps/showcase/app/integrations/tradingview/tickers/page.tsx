import { EntryApiSection } from "@/components/docs/entry-api";
import TradingViewTickersPage from "./page-client";

export default function Page() {
  return <TradingViewTickersPage api={<EntryApiSection entryId="tradingview-tickers" primary="TradingViewTickerTape" />} />;
}
