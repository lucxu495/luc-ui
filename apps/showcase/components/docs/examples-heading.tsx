"use client";

import { Heading } from "@luc/ui";
import { useOptionalI18n } from "@/lib/i18n/provider";

/**
 * The `Examples` heading a hand-written page needs above its first specimen.
 *
 * The registry-rendered pages always had it. The curated pages printed their
 * examples directly under the lead, so the canonical section order held in the
 * outline only for half the site — and the "On this page" rail had no `#examples`
 * anchor on those pages. One component, one line per page, and the rail, the
 * heading level and the Chinese label are consistent again.
 */
export function ExamplesHeading() {
  const i18n = useOptionalI18n();
  const tcs = i18n?.tcs ?? ((source: string) => source);
  return (
    <Heading size="title" as="h2" id="examples">
      {tcs("Examples")}
    </Heading>
  );
}
