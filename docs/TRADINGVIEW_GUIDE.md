# LUC UI — TradingView integration guide

`@luc/ui/tradingview` embeds **TradingView's own market widgets** as LUC-shaped
React components. It is an integration layer, not a chart library: the data, the
rendering and the attribution belong to TradingView, and the wrapper owns the
lifecycle, the theming contract and the failure states.

- Provider policy audit: `docs/research/v0.6-tradingview-policy-audit.md`
- The widget registry: `packages/ui/src/integrations/tradingview/core/catalog.ts`

## 1. When to use a provider widget

| Need | Use | Why |
| --- | --- | --- |
| A standard market chart, quote, screener, heatmap, news feed or macro calendar | `@luc/ui/tradingview` | TradingView already hosts the data, the sessions, the corporate actions and the legal attribution. |
| Your own OHLC, your overlays, your annotations, cross-engine sync | `@luc/ui/charts` → `FinancialChart` | The data is yours; the provider cannot know about it. |
| Your own metrics: distributions, correlations, regimes, drawdown | `@luc/ui/charts` research families | LUC computes and explains the numbers. |

All three lanes can appear on one page. They are different jobs, not competing
implementations — see the Showcase's `/integrations/tradingview` overview.

**Widgets are display, not data access.** Nothing in this package reads a
widget's DOM, and nothing scrapes provider content into another system. If a
number matters to your own analytics, it must come from your own data pipeline.

## 2. The two formats, honestly

TradingView ships two embedding technologies, and LUC keeps the difference
visible instead of pretending both are equally themeable.

| | Web Component | iframe |
| --- | --- | --- |
| Official format | `<script type="module" src="…/w/{locale}/tv-<widget>.js">` plus a custom element | `<script src="…/embed-widget-<widget>.js">` with a JSON configuration |
| Shadow DOM | closed | a separate document |
| LUC theming | `theme` attribute + the provider's published CSS custom properties (mapped from LUC tokens) + documented `::part()` | the provider's own configuration keys only (`colorTheme`, `backgroundColor`, `gridColor`, `isTransparent`) |
| Style isolation | the widget inherits LUC's font and colours | the widget looks like TradingView, in the page's theme |
| Examples | Mini Chart, Market Data, Ticker Tape, Technical Analysis, Forex Table | Advanced Chart, Screener, Stock Heatmap, Top Stories, Economic Calendar |

The registry records the classification for every widget; the Showcase's
**Themes** page lets you see the difference rather than read about it.

## 3. Quick start

```tsx
import { TradingViewAdvancedChart, TradingViewMiniChart, TradingViewTickerTape } from "@luc/ui/tradingview";

// A full provider chart (iframe)
<TradingViewAdvancedChart symbol="BINANCE:BTCUSDT" preset="standard" height={560} />

// A card-sized chart (Web Component, follows LUC's tokens)
<TradingViewMiniChart symbol="NASDAQ:AAPL" height={180} />

// A strip above a page
<TradingViewTickerTape symbols={["NASDAQ:AAPL", "BINANCE:BTCUSDT", "FX:EURUSD"]} />
```

Every wrapper:

- is a **client** component and renders its markup on the server too, so the box
  has its final size before any provider code arrives;
- **loads nothing** until it is within 200px of the viewport (`loading="eager"`
  opts out);
- renders a **geometry-matched skeleton** while loading and a **retry affordance**
  when the provider cannot be reached;
- keeps the provider's own **attribution** intact and never covers it;
- accepts a `theme` override (`"dark" | "light" | "auto"`, default `"auto"`).

## 4. What is typed, and what is not

`@luc/ui` types every provider setting it exposes:

```tsx
<TradingViewAdvancedChart
  symbol="NASDAQ:AAPL"
  interval="D"                 // "1" | "3" | … | "D" | "W" | "M"
  style="1"                    // candles
  preset="analysis"            // minimal | standard | analysis
  timezone="America/New_York"  // explicit; never inferred from the browser
  studies={["STD;RSI"]}
  compareSymbols={[{ symbol: "NASDAQ:MSFT", position: "SamePane" }]}
/>
```

Two rules follow from that:

1. **A prop exists only where the provider documents it.** The Screener has no
   `symbol` prop because the provider's screener has no symbol setting.
2. **Closed sets stay closed.** `TradingViewEconomicMap`'s `metric` is
   `"gdp" | "ur" | "gdg" | "intr" | "iryy"` because those five are the widget's
   own keys — an invented key makes the provider throw while it renders.

For a provider option LUC does not model yet, every wrapper takes `config`, which
is merged **under** the typed props:

```tsx
<TradingViewAdvancedChart symbol="NASDAQ:AAPL" config={{ hide_legend: true }} />
```

`config` can only set attributes and keys the widget already declares. It cannot
change the script URL, the element, or the attribution — see §7.

## 5. Sizing

- Every wrapper defaults to the widget's usable height and accepts `height`
  (`number` for px, or any CSS length).
- `minSize` in the registry is the smallest box that still renders the widget
  honestly; the Showcase prints it under each preview.
- A horizontal **Ticker Tape defines its own height** — give it the provider's
  own measurement (104px) rather than stretching it.
- Reserve space with `height` when the provider is lazy: the wrapper renders its
  box at that size immediately, so the page never jumps.
- Do not put `overflow: hidden` on a widget's box: the provider's popovers and
  dialogs are rendered inside it and would be clipped.

## 6. Theming

```tsx
// Web Components: LUC's semantic tokens mapped onto the provider's public
// custom properties, plus an explicit theme attribute.
<TradingViewMiniChart symbol="NASDAQ:AAPL" />

// Opt out and keep TradingView's own colours:
<TradingViewMiniChart symbol="NASDAQ:AAPL" inheritTheme={false} />

// A transparent widget on a LUC panel:
<TradingViewMiniChart symbol="NASDAQ:AAPL" transparent />
```

The bridge is one map (`TRADINGVIEW_TOKEN_BRIDGE`) and only contains tokens with
a clear semantic counterpart: background, text, font, accent, muted scales,
tooltip and popup surfaces, and the up/down pair. TradingView keeps its own
market-status chips and its heatmap colour semantics — in a financial heatmap the
colour *is* the data.

iframe widgets can only be re-created with new configuration when the theme
changes. The wrapper removes the previous embed first, so a theme flip can never
leave two widgets stacked.

## 7. Attribution and links

- TradingView's copyright block is rendered exactly as the provider's snippet
  ships it, and LUC never places anything over a widget box.
- **Only symbol links can be redirected.** Two supported ways:

```tsx
// 1. The provider's own URL template
<TradingViewMiniChart
  symbol="NASDAQ:AAPL"
  symbolUrl="https://example.com/stocks/{tvexchange}/{tvsymbol}"
/>

// 2. Handle the event yourself (SPA routing)
<TradingViewMiniChart
  symbol="NASDAQ:AAPL"
  onSymbolNavigate={({ href, context }) => router.push(`/symbols/${context.symbol}`)}
/>
```

Attribution, data-source and legal links always point at TradingView; they are
not intercepted by either mechanism.

## 8. Loading, failure and the network

- `loading="lazy"` (default) starts the load when the widget approaches the
  viewport, so a catalog of thirty previews does not open thirty connections.
- Web Components report failure when the module rejects or the element does not
  register within `timeoutMs` (default 12s); if the element registers later the
  state recovers by itself.
- iframe widgets report failure from the embed script's own `error` event.
- A failure renders `TradingViewWidgetError` with a retry, and never invents
  market data. The rest of the page is unaffected.
- Both formats are safe under React StrictMode and remounts: the loader
  deduplicates modules by URL, and the iframe adapter rebuilds its own markup and
  destroys it on unmount.

### Construction failures

Loading is not the only way a provider integration can fail, so the wrapper
bounds *construction* too — a third-party widget must never be able to unmount
the page that holds it:

- **Unusable symbol.** The typed widgets check the symbol before anything is
  requested; an empty value or one that cannot appear in `EXCHANGE:TICKER`
  renders `TradingViewSymbolError` and never reaches the provider. (The public
  `assertTradingViewSymbol` export still throws, so a direct caller can fail
  loudly; the components degrade instead.)
- **Refused URL.** The loader records a URL it will not load as that widget's
  `failed` state rather than throwing out of the effect that called it, and the
  iframe adapter catches a construction throw and shows the same surface.
- **Anything else.** `TradingViewBoundary` (exported from
  `@luc/ui/tradingview`) wraps the provider surface of both adapters. A throw
  from a descendant — including a bad element upgrade — becomes the standard
  retryable error surface, and retry remounts the widget.

All of these are the *same* bounded surface: an accessible `role="alert"` inside
the widget's own box, with retry where a retry can help, and no provider
internals, stack traces or invented data in the UI.

The Showcase's TradingView routes are the **only** pages in the project that
depend on third-party resources at runtime. Required domains for a production
CSP are listed on `/integrations/tradingview`, derived from the provider's own
embeds rather than guessed.

## 9. Package boundaries

```tsx
import { TradingViewMiniChart } from "@luc/ui/tradingview";   // the integration
import { Button } from "@luc/ui/components/button";           // no TradingView code
```

- `@luc/ui/tradingview` is its own entry point, and the root barrel does not
  export it.
- Measured from the compiled package: a button-only consumer bundle is unchanged
  at 5.7 KB raw / 2.1 KB gzip, and contains none of the integration's strings.
- The TradingView entry itself is ~43 KB raw / ~11 KB gzip including the full
  registry, and loads **no** provider script until a wrapper renders.

## 10. What future agents must not do

- Do not vendor, copy or self-host TradingView's widget code. Use the official
  loader URLs in the registry.
- Do not add a wrapper for a legacy embed when a canonical replacement exists —
  check `TRADINGVIEW_LEGACY_EMBEDS` first.
- Do not scrape widget content, read the shadow DOM, or feed provider values into
  another system.
- Do not remove, hide, recolour or cover provider attribution.
- Do not paste a raw widget snippet into a product page when a LUC wrapper
  exists.
- Do not pass a URL from props into a script tag: the loader accepts only the
  three official hosts, and the URL comes from the registry.
