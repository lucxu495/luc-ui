# Luc UI — URL state guide

## The rule

A URL describes a **reproducible view**. It is not a serialization of your React
state, and it is not a place to keep personal preferences.

| Kind | Examples | Where it lives |
| --- | --- | --- |
| **Shareable semantic state** | date window, chart range, visible series, table sort/filter/search, view mode, pinned inspection cursor | the URL |
| **Personal presentation state** | sidebar collapsed, pane sizes, inspector open, density, theme | local storage |
| **Ephemeral interaction state** | hovered crosshair, open menus, drag position, focused control | nowhere |

Precedence: for shareable state the URL wins; for personal state the local value
wins. Nothing is synchronized in both directions — that is how you get loops.

## Router agnosticism

`@luc/ui` owns the vocabulary and never imports a router:

```ts
import { param, params, enumParam, listParam, dateOnlyParam, nullableParam } from "@luc/ui/url-state";

const viewParams = params({
  range: param(enumParam(["1m", "6m", "1y", "all"] as const), "1y"),
  series: param(listParam(stringParam()), ["close"]),
  from: param(dateOnlyParam(), DATASET_START),
  to: param(dateOnlyParam(), DATASET_END),
  sort: param(sortListParam({ maxItems: 2 }), [{ id: "sharpe", desc: true }]),
  q: param(stringParam({ maxLength: 48 }), ""),
  cursor: param(nullableParam(dateOnlyParam()), null),
});
```

Reading and writing are pure functions — usable on a server, in a test, in any
framework:

```ts
decodeParams("?range=garbage&series=close,close", viewParams);
// → range falls back to "1y"; duplicates collapse

encodeParams({ range: "1y", series: ["close"] }, viewParams);
// → nothing, because every value was its default

mergeParams("?utm_source=docs", { range: "6m" }, viewParams);
// → unrelated parameters survive
```

## Two ways to bind it

**No framework:** `useUrlState(viewParams)` reads and writes through the history
API. It is SSR-safe (the server renders `initialSearch`), and Back/Forward work
through `popstate`.

**Next App Router (the Showcase):** `nuqs` supplies shallow updates and the
App Router integration, and the LUC codecs plug into it:

```ts
const parsers = {
  range: nuqsParser(viewParams.range.codec, viewParams.range.default),
  …
};
const [view, setView] = useQueryStates(parsers, {
  history: "replace",
  shallow: true,
  scroll: false,
  clearOnDefault: true,
});
```

nuqs is a Showcase dependency, never a `@luc/ui` dependency. A product on
another router implements `UrlStateAdapter` (three methods) and skips nuqs.

## Clean URLs

1. **Defaults are omitted.** `?range=1y` never appears when `1y` is the default.
2. **Order is declaration order**, so the same view always produces the same
   string and a copied link is stable.
3. **No JSON blobs.** Semantic, short parameter names.
4. **Unrelated parameters survive.** `mergeParams` only rewrites the keys the
   set owns.
5. **Bounded input.** Every codec clamps string length, list length and numeric
   range, so a pasted megabyte cannot reach a component.

## History policy

| Interaction | History |
| --- | --- |
| Typing in a search box | `replace` |
| Toggling a series, changing a view mode | `push` when it is a navigation, `replace` when it is a scrub |
| Choosing a range chip or a preset | `push` — Back should return to the previous window |
| Pinning a cursor | `replace` |

The flagship makes this explicit: chips and view mode push, everything else
replaces. QA asserts Back and Forward move between shared views.

## Invalid URLs

A URL is user input. `decode` returns `undefined` for anything it cannot read
and the caller falls back to the default, so `?range=garbage` renders the
default view instead of crashing. There is a Showcase page of deliberately
broken links (`/application/url-state`).

## Dates

Date-only state is **`YYYY-MM-DD`, parsed to `CalendarDate`** — never through a
JavaScript `Date`. A window is two parameters (`from`, `to`), both inclusive;
the code never adds `23:59:59`. Datetime/zoned state uses
`instantParam()` (ISO-8601 UTC ↔ epoch milliseconds). See
`docs/DATE_TIME_GUIDE.md`.

## Chart and table state

```ts
?from=2026-06-28&series=close,sma50&mode=chart&status=live&sort=-sharpe&q=vol&cursor=2026-03-05
```

- Series visibility is a list; the chart filters, it never refetches.
- Table sorting is the compact `-sharpe,symbol` form, most significant first.
- The facet filter is a list value on one column.
- The pinned inspection cursor is a date (or an instant for intraday series).

Column widths, hover state and checkbox selection stay out of the URL.

## Pinned inspection

`ChartInspectionProvider` turns a click into a pinned x on the sync bus, so both
engines hold the same timestamp. The provider does **not** own Escape; the page
decides, because Escape priority belongs to whoever owns the layers.

## Share view

Copy the current URL, confirm with a toast. There is no share service, no short
link and no backend: the URL *is* the shareable state. The Showcase's flagship
page is the reference implementation, including a clipboard fallback.

## Do not

- Put pane sizes, hover state or open menus in the URL.
- Encode a state object as one JSON parameter.
- Write a default value into the link.
- Let two features own the same parameter key.
- Serialize a date-only value through `Date`.
