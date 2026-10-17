import { EntryApiSection } from "@/components/docs/entry-api";
import TradingViewThemesPage from "./page-client";

export default function Page() {
  return <TradingViewThemesPage api={<EntryApiSection entryId="tradingview-themes" />} />;
}
