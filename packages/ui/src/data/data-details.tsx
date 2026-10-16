"use client";

import { RiTableLine } from "@remixicon/react";
import { Button } from "../components/button";
import { Sheet, SheetBody, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "../components/sheet";
import { useMediaQuery } from "../hooks/use-media-query";
import { cn } from "../utils/cn";

/**
 * "Data" — the exact rows behind a surface, one click away and out of the way.
 *
 * A canvas or a heatmap is a *reading* of a dataset: it answers a question the
 * reader came with, and the exact rows answer a different one ("what was the
 * value on that date?"). Putting the second question's answer in the vertical
 * reading flow costs every reader a full-width disclosure after every chart —
 * which is what this control replaces.
 *
 * The control is *chrome*, not content: a compact trigger that belongs in a
 * surface's header, and a panel that is bounded to the viewport instead of
 * pushing the page down. Desktop opens a right-hand panel (`Sheet`, `side
 * "right"`), mobile a bottom one — the same primitive and the same focus trap,
 * Escape handling and focus restore, chosen by the browsing context rather than
 * by a per-domain branch.
 *
 * The panel content is the caller's: LUC UI decides *where* exact data lives,
 * never *what* it is. Nothing here recomputes, sorts, dedupes or formats a
 * served value — the table passed in is rendered as given.
 */
export interface DataDetailsProps {
  /** Panel heading — name the dataset, e.g. "Rolling 30-day return". */
  title: string;
  /** One line naming what the rows are and where they came from. */
  description?: string;
  /** The exact rows, rendered by the caller (usually a table). */
  children: React.ReactNode;
  /** Trigger text. Default `Data`. */
  label?: string;
  /** Panel size on the anchored edge. Default `xl`. */
  size?: "sm" | "md" | "lg" | "xl" | "full";
  className?: string;
  /** Extra hook for QA selectors; rendered on the trigger wrapper. */
  slot?: string;
}

export function DataDetails({
  title,
  description,
  children,
  label = "Data",
  size = "xl",
  className,
  slot,
}: DataDetailsProps) {
  // The browsing context decides the edge. The server snapshot is the desktop
  // panel, so the trigger is identical on both; the panel only ever exists on
  // the client (it is portalled on open), so there is no hydration mismatch.
  const narrow = useMediaQuery("(max-width: 767px)");

  return (
    <div data-slot={slot} className={cn("min-w-0", className)}>
      <Sheet>
        <SheetTrigger asChild>
          <Button size="sm" variant="ghost" leadingIcon={<RiTableLine />} aria-label={label}>
            {label}
          </Button>
        </SheetTrigger>
        {/*
          The panel keeps the primitive's own `data-slot="sheet"` hook — a
          consumer that styles or measures "the overlay panel" must find this
          one too — and marks itself as the exact-rows panel beside it.
        */}
        <SheetContent side={narrow ? "bottom" : "right"} size={size} data-details="true">
          <SheetHeader icon={<RiTableLine />}>
            <SheetTitle>{title}</SheetTitle>
            {description ? <SheetDescription>{description}</SheetDescription> : null}
          </SheetHeader>
          <SheetBody data-slot="data-details-body">{children}</SheetBody>
        </SheetContent>
      </Sheet>
    </div>
  );
}
