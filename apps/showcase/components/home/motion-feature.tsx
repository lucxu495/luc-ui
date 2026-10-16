"use client";

/*
 * The homepage's motion section.
 *
 * Motion is the easiest thing for a UI library to overdo, so the demonstration
 * here is deliberately *user-triggered*: the visitor picks a sentence and the
 * headline swaps to it through the library's own stagger. Nothing animates on its
 * own, which also means nothing here runs foul of "pause, stop, hide", and the
 * library renders the plain string under `prefers-reduced-motion`.
 */

import Link from "next/link";
import { useState } from "react";
import { Heading, KineticHeadline, SegmentedControl, SegmentedItem, Text } from "@luc/ui";
import { useI18n } from "@/lib/i18n/provider";

const PHRASES = [
  { id: "answer", text: "Motion answers a pointer. Nothing moves on its own." },
  { id: "switch", text: "Every effect has a duration, an easing and an off switch." },
  { id: "reduce", text: "Reduced motion renders the final state, not a slower one." },
] as const;

export function HomeMotionFeature() {
  const { tcs, href } = useI18n();
  const [active, setActive] = useState<string>(PHRASES[0].id);
  const phrase = PHRASES.find((entry) => entry.id === active) ?? PHRASES[0];

  return (
    <section
      data-testid="home-motion"
      className="grid gap-8 border-t border-line-subtle pt-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,22rem)] lg:gap-12"
    >
      <div className="flex min-w-0 flex-col gap-5">
        <KineticHeadline
          as="p"
          mode="swap"
          stagger={0.05}
          live
          text={tcs(phrase.text)}
          className="font-display text-[clamp(1.6rem,3vw,2.6rem)] leading-[1.15] font-semibold tracking-[-0.03em] text-fg-primary text-balance"
        />
        <SegmentedControl
          size="sm"
          aria-label={tcs("Choose a sentence")}
          value={active}
          onValueChange={(next) => next && setActive(next as string)}
        >
          <SegmentedItem size="sm" value="answer">
            {tcs("Pointer")}
          </SegmentedItem>
          <SegmentedItem size="sm" value="switch">
            {tcs("Off switch")}
          </SegmentedItem>
          <SegmentedItem size="sm" value="reduce">
            {tcs("Reduced motion")}
          </SegmentedItem>
        </SegmentedControl>
      </div>

      <div className="flex flex-col gap-3">
        <Heading size="heading" as="h2">
          {tcs("Motion with an off switch")}
        </Heading>
        <Text variant="caption" tone="muted" className="text-pretty">
          {tcs(
            "Changing the sentence is a real transition through the library's own stagger. Turn motion down in the header and the same change becomes an instant swap, which is what a reader who asked for less motion should get.",
          )}
        </Text>
        <Link href={href("/motion")} className="rounded-sm text-caption text-fg-accent underline luc-focus">
          {tcs("Open the motion gallery")}
        </Link>
      </div>
    </section>
  );
}
