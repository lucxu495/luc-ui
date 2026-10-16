"use client";

/*
 * The way back to the collection a page belongs to.
 *
 * A reference product, a template and a studio are all reached *from* a
 * collection — `/experiences` lists sixteen products, `/templates` explains the
 * compositions they are made of, `/blocks` is Build's landing and lists the five
 * subareas. Every one of those details used to end the trail: the reader had a
 * sidebar that named the family and a browser Back button, and nothing on the
 * page that said "this is one of several".
 *
 * It is deliberately one line with a left arrow rather than another card or a
 * modal footer: the affordance is a fact about where you are, so it sits above
 * the page's own header, in the same place on every page that uses it.
 *
 * The label goes through `tn`, because it names a row that already exists in the
 * navigation — "All experiences" is the first row of the Experiences group — so
 * the link and the menu row it corresponds to can never disagree about the word.
 */

import Link from "next/link";
import { RiArrowLeftLine } from "@remixicon/react";
import { cn } from "@luc/ui";
import { useI18n } from "@/lib/i18n/provider";

export interface CollectionReturnProps {
  /** The collection's route — usually its navigation row's `href`. */
  to: string;
  /** Its navigation label, keyed by the same English source. */
  label: string;
  className?: string;
}

export function CollectionReturn({ to, label, className }: CollectionReturnProps) {
  const { tn, href } = useI18n();
  return (
    <Link
      href={href(to)}
      data-slot="collection-return"
      className={cn(
        "luc-focus luc-transition inline-flex items-center gap-1.5 rounded-xs text-caption text-fg-muted",
        "hover:text-fg-primary",
        className,
      )}
    >
      <RiArrowLeftLine aria-hidden="true" className="size-3.5" />
      {tn(label)}
    </Link>
  );
}
