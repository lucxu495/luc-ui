import { EntryApiSection } from "@/components/docs/entry-api";
import TradingViewNewsCalendarsPage from "./page-client";

export default function Page() {
  return <TradingViewNewsCalendarsPage api={<EntryApiSection entryId="tradingview-news-calendars" primary="TradingViewTopStories" />} />;
}
