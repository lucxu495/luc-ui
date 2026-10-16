/*
 * Live Demos — Actions.
 *
 * `button-group`, `float-button`, `icon`, `icon-button`, `kbd`, `link`.
 *
 * Every demo here is `composition(...)`: one real component, one deterministic
 * fixture, and the snippet written beside it. See `../../jsx.ts` for the
 * contract, and `indexDemos` for why an id can only appear once.
 *
 * `Button` and `Toggle` have hand-written pages with their own specimens
 * (`app/components/buttons`, `app/components/toggle`), so they are not here.
 * What follows is the six Actions entries the registry generates a page for, and
 * each one covers the capabilities the component actually has — read from
 * `packages/ui/src/components/*.tsx`, not from the props table:
 *
 *   IconButton   `iconButtonVariants` is four variants × three sizes, plus
 *                `loading` and `disabled`
 *   Icon         five sizes, nine tones, `label`, `spin`, and `name` vs `icon`
 *   FloatButton  four sides, two sizes, three variants, `badge`, `fixed`, and
 *                the `FloatButtonGroup` disclosure
 *   ButtonGroup  horizontal, `vertical`, the separator, and the `Toolbar` shell
 *                the same module exports
 *   Link         three variants × three underline settings, in flow and external
 *   KbdGroup     a chord, its sizes, and the platform's own modifier names
 */

import {
  Button,
  ButtonGroup,
  ButtonGroupSeparator,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  FloatButton,
  FloatButtonGroup,
  Icon,
  IconButton,
  KbdGroup,
  Text,
  Toolbar,
  ToolbarButton,
  ToolbarSeparator,
  ToolbarToggleGroup,
  ToolbarToggleItem,
} from "@luc/ui";
import {
  RiArrowDownSLine,
  RiBold,
  RiDeleteBinLine,
  RiDownloadLine,
  RiFileCopyLine,
  RiItalic,
  RiLinkM,
  RiMoreLine,
  RiPlayLine,
  RiRefreshLine,
  RiSettings3Line,
  RiShareLine,
  RiSparklingLine,
  RiUnderline,
} from "@remixicon/react";
import { IconGlyphDemo } from "@/components/demo/islands/icon-glyph-demo";
import { IconSetDemo } from "@/components/demo/islands/icon-set-demo";
import { LocalLink } from "@/components/docs/local-link";
import { composition, type DemoSpec } from "../index";
import type { ReactNode } from "react";

/**
 * The surface a floating action is pinned to, inside a documentation page.
 *
 * A `fixed` FloatButton on a documentation page covers the page it is
 * documenting, so every specimen here is positioned by its own box — which is
 * also the `fixed={false}` path a consumer uses inside a canvas, a preview pane
 * or a card. The box is deliberately shallow: a 12rem empty stage taught a
 * reader nothing except that the specimen was slow to arrive.
 *
 * Its caption is two words on purpose. A specimen is the thing a reader looks
 * at, and the prose that explains it belongs in the example's own title and
 * description, which are translated; a five-word sentence *inside* the stage is
 * English on the Chinese page and is a leak the runtime locale check reports.
 */
function FloatingStage({
  children,
  label,
  className,
}: {
  children: ReactNode;
  label: string;
  className?: string;
}) {
  return (
    <div
      /* `surface-sunken`, not `surface-canvas`: this box sits *inside* an
       * example stage, which is already on the canvas, and four corner specimens
       * on the same surface as their own frame read as one undivided panel. */
      className={`relative w-full overflow-hidden rounded-lg border border-line-subtle bg-surface-sunken ${
        className ?? "h-32"
      }`}
    >
      <div className="flex h-full items-center justify-center p-4">
        <p className="text-caption text-fg-muted">{label}</p>
      </div>
      {children}
    </div>
  );
}

/**
 * The visual for one control inside a `Toolbar`.
 *
 * `ToolbarToggleItem` and `ToolbarButton` are the Radix parts re-exported as
 * they are, so they arrive with no skin — the module styles the shell and hands
 * the caller the rest. On a *client* page the skin is `toggleVariants` (see the
 * Toggle page); this demo is data read by a Server Component, and
 * `toggleVariants` is published from a `"use client"` module, so it cannot be
 * called here at all — React refuses to invoke a client reference on the server.
 * Spelling the classes out is what a Server Component has to do, and the snippet
 * shows it rather than hiding it behind a constant.
 *
 * Measured, not assumed: without the group's `flex`, three items render as a
 * vertical column inside the toolbar.
 */
const toolbarItem =
  "grid size-8 place-items-center rounded-sm text-fg-secondary luc-focus luc-transition hover:bg-surface-interactive-hover hover:text-fg-primary data-[state=on]:bg-surface-selected data-[state=on]:text-fg-accent";

export const actionDemos: readonly DemoSpec[] = [
  /* ------------------------------------------------------------------- link */
  composition({
    id: "link",
    title: "Three variants",
    node: (
      <div className="flex flex-wrap items-center gap-6">
        <LocalLink href="/components/typography">Browse the catalogue</LocalLink>
        <LocalLink href="/components/typography" variant="muted">
          Secondary reference
        </LocalLink>
        <LocalLink href="/charts/catalog" variant="accent">
          Open the chart catalogue
        </LocalLink>
      </div>
    ),
    code: `<Link href="/components/typography">Browse the catalogue</Link>
<Link href="/components/typography" variant="muted">Secondary reference</Link>
<Link href="/charts/catalog" variant="accent">Open the chart catalogue</Link>`,
    note: "Variant is emphasis, not decoration: `default` is a link in body copy, `accent` is the LUC link colour, and `muted` steps a reference down beside a heading.",
    examples: [
      {
        title: "Underline behaviour",
        node: (
          <div className="flex flex-wrap items-center gap-6">
            <LocalLink href="/charts/catalog" variant="accent">
              On hover (default)
            </LocalLink>
            <LocalLink href="/charts/catalog" variant="accent" underline="always">
              Always
            </LocalLink>
            <LocalLink href="/charts/catalog" variant="accent" underline="none">
              None
            </LocalLink>
          </div>
        ),
        code: `<Link href="/charts/catalog" variant="accent">On hover (default)</Link>
<Link href="/charts/catalog" variant="accent" underline="always">Always</Link>
<Link href="/charts/catalog" variant="accent" underline="none">None</Link>`,
        note: "The default leaves the rule to the pointer, which is right in a navigation list and weak inside a paragraph — there, `underline=\"always\"` keeps the link identifiable without relying on colour alone.",
      },
      {
        title: "In a sentence",
        node: (
          <Text variant="body" as="p" className="max-w-[52ch]">
            <LocalLink href="/docs/installation" variant="accent" underline="always">
              Install the package
            </LocalLink>{" "}
            once, then import.
          </Text>
        ),
        code: `<Text as="p">
  <Link href="/docs/installation" variant="accent" underline="always">
    Install the package
  </Link>{" "}
  once, then import.
</Text>`,
        note: "An inline-flex anchor sits in the text flow and keeps the browser's own affordances: middle click, copy link address, the status preview.",
      },
      {
        title: "An external destination",
        node: (
          <LocalLink
            href="https://remixicon.com/"
            target="_blank"
            rel="noreferrer"
            variant="accent"
          >
            Remix Icon
            <Icon name="external" size="sm" />
          </LocalLink>
        ),
        code: `<Link href="https://remixicon.com/" target="_blank" rel="noreferrer" variant="accent">
  Remix Icon
  <Icon name="external" size="sm" />
</Link>`,
        note: "A link that leaves the site says so; the icon is decoration and the label carries the meaning.",
      },
    ],
  }),

  /* ------------------------------------------------------------ icon-button */
  composition({
    id: "icon-button",
    title: "Four variants",
    node: (
      <div className="flex flex-wrap items-center gap-3">
        <IconButton label="Copy run id" icon={<RiFileCopyLine />} variant="solid" />
        <IconButton label="Run preview" icon={<RiPlayLine />} variant="ghost" />
        <IconButton label="Regenerate series" icon={<RiSparklingLine />} variant="accent" />
        <IconButton label="Delete run" icon={<RiDeleteBinLine />} variant="danger" />
      </div>
    ),
    code: `<IconButton label="Copy run id" icon={<RiFileCopyLine />} variant="solid" />
<IconButton label="Run preview" icon={<RiPlayLine />} variant="ghost" />
<IconButton label="Regenerate series" icon={<RiSparklingLine />} variant="accent" />
<IconButton label="Delete run" icon={<RiDeleteBinLine />} variant="danger" />`,
    note: "Four variants, from the quiet `ghost` to the destructive `danger`. The label is required rather than optional: an icon-only control without an accessible name is a defect, not a style.",
    examples: [
      {
        title: "Three sizes",
        node: (
          <div className="flex flex-wrap items-center gap-4">
            <IconButton label="More actions" icon={<RiMoreLine />} size="sm" />
            <IconButton label="More actions" icon={<RiMoreLine />} size="md" />
            <IconButton label="More actions" icon={<RiMoreLine />} size="lg" />
          </div>
        ),
        code: `<IconButton label="More actions" icon={<RiMoreLine />} size="sm" />
<IconButton label="More actions" icon={<RiMoreLine />} size="md" />
<IconButton label="More actions" icon={<RiMoreLine />} size="lg" />`,
        note: "A size is the control's height on the density scale, and the glyph follows it: 16, 18 and 20 pixels. That square geometry is why an icon-only action should not be a `Button` holding one glyph.",
      },
      {
        title: "Loading and disabled",
        node: (
          <div className="flex flex-wrap items-center gap-3">
            <IconButton label="Refreshing" icon={<RiRefreshLine />} loading variant="solid" />
            <IconButton label="Refreshing" icon={<RiRefreshLine />} loading />
            <IconButton label="Settings" icon={<RiSettings3Line />} disabled />
          </div>
        ),
        code: `<IconButton label="Refreshing" icon={<RiRefreshLine />} loading variant="solid" />
<IconButton label="Refreshing" icon={<RiRefreshLine />} loading />
<IconButton label="Settings" icon={<RiSettings3Line />} disabled />`,
        note: "`loading` keeps the control's size, blocks activation and reports `aria-busy`; every control in this row stays in the tab order except the disabled one.",
      },
      {
        title: "Beside a Button",
        node: (
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="secondary">Export CSV</Button>
            <IconButton label="Copy share link" icon={<RiLinkM />} />
            <IconButton label="More export options" icon={<RiMoreLine />} />
          </div>
        ),
        code: `<Button variant="secondary">Export CSV</Button>
<IconButton label="Copy share link" icon={<RiLinkM />} />
<IconButton label="More export options" icon={<RiMoreLine />} />`,
        note: "The size scale is shared, so a `md` IconButton lines up with a `md` Button without a height wrapper — the reason to reach for it instead of styling a button yourself.",
      },
    ],
  }),

  /* ------------------------------------------------------------------- icon */
  composition({
    id: "icon",
    title: "Five sizes",
    node: (
      <div className="flex flex-wrap items-end gap-4">
        <Icon name="star" size="xs" tone="secondary" />
        <Icon name="star" size="sm" tone="secondary" />
        <Icon name="star" size="md" tone="secondary" />
        <Icon name="star" size="lg" tone="secondary" />
        <Icon name="star" size="xl" tone="secondary" />
      </div>
    ),
    code: `<Icon name="star" size="xs" />
<Icon name="star" size="sm" />
<Icon name="star" size="md" />
<Icon name="star" size="lg" />
<Icon name="star" size="xl" />`,
    note: "A size is a role, not a pixel count: `xs` is inline in text, `xl` is a mark. The wrapper owns the scale, so an icon matches the text beside it without the caller guessing a number.",
    examples: [
      {
        title: "Tones, and a name when the icon is the content",
        node: (
          <div className="flex flex-wrap items-center gap-4">
            <Icon name="check" tone="positive" size="lg" />
            <Icon name="alert" tone="warning" size="lg" />
            <Icon name="error" tone="negative" size="lg" />
            <Icon name="info" tone="info" size="lg" />
            <Icon name="sparkle" tone="accent" size="lg" />
            <Icon name="lock" tone="primary" size="lg" label="Encrypted at rest" />
          </div>
        ),
        code: `<Icon name="check" tone="positive" size="lg" />
<Icon name="alert" tone="warning" size="lg" />
<Icon name="error" tone="negative" size="lg" />
<Icon name="info" tone="info" size="lg" />
<Icon name="sparkle" tone="accent" size="lg" />
<Icon name="lock" tone="primary" size="lg" label="Encrypted at rest" />`,
        note: "Tone is semantic and resolves to a `--fg-*` token, so it follows the theme. The last one carries a `label`, which makes it an image with a name instead of decoration.",
      },
      {
        title: "Any glyph, and one that is still working",
        /* A client island, and necessarily so: `icon` takes the glyph component,
         * and React will not serialise a function across the RSC boundary. See
         * `components/demo/islands/icon-glyph-demo.tsx`. */
        node: <IconGlyphDemo />,
        code: `<Icon icon={RiStarLine} size="lg" tone="warning" />
<Icon icon={RiShareLine} size="lg" tone="muted" />
<Icon icon={RiRefreshLine} size="lg" tone="accent" spin />`,
        note: "`name` addresses the curated set the library draws with; `icon` takes any Remix Icon component. `spin` is for work in flight, and it stops under reduced motion.",
      },
      {
        title: "The set, searchable",
        node: <IconSetDemo />,
        code: `import { Icon, searchIcons } from "@luc/ui";

const names = searchIcons(query); // name and keyword, both languages
names.map((name) => <Icon key={name} name={name} />);`,
        note: "Names and keywords in both languages, because the person looking for an icon may type either one.",
      },
    ],
  }),

  /* ----------------------------------------------------------- float-button */
  composition({
    id: "float-button",
    title: "Pinned to a surface",
    node: (
      <FloatingStage label="Preview surface">
        <FloatButton fixed={false} icon={<RiDownloadLine />} label="Export this view" />
      </FloatingStage>
    ),
    code: `<FloatButton icon={<RiDownloadLine />} label="Export this view" />

// Inside a surface instead of the viewport:
<div className="relative">
  <FloatButton fixed={false} icon={<RiDownloadLine />} label="Export" />
</div>`,
    note: "Pinned to the viewport by default, and to the nearest positioned ancestor with `fixed={false}`. It sits at a layer below every overlay, so a dialog covers it instead of fighting it.",
    examples: [
      {
        title: "A stack that opens",
        node: (
          <FloatingStage label="Quick actions, opened" className="h-56">
            <FloatButtonGroup
              fixed={false}
              defaultOpen
              label="Quick actions"
              icon={<RiSparklingLine />}
              actions={[
                { id: "refresh", icon: <RiRefreshLine />, label: "Re-run" },
                { id: "settings", icon: <RiSettings3Line />, label: "Settings" },
                { id: "share", icon: <RiShareLine />, label: "Share" },
              ]}
            />
          </FloatingStage>
        ),
        code: `<FloatButtonGroup
  label="Quick actions"
  icon={<RiSparklingLine />}
  actions={[
    { id: "refresh", icon: <RiRefreshLine />, label: "Re-run" },
    { id: "settings", icon: <RiSettings3Line />, label: "Settings" },
    { id: "share", icon: <RiShareLine />, label: "Share" },
  ]}
/>`,
        note: "The trigger is a real button with `aria-expanded`; opening moves focus to the first action, and Escape closes the stack and returns focus to the trigger.",
      },
      {
        title: "All four corners",
        node: (
          <div className="grid w-full gap-3 sm:grid-cols-2">
            <FloatingStage label="bottom-right" className="h-28">
              <FloatButton fixed={false} icon={<RiDownloadLine />} label="Export" />
            </FloatingStage>
            <FloatingStage label="bottom-left" className="h-28">
              <FloatButton fixed={false} side="bottom-left" icon={<RiDownloadLine />} label="Export" />
            </FloatingStage>
            <FloatingStage label="top-right" className="h-28">
              <FloatButton fixed={false} side="top-right" icon={<RiDownloadLine />} label="Export" />
            </FloatingStage>
            <FloatingStage label="top-left" className="h-28">
              <FloatButton fixed={false} side="top-left" icon={<RiDownloadLine />} label="Export" />
            </FloatingStage>
          </div>
        ),
        code: `<FloatButton icon={<RiDownloadLine />} label="Export" />
<FloatButton side="bottom-left" icon={<RiDownloadLine />} label="Export" />
<FloatButton side="top-right" icon={<RiDownloadLine />} label="Export" />
<FloatButton side="top-left" icon={<RiDownloadLine />} label="Export" />`,
        note: "`side` picks the corner, and the offset clears the device's own safe area, so a floating action does not land on a phone's home indicator.",
      },
      {
        title: "Intents, sizes and a count",
        node: (
          <div className="grid w-full gap-3 sm:grid-cols-3">
            <FloatingStage label="accent, badge 3" className="h-28">
              <FloatButton
                fixed={false}
                variant="accent"
                icon={<RiRefreshLine />}
                label="Jobs finished since you last looked: 3"
                badge={3}
              />
            </FloatingStage>
            <FloatingStage label="solid, md" className="h-28">
              <FloatButton fixed={false} size="md" icon={<RiShareLine />} label="Share" />
            </FloatingStage>
            <FloatingStage label="danger" className="h-28">
              <FloatButton fixed={false} variant="danger" icon={<RiDeleteBinLine />} label="Discard draft" />
            </FloatingStage>
          </div>
        ),
        code: `<FloatButton
  variant="accent"
  icon={<RiRefreshLine />}
  label="Jobs finished since you last looked: 3"
  badge={3}
/>
<FloatButton size="md" icon={<RiShareLine />} label="Share" />
<FloatButton variant="danger" icon={<RiDeleteBinLine />} label="Discard draft" />`,
        note: "The badge is decoration: it is `aria-hidden`, so a number a reader has to hear belongs in `label`, in the caller's own language.",
      },
    ],
  }),

  /* ---------------------------------------------------------- button-group */
  composition({
    id: "button-group",
    title: "A joined row",
    node: (
      <ButtonGroup aria-label="Time frame">
        <Button variant="secondary" size="sm">
          Day
        </Button>
        <Button variant="secondary" size="sm">
          Week
        </Button>
        <Button variant="secondary" size="sm">
          Month
        </Button>
      </ButtonGroup>
    ),
    code: `<ButtonGroup aria-label="Time frame">
  <Button variant="secondary">Day</Button>
  <Button variant="secondary">Week</Button>
  <Button variant="secondary">Month</Button>
</ButtonGroup>`,
    note: "The group is geometry and one joint: neighbouring borders collapse, the inner corners square, and every child keeps its own variant.",
    examples: [
      {
        /*
         * "Stacked vertically", not "Vertical".
         *
         * The dictionary already keys `"Vertical"` to the discovery taxonomy's
         * art direction — "垂直领域", a vertical *industry* — so an example title
         * that said "Vertical" was translated into a sentence about market
         * segments. A one-word title is not always a free key: the same English
         * word can already mean something else in this product.
         */
        title: "Stacked vertically",
        node: (
          <ButtonGroup vertical aria-label="Chart range">
            <Button variant="outline" size="sm">
              1 month
            </Button>
            <Button variant="outline" size="sm">
              6 months
            </Button>
            <Button variant="outline" size="sm">
              1 year
            </Button>
          </ButtonGroup>
        ),
        code: `<ButtonGroup vertical aria-label="Chart range">
  <Button variant="outline">1 month</Button>
  <Button variant="outline">6 months</Button>
  <Button variant="outline">1 year</Button>
</ButtonGroup>`,
        note: "`vertical` moves the joint to the horizontal edges: the borders collapse upward and the outer corners stay round.",
      },
      {
        title: "A change of intent",
        node: (
          <ButtonGroup>
            <Button variant="primary" size="sm">
              Save
            </Button>
            <ButtonGroupSeparator />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="primary" size="sm" aria-label="More save options">
                  <RiArrowDownSLine />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>Save as draft</DropdownMenuItem>
                <DropdownMenuItem>Save and publish</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </ButtonGroup>
        ),
        code: `<ButtonGroup>
  <Button variant="primary">Save</Button>
  <ButtonGroupSeparator />
  <DropdownMenu>
    <DropdownMenuTrigger asChild>
      <Button variant="primary" aria-label="More save options">
        <RiArrowDownSLine />
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end">
      <DropdownMenuItem>Save as draft</DropdownMenuItem>
      <DropdownMenuItem>Save and publish</DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
</ButtonGroup>`,
        note: "`ButtonGroupSeparator` says there are two intents here rather than two options; the menu trigger is a real button with its own name, so the row keeps one tab stop per action.",
      },
      {
        title: "Toolbar: one tab stop",
        node: (
          <Toolbar label="Chart formatting">
            {/*
             * `ToolbarToggleGroup`, `ToolbarToggleItem`, `ToolbarSeparator` and
             * `ToolbarButton` are the Radix primitives re-exported as they are:
             * the module styles the shell and leaves the parts to the caller, so
             * a strip supplies the layout. Measured rather than assumed — without
             * the group's `flex`, three items render as a 96px column inside a
             * 106px toolbar. Reported as a finding rather than patched here,
             * because styling those exports is a change to the library.
             */}
            <ToolbarToggleGroup
              type="multiple"
              defaultValue={["bold"]}
              aria-label="Text style"
              className="flex items-center gap-1"
            >
              {(
                [
                  { value: "bold", label: "Bold", icon: <RiBold className="size-4" /> },
                  { value: "italic", label: "Italic", icon: <RiItalic className="size-4" /> },
                  { value: "underline", label: "Underline", icon: <RiUnderline className="size-4" /> },
                ] as const
              ).map((item) => (
                <ToolbarToggleItem
                  key={item.value}
                  value={item.value}
                  aria-label={item.label}
                  className={toolbarItem}
                >
                  {item.icon}
                </ToolbarToggleItem>
              ))}
            </ToolbarToggleGroup>
            <ToolbarSeparator className="mx-1 w-px self-stretch bg-line-subtle" />
            <ToolbarButton
              aria-label="Series settings"
              className={toolbarItem}
            >
              <RiSettings3Line className="size-4" />
            </ToolbarButton>
          </Toolbar>
        ),
        code: `<Toolbar label="Chart formatting">
  <ToolbarToggleGroup
    type="multiple"
    defaultValue={["bold"]}
    aria-label="Text style"
    className="flex items-center gap-1"
  >
    <ToolbarToggleItem
      value="bold"
      aria-label="Bold"
      className="grid size-8 place-items-center rounded-sm hover:bg-surface-interactive-hover data-[state=on]:bg-surface-selected"
    >
      <RiBold />
    </ToolbarToggleItem>
  </ToolbarToggleGroup>
  <ToolbarSeparator />
  <ToolbarButton
    aria-label="Series settings"
    className="grid size-8 place-items-center rounded-sm hover:bg-surface-interactive-hover"
  >
    <RiSettings3Line />
  </ToolbarButton>
</Toolbar>`,
        note: "`Toolbar` is the keyboard contract rather than a wrapper: one tab stop for the strip, arrow keys between the controls, Home and End to the ends, and a `label` the type requires because an unnamed toolbar is a defect. The parts are the Radix primitives re-exported as they are, so a strip brings its own layout and skin; `toggleVariants` is the LUC skin, but it ships in a client module, which is why a server-rendered strip spells the classes out.",
      },
    ],
  }),

  /* -------------------------------------------------------------------- kbd */
  composition({
    id: "kbd",
    title: "One chord, two platforms",
    node: (
      <div className="flex flex-wrap items-center gap-6">
        <KbdGroup keys={["⌘", "K"]} />
        <KbdGroup keys={["Ctrl", "K"]} />
      </div>
    ),
    code: `<KbdGroup keys={["⌘", "K"]} />
<KbdGroup keys={["Ctrl", "K"]} />`,
    note: "A chord is one combination rather than a list of symbols: the `+` between the keys belongs to the group and is hidden from a screen reader.",
    examples: [
      {
        title: "Platform conventions",
        node: (
          <div className="flex flex-wrap items-center gap-6">
            <KbdGroup keys={["⌘", "K"]} />
            <KbdGroup keys={["⌥", "⌘", "I"]} />
            <KbdGroup keys={["Ctrl", "Shift", "P"]} />
            <KbdGroup keys={["Esc"]} />
            <KbdGroup keys={["⇧", "↵"]} />
          </div>
        ),
        code: `<KbdGroup keys={["⌘", "K"]} />
<KbdGroup keys={["⌥", "⌘", "I"]} />
<KbdGroup keys={["Ctrl", "Shift", "P"]} />
<KbdGroup keys={["Esc"]} />
<KbdGroup keys={["⇧", "↵"]} />`,
        note: "macOS writes modifiers as glyphs (⌘, ⌥, ⇧) and Windows and Linux spell them (Ctrl, Shift). The component prints the keys it is given rather than choosing for the reader: the source of truth is the reader's own keyboard.",
      },
      {
        title: "Two sizes",
        node: (
          <div className="flex flex-wrap items-center gap-6">
            <KbdGroup keys={["⌘", "K"]} size="sm" />
            <KbdGroup keys={["⌘", "K"]} />
          </div>
        ),
        code: `<KbdGroup keys={["⌘", "K"]} size="sm" />
<KbdGroup keys={["⌘", "K"]} />`,
        note: "`sm` sits inside a caption, a table cell or a menu row; `md` is the default beside a label.",
      },
      {
        title: "A shortcut list",
        node: (
          <dl className="grid w-full max-w-md grid-cols-[1fr_auto] items-center gap-x-6 gap-y-2">
            <dt className="text-label text-fg-secondary">Command menu</dt>
            <dd>
              <KbdGroup keys={["⌘", "K"]} size="sm" />
            </dd>
            <dt className="text-label text-fg-secondary">Toggle inspector</dt>
            <dd>
              <KbdGroup keys={["⌥", "⌘", "I"]} size="sm" />
            </dd>
            <dt className="text-label text-fg-secondary">Dismiss dialog</dt>
            <dd>
              <KbdGroup keys={["Esc"]} size="sm" />
            </dd>
          </dl>
        ),
        code: `<dl className="grid grid-cols-[1fr_auto] gap-x-6 gap-y-2">
  <dt>Command menu</dt>
  <dd><KbdGroup keys={["⌘", "K"]} size="sm" /></dd>
  <dt>Toggle inspector</dt>
  <dd><KbdGroup keys={["⌥", "⌘", "I"]} size="sm" /></dd>
  <dt>Dismiss dialog</dt>
  <dd><KbdGroup keys={["Esc"]} size="sm" /></dd>
</dl>`,
        note: "The definition list is the caller's structure; the single keycap (`Kbd`, in the typography family) is the component to reach for when a chord is not what you need.",
      },
    ],
  }),
];
