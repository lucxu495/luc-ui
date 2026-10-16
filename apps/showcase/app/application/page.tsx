"use client";

import { Card, Code, Section, Text } from "@luc/ui";
import { DocPage } from "@/components/docs/doc-page";
import { PageHeader } from "@/components/docs/page-header";
import { EntryFooter } from "@/components/docs/entry-footer";
import { RelatedApi } from "@/components/docs/related-api";
import { Example } from "@/components/docs/example";
import { ImportLine } from "@/components/docs/family-imports";
import { DemoShell } from "@/components/shell/demo-shell";
import { useI18n } from "@/lib/i18n/provider";

/**
 * App shell.
 *
 * Two states of one component, side by side, at a bounded height. The point is
 * not the frame — it is that the frame, the rail mode, the sticky topbar, the
 * status strip and the off-canvas drawer are one system, so a product never
 * writes page-local shell CSS.
 */
export default function ApplicationPage() {
  const { tcs } = useI18n();
  return (
    <DocPage>
      <PageHeader
        eyebrow={tcs("Application")}
        title="App shell"
        lead="The application frame: a sidebar column, a sticky topbar, a scrolling main region and an optional status strip. It owns the landmarks, the skip link, the responsive switch to off-canvas navigation and the scroll model."
      />

      <ImportLine line={'import {\n  AppShell,\n  AppShellContent,\n  AppShellStatusBar,\n  AppShellTopbar,\n  SidebarContent,\n  SidebarFooter,\n  SidebarGroup,\n  SidebarGroupLabel,\n  SidebarHeader,\n  SidebarItem,\n  SidebarMenu,\n  SidebarToggle,\n} from "@luc/ui/app-shell";'} />

      {/*
        * The specimen is the real `AppShell` at a bounded height, which is the
        * only thing this page changes: a product passes `height="fill"` and the
        * shell takes its container. The snippet below is the composition the two
        * frames were built from — the wrapper that bounds them is Showcase-local
        * and is deliberately not what a reader copies.
        */}
      <Example
        title={tcs("Two states, one component")}
        description={tcs("Expanded is the default. The rail keeps the icons, keeps the labels as the accessible name, and reveals them with the existing tooltip. Ctrl/⌘ + B toggles it; the state persists locally, never in the URL.")}
        layout="stage"
        padding="none"
        stageClassName="grid gap-4 p-5 xl:grid-cols-2"
        code={`/* Both frames are one component. The doc frame only bounds the height. */
<AppShell
  height="fill"
  pathname={pathname}                  // router-agnostic: a string, not a router
  renderLink={(props) => <Link {...props} />}
  sidebarPersistKey="product:sidebar"  // the collapsed state survives a reload
  sidebar={
    <>
      <SidebarHeader>…</SidebarHeader>
      <SidebarContent ariaLabel="Sections">
        <SidebarGroup>
          <SidebarGroupLabel>Research</SidebarGroupLabel>
          <SidebarMenu>
            <SidebarItem label="Datasets" href="/datasets" />
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarToggle />                {/* the rail's only control */}
      </SidebarFooter>
    </>
  }
  topbar={<AppShellTopbar>…</AppShellTopbar>}
  statusBar={<AppShellStatusBar aria-label="Status">Updated 12:04 UTC</AppShellStatusBar>}
>
  <AppShellContent>{page}</AppShellContent>
</AppShell>

/* The rail is the same element — one prop, not a second layout.
   renderLink keeps the labels as the accessible name while the text is
   hidden, so a collapsed item is still announced by voice. */
<AppShell defaultSidebarCollapsed ... />`}
      >
        <div className="flex flex-col gap-2">
          <Text variant="caption" tone="muted">
            {tcs("Expanded")}
          </Text>
          <DemoShell title={tcs("Overview")} className="h-[22rem]">
            <p className="text-body text-fg-secondary">
              {tcs("Main content scrolls the page. The sidebar scrolls itself, and the topbar never moves.")}</p>
          </DemoShell>
        </div>
        <div className="flex flex-col gap-2">
          <Text variant="caption" tone="muted">
            {tcs("Collapsed rail")}
          </Text>
          <DemoShell defaultCollapsed title={tcs("Overview")} className="h-[22rem]">
            <p className="text-body text-fg-secondary">
              {tcs("Hover an icon for its label. A parent item with children expands the rail before it opens the tree, so nested navigation stays reachable.")}</p>
          </DemoShell>
        </div>
      </Example>

      <Section
        title={tcs("Composition")}
        description={tcs("The shell takes slots, not a configuration object. Sidebar contents, topbar, status bar and the mobile navigation are all ordinary nodes.")}
      >
        <Card variant="raised" className="p-0">
          <Code block>{`<AppShell
  pathname={pathname}          // router-agnostic: a string, not a router
  renderLink={(props) => <Link {...props} />}
  sidebarPersistKey="product:sidebar"
  sidebar={
    <>
      <SidebarHeader>…</SidebarHeader>
      <SidebarContent ariaLabel="Sections">
        <SidebarGroup>
          <SidebarGroupLabel>Research</SidebarGroupLabel>
          <SidebarMenu>
            <SidebarItem label="Datasets" href="/datasets" />
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>…</SidebarFooter>
    </>
  }
  topbar={
    <AppShellTopbar>
      <AppShellMobileTrigger />
      <Breadcrumbs items={trail} />
    </AppShellTopbar>
  }
  statusBar={<AppShellStatusBar>Updated 12:04 UTC</AppShellStatusBar>}
>
  <AppShellContent>{page}</AppShellContent>
</AppShell>`}</Code>
        </Card>
      </Section>

      <Section
        title={tcs("What the shell owns")}
        description={tcs("Everything below is a rule, not a preference: a product that follows them cannot produce a shell that fights the system.")}
      >
        <div className="grid gap-3 md:grid-cols-2">
          <Card variant="default" className="flex flex-col gap-2">
            <Text variant="label">Landmarks and keyboard</Text>
            <ul className="flex flex-col gap-1.5 text-caption text-fg-secondary">
              <li>{tcs("One named navigation landmark per sidebar (the scrolling region is the nav).")}</li>
              <li>{tcs("One main region, one header, one optional status strip.")}</li>
              <li>{tcs("A skip link that is visually hidden until focused and lands on main.")}</li>
              <li>{tcs("Focus returns to the trigger when the mobile drawer closes.")}</li>
            </ul>
          </Card>
          <Card variant="default" className="flex flex-col gap-2">
            <Text variant="label">Scroll model</Text>
            <ul className="flex flex-col gap-1.5 text-caption text-fg-secondary">
              <li>{tcs("Sidebar: its own scroll region, so a long nav never moves the page.")}</li>
              <li>{tcs("Topbar: sticky, opaque, one hairline underneath — never translucent.")}</li>
              <li>{tcs("Main: the document scrolls by default; a workspace pane scrolls itself.")}</li>
              <li>{tcs("Status strip: fixed, and it scrolls sideways rather than wrapping.")}</li>
            </ul>
          </Card>
        </div>
      </Section>
      <RelatedApi ids={["app-shell", "navigation", "workspace", "url-state", "outline-drawer"]} />
      <EntryFooter />
    </DocPage>
  );
}
