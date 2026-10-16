"use client";

import { Suspense, type ReactNode } from "react";
import Link from "next/link";
import { useQueryStates } from "nuqs";
import {
  Badge,
  Button,
  Card,
  Code,
  Input,
  Section,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Skeleton,
  Text,
  dateOnlyParam,
  enumParam,
  listParam,
  nullableParam,
  param,
  params,
  sortListParam,
  stringParam,
} from "@luc/ui";
import { DocPage } from "@/components/docs/doc-page";
import { PageHeader } from "@/components/docs/page-header";
import { EntryFooter } from "@/components/docs/entry-footer";
import { Example } from "@/components/docs/example";
import { ImportLine } from "@/components/docs/family-imports";
import { nuqsParser } from "@/lib/luc-nuqs";
import { useI18n } from "@/lib/i18n/provider";

/**
 * URL state.
 *
 * The library owns the vocabulary — codecs, parameter sets, the "omit the
 * default" rule, deterministic order — and never imports a router. Next owns
 * the plumbing through the nuqs adapter. This page shows both halves, plus the
 * rule that decides what belongs in a URL at all.
 */

const demoParams = params({
  range: param(enumParam(["1m", "6m", "1y", "all"] as const), "1y"),
  series: param(listParam(stringParam()), ["close", "sma50"]),
  sort: param(sortListParam({ maxItems: 2 }), [{ id: "sharpe", desc: true }]),
  from: param(nullableParam(dateOnlyParam()), null),
  q: param(stringParam({ maxLength: 32 }), ""),
});

export function UrlStatePage({ apiSection }: { apiSection?: ReactNode }) {
  return (
    <Suspense fallback={<Skeleton className="h-96" />}>
      <UrlStateDemo apiSection={apiSection} />
    </Suspense>
  );
}

function UrlStateDemo({ apiSection }: { apiSection?: ReactNode }) {
  const { tcs, href } = useI18n();
  const [state, setState] = useQueryStates(
    {
      range: nuqsParser(demoParams.range.codec, demoParams.range.default),
      series: nuqsParser(demoParams.series.codec, demoParams.series.default),
      q: nuqsParser(demoParams.q.codec, demoParams.q.default),
    },
    { history: "replace", shallow: true, scroll: false, clearOnDefault: true },
  );

  return (
    <DocPage>
      <PageHeader
        eyebrow={tcs("Application")}
        title="URL state"
        lead="A URL should describe a reproducible view, not a React tree. Shareable state goes in the address bar, personal presentation state goes in local storage, and ephemeral interaction state goes nowhere."
      />

      <ImportLine line={'import { Input, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@luc/ui";\nimport { decodeParams, encodeParams, enumParam, listParam, params, stringParam } from "@luc/ui/url-state";'} />

      {/*
        * The live half of the page comes first. The pure API — the half a reader
        * cannot see by clicking — follows it as a reference section, which is the
        * reading order Components V2 asks for: capability, then contract.
        */}
      <Example
        title={tcs("Live: three parameters in the address bar")}
        description={tcs("Change any control and the address bar updates in place: no reload, and no history entry for every keystroke.")}
        layout="stage"
        code={`/* One adapter, one parameter set. The codecs are the library's; the
   plumbing is Next's, through the nuqs bridge. */
const demoParams = params({
  range:  param(enumParam(["1m", "6m", "1y", "all"] as const), "1y"),
  series: param(listParam(stringParam()), ["close", "sma50"]),
  q:      param(stringParam({ maxLength: 32 }), ""),
});

const [state, setState] = useQueryStates(
  {
    range:  nuqsParser(demoParams.range.codec, demoParams.range.default),
    series: nuqsParser(demoParams.series.codec, demoParams.series.default),
    q:      nuqsParser(demoParams.q.codec, demoParams.q.default),
  },
  { history: "replace", shallow: true, scroll: false, clearOnDefault: true },
);

<Select value={state.range} onValueChange={(next) => next && setState({ range: next })}>
  <SelectTrigger aria-label={tcs("Range")} className="w-40">
    <SelectValue />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="1m">1 month</SelectItem>
    <SelectItem value="6m">6 months</SelectItem>
    <SelectItem value="1y">1 year</SelectItem>
    <SelectItem value="all">All</SelectItem>
  </SelectContent>
</Select>

{["close", "sma50", "sma200"].map((id) => (
  <Button
    key={id}
    variant={state.series.includes(id) ? "primary" : "ghost"}
    aria-pressed={state.series.includes(id)}
    onClick={() => setState({ series: toggle(state.series, id) })}
  >
    {id}
  </Button>
))}

<Input value={state.q} onChange={(event) => setState({ q: event.target.value })} />`}
      >
        <div className="flex flex-wrap items-end gap-3">
              <label className="flex flex-col gap-1.5">
                <span className="text-micro text-fg-muted uppercase">{tcs("Range")}</span>
                <Select
                  value={state.range}
                  onValueChange={(next) => next && setState({ range: next as typeof state.range })}
                >
                  <SelectTrigger aria-label={tcs("Range")} className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1m">{tcs("1 month")}</SelectItem>
                    <SelectItem value="6m">{tcs("6 months")}</SelectItem>
                    <SelectItem value="1y">{tcs("1 year")}</SelectItem>
                    <SelectItem value="all">{tcs("All")}</SelectItem>
                  </SelectContent>
                </Select>
              </label>
              <div className="flex flex-col gap-1.5">
                <span className="text-micro text-fg-muted uppercase">{tcs("Series")}</span>
                <div className="flex gap-1.5">
                  {["close", "sma50", "sma200"].map((id) => {
                    const active = state.series.includes(id);
                    return (
                      <Button
                        key={id}
                        size="sm"
                        variant={active ? "primary" : "ghost"}
                        aria-pressed={active}
                        onClick={() =>
                          setState({
                            series: active
                              ? state.series.filter((entry) => entry !== id)
                              : [...state.series, id],
                          })
                        }
                      >
                        {id}
                      </Button>
                    );
                  })}
                </div>
              </div>
              <label className="flex flex-col gap-1.5">
                <span className="text-micro text-fg-muted uppercase">{tcs("Search")}</span>
                <Input
                  size="sm"
                  className="w-44"
                  placeholder={tcs("e.g. velocity")}
                  value={state.q}
                  onChange={(event) => setState({ q: event.target.value })}
                  aria-label={tcs("Search")}
                />
              </label>
        </div>
      </Example>

      <Section
        title={tcs("Typed codecs")}
        description={tcs("A codec is the whole vocabulary one parameter needs: how to read it, how to write it, and when two values are the same. Invalid input is not an error — it falls back to the default, because a URL is user input.")}
      >
        <Card variant="raised" className="flex flex-col gap-3">
          <Text variant="label">{tcs("Deterministic, and total")}</Text>
          <Text variant="caption" tone="muted">
            {tcs("The pure API reads and writes a parameter set with no React and no router. Order is declaration order, defaults are omitted, and duplicates collapse.")}</Text>
          <Code block>{`const decoded = decodeParams("?range=garbage&series=close,close,sma50", params);
// range falls back to "1y"; series is ["close", "sma50"]

const encoded = encodeParams({ range: "1y", series: ["close"] }, params);
// "" — every value was its default, so nothing is written`}</Code>
          <Text variant="caption" tone="muted">
            {tcs("The same functions run on the server, in a test, and in a browser adapter — the parameter set is the contract, not the hook.")}</Text>
        </Card>
      </Section>

      <Example
        title={tcs("Invalid links recover")}
        description={tcs("Every link below is wrong on purpose. None of them crash, and none render an impossible view: the page falls back to the default and normalizes the URL on the next write.")}
        layout="stage"
        code={`/* Every href below is deliberately wrong. The decoders are total: an
   unreadable value is the default, and the next write normalises the URL. */
{[
  "?range=garbage",
  "?series=does-not-exist,close,close",
  "?q=" + "x".repeat(64),
  "?sort=not-a-sort-key-with-spaces",
].map((search) => (
  <Link key={search} href={"/application/url-state" + search}>{search}</Link>
))}`}
      >
        <div className="flex flex-wrap gap-2">
          {[
            "?range=garbage",
            "?series=does-not-exist,close,close",
            "?q=" + "x".repeat(64),
            "?sort=not-a-sort-key-with-spaces",
          ].map((search) => (
            <Link
              key={search}
              href={href(`/application/url-state${search}`)}
              className="luc-focus rounded-sm border border-line-subtle bg-surface-default px-2.5 py-1.5 font-mono text-caption text-fg-secondary hover:border-line-strong hover:text-fg-primary"
            >
              {search.length > 44 ? `${search.slice(0, 44)}…` : search}
            </Link>
          ))}
        </div>
      </Example>

      <Section
        title={tcs("What goes where")}
        description={tcs("The rule that keeps a URL readable, and the one future agents get wrong most often.")}
      >
        <div className="grid gap-3 md:grid-cols-3">
          <Card variant="default" className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <Badge size="sm" tone="accent">
                URL
              </Badge>
              <Text variant="label">{tcs("Shareable")}</Text>
            </div>
            <ul className="flex flex-col gap-1 text-caption text-fg-secondary">
              <li>{tcs("Window and range")}</li>
              <li>{tcs("Visible series")}</li>
              <li>{tcs("Table filters, sort, search")}</li>
              <li>{tcs("View mode, selected tab")}</li>
              <li>{tcs("Pinned inspection cursor")}</li>
            </ul>
          </Card>
          <Card variant="default" className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <Badge size="sm" tone="neutral">
                local
              </Badge>
              <Text variant="label">{tcs("Personal")}</Text>
            </div>
            <ul className="flex flex-col gap-1 text-caption text-fg-secondary">
              <li>{tcs("Sidebar collapsed")}</li>
              <li>{tcs("Pane sizes")}</li>
              <li>{tcs("Inspector open")}</li>
              <li>{tcs("Density, theme")}</li>
            </ul>
          </Card>
          <Card variant="default" className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <Badge size="sm" tone="neutral">
                nowhere
              </Badge>
              <Text variant="label">{tcs("Ephemeral")}</Text>
            </div>
            <ul className="flex flex-col gap-1 text-caption text-fg-secondary">
              <li>{tcs("Hovered crosshair")}</li>
              <li>{tcs("Open menus")}</li>
              <li>{tcs("Drag position")}</li>
              <li>{tcs("Focused control")}</li>
            </ul>
          </Card>
        </div>
        <Text variant="caption" tone="muted">
          {tcs("Precedence: for shareable state the URL wins; for personal state the local value wins. Nothing is synchronized in both directions.")}</Text>
      </Section>
      {apiSection}
      <EntryFooter />
    </DocPage>
  );
}
