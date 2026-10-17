# Luc UI — Navigation guide

## One model, three surfaces

`NavigationGroup` / `NavigationItem` is the only navigation data in a LUC
application. The sidebar, the mobile drawer and the command palette all render
from it, so a page cannot be reachable in one and missing from the other.

```ts
interface NavigationItem {
  id: string;              // stable identity: keys, persistence, command ids
  label: string;
  href?: string;           // an href, not a route object
  icon?: ReactNode;        // decorative; the label is the accessible name
  badge?: ReactNode;
  description?: string;    // second line, and palette matching
  disabled?: boolean;
  children?: NavigationItem[];  // one level, deliberately
  action?: () => void;     // command-only rows
  keywords?: string[];     // extra palette search words
}
```

Two levels is a decision, not a limitation to work around. A deeper tree wants
search — the command palette — not a menu three levels deep.

## Router agnosticism

`@luc/ui` never imports `next/navigation`, React Router or TanStack Router. A
product supplies three things:

```tsx
<AppShell
  pathname={pathname}                      // a string
  renderLink={(props) => <Link {...props} />}  // how an <a> is rendered
  onNavigate={(href) => track(href)}       // prefetch, analytics, close a drawer
/>
```

With no provider at all, the default renders a real `<a href>`, so middle-click
and "open in new tab" keep working. `AppShell` passes these down through
`NavigationProvider`; `NavigationLink` is the single place a link is created.

Framework adapters live in the product, not the library:

```tsx
// Next App Router
renderLink={(props) => <Link {...props} />}

// React Router (conceptually)
renderLink={(props) => <Link to={props.href} {...props} />}
```

## Active state

Active state is derived, never hand-set:

```ts
isNavigationItemActive(pathname, "/charts");   // true on /charts/timeseries
isNavigationItemActive(pathname, "/charts");   // false on /charts-archive
findActiveNavigationItem(groups, pathname);    // most specific ancestor
```

A prefix only counts on a path *segment* boundary. `/` is only active on `/`.

An active item gets an opaque `surface-selected` background plus a 2px accent
edge — never colour alone, and never a glow on a passive surface.

## Groups and nesting

`SidebarGroup` + `SidebarGroupLabel` + `SidebarMenu` + `SidebarItem`. A parent
item with children renders a disclosure (Radix `Collapsible`, so `aria-expanded`
and `aria-controls` are the library's). In rail mode the first click expands the
sidebar and opens the tree.

## Search and the command palette

```ts
filterNavigation(groups, "prices");          // keeps the path to a match
flattenNavigation(groups);                   // depth-first, ordered
navigationCommandEntries(groups, extras);    // palette rows, haystack included
```

The palette is derived from the same model. Command-only rows — "Copy view link",
"Switch theme", "Run a job" — are passed in as `extras`; they are actions, not
navigation, and they never appear in the sidebar.

## Mobile

The mobile drawer is `AppShellMobileNav`, which is the existing `Sheet`. It runs
the sidebar content in a non-collapsible `SidebarProvider`, so the nav is always
expanded inside the drawer. Navigate to a page and the drawer closes itself.

## Keyboard

- Every item is a link or a button: real tab stops, real Enter/Space.
- The disclosure trigger reports `aria-expanded`.
- `Ctrl/⌘ + B` toggles the sidebar (`sidebarShortcut={false}` to opt out).
- `Ctrl/⌘ + K` opens the command palette (the product wires the hotkey; the
  library ships `useCommandHotkey`).
- The mobile drawer traps focus and restores it on close.

## Do not

- Keep a second navigation list for the command palette.
- Use a `Select` as navigation. Navigation is links; a Select picks a value.
- Hard-code product routes (`/btc`, `/reports`) inside `@luc/ui`.
- Build a third level with float-out menus. Use search.
