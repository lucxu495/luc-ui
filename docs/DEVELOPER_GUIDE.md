# Using Luc UI

`@luc/ui` is a public, ESM-only package. The current `1.0.0` release installs
from the immutable `v1.0.0` Git tag; there is no npm registry release yet. It
requires React and React DOM 19, Tailwind CSS v4 for the supplied stylesheet,
and Node 22 or newer for the repository tools (`packages/ui/package.json`,
`../package.json`).

```bash
pnpm add @luc/ui@github:lucxu495/luc-ui#v1.0.0
```

## Start a React or Next.js app

Install Tailwind v4 beside the package. Vite uses `@tailwindcss/vite`; Next.js
uses `@tailwindcss/postcss`. At the app root, import the stylesheet once:

```css
@import "tailwindcss";
@import "@luc/ui/styles.css";
```

The **packed** `styles.css` scans the installed `dist` modules with its own relative `@source`; it contains no `src` directory. Do not point Tailwind at `node_modules/@luc/ui/src`. The token-only entry is `@luc/ui/tokens.css` for apps that supply their own base layer (`packages/ui/src/styles/index.css`, `packages/ui/scripts/postbuild.mjs`).

Vite:

```ts
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({ plugins: [react(), tailwindcss()] });
```

Next.js App Router:

```js
// postcss.config.mjs
export default { plugins: { "@tailwindcss/postcss": {} } };
```

Wrap the rendered app with `LucProvider`; use `lucThemeInitScript` in the document head to avoid an incorrect first theme paint. In Next.js, the provider is a client boundary and can wrap server-rendered children. Pass an explicit locale for date/time output that is rendered on the server (`packages/ui/src/providers/luc-provider.tsx`, `packages/ui/src/providers/theme-script.ts`, `docs/DATE_TIME_GUIDE.md`).

```tsx
import { LucProvider, lucThemeInitScript } from "@luc/ui";
import "@luc/ui/styles.css";

// In a Next.js root layout, render the init script in <head>, then wrap children.
const themeScript = lucThemeInitScript({ defaultTheme: "dark" });
// <script dangerouslySetInnerHTML={{ __html: themeScript }} />
// <LucProvider defaultTheme="dark">{children}</LucProvider>
```

## Find and compose components

Use the generated [component catalog](./COMPONENT_CATALOG.md) to find the public import, exact exported names and a Showcase example. Its [JSON form](./component-catalog.json) adds declaring source and TypeScript signatures. Public paths come from `packages/ui/package.json`, and exact symbols come from public TypeScript barrels. A file under `packages/ui/src/` is not itself a supported package import.

- `Button` is a native button. Use `buttonVariants` on an anchor for a link styled as an action. It has no `asChild` prop (`packages/ui/src/components/button-base.tsx`, `button-variants.ts`).
- `Input` is available at `@luc/ui/components/input`; `Textarea` and `SearchInput` are available from the root barrel (`packages/ui/src/components/input.tsx`, `packages/ui/src/index.ts`).
- `DataTable`/`VirtualDataTable` are native tables with controlled sorting, filtering, selection and pagination. They do not edit cells or provide spreadsheet grid navigation (`packages/ui/src/table/data-table.tsx`, `virtual-data-table.tsx`).
- `Select`, `Dialog`, `Popover`, `Menu`, `Tabs` and `Sheet` compose from their exported parts. Set an accessible name on triggers, and let the behavior primitives own focus and keyboard handling (`packages/ui/src/components/`).
- `Card` is a surface. For a clickable Card, choose a native actionable element with `as="a"` or `as="button"`; do not leave an interactive `div` without keyboard behavior (`packages/ui/src/components/card.tsx`).

Most interactive controls accept controlled and uncontrolled state following their underlying React/Radix API; inspect their prop signatures in the catalog and working Showcase example. A controlled pair generally uses `value`/`onValueChange`; an uncontrolled control uses `defaultValue`. `DataTable` exposes state slices such as `sorting`/`onSortingChange` and never fetches data (`packages/ui/src/table/table-core.tsx`).

## Heavy surfaces and server boundaries

Use narrow chart entries: `@luc/ui/charts` for prepared generic series, `@luc/ui/financial-chart` for prepared price series, and `@luc/ui/tradingview` for provider widgets. The TradingView entry is separate from the root barrel. Chart computation, data retrieval and product semantics belong to the consumer (`packages/ui/src/charts/index.ts`, `packages/ui/src/integrations/tradingview/index.ts`, `docs/CHART_GUIDE.md`). A canvas chart needs a semantic `ChartDataTable` alternate when users must inspect its data.

The package build preserves `"use client"` on interactive modules. Server Components can render them as client islands, but pass serializable props across the server/client boundary. Use the server-safe `buttonVariants` recipe for an anchor rendered entirely on the server (`packages/ui/src/components/button.tsx`, `button-variants.ts`, `packages/ui/scripts/postbuild.mjs`). SSR dates require an explicit locale and deterministic `todayValue`; see [Date and time](./DATE_TIME_GUIDE.md).

## Design, accessibility and verification

Use semantic tokens from [DESIGN_SYSTEM.md](../DESIGN_SYSTEM.md). Add motion only to a meaningful interaction, preserve resting content, and honor reduced-motion behavior ([MOTION_GUIDE.md](./MOTION_GUIDE.md)). Name controls, preserve native elements and pair chart visuals with tabular data where appropriate ([ACCESSIBILITY.md](./ACCESSIBILITY.md)).

From `luc-ui/`, run `pnpm verify` for source/type/package gates. For changed visuals, run `pnpm qa:changed`; use the relevant targeted behavior group before a full release sweep. The catalog check is `pnpm --filter @luc/ui catalog:check`; the independent packed-install proof is `pnpm --filter @luc/ui test:independent-consumer` after a package build (`packages/ui/package.json`, `docs/QA_WORKFLOW.md`).

If a utility class is missing in an external app, first confirm the packed `dist/styles/index.css` contains `@source "../"` and the app compiles Tailwind v4. If an import fails, check the catalog and packed `exports` map; do not deep-import `src` or `dist`. If a provider widget fails, inspect the wrapper's fallback state before blaming the host page ([PACKAGING_GUIDE.md](./PACKAGING_GUIDE.md), [TRADINGVIEW_GUIDE.md](./TRADINGVIEW_GUIDE.md)).
