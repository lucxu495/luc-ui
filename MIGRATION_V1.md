# Migrating to V1.0

V1.0 is the first frozen release. If you had code against the pre-1.0 working
tree, there are three changes to make. If you are starting fresh, there is
nothing to do.

## 1. Elevation tokens were renamed

The semantic shadow custom properties moved from `--shadow-*` to
`--elevation-*`, so that Tailwind's own `--shadow-*` theme namespace could be
bridged to them and `shadow-overlay` could become a real utility.

```diff
- box-shadow: var(--shadow-overlay);
+ box-shadow: var(--elevation-overlay);
```

| Old | New |
| --- | --- |
| `--shadow-xs` | `--elevation-xs` |
| `--shadow-sm` | `--elevation-sm` |
| `--shadow-md` | `--elevation-md` |
| `--shadow-lg` | `--elevation-lg` |
| `--shadow-overlay` | `--elevation-overlay` |
| `--shadow-inset-top` | `--elevation-inset-top` |
| `--shadow-inset-top-none` | `--elevation-inset-top-none` |

**Reason:** the two namespaces had the same names, so the bridge could not be
written without a self-referencing `var(--x): var(--x)` cycle. The consequence
was that `shadow-sm|md|lg|xs` resolved to Tailwind's default grey shadows, and
`shadow-overlay` did not exist at all — every overlay rendered without a shadow.
See `docs/V1_TOKEN_AUDIT.md` §3.

If you used the *utility classes* (`shadow-sm`, `shadow-overlay`) and never the
raw custom properties, there is nothing to change — those now render the
intended LUC values.

## 2. Five new subpaths

`@luc/ui/slider`, `@luc/ui/dropdown-menu`, `@luc/ui/context-menu`,
`@luc/ui/alert`, `@luc/ui/empty-state` now exist. Nothing was moved; the
corresponding components are also new. Existing imports are unchanged.

## 3. Chart inspection gained a keyboard surface

`ChartInspectionArea` was added to `@luc/ui/charts`. It is additive; the
existing `useChartInspection` / `ChartInspectionProvider` / `ChartPinButton`
API is unchanged, and a chart that does not wrap its plot in the new area
behaves exactly as before.

## 3a. The sidebar now marks one current page

`SidebarItem` and `SidebarSubmenu` used to set `aria-current="page"` on every
item whose href was a prefix of the route, so a section route and the detail
route under it were both "current" and both painted as selected. Only the exact
match claims `aria-current="page"` now; a containing section is still lit, with
an accent label rather than a selected surface, so the navigation map still
shows where the reader is.

If you rendered a custom active state from `isNavigationItemActive`, nothing
changes — it is still the prefix test. The new exact test is exported as
`isNavigationItemCurrent`, and both items carry `data-active` (in the section)
and `data-current` (the page) for styling and tests.

## What did *not* change

No component prop was renamed, removed or re-typed. No component was moved
between entry points. The root barrel, the CSS entry and the provider contract
in `LucProvider` are unchanged.

## Deferred, not removed

The components listed as deferred in `docs/COMPONENT_INVENTORY.md` §11 were
never published, so there is nothing to migrate away from. If your product
needs one, the inventory says why it was held back and what the next step is.
