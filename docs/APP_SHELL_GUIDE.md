# LUC UI — App shell guide

The application frame. This is the document to read before writing anything that
looks like "a sidebar and a topbar".

## What the shell is

```
┌──────────────┬───────────────────────────────────────────────┐
│              │ Topbar                                        │
│              ├───────────────────────────────────────────────┤
│   Sidebar    │ Page header / breadcrumb                      │
│              ├──────────────────────────────┬────────────────┤
│              │ Main (or a Workspace)        │   Inspector    │
│              ├──────────────────────────────┴────────────────┤
│              │ Status bar (optional)                         │
└──────────────┴───────────────────────────────────────────────┘
```

`AppShell` renders that frame and nothing else. It owns:

- the landmark structure (`aside`, `header`, `main`, `nav`, optional footer),
- the skip link and its target,
- the sidebar's three states (expanded, rail, off-canvas),
- the scroll model,
- the responsive switch to a Sheet drawer,
- and the tokenised geometry (`--shell-topbar-height`, `--shell-sidebar-width`,
  `--shell-sidebar-rail-width`, `--shell-statusbar-height`).

It does **not** own routing. See `NAVIGATION_GUIDE.md`.

## Minimal usage

```tsx
<AppShell
  pathname={pathname}
  renderLink={(props) => <Link {...props} />}
  sidebarPersistKey="product:sidebar"
  sidebar={
    <>
      <SidebarHeader>…</SidebarHeader>
      <SidebarContent ariaLabel="Sections">…</SidebarContent>
      <SidebarFooter>…</SidebarFooter>
    </>
  }
  topbar={
    <AppShellTopbar>
      <AppShellMobileTrigger />
      <Breadcrumbs items={trail} />
    </AppShellTopbar>
  }
  statusBar={<AppShellStatusBar>Updated 12:04 UTC</AppShellStatusBar>}
>
  <AppShellContent>{page}</AppShellContent>
</AppShell>
```

`sidebar` is rendered inside the shell's `aside`, and `Sidebar`'s scrolling
region is the `nav` landmark. Nothing else is required; every part is optional
except the children.

## Props worth knowing

| Prop | Why |
| --- | --- |
| `height="viewport"` (default) | Fills the document; the page scrolls. |
| `height="fill"` | Sizes to a bounded parent — dashboards, previews, tests. |
| `sidebarCollapsed` / `defaultSidebarCollapsed` | Controlled or uncontrolled, like every LUC state. |
| `collapsibleSidebar={false}` | Pins the sidebar open; the rail and the shortcut disappear. |
| `sidebarPersistKey` | Opt-in local persistence, versioned. No key, no storage. |
| `sidebarShortcut` | `Ctrl/⌘ + B`, on by default, ignored while typing in a field. |
| `density="compact"` | Sets `data-density` for a dense terminal build. |
| `contentId` | The skip link's target; defaults to `luc-content`. |

## Sidebar states

**Expanded** is the default. **Collapsed (rail)** keeps the icons, keeps each
label in the DOM as the accessible name (`sr-only`) and reveals it with the
existing `Tooltip`. Group headings become hairline separators, badges become a
small count dot, and a parent item with children expands the rail before it
opens the tree — nested navigation does not become decorative.

**Off-canvas** is the same markup inside the existing `Sheet` (Radix Dialog), so
focus trapping, focus restore, Escape and the scrim are the behaviour the system
already ships. Any in-shell navigation closes it: `AppShell` wraps
`onNavigate` for exactly that reason.

Collapsed state is **personal presentation state**: it persists locally and
never reaches the URL.

## Scroll model

| Region | Behaviour |
| --- | --- |
| Sidebar | Its own scroll region; a long nav never moves the page. |
| Topbar | Sticky, opaque, one hairline underneath. |
| Main | The document scrolls by default. |
| Workspace pane | Scrolls itself (`WorkspacePaneBody`). |
| Status bar | Fixed; it scrolls sideways rather than wrapping. |

The topbar is deliberately **opaque**. A translucent bar carrying text is the
pattern `DESIGN_SYSTEM.md` §8a forbids; the hairline does the separation.

## Responsive behaviour

| Width | Sidebar | Workspace |
| --- | --- | --- |
| `lg` and up (≥64rem) | Expanded or rail, sticky | Resizable panes |
| Below `lg` | Off-canvas Sheet, triggered from the topbar | Panes stack, handles disappear |

Breakpoints come from the existing scale. Nothing in the shell invents one.

## Page composition

`PageHeader` carries the page's identity — eyebrow, title, description, a meta
row, actions, and an optional tabs row. Below it, choose one:

```tsx
<AppShellContent>…</AppShellContent>              {/* 1216px, page gutters */}
<AppShellContent width="prose">…</AppShellContent> {/* 704px, documents */}
<AppShellContent width="bleed">…</AppShellContent> {/* full width, workspaces */}
```

## Do not

- Write page-local sidebar or topbar CSS. Add a slot, or a token.
- Put a second `<nav aria-label="…">` inside a sidebar; the scrolling region is
  the landmark.
- Make the topbar translucent, or give it a shadow *and* a border.
- Give the sidebar an arbitrary width per page. Change the token if the product
  really needs a different one.
- Use the shell as a grid system. `Container`, `Grid`, `Stack` and `Inline`
  exist for that.
