/*
 * One sentence per documented module: what it is *for*.
 *
 * This is the only place a component is described in prose, and it is keyed by
 * the module key from `taxonomy.ts`, so a page, its sidebar tooltip, its search
 * result and its entry in an AI prompt all say the same thing.
 *
 * House rules, so the catalogue reads as one document rather than many:
 *
 *  - It says what the component is for, not what it looks like. "Choose one
 *    value from a known list" beats "a beautiful select menu".
 *  - It names the contract the component owns — the thing you would get wrong
 *    if you hand-rolled it — rather than listing props.
 *  - It never promises a computation the library does not perform.
 *  - No marketing adjectives, no "simply", no "just".
 */

import type { ModuleKey } from "../taxonomy";

export const MODULE_SUMMARIES: Record<ModuleKey, string> = {
  /* ---------------------------------------------------------------- actions */
  "components/button-base":
    "The action primitive: a real `<button>`, six intents, three sizes, and a variant helper for anchors.",
  "components/icon-button":
    "A square, icon-only action that always carries an accessible name.",
  "components/icon":
    "One wrapper for the library's glyphs: size, tone and accessibility settled in one place, plus the named set it draws with.",
  "components/float-button":
    "An action that stays reachable: pinned to a corner, with the offsets, stacking and disclosure a stack of them needs.",
  "components/button-group":
    "Grouped actions behind one joint, and the toolbar shell that gives a strip one tab stop.",
  "components/toggle":
    "A two-state button, and the group that turns several of them into a choice.",
  "components/link":
    "A real anchor with a visible focus ring, rather than a span styled to look like one.",
  "components/kbd":
    "Keyboard chords rendered as keycaps, with the modifier names of the reader's own platform.",

  /* ------------------------------------------------------------------ forms */
  "components/file-upload":
    "The upload list as a real status model: queued, uploading, done, rejected and retryable.",
  "components/input":
    "The text control family: input, textarea, search and the shared chrome they all use.",
  "components/textarea":
    "Multi-line text with the shared control chrome and a real resize contract.",
  "components/native-select":
    "The platform select, for when the operating system's own menu is the right answer.",
  "components/select":
    "Choose one value from a known list, with the full listbox keyboard contract.",
  "components/combobox":
    "Search and choose, including asynchronous sources, grouping and multi-select.",
  "components/checkbox":
    "A boolean choice with an indeterminate state and a 24 px hit area.",
  "components/radio-group":
    "One of a few mutually exclusive options, with roving focus and arrow-key movement.",
  "components/switch":
    "An immediate on or off for a setting that applies without a save.",
  "components/slider":
    "A value on a range, single or two-handled, with a keyboard contract per thumb.",
  "components/segmented-control":
    "A compact exclusive choice that reads as a single control.",
  "components/rating":
    "A star rating that is operable from the keyboard and answers in half steps when asked.",
  "components/search-input":
    "A field that behaves like a search box: a clear affordance and Escape to reset.",
  "components/input-group":
    "An input with addons — prefixes, suffixes and inline actions inside one ring.",
  "forms/form":
    "The submit lifecycle and the error summary a long form needs, without binding a form engine.",
  "forms/sections":
    "Grouping, repeating and numbering fields across a long form.",
  "forms/inputs/number-input":
    "Numeric entry with a real scale: integers, currency and percentages.",
  "forms/inputs/currency-input":
    "Money entry with an explicit scale, sign handling and a currency prefix.",
  "forms/inputs/password-input":
    "A password field with a real reveal control and no clipboard surprises.",
  "forms/inputs/otp-input":
    "One-time codes: paste-aware, auto-advancing, announced as one group.",
  "forms/inputs/file-input":
    "Choosing files and dropping them, with the same validation surface.",
  "forms/inputs/tag-input":
    "A list of values entered as chips, with keyboard removal and duplicate handling.",
  "components/color-picker":
    "Pick a colour, with a parsed hex value and readable ink computed for you.",
  "components/field":
    "The label, description, message and ARIA wiring every control needs, in one component.",
  "components/label":
    "A caption bound to a control, for the cases `Field` does not own.",

  /* -------------------------------------------------------------- datetime */
  "datetime/calendar":
    "A month grid with a real calendar type underneath, so week start and unavailable days are data.",
  "datetime/date-picker":
    "A single date, a range and the presets a research workflow actually uses.",
  "datetime/datetime-picker":
    "A wall-clock moment, local or zoned, with the time zone carried in the value.",
  "datetime/month-year-picker":
    "Coarse steps — a month, a year — without pretending they are dates.",
  "datetime/time-picker":
    "A time of day as its own value, not a date at midnight.",

  /* ---------------------------------------------------------------- layout */
  "layout/container":
    "The page's measure: one max width and one gutter, applied consistently.",
  "layout/grid":
    "A responsive grid where the column count is a decision, not a class soup.",
  "layout/inline":
    "A row that wraps and gaps predictably, and collapses to a column on narrow screens.",
  "layout/stack":
    "Vertical rhythm between siblings, so spacing is owned in one place.",
  "layout/section":
    "A titled band of content with the spacing and hierarchy a page needs.",
  "components/card":
    "A quiet surface for a group of related things, plus its denser sibling `Panel`.",
  "components/panel":
    "The dense surface for toolbars, sidebars and nested regions.",
  "components/separator":
    "A hairline that means structure, in either direction.",
  "components/scroll-area":
    "A styled scroll container that keeps the platform's scrolling semantics.",
  "components/aspect-ratio":
    "Hold a ratio without layout shift, whatever loads inside it.",

  /* ------------------------------------------------------------ navigation */
  "app-shell/app-shell":
    "The landmarks of a product: topbar, sidebar, content and status bar, with a skip link.",
  "app-shell/sidebar":
    "The navigation rail: expanded, railed and off-canvas, with the router injected rather than imported.",
  "app-shell/breadcrumbs":
    "Where the current page sits, with the separator semantics the platform expects.",
  "app-shell/page-header":
    "The one place a page states its title, lead and metadata.",
  "components/tabs":
    "Switch between panels of related content, with the full tab keyboard contract.",
  "components/pagination":
    "Move through pages of a result set, with the page sizes people actually use.",
  "components/stepper":
    "Progress through a known sequence of steps, announced rather than implied.",
  "components/tree-view":
    "A hierarchy with roving focus, expansion state and selection.",

  /* -------------------------------------------------------------- feedback */
  "components/alert":
    "Inline status that stays where it is, plus `Callout` for prose-adjacent guidance.",
  "components/progress":
    "A determinate or indeterminate bar for work whose size is known.",
  "components/spinner":
    "An indeterminate wait, sized to the thing it replaces.",
  "components/skeleton":
    "A placeholder that reserves the shape of what is loading.",
  "components/empty-state":
    "The honest answer when there is nothing to show, and what to do next.",
  "components/result":
    "The surface a flow ends on: what just happened, what to do next, and the action that follows from it.",
  "data/status-badge":
    "A state as a word and a colour, with the state itself as the source of the colour.",
  "components/toast":
    "Transient, announced notifications with a LUC skin on Sonner's behaviour.",
  "components/notification-center":
    "An inbox for the notifications a user has already been shown, with read state.",
  "components/guided-tour":
    "A multi-step tour anchored to real elements, with the steps declared as data.",

  /* -------------------------------------------------------------- overlays */
  "components/accordion":
    "Disclosure in place: one or many sections open, with the button and region wiring the platform expects.",
  "components/dialog":
    "A modal surface with the whole focus-trap and return-focus contract.",
  "components/alert-dialog":
    "A modal confirmation that cannot be dismissed by accident.",
  "components/sheet":
    "An edge-anchored surface at five sizes, for settings and detail.",
  "components/popover":
    "A positioned surface for a little content, with focus moved into it and returned.",
  "components/hover-card":
    "A preview on hover that is also reachable by keyboard.",
  "components/tooltip":
    "A short label for an icon or a truncated value, never for essential content.",
  "components/dropdown-menu":
    "An action menu with the menu keyboard contract, including checkbox and radio items.",
  "components/context-menu":
    "The same menu contract, opened at a point instead of a trigger.",
  "components/command":
    "The ⌘K palette: fuzzy search over declared pages, scoped by group.",

  /* ---------------------------------------------------------- data display */
  "components/badge":
    "A short label for a state, a count or a category — and `Tag` when it needs to be removed.",
  "table/data-table":
    "A real table with sorting, facets, selection, column control and every state controlled.",
  "table/virtual-data-table":
    "The same contract for result sets too large to render.",
  "table/data-table-toolbar":
    "The row above a table: search, facets, column visibility and the selection count.",
  "table/data-table-pagination":
    "Page controls bound to the table's own state, server-side paging included.",
  "table/facet-filter":
    "Multi-select filtering derived from the data, with counts that reflect the other facets.",
  "table/column-visibility-menu":
    "Show and hide columns without losing the user's arrangement.",
  "components/timeline":
    "A sequence of events with machine-readable times and no invented ordering.",
  "components/list":
    "A sequence of comparable rows on one hairline grid, with the slots that keep ten rows aligned.",
  "components/transfer-list":
    "Move items between two lists with the keyboard, not only the mouse.",
  "components/kanban-board":
    "Columns of cards that can be moved, with the move announced either way.",
  "components/sortable-list":
    "Reorder with pointer or keyboard, announcing every move.",
  "data/metric":
    "One number with its label, unit and context, in a hierarchy that reads at a glance.",
  "data/delta":
    "A change with a direction, coloured by meaning rather than by sign alone.",
  "data/stat-card":
    "One number, its context and its trend in a single scannable surface.",
  "data/timestamp":
    "A moment written for a human, with the machine-readable value kept beside it.",
  "data/data-details":
    "A definition list for a record, ready for the detail pane of a table.",

  /* ----------------------------------------------------------------- media */
  "components/avatar":
    "A person, a group of people, and a fallback that is not a broken image.",
  "components/carousel":
    "A track of items with controls, and keyboard access to every one of them.",
  "components/image-gallery":
    "A grid that opens into a lightbox without losing your place.",
  "components/image-compare":
    "Two images and one draggable divider, operable from the keyboard.",

  /* ----------------------------------------------------------- application */
  "workspace/workspace":
    "Resizable panes with real separators, keyboard resizing and a mobile composition.",
  "workspace/inspector":
    "The right-hand detail pane: collapsible, sectioned and never unmounted.",
  "workspace/outline-drawer":
    "The on-this-page outline as a scrollspy, with a drawer on narrow screens.",
  "app-shell/navigation-context":
    "The injected navigation model — one tree that drives the sidebar, the mobile drawer and the command palette.",
  "url-state/index":
    "Typed URL state: a codec per value type, pure encode and decode, and one hook.",
  "providers/luc-provider":
    "The single provider a consuming app installs: theme, locale and motion defaults together.",
  "providers/theme-provider":
    "Light, dark and system, resolved without a flash and without a client-side layout effect.",
  "providers/locale-provider":
    "Explicit locale and time zone for date and number formatting, so server and client agree.",

  /* -------------------------------------------------------------------- ai */
  "components/ai":
    "The conversation surface: messages, streaming text, tool calls and agent activity.",

  /* ------------------------------------------------------------ typography */
  "components/typography":
    "Roles rather than sizes, and numerals that never lie about their alignment.",

  /* ----------------------------------------------------------- experiences */
  "experiences/profile-hero":
    "The top of a personal site: a name as the `h1`, one line of context and the facts that matter.",
  "experiences/social-links":
    "The three things every personal site gets wrong — accessible names, new-tab warnings, list semantics.",
  "experiences/experience-timeline":
    "A career as an ordered list, with a machine-readable period and a localisable open end.",
  "experiences/project-showcase":
    "A grid that grows the chosen project into a detail region, controlled or not.",
  "experiences/publication-list":
    "Year, type and topic facets derived from the entries, with no invented citations.",
  "experiences/reading-shelf":
    "Books and papers grouped by status, with progress as a real progress bar.",
  "experiences/now-section":
    "A `/now` block that must carry the date it was last true.",

  /* ---------------------------------------------------------------- motion */
  "motion/kinetic-headline":
    "A headline that assembles itself per word or per letter, and settles into real text.",
  "motion/text-reveal":
    "Reveal prose line by line as it enters the viewport, including the scramble variant.",
  "motion/number-ticker":
    "A number that counts to its value, formatted by the caller, and static under reduced motion.",
  "motion/shimmer":
    "A moving highlight that says \"still loading\" without a spinner.",
  "motion/spotlight-surface":
    "A panel with a light that follows the pointer, drawn as a painted layer rather than a shadow.",
  "motion/glare-surface":
    "A diagonal sheen that sweeps a surface on hover.",
  "motion/tilt-surface":
    "Depth from pointer position, bounded so text never becomes unreadable.",
  "motion/border-glow":
    "An accent that travels the border of a focused or featured surface.",
  "motion/border-trail":
    "A light that runs the perimeter of a card, and the layer primitive it is built from.",
  "motion/aurora-surface":
    "A slow, low-frequency background wash for a hero — one memorable moment, not a particle system.",
  "motion/motion-surface":
    "The base surface every spatial effect is layered on, with the depth rung as a prop.",
  "motion/interactive-grid":
    "A grid that responds to the pointer, with the density declared rather than tuned in CSS.",
  "motion/beam-flow":
    "Lines of light travelling between two points, weighted by a value.",
  "motion/marquee":
    "Continuous scrolling content that pauses on hover, focus and reduced motion.",
  "motion/card-stack":
    "Cards in depth that can be advanced, with the controls exposed as a real group.",
  "motion/morphing-dialog":
    "A dialog that grows out of the element that opened it, keeping the focus contract.",
  "motion/morphing-popover":
    "The same morph, for content that does not need a modal.",
  "motion/parallax-scene":
    "Layered depth driven by scroll, with the layer depth declared per child.",
  "motion/magnify-dock":
    "A dock that scales its items under the pointer, with the keyboard path intact.",
  "motion/orbit-field":
    "Nodes on orbits, useful for a small system diagram rather than decoration.",
  "motion/pressable":
    "The pointer-level press contract, extracted so any surface can have it.",
  "motion/press-ripple":
    "A ripple from the press point, as a real layer with a bounded lifetime.",
  "motion/click-burst":
    "A short burst of shapes from a click, for the one place a product wants delight.",
  "motion/data-change-flash":
    "A background flash when a value changes, so a live number is noticed without a badge.",
  "motion/selection-beam":
    "A beam that connects a selection to its destination.",
  "motion/shared-highlight":
    "A single highlight that slides between the active items of a group.",
  "motion/icon-morph":
    "Swap one icon for another with a morph, keeping one accessible name.",
  "motion/presence":
    "Mount and unmount with an exit animation, without a layout library.",
  "motion/collapse":
    "Height animation for disclosure, driven by measured content rather than a fixed height.",
  "motion/stagger":
    "A group that delivers its children one after another, with the delay declared once.",
  "motion/reveal":
    "Reveal a block as it enters the viewport, once, and immediately under reduced motion.",
  "motion/transition-panel":
    "Swap between panels while keeping the container's size stable.",
  "motion/expandable-surface":
    "Grow a surface in place to reveal more, with the trigger and close affordances included.",
  "motion/magnetic":
    "A slight pull toward the pointer, bounded so the target stays where the user aimed.",
  "motion/intensity":
    "The provider that scales every motion decision in a subtree, including off.",
};

/** Reuse one module's sentence under a different canonical id. */
function fromModule(key: ModuleKey): string {
  const summary = MODULE_SUMMARIES[key];
  if (!summary) throw new Error(`summaries.ts: no summary for module "${key}"`);
  return summary;
}

/** A summary for a page that documents a real route under its own id. */
export const PAGE_SUMMARIES: Record<string, string> = {
  button: fromModule("components/button-base"),
  "tag-input": fromModule("forms/inputs/tag-input"),
  "file-input": fromModule("forms/inputs/file-input"),
  field: fromModule("components/field"),
  typography: fromModule("components/typography"),
  ai: fromModule("components/ai"),
  form: fromModule("forms/form"),
  "virtual-data-table": fromModule("table/virtual-data-table"),
  metric: fromModule("data/metric"),
  "status-badge": fromModule("data/status-badge"),
  "url-state": fromModule("url-state/index"),
  "luc-provider": fromModule("providers/luc-provider"),
  "theme-provider": fromModule("providers/theme-provider"),
  "locale-provider": fromModule("providers/locale-provider"),
  "inspector-pane": fromModule("workspace/inspector"),
  "outline-drawer": fromModule("workspace/outline-drawer"),
  navigation: fromModule("app-shell/navigation-context"),
  sidebar: fromModule("app-shell/sidebar"),
  breadcrumbs: fromModule("app-shell/breadcrumbs"),
  "page-header": fromModule("app-shell/page-header"),
  "datetime-picker": fromModule("datetime/datetime-picker"),
  "month-year-picker": fromModule("datetime/month-year-picker"),
};
