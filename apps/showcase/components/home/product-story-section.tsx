"use client";

/*
 * The product story: the four rules the library is built on.
 *
 * A homepage that only shows components describes a catalogue. This section says
 * what the catalogue is *for*, in the four rules that actually decide how the
 * library is built — and that a reader can hold the library to. Each rule is
 * checkable against a real page: a component's source uses semantic tokens, the
 * chart pages render prepared data, and so on.
 *
 * Nothing here is a claim about scale ("fast", "powerful"), because a claim about
 * scale ages badly and cannot be verified by looking at the page.
 *
 * Phase 10A changed the *form*: four bordered cards became one hairline field
 * divided into four cells, and the decorative `01–04` markers were removed because
 * these principles are a set, not a sequence. The sentences are unchanged — they
 * are the copy that was already reviewed and translated.
 */

import { Callout, Heading, Section, Text } from "@luc/ui";
import { useI18n } from "@/lib/i18n/provider";

export function HomeProductStory() {
  const { tcs } = useI18n();

  return (
    <Section
      data-testid="home-story"
      className="border-t border-line-subtle pt-10"
      title={tcs("What this system believes")}
      description={tcs(
        "Four rules decide every component in the library — and every page that documents it.",
      )}
    >
      <div className="grid gap-px overflow-hidden rounded-xl border border-line-subtle bg-line-subtle sm:grid-cols-2 xl:grid-cols-4">
        {PRINCIPLES.map((principle) => (
          <div key={principle.title} className="flex flex-col gap-2 bg-surface-default p-5">
            <Heading size="title" as="h3">
              {tcs(principle.title)}
            </Heading>
            <Text variant="caption" tone="muted">
              {tcs(principle.body)}
            </Text>
          </div>
        ))}
      </div>

      <Callout tone="neutral" title={tcs("How to read a component page")}>
        <Text variant="caption" tone="muted">
          {tcs(
            "Each page opens with what the component is for, then a live example, the real import path, the API from the generated catalog and what it does not do.",
          )}
        </Text>
      </Callout>
    </Section>
  );
}

interface Principle {
  title: string;
  body: string;
}

const PRINCIPLES: Principle[] = [
  {
    title: "Tokens come before components",
    body: "Three layers — core, semantic and utility — so a component never names a colour or a size directly.",
  },
  {
    title: "Dark mode is the reference",
    body: "The dark theme is designed first; the light theme is an independent design, never an inversion.",
  },
  {
    title: "The interface never computes",
    body: "Charts and tables render values the caller prepared; indicators, factors and backtests stay in the data layer.",
  },
  {
    title: "Documentation stays honest",
    body: "Where a component cannot express something, its page says so instead of quietly faking the result.",
  },
];
