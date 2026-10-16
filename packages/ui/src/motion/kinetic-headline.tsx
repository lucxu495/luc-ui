"use client";

import { AnimatePresence, motion } from "motion/react";
import { cn } from "../utils/cn";
import { useMotionProfile } from "./intensity";
import { easing } from "./tokens";

export type KineticHeadlineMode = "reveal" | "swap";
export type KineticHeadlineTag = "h1" | "h2" | "h3" | "p" | "span" | "div";

/**
 * Split a headline into units that can be laid out independently.
 *
 * `text.split(/\s+/)` is a Latin-only assumption, and it broke Chinese: a
 * sentence with no spaces is one unit, every unit is rendered
 * `inline-block whitespace-pre` so it cannot wrap, and 19 characters of Chinese
 * became a **501px span inside a 339px headline** — 131px of horizontal scroll on
 * the mobile home page (`/zh` at 390px). Nothing looked wrong on an English page,
 * which is why it survived every previous check.
 *
 * `Intl.Segmenter` knows where a language's word boundaries are, so Chinese gets
 * real units (and therefore a real stagger). The separators are kept *inside* the
 * preceding unit — whitespace is part of the text, not something the component
 * may invent — so the rendered string is byte-for-byte the string that was passed
 * in, in either language. The fallback keeps the old behaviour for a runtime with
 * no segmenter.
 */
function segmentUnits(text: string): string[] {
  const segmenter =
    typeof Intl !== "undefined" && "Segmenter" in Intl
      ? new Intl.Segmenter(undefined, { granularity: "word" })
      : null;
  const units: string[] = [];
  /*
   * A word starts a unit — unless the segment before it binds to it.
   *
   * `Intl.Segmenter` reports `data`, `-`, `heavy` for `data-heavy`, and a plain
   * "start a unit at every word" rule animates a hyphen on its own. A hyphen or an
   * apostrophe inside a word is therefore *binding*: the word that follows it
   * joins the same unit. Everything else — a space, a Chinese comma — simply
   * attaches to the unit it follows, and the next word begins the next unit. That
   * gives "data-heavy" one unit and "指针，"  one unit, with the rendered string
   * still exactly the string that came in.
   */
  let binding = false;
  const push = (part: string, wordLike: boolean) => {
    if (!part) return;
    const joins = units.length > 0 && (!wordLike || binding);
    if (joins) units[units.length - 1] += part;
    else units.push(part);
    binding = !wordLike && /^['’\u2010-\u2015-]+$/.test(part);
  };
  if (segmenter) {
    for (const part of segmenter.segment(text)) push(part.segment, part.isWordLike === true);
  } else {
    for (const part of text.match(/\s+|\S+/g) ?? []) push(part, part.trim().length > 0);
  }
  return units.length > 0 ? units : [text];
}

export interface KineticHeadlineProps extends Omit<React.ComponentPropsWithRef<"h2">, "children"> {
  /** The headline. Changing it animates the change; it is the only content. */
  text: string;
  /** How the words arrive. `reveal` assembles, `swap` replaces in place. */
  mode?: KineticHeadlineMode;
  /** Seconds between consecutive words. */
  stagger?: number;
  /** Announce the new text politely when it changes (a live headline). */
  live?: boolean;
  /** Element to render. Defaults to `h2`; the caller owns the type scale. */
  as?: KineticHeadlineTag;
}

/**
 * LUC `KineticHeadline` — typography that acknowledges a change instead of
 * snapping to it.
 *
 * Its reason to exist is *layout-aware text transitions*: a headline that
 * swaps from one sentence to another with a direction, a stagger and a shared
 * reading rhythm, rather than a hard cut. Real uses are a rotating value
 * proposition, a step title in a wizard, a live status line, a chart caption
 * that follows the selected series.
 *
 * The rules it follows:
 *
 *  1. **The accessible text is one string.** The animated layer is
 *     `aria-hidden`, and a visually-hidden copy carries the text, so a screen
 *     reader never hears "Revenue" spelled across nine spans.
 *  2. **Text stays text.** Words are real text nodes — selectable, searchable,
 *     and translatable — not images or per-character canvases.
 *  3. **It is a headline, not a toy.** Word granularity keeps the element count
 *     sane, and the whole animation is `transform` + `opacity` on the compositor.
 *     "Word" is decided by `Intl.Segmenter`, so it means the language's words: a
 *     Latin sentence is a handful of units, and a Chinese one is more, because
 *     Chinese writes no spaces and its words are shorter. That is the honest cost
 *     of animating the same sentence in two writing systems; a space-only split
 *     made Chinese an unbreakable 500px span instead.
 *  4. **Reduced motion renders the plain string**, because the meaning of a
 *     headline is the words, not the paragraph of motion around them.
 */
export function KineticHeadline({
  text,
  mode = "reveal",
  stagger = 0.045,
  live = false,
  as: Tag = "h2",
  className,
  ...props
}: KineticHeadlineProps) {
  const profile = useMotionProfile();
  const animate = profile.ambient && profile.intensity !== "none";
  const words = segmentUnits(text);
  const offset = mode === "swap" ? 12 : 20;

  const word = {
    hidden: { opacity: 0, y: offset },
    visible: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: mode === "swap" ? -offset : 0 },
  } as const;

  return (
    <Tag data-slot="kinetic-headline" className={cn("relative", className)} {...props}>
      <span data-slot="kinetic-accessible" className="sr-only" aria-live={live ? "polite" : "off"}>
        {text}
      </span>
      <span aria-hidden="true" className="block">
        <AnimatePresence initial={false} mode="wait">
          <motion.span
            key={text}
            className="block"
            initial={animate ? "hidden" : false}
            animate="visible"
            exit={animate ? "exit" : undefined}
            transition={animate ? { duration: 0.34, ease: easing.enter, staggerChildren: stagger } : { duration: 0 }}
          >
            {words.map((value, index) => (
              <motion.span
                key={`${index}-${value}`}
                data-slot="kinetic-word"
                /*
                 * `pre-wrap` + `break-words` is the belt to the segmenter's
                 * braces: a unit that is still wider than its line — a long URL, a
                 * language the segmenter does not split — wraps inside its own box
                 * instead of pushing the document sideways.
                 */
                className="inline-block max-w-full whitespace-pre-wrap break-words"
                variants={animate ? word : undefined}
              >
                {value}
              </motion.span>
            ))}
          </motion.span>
        </AnimatePresence>
      </span>
    </Tag>
  );
}
