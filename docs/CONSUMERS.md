# Consuming `@luc/ui`

Three ways to install the package, in the order they are recommended.

## 1. A git tag (recommended)

```json
{ "dependencies": { "@luc/ui": "github:lucxu495/luc-ui#v1.1.0" } }
```

That is the whole contract. The tag points at a commit on the `release` branch
whose root is the built package, so:

* the install runs **no scripts** — nothing to allow-list, nothing to review;
* `pnpm-lock.yaml` records the resolved commit, so the same ref resolves to the
  same bytes for everyone;
* `dist/` carries the 40 public subpaths, the `.d.ts` files and the CSS.

`docs/RELEASES.md` explains why the tag is on a release branch rather than
`#main`, and what happens on a version bump.

For a revision that is not a release, pin the commit:

```json
{ "dependencies": { "@luc/ui": "github:lucxu495/luc-ui#<40-char-sha>" } }
```

## 2. A packed tarball

For a product that would rather not depend on a git ref — `@luc/visuals` used
this before it moved to the tag, and `luc-render` and `luc-network/desktop-v1`
still do:

```bash
pnpm --filter @luc/ui pack:local         # → artifacts/pack/luc-ui-<hash>.tgz
```

```json
{ "dependencies": { "@luc/ui": "file:./vendor/luc-ui-1.1.0.tgz" } }
```

The tarball is the same build, and `pnpm pack` applies `publishConfig`, so its
manifest exports `dist`. Two things to know before choosing it:

* **the file is the version.** Nothing in the lockfile ties a `file:` tarball to
  a commit, and pnpm trusts the recorded `integrity` hash — replacing the
  tarball under the same path needs `pnpm install --force`;
* it has to be vendored into the consumer, so the artifact is one more copy to
  keep current.

The git ref removes both problems, which is why it comes first here.

## 3. From this repository (development only)

Inside the `luc-ui` workspace, `apps/showcase` depends on `@luc/ui` as
`workspace:*` and resolves it to `packages/ui/src`, which is what makes the
Showcase's hot reload work on component source. Consumers never see that layout:
`exports` point at `src` for the workspace and at `dist` for anything packed or
tagged.

## Using it

```tsx
// app/layout.tsx
import { LucProvider, lucThemeInitScript } from "@luc/ui";
import "@luc/ui/styles.css";

<html lang="en" suppressHydrationWarning>
  <head>
    <script dangerouslySetInnerHTML={{ __html: lucThemeInitScript({ defaultTheme: "dark" }) }} />
  </head>
  <body>
    <LucProvider defaultTheme="dark">{children}</LucProvider>
  </body>
</html>
```

```css
@import "tailwindcss";
@import "@luc/ui/styles.css";
```

The stylesheet is Tailwind CSS v4 and scans its own `dist` modules, so an app
outside this repository needs no `@source` line for it. Import it **after**
`@import "tailwindcss"`.

### Peer dependencies

`react` and `react-dom` (`^19.0.0`) are peers, and so is `react-hook-form`
(`^7.0.0`) — the last one is optional and only needed for
`@luc/ui/forms/react-hook-form`.

## Verifying an install

The package ships its own proof, and both installed-artifact checks run the same
assertions:

```bash
pnpm --filter @luc/ui test:git-consumer           # a local git ref
pnpm --filter @luc/ui test:git-consumer:remote    # github.com/lucxu495/luc-ui
pnpm --filter @luc/ui test:independent-consumer   # the packed tarball
```

Each one installs into a temporary directory outside the workspace, typechecks
eleven public subpaths, server-renders the package, compiles the stylesheet with
Tailwind and measures a button-only bundle.
