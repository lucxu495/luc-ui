# Luc UI — Workspace guide

A structured, resizable application layout for data-heavy screens. **Not** a
drag-and-drop dashboard: panes exist because the code says they exist, and the
only thing the engine does is move the dividers.

## The pieces

```
Workspace                 root; decides panes vs stacked, owns focus mode
  WorkspaceGroup          a resizable split, horizontal or vertical
    WorkspacePane         one panel; min/max/default/collapsible
      WorkspacePaneHeader title, actions, focus toggle, reset
      WorkspacePaneBody   the scroll region (focusable on purpose)
      WorkspacePaneFooter optional status row
    WorkspaceResizeHandle  the separator
  InspectorPane           a collapsible detail pane
```

## Example

```tsx
<Workspace className="min-h-0 flex-1">
  <WorkspaceGroup orientation="horizontal" persistKey="product:research" persistVersion={1}>
    <WorkspacePane id="stack" minSize="22rem">
      <WorkspaceGroup orientation="vertical" persistKey="product:research-inner">
        <WorkspacePane id="chart" minSize="18rem">…</WorkspacePane>
        <WorkspaceResizeHandle label="Resize chart and table" />
        <WorkspacePane id="table" minSize="16rem">…</WorkspacePane>
      </WorkspaceGroup>
    </WorkspacePane>
    <WorkspaceResizeHandle label="Resize inspector" />
    <InspectorPane id="inspector" open={open} onOpenChange={setOpen} title="Inspector">
      …
    </InspectorPane>
  </WorkspaceGroup>
</Workspace>
```

Nested splits work by putting a `WorkspaceGroup` **inside** a pane. That is also
the engine's requirement: a group's direct children are panels and separators,
nothing else.

## The engine decision

`react-resizable-panels` v4 (MIT) supplies dragging, keyboard resizing,
constraints, collapsible panes, imperative handles and accessible separators.
LUC supplies the frame, the handle's visual language, the responsive fallback,
the persistence policy and the Inspector. See
`docs/research/v0.5-open-source-audit.md`.

The separator arrives with `role="separator"`, `aria-valuenow`/`min`/`max`, and
arrow-key resizing. LUC styles it from the engine's own state attribute
(`data-separator="inactive|active|focus"`) rather than keeping a second state
machine.

## Sizes are personal state

```tsx
<WorkspaceGroup persistKey="product:research" persistVersion={1} defaultLayout={{ chart: 70, table: 30 }} />
```

- Stored in local storage, never in the URL.
- Versioned; an incompatible shape is discarded rather than migrated.
- Keyed by the **pane set**, so a workspace that swaps a pane keeps one layout
  per combination instead of applying stale percentages.
- Restored in a layout effect after hydration — the server cannot know a
  layout, and applying one during render would be a hydration mismatch.

## Focus mode, and Escape

Double-press equivalent: the expand control in a pane header. The pane fills its
group; the group's other panes are not rendered at all (the engine sets
`display: flex` inline on its roots, so a class cannot hide a panel). Escape
exits, and so does any resize.

Escape precedence, lowest to highest:

1. pinned chart inspection (only when nothing else owns Escape)
2. workspace focus mode
3. popovers and menus
4. dialogs and sheets — including chart fullscreen

The library refuses to decide this for you: `ChartInspectionProvider` does not
listen for Escape, and the page that owns the layers decides who wins. The
flagship page shows the guard.

## Mobile

Below 64rem the workspace is a column: panes stack, handles and the focus
control disappear, and an inspector should be presented as a `Sheet` instead.
Design the stacked order first — it is the order a phone will use.

`hideOnStacked` removes a pane (a secondary chart, say) rather than stacking it.

## Scroll

A pane body scrolls itself and is focusable, because a scroll region that cannot
be reached by keyboard is a defect. Give it `ariaLabel` when it is a named
region rather than the pane's only body.

## The inspector

`InspectorPane` is a `WorkspacePane` with an opinion: it collapses to zero width
**without unmounting**, so reopening restores the previous size and the
workspace never jumps. `InspectorToggle` reopens it from somewhere the reader can
still reach; `InspectorSection` / `InspectorRow` give it a quiet structure.

## Do not

- Use a workspace for a document, or for two fixed columns. Use the shell and
  the grid primitives.
- Put pane sizes in the URL by default.
- Mount an engine (a chart) inside a pane that unmounts on every toggle unless
  you accept that cost; that is what `collapsedSize="0%"` avoids.
- Add a drag handle, a docking gesture or a floating panel layer we did not
  ship.
- Resize panes with `display: none` or a class override on a panel; the engine
  owns that geometry.
