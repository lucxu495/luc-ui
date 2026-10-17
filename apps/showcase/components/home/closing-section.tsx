/*
 * The closing statement.
 *
 * A homepage that ends with a card grid ends by listing; this one ends by saying
 * what the project is and where it currently stands. The standing is stated
 * plainly because it is a fact a visitor would otherwise have to discover: the
 * library is public on GitHub, installable from an immutable Git tag, not yet
 * published to a package registry, and carries no paid tier. Saying so is more
 * useful than a badge claiming a star count.
 */

import Link from "next/link";
import { Inline, Text, buttonVariants } from "@luc/ui";
import { getServerCopy } from "@/lib/i18n/server";

export async function HomeClosing() {
  const { tcs, href } = await getServerCopy();

  return (
    <section
      data-testid="home-closing"
      className="flex flex-col gap-6 border-t border-line-strong pt-10"
    >
      <p className="max-w-[46ch] font-display text-[clamp(1.8rem,3.4vw,3rem)] leading-[1.05] font-semibold tracking-[-0.034em] text-fg-primary text-balance">
        {tcs("Build with a system that shows you how it is built.")}
      </p>
      <Text variant="caption" tone="muted" className="max-w-[70ch]">
        {tcs(
          "Luc UI is public on GitHub. Version 1.0.0 installs from an immutable Git tag; registry publication is still pending, and there is no paid tier. The installation guide shows the exact commands that work today.",
        )}
      </Text>
      <Inline gap="sm" wrap>
        <Link href={href("/docs/installation")} className={buttonVariants({ variant: "primary" })}>
          {tcs("Read the installation guide")}
        </Link>
        <Link href={href("/docs")} className={buttonVariants({ variant: "outline" })}>
          {tcs("Read the documentation")}
        </Link>
      </Inline>
    </section>
  );
}
