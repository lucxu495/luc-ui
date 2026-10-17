import { EntryApiSection } from "@/components/docs/entry-api";
import TradingViewSymbolDetailsPage from "./page-client";

export default function Page() {
  return <TradingViewSymbolDetailsPage api={<EntryApiSection entryId="tradingview-symbol-details" primary="TradingViewSymbolInfo" />} />;
}
