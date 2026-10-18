<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="./docs/assets/brand/luc-ui-logo-dark-512.png" />
    <img src="./docs/assets/brand/luc-ui-logo-light-512.png" width="248" alt="Luc UI" />
  </picture>
</p>

<h1 align="center">Luc UI</h1>

<p align="center">
  An open-source React and TypeScript design system for accessible interfaces,
  considered motion, data display and professional charts.
</p>

Luc UI combines design tokens, reusable React components, spatial motion,
responsive data surfaces, chart primitives and typed TradingView wrappers. The
package is ESM-only, ships compiled JavaScript and declarations, and includes a
Tailwind CSS v4 stylesheet.

The project is public on GitHub. The current package release is **1.0.1**,
announced in GitHub Releases and installed from the immutable **`v1.0.1` Git
tag**. Luc UI is not published to an npm registry yet.

## Features

- Accessible React 19 components, built on native elements and established
  behavior primitives.
- Semantic design tokens for light and dark themes, accent palettes and
  typography roles.
- Layout, navigation, application shell, workspace and URL-state primitives.
- Motion components with reduced-motion behavior.
- General, statistical, financial and scientific charts.
- Typed TradingView widgets behind a separate `@luc/ui/tradingview` entry.
- TypeScript declarations for every public module entry.
- English and Simplified Chinese documentation in the local Showcase.
- Package checks for exports, types, CSS, tree-shaking and isolated consumers.

## Requirements

- React and React DOM `^19.0.0`.
- Tailwind CSS v4 for the supplied stylesheet.
- Node.js 22 or newer to develop this repository.
- pnpm 12.6 to develop this repository. Consumers may use npm, pnpm, Yarn or Bun.

## Quick start

### 1. Install from the Git tag

```bash
pnpm add @luc/ui@github:lucxu495/luc-ui#v1.0.1
```

```bash
npm install @luc/ui@github:lucxu495/luc-ui#v1.0.1
```

The tag points to a commit on the `release` branch whose root is the built
package. It contains `dist/`, declarations, CSS and the package manifest, with no
install-time build script.

Do not use `npm install @luc/ui` yet: the registry package does not exist.

### 2. Compile the stylesheet

Luc UI ships Tailwind CSS v4 source. Tailwind must compile it in the consumer.

**Vite**

```bash
npm install -D tailwindcss@4 @tailwindcss/vite@4
```

```ts
// vite.config.ts
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({ plugins: [react(), tailwindcss()] });
```

**Next.js App Router**

```bash
npm install -D tailwindcss@4 @tailwindcss/postcss@4
```

```js
// postcss.config.mjs
export default { plugins: { "@tailwindcss/postcss": {} } };
```

Then import Tailwind first and Luc UI second, once at the application root:

```css
@import "tailwindcss";
@import "@luc/ui/styles.css";
```

`@luc/ui/tokens.css` is available for applications that provide their own base
layer.

### 3. Mount the provider

`LucProvider` owns the resolved theme, locale and motion default. In Next.js,
run the theme init script in the document head to avoid a flash before
hydration.

```tsx
import { LucProvider, lucThemeInitScript } from "@luc/ui";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: lucThemeInitScript({ defaultTheme: "dark" }),
          }}
        />
      </head>
      <body>
        <LucProvider defaultTheme="dark">{children}</LucProvider>
      </body>
    </html>
  );
}
```

### 4. Render a component

```tsx
import { Button } from "@luc/ui";

export function SaveButton() {
  return <Button variant="primary">Save view</Button>;
}
```

## Charts

Chart data is prepared by the caller. Luc UI draws it and does not fetch or
recompute the series.

```tsx
"use client";

import { LineChart } from "@luc/ui/charts";

const rows = [
  { date: "2026-08-01", close: 94.2 },
  { date: "2026-08-08", close: 95.1 },
  { date: "2026-08-15", close: 96.4 },
];

export function PriceChart() {
  return (
    <LineChart
      data={rows}
      xKey="date"
      series={[{ key: "close", label: "Close", type: "line" }]}
      height={240}
      ariaLabel="Weekly closes"
    />
  );
}
```

Use a client boundary in Next.js. A chart needs a width-bearing parent even
when its height is set.

## TradingView

The TradingView entry is separate from the root package, so applications that do
not use provider widgets do not load its code.

```tsx
"use client";

import { TradingViewMiniChart } from "@luc/ui/tradingview";

export function MarketCard() {
  return <TradingViewMiniChart symbol="NASDAQ:AAPL" height={180} />;
}
```

The widget loads TradingView-hosted content over the network. Market data and
attribution belong to TradingView, not Luc UI.

## Documentation

- [Developer guide](./docs/DEVELOPER_GUIDE.md)
- [Component catalog](./docs/COMPONENT_CATALOG.md)
- [Public API](./docs/PUBLIC_API.md)
- [Charts](./docs/CHART_GUIDE.md)
- [Motion](./docs/MOTION_GUIDE.md)
- [Forms](./docs/FORM_GUIDE.md)
- [Date and time](./docs/DATE_TIME_GUIDE.md)
- [Application shell](./docs/APP_SHELL_GUIDE.md)
- [TradingView](./docs/TRADINGVIEW_GUIDE.md)
- [Accessibility](./docs/ACCESSIBILITY.md)

The full Showcase runs locally:

```bash
pnpm install
pnpm dev
# http://localhost:3000
# http://127.0.0.1:5300
```

There is no hosted public Showcase URL yet.

## Development

```bash
git clone https://github.com/lucxu495/luc-ui.git
cd luc-ui
pnpm install
pnpm dev
```

Useful repository gates:

```bash
pnpm typecheck
pnpm lint
pnpm test
pnpm verify
pnpm test:consumers
```

`pnpm verify` covers types, lint, unit tests, i18n, the chart and documentation
registries, package exports and the release artifact. `pnpm test:consumers`
creates temporary Vite and Next.js applications, installs the packed artifact
with plain npm, builds them for production and verifies them in Chromium.

To inspect the production Showcase in Docker:

```bash
docker compose up -d --build
# http://127.0.0.1:5300
```

The Compose project is `luc-ui-standalone`, the service is `showcase`, and only
the loopback host port is published.

## Contributing

Read [CONTRIBUTING.md](./CONTRIBUTING.md) before opening an issue or pull
request. Bug reports should include a minimal reproduction, the package source
and version, and any relevant browser or framework details.

## Stability and distribution

- Package: `@luc/ui`
- Current version: `1.0.1`
- Public Git tag: `v1.0.1`
- Module format: ESM
- Stylesheet: Tailwind CSS v4
- License: MIT

The public tag is immutable. Changes merged after `v1.0.1` are not available
through that install until a new version is built and tagged. See
[`docs/VERSIONING.md`](./docs/VERSIONING.md),
[`docs/RELEASES.md`](./docs/RELEASES.md) and
[`docs/OPEN_SOURCE_RELEASE_CHECKLIST.md`](./docs/OPEN_SOURCE_RELEASE_CHECKLIST.md).

## License

MIT © 2026 xu. See [LICENSE](./LICENSE).
