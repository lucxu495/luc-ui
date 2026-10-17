import { EntryApiSection } from "@/components/docs/entry-api";
import TradingViewScreenersPage from "./page-client";

export default function Page() {
  return <TradingViewScreenersPage api={<EntryApiSection entryId="tradingview-screeners" primary="TradingViewScreener" />} />;
}
