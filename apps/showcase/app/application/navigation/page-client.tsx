"use client";

/*
 * The body of the AppShell page.
 *
 * Three layers, and the page keeps them apart on purpose, because mixing them is
 * the mistake it exists to prevent:
 *
 *   1. `AppShell` is *layout*. It owns the landmarks, the skip link, the scroll
 *      model and the responsive switch to a drawer. It knows nothing about routes.
 *   2. The navigation *model* is data — `NavigationGroup[]` — and the sidebar, the
 *      mobile drawer and the command palette are three views derived from it, so a
 *      page cannot exist in one surface and be missing from another.
 *   3. Routing is *injected*. An item has an `href`; `renderLink`, `pathname` and
 *      `onNavigate` are how the product says what an href means.
 *
 * The order is the order a reader builds a shell in: the frame, then the tree it
 * renders, then what the model derives, then the adapter. What the page used to do
 * was explain the model first and show the frame never — a reader who wanted an
 * application shell had to scroll past three architecture paragraphs to find out
 * that `AppShell` existed at all.
 */

import { useMemo, useState, type ReactNode } from "react";
import {
  Badge,
  Button,
  Card,
  Code,
  Heading,
  SearchInput,
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarItem,
  SidebarMenu,
  SidebarProvider,
  Text,
  filterNavigation,
  flattenNavigation,
  navigationCommandEntries,
} from "@luc/ui";
import { DocPage } from "@/components/docs/doc-page";
import { PageHeader } from "@/components/docs/page-header";
import { ImportLine } from "@/components/docs/family-imports";
import { Example } from "@/components/docs/example";
import { CodeBlock } from "@/components/docs/code-block";
import { GuidanceCards } from "@/components/docs/guidance";
import { EntryFooter } from "@/components/docs/entry-footer";
import { DemoShell, demoGroups } from "@/components/shell/demo-shell";
import { ENTRY_NOTES } from "@/lib/docs/curation/notes";
import { useI18n } from "@/lib/i18n/provider";

const SHELL_CODE = [
  `<AppShell`,
  `  height="fill"`,
  `  pathname={pathname}                 // a string, not a router`,
  `  renderLink={(props) => <Link {...props} />}`,
  `  onNavigate={closeDrawer}`,
  `  sidebarCollapsed={collapsed}        // controlled, or leave it out`,
  `  onSidebarCollapsedChange={setCollapsed}`,
  `  sidebarPersistKey="product:sidebar" // the rail survives a reload`,
  `  sidebar={`,
  `    <>`,
  `      <SidebarHeader>…</SidebarHeader>`,
  `      <SidebarContent ariaLabel="Sections">`,
  `        <SidebarGroup>`,
  `          <SidebarGroupLabel>Overview</SidebarGroupLabel>`,
  `          <SidebarMenu>`,
  `            <SidebarItem label="Datasets" href="/datasets" icon={<RiDatabase2Line />}>`,
  `              <SidebarItem label="Prices" href="/datasets/prices" />`,
  `            </SidebarItem>`,
  `            <SidebarItem label="Billing" disabled />`,
  `          </SidebarMenu>`,
  `        </SidebarGroup>`,
  `      </SidebarContent>`,
  `      <SidebarFooter>`,
  `        <SidebarToggle />`,
  `      </SidebarFooter>`,
  `    </>`,
  `  }`,
  `  topbar={`,
  `    <AppShellTopbar>`,
  `      <AppShellMobileTrigger />`,
  `      <Breadcrumbs items={[{ label: "Luc UI", href: "/" }, { label: "Overview" }]} />`,
  `    </AppShellTopbar>`,
  `  }`,
  `  statusBar={<AppShellStatusBar>Updated 12:04 UTC</AppShellStatusBar>}`,
  `>`,
  `  <AppShellContent>…</AppShellContent>`,
  `</AppShell>`,
].join("\n");

const FILTER_CODE = [
  `const groups = filterNavigation(navigation, query);`,
  ``,
  `<SidebarProvider collapsible={false} shortcut={false}>`,
  `  <SidebarContent ariaLabel="Sections">`,
  `    {groups.map((group) => (`,
  `      <SidebarGroup key={group.id}>`,
  `        <SidebarGroupLabel>{group.label}</SidebarGroupLabel>`,
  `        <SidebarMenu>`,
  `          {group.items.map((item) => (`,
  `            <SidebarItem key={item.id} label={item.label} href={item.href} icon={item.icon} />`,
  `          ))}`,
  `        </SidebarMenu>`,
  `      </SidebarGroup>`,
  `    ))}`,
  `  </SidebarContent>`,
  `</SidebarProvider>`,
].join("\n");

const DERIVE_CODE = [
  `// The palette's list is derived, never hand-written.`,
  `const entries = navigationCommandEntries(navigation, [`,
  `  { id: "copy-view", label: "Copy view link", action: copyView },`,
  `]);`,
  ``,
  `entries.map((entry) => (`,
  `  <CommandItem key={entry.id} value={entry.haystack} onSelect={() => run(entry)}>`,
  `    {entry.label}`,
  `  </CommandItem>`,
  `))`,
].join("\n");

const ROUTER_CODE = [
  `<AppShell`,
  `  pathname={usePathname()}`,
  `  renderLink={(props) => <Link {...props} />}`,
  `  onNavigate={(href) => analytics.track("nav", href)}`,
  `/>`,
  ``,
  `// With no adapter at all the default renders a real anchor, so middle-click,`,
  `// "open in a new tab" and the browser's own link preview keep working.`,
].join("\n");

const PATH_CODE = [
  `const groups = filterNavigation(navigation, "prices");`,
  `// The Datasets parent survives the filter; nothing else does.`,
  ``,
  `isNavigationItemActive("/charts/timeseries", "/charts");`,
  `// true`,
  ``,
  `isNavigationItemActive("/charts-archive", "/charts");`,
  `// false — the boundary is a path segment, not a prefix`,
  ``,
  `findActiveNavigationItem(groups, pathname);`,
  `// the most specific ancestor`,
].join("\n");

export function NavigationPage({ apiSection }: { apiSection?: ReactNode }) {
  const { tcs } = useI18n();
  const notes = ENTRY_NOTES["app-shell"];
  const [query, setQuery] = useState("");
  const [collapsed, setCollapsed] = useState(false);
  const groups = useMemo(() => filterNavigation(demoGroups, query), [query]);
  const commands = useMemo(() => navigationCommandEntries(demoGroups), []);
  const flattened = useMemo(() => flattenNavigation(demoGroups), []);

  return (
    <DocPage>
      <PageHeader
        eyebrow={tcs("Navigation")}
        title="AppShell"
        lead="The landmarks of a product — a sidebar column, a sticky topbar, a scrolling main region and an optional status strip — plus the navigation model that fills them."
      />

      <section className="flex flex-col gap-5">
        <Heading size="title" as="h2" id="examples">
          {tcs("Examples")}
        </Heading>

        <Example
          title={tcs("The standard shell")}
          description={tcs(
            "The real component at a bounded height: sidebar, topbar, content and status bar are the same frame the Showcase itself runs in. Push the rail on the edge, or the toggle in the sidebar footer, and the column becomes a rail with every label kept as an accessible name; below 1024px the column gives way to the drawer in the topbar. Ctrl/⌘ + B is off here so the demo cannot fight the Showcase's own shell.",
          )}
          layout="stage"
          padding="none"
          stageClassName="p-5"
          code={SHELL_CODE}
        >
          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center gap-3">
              <Button size="sm" variant="secondary" onClick={() => setCollapsed((value) => !value)}>
                {collapsed ? tcs("Expand the sidebar") : tcs("Collapse the sidebar")}
              </Button>
              <Text variant="caption" tone="muted">
                {collapsed ? tcs("The rail is on.") : tcs("The column is on.")}
              </Text>
            </div>
            <DemoShell
              className="h-[26rem]"
              collapsed={collapsed}
              onCollapsedChange={setCollapsed}
              mobileTrigger
              breadcrumbs={[{ label: tcs("Overview") }]}
              title={tcs("Overview")}
            />
          </div>
        </Example>

        <Example
          title={tcs("Filtering the model")}
          description={tcs(
            "The same tree the sidebar renders, filtered as the reader types. A parent survives when one of its children matches, so a search never hides the way to the page it found — and the function that drives this demo is the one the Showcase sidebar calls.",
          )}
          layout="block"
          code={FILTER_CODE}
        >
          <div className="grid w-full grid-cols-[minmax(0,1fr)] items-start gap-5 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)]">
            <div className="flex min-h-0 flex-col gap-4">
              <SearchInput
                size="sm"
                placeholder={tcs("Filter the tree…")}
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                aria-label={tcs("Filter the demo navigation")}
              />
              <SidebarProvider shortcut={false} collapsible={false}>
                <div className="max-h-[26rem] overflow-hidden rounded-lg border border-line-subtle bg-surface-sunken">
                  <Sidebar>
                    <SidebarContent ariaLabel={tcs("Filtered demo navigation")}>
                      {groups.length === 0 ? (
                        <Text variant="caption" tone="muted" className="px-2">
                          {tcs("Nothing matches that filter.")}
                        </Text>
                      ) : null}
                      {groups.map((group) => (
                        <SidebarGroup key={group.id}>
                          <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
                          <SidebarMenu>
                            {group.items.map((item) => (
                              <SidebarItem
                                key={item.id}
                                label={item.label}
                                href={item.href}
                                icon={item.icon}
                                badge={item.badge}
                              >
                                {item.children
                                  ? item.children.map((child) => (
                                      <SidebarItem
                                        key={child.id}
                                        label={child.label}
                                        href={child.href}
                                      />
                                    ))
                                  : undefined}
                              </SidebarItem>
                            ))}
                          </SidebarMenu>
                        </SidebarGroup>
                      ))}
                    </SidebarContent>
                  </Sidebar>
                </div>
              </SidebarProvider>
            </div>

            <Card variant="raised" className="flex flex-col gap-3">
              <Text variant="label">{tcs("Filtering keeps the path")}</Text>
              <Text variant="caption" tone="muted">
                {tcs(
                  "The model is data, so everything that reads it is a pure function: filter it, flatten it, or turn it into command entries without keeping a second copy of the routes.",
                )}
              </Text>
              <Code block>{PATH_CODE}</Code>
            </Card>
          </div>
        </Example>

        <Example
          title={tcs("What the model derives")}
          description={tcs(
            "Every navigable item, depth-first, with a pre-computed lowercase haystack for matching. The command palette does not keep its own copy of the routes; extras are for actions that are not navigation — copy the view, switch the theme, run a job.",
          )}
          layout="block"
          code={DERIVE_CODE}
        >
          <div className="flex w-full flex-col gap-3">
            <ul className="grid gap-1.5 sm:grid-cols-2">
              {flattened.map((item) => (
                <li
                  key={item.id}
                  className="flex items-center justify-between gap-2 rounded-sm border border-line-subtle bg-surface-default px-2.5 py-1.5"
                >
                  <span className="text-label text-fg-secondary">{item.label}</span>
                  <span className="luc-numeric text-micro text-fg-muted">
                    {item.href ?? "action"}
                  </span>
                </li>
              ))}
            </ul>
            <Text variant="caption" tone="muted">
              {tcs("{commands} command entries derived from {items} navigation items.")
                .replace("{commands}", String(commands.length))
                .replace("{items}", String(flattened.length))}
            </Text>
          </div>
        </Example>

        <Example
          title={tcs("Routing is injected, not imported")}
          description={tcs(
            "The library never imports a router. Three props say what an href means, which location is current, and what happens when someone follows one — which is the whole integration, for Next, React Router or a plain anchor.",
          )}
          layout="block"
          code={ROUTER_CODE}
        >
          <div className="flex w-full flex-col gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <Badge size="sm" tone="neutral">
                Next
              </Badge>
              <Badge size="sm" tone="neutral">
                React Router
              </Badge>
              <Badge size="sm" tone="neutral">
                Plain anchor
              </Badge>
            </div>
            <Text variant="caption" tone="muted">
              {tcs(
                "Every link in the frames above is a real anchor to a real route. That is the default, not the adapter.",
              )}
            </Text>
          </div>
        </Example>
      </section>

      <section className="flex flex-col gap-3">
        <Heading size="title" as="h2" id="usage">
          {tcs("Usage")}
        </Heading>
        <ImportLine
          line={`import {
  AppShell,
  AppShellContent,
  AppShellStatusBar,
  AppShellTopbar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarItem,
  SidebarMenu,
  SidebarToggle,
} from "@luc/ui/app-shell";`}
        />
        {notes?.usage?.code ? (
          <CodeBlock code={notes.usage.code} label={tcs("Copy the minimal call")} />
        ) : null}
        {notes?.usage?.note ? (
          <Text variant="caption" tone="muted" as="p" className="max-w-[68ch]">
            {tcs(notes.usage.note)}
          </Text>
        ) : null}
      </section>

      {apiSection}

      <section className="flex flex-col gap-4">
        <Heading size="title" as="h2" id="guidelines">
          {tcs("Guidelines")}
        </Heading>
        <GuidanceCards use={notes?.guidance?.use ?? []} avoid={notes?.guidance?.avoid ?? []} tcs={tcs} />
        {notes?.accessibility?.detail ? (
          <div className="flex flex-col gap-1.5">
            <Heading size="title" as="h3">
              {tcs("Accessibility")}
            </Heading>
            <Text variant="body" tone="muted" as="p" className="max-w-[68ch]">
              {tcs(notes.accessibility.detail)}
            </Text>
          </div>
        ) : null}
      </section>

      {/*
        * Two registry rows share this route: `app-shell`, and the reference row for
        * the navigation model. The footer names the module's own entry and offers
        * the two Navigation pages a shell is most often built with.
        */}
      <EntryFooter entryId="app-shell" related={["tabs", "pagination"]} />
    </DocPage>
  );
}
