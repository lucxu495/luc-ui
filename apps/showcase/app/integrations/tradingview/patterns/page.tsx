import { Heading, Text } from "@luc/ui";
import Link from "next/link";
import { getServerCopy } from "@/lib/i18n/server";
import TradingViewPatternsPage from "./page-client";

async function Reference() {
  const { tcs, href } = await getServerCopy();
  return (
    <section className="flex flex-col gap-4">
      <Heading size="title" as="h2" id="api">
        {tcs("Reference")}
      </Heading>
      <Text variant="body" tone="muted" as="p" className="max-w-[68ch]">
        {tcs("Patterns composes public provider widgets. Their compiler-generated APIs are documented on the widget-family pages:")}
      </Text>
      <ul className="flex list-disc flex-col gap-2 pl-5 text-body">
        {([
          ["Charts", "/integrations/tradingview/charts"],
          ["Watchlists and market data", "/integrations/tradingview/watchlists"],
          ["Tickers", "/integrations/tradingview/tickers"],
          ["Symbol details", "/integrations/tradingview/symbol-details"],
          ["News and calendars", "/integrations/tradingview/news-calendars"],
        ] as const).map(([label, route]) => (
          <li key={route}>
            <Link className="luc-focus text-fg-accent underline" href={href(route)}>
              {tcs(label)}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

export default function Page() {
  return <TradingViewPatternsPage api={<Reference />} />;
}
