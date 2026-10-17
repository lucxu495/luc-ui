# @luc/ui

Luc UI is a reusable React 19 component, chart and application UI package. It is
published from this repository as a git tag — not from a registry:

```bash
pnpm add @luc/ui@github:lucxu495/luc-ui#v1.0.0
```

The tag points at a commit on the `release` branch whose root is this package,
so the install is the built artifact, runs no scripts and is pinned by the
lockfile to a commit.
[`docs/RELEASES.md`](https://github.com/lucxu495/luc-ui/blob/main/docs/RELEASES.md)
is the contract;
[`docs/CONSUMERS.md`](https://github.com/lucxu495/luc-ui/blob/main/docs/CONSUMERS.md)
covers the tarball alternative. The package is ESM only and ships compiled
`dist` JavaScript, type declarations and Tailwind CSS v4 source.

Import the stylesheet once at the application root:

```css
@import "tailwindcss";
@import "@luc/ui/styles.css";
```

The packed stylesheet scans the package's own `dist` modules. There is no
`src` tree in the tarball. In React, wrap the app in `LucProvider` and use the
theme init script in the document head if you need a stable initial theme.

```tsx
import { LucProvider, lucThemeInitScript } from "@luc/ui";
import { Button } from "@luc/ui/components/button";
```

For exact supported imports and examples, see the generated
[`COMPONENT_CATALOG.md`](https://github.com/lucxu495/luc-ui/blob/main/docs/COMPONENT_CATALOG.md),
and the living documentation at
<https://github.com/lucxu495/luc-ui/tree/main/apps/showcase>. The
[`DEVELOPER_GUIDE.md`](https://github.com/lucxu495/luc-ui/blob/main/docs/DEVELOPER_GUIDE.md)
covers SSR, composition, charts, accessibility and troubleshooting.

The repository is at <https://github.com/lucxu495/luc-ui>, MIT licensed. From a
clone of it, `pnpm verify` runs the package gates; the two installed-artifact
proofs are `pnpm --filter @luc/ui test:git-consumer` and
`pnpm --filter @luc/ui test:independent-consumer`.
