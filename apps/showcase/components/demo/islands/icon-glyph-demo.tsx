"use client";

/*
 * `Icon`'s `icon` prop, demonstrated — and the one thing that cannot be shown
 * from a server component.
 *
 * `Icon` is a client component, and `icon` takes the glyph *component itself*
 * (`icon={RiStarLine}`). Passing that from a server-rendered specimen is not a
 * style question: React refuses to serialise a function across the RSC boundary,
 * and the page fails with "Functions cannot be passed directly to Client
 * Components" — measured on `/components/icon` and `/components/link`, which is
 * how this island came to exist.
 *
 * A consumer writing a client component does not hit that boundary, which is why
 * the API is documented this way and why the specimen lives here rather than in
 * the demo registry: the demo file is data read by a server component, and this
 * is the smallest client module that can honestly show the prop.
 *
 * `name="…"` needs no island at all — the wrapper resolves the glyph on the
 * server — so the rest of the Icon specimens stay plain data.
 */

import { Icon } from "@luc/ui";
import { RiRefreshLine, RiShareLine, RiStarLine } from "@remixicon/react";

export function IconGlyphDemo() {
  return (
    <div className="flex flex-wrap items-center gap-4">
      <Icon icon={RiStarLine} size="lg" tone="warning" />
      <Icon icon={RiShareLine} size="lg" tone="muted" />
      <Icon icon={RiRefreshLine} size="lg" tone="accent" spin />
    </div>
  );
}
