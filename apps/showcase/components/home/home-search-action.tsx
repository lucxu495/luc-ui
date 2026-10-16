"use client";

/*
 * The front door's search action.
 *
 * A client island because it *does* something: it opens the Showcase's global
 * command palette, which is the same control the header's trigger and ⌘K open.
 * A server component could not, and the alternative — a link to a page that has
 * a search field on it — is the misleading button the brief forbids.
 *
 * It renders as a button rather than a link, and that is honest: nothing about it
 * navigates. The `⌘K` hint is inside the control so the keyboard shortcut is
 * discoverable from the one place a first-time reader is looking.
 *
 * If there is no launcher — the component used outside the Showcase's frame — the
 * button is replaced by a link to the one page that does have a search field, so
 * the control never sits there doing nothing.
 */

import Link from "next/link";
import { Kbd, buttonVariants } from "@luc/ui";
import { RiSearchLine } from "@remixicon/react";
import { useSearchLauncher } from "@/components/shell/search-context";
import { useI18n } from "@/lib/i18n/provider";

export function HomeSearchAction() {
  const { tcs, href } = useI18n();
  const launcher = useSearchLauncher();

  if (!launcher) {
    return (
      <Link href={href("/explore")} className={buttonVariants({ variant: "ghost", size: "lg" })}>
        {tcs("Search the catalog")}
      </Link>
    );
  }

  return (
    <button
      type="button"
      onClick={launcher.openSearch}
      data-slot="home-search-action"
      className={buttonVariants({ variant: "ghost", size: "lg" })}
    >
      <RiSearchLine aria-hidden="true" className="size-4" />
      {tcs("Search")}
      <Kbd className="ml-1">⌘K</Kbd>
    </button>
  );
}
