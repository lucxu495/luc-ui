/*
 * The server half of this page.
 *
 * The API reference is read from the documentation registry, which carries the
 * compiler's own reading of the published package — and is far too large to ship
 * to a browser. So the page stays a client component and the table arrives as a
 * node, already rendered. Delivered JavaScript for the API data: zero bytes.
 */

import { EntryApiSection } from "@/components/docs/entry-api";
import { ENTRY_NOTES } from "@/lib/docs/curation/notes";
import { NavigationPage } from "./page-client";

export default function Page() {
  return (
    <NavigationPage
      apiSection={
        /*
         * Five registry rows, one API area.
         *
         * `@luc/ui/app-shell` is one import that publishes the shell, the sidebar
         * parts, the breadcrumbs and the page header — four registry rows, three
         * of them reference rows documented on this page rather than on pages of
         * their own — and `navigation` is the model the sidebar is rendered from.
         * Naming all five ids here is what makes `SidebarItem`'s, `Breadcrumbs`'
         * and `useNavigation`'s props reachable: they are published by the
         * package, and before this they appeared in no table anywhere on the
         * site.
         *
         * `primary` is what keeps that honest rather than overwhelming — the two
         * components a reader came for are open, and the sub-surface (the group,
         * the rail, the toggle, the breadcrumb parts, the header meta) is folded
         * behind a native disclosure, every prop still on the page and still
         * compiled. "Exports" is the heading rather than "API" because there are
         * four export tables, one per module.
         */
        <EntryApiSection
          entryId={["app-shell", "sidebar", "breadcrumbs", "page-header", "navigation"]}
          heading="Exports"
          primary={["AppShell", "Sidebar", "SidebarItem", "Breadcrumbs", "PageHeader", "NavigationProvider"]}
          {...(ENTRY_NOTES["app-shell"]?.api?.note
            ? { note: ENTRY_NOTES["app-shell"].api.note }
            : {})}
        />
      }
    />
  );
}
