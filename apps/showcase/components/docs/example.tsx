"use client";

/*
 * The Components V2 example.
 *
 * `Demo` renders *documentation*: a specimen and, underneath it, the source. That
 * was right for the registry pages, where one specimen answers "what is this".
 * It is wrong for a Components page, where eight specimens run down a page and
 * eight always-visible code blocks turn it into a wall — and where the reader's
 * question is "show me the capability", with the code as an *optional* second
 * step. See `docs/COMPONENTS_V2.md` §6.
 *
 * So this is the same idea with two changes, and both are about the reading path:
 *
 *   - the code is behind a real disclosure (`aria-expanded` + `aria-controls`),
 *     hidden by default, so the examples stay scannable;
 *   - the specimen sits in its own bounded card that grows with its content,
 *     instead of a fixed stage — a single Toggle must not reserve half a screen.
 *
 * The rule the registry enforces for its own specimens is kept: the code is the
 * source the preview was built from. A caller that passes `children` derived from
 * state builds the string from the same values.
 */

import { useId, useState } from "react";
import { cn } from "@luc/ui";
import { RiCodeLine } from "@remixicon/react";
import { CopyButton } from "./copy-button";
import { localizeSpecimen } from "@/lib/i18n/specimen";
import { useOptionalI18n } from "@/lib/i18n/provider";

export interface ExampleProps {
  /** Names the capability, e.g. "Three sizes" — never the prop name. */
  title: string;
  /** One line, only where the specimen alone would be ambiguous. */
  description?: string;
  children: React.ReactNode;
  /** The source the preview was built from. Required: an example without it is a screenshot. */
  code: string;
  /**
   * How the specimen sits in its card.
   *
   *   inline  a row of small specimens, centred (the default for controls)
   *   block   stacked, filling the card's width
   *   grid    equally weighted cells
   *   stage   one full-width surface that needs room (a dialog, a table)
   */
  layout?: "inline" | "block" | "grid" | "stage";
  /** Start with the code visible. Use where the snippet *is* the point. */
  defaultOpen?: boolean;
  /** Padding of the specimen card. `none` when the specimen brings its own frame. */
  padding?: "default" | "none";
  /**
   * Extra classes for the specimen stage only.
   *
   * The rendering-`Demo` prop of the same name: a specimen that needs a
   * two-column grid at `lg`, or a fixed height, says so here — and the title,
   * the disclosure and the copy button underneath stay where they are. Kept
   * because the pages migrating from `Demo` use it, and the alternative is
   * another wrapper `<div>` inside every one of those examples, which puts
   * layout inside content on forty pages.
   */
  stageClassName?: string;
  className?: string;
}

export function Example({
  title,
  description,
  children,
  code,
  layout = "inline",
  defaultOpen = false,
  padding = "default",
  stageClassName,
  className,
}: ExampleProps) {
  const i18n = useOptionalI18n();
  const tcs = i18n?.tcs ?? ((source: string) => source);
  const [open, setOpen] = useState(defaultOpen);
  const panelId = useId();

  return (
    <section data-slot="example" className={cn("flex flex-col gap-2.5", className)}>
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <h3 className="font-display text-title text-fg-primary">{tcs(title)}</h3>
        {description ? (
          <p className="max-w-[68ch] text-caption text-fg-muted">{tcs(description)}</p>
        ) : null}
      </div>

      <div
        data-slot="example-stage"
        className={cn(
          "rounded-lg border border-line-subtle bg-surface-canvas",
          padding === "default" && "p-5",
          /* See the note on the grid case below: the same `min-w-0` floor keeps
           * an intrinsically wide specimen from setting the width of the page. */
          layout === "inline" && "flex flex-wrap items-center justify-center gap-3 [&>*]:min-w-0",
          layout === "block" && "flex flex-col gap-4 [&>*]:min-w-0",
          /*
           * `[&>*]:min-w-0` because a grid track takes its floor from its
           * items' min-content, and a specimen is allowed to contain something
           * intrinsically wide — a `ScrollArea` holding a `w-[44rem]` grid, a
           * marquee's loop, a table.
           *
           * `/components/pagination` is the case that found this: its "Both
           * axes" specimen holds a 704px inner grid, so the track became 704,
           * the sibling card stretched to match, and the whole page scrolled
           * sideways by 381px at a 390px viewport. Every specimen that wants to
           * scroll internally instead of pushing the document now can, without
           * forty pages each remembering a class.
           */
          layout === "grid" && "grid gap-4 [&>*]:min-w-0 sm:grid-cols-2 lg:grid-cols-3",
          layout === "stage" && "flex flex-col gap-4",
          stageClassName,
        )}
      >
        {/*
          * A specimen is translated where it is rendered, not where it is
          * written: a curated page builds its previews inside a client
          * component, so the frame is the first place that can reach the strings
          * they contain. A tree that arrives from a server component is opaque
          * here and is localized by the route that created it instead — applying
          * the rule twice is harmless, because a translated string no longer
          * matches the dictionary. See `lib/i18n/specimen.tsx`.
          */}
        {localizeSpecimen(children, tcs)}
      </div>

      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          aria-expanded={open}
          aria-controls={panelId}
          onClick={() => setOpen((next) => !next)}
          className={cn(
            "luc-transition luc-focus inline-flex h-control-sm items-center gap-2 rounded-sm px-2.5",
            "border border-line-default text-caption text-fg-secondary",
            "hover:border-line-strong hover:text-fg-primary",
          )}
        >
          <RiCodeLine aria-hidden="true" className="size-3.5" />
          {open ? tcs("Hide code") : tcs("Show code")}
        </button>
        <CopyButton value={code} label={tcs("Copy code")} />
      </div>

      {/*
        * The panel is always in the DOM — the disclosure only hides it — so the
        * `aria-controls` relationship holds and the copy button beside it can be
        * used without opening anything.
        */}
      <div id={panelId} hidden={!open}>
        <pre
          tabIndex={0}
          className="luc-table-scroll overflow-x-auto rounded-lg border border-line-subtle bg-surface-sunken px-3.5 py-3 font-mono text-caption leading-[1.7] text-fg-secondary"
        >
          <code>{code}</code>
        </pre>
      </div>
    </section>
  );
}
