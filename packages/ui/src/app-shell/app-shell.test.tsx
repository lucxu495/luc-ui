import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { createMemoryStorage } from "../utils/storage";
import { LucProvider } from "../providers/luc-provider";
import {
  AppShell,
  AppShellContent,
  AppShellMobileTrigger,
  AppShellTopbar,
} from "./app-shell";
import { Breadcrumbs } from "./breadcrumbs";
import { PageHeader } from "./page-header";
import { SidebarContent, SidebarGroup, SidebarItem, SidebarMenu } from "./sidebar";
import type { NavigationLinkProps } from "./navigation-context";

function Link({ href, children, ...props }: NavigationLinkProps) {
  return (
    <a
      href={href}
      data-testid="adapter-link"
      {...props}
      onClick={(event) => {
        // A real router calls the consumer's handler first, then suppresses the
        // full-page navigation. Mirror that order.
        props.onClick?.(event);
        if (event.defaultPrevented) return;
        // jsdom has no router: keep the click observable without navigating.
        event.preventDefault();
      }}
    >
      {children}
    </a>
  );
}

function sidebar() {
  return (
    <SidebarContent ariaLabel="Primary">
      <SidebarGroup>
        <SidebarMenu>
          <SidebarItem label="Overview" href="/" icon={<span />} />
          <SidebarItem label="Reports" href="/reports" badge={3} />
        </SidebarMenu>
      </SidebarGroup>
      <SidebarGroup>
        <SidebarMenu>
          <SidebarItem label="Datasets" icon={<span />} defaultOpen>
            <SidebarItem label="Prices" href="/datasets/prices" />
          </SidebarItem>
        </SidebarMenu>
      </SidebarGroup>
    </SidebarContent>
  );
}

function renderShell(overrides: Partial<React.ComponentProps<typeof AppShell>> = {}) {
  return render(
    <LucProvider defaultTheme="dark">
      <AppShell
        pathname="/reports"
        renderLink={(props) => <Link {...props} />}
        sidebar={sidebar()}
        mobileNavTitle="Navigation"
        topbar={
          <AppShellTopbar>
            <AppShellMobileTrigger />
            <span>Workspace</span>
          </AppShellTopbar>
        }
        {...overrides}
      >
        <AppShellContent>
          <PageHeader
            eyebrow="Research"
            title="Reports"
            description="Every generated report."
            meta={<span>12 items</span>}
          />
          <p>Body</p>
        </AppShellContent>
      </AppShell>
    </LucProvider>,
  );
}

describe("AppShell", () => {
  it("renders one named navigation landmark, a main region and a skip link", () => {
    renderShell();
    expect(screen.getByRole("navigation", { name: "Primary" })).toBeInTheDocument();
    expect(screen.getByRole("main")).toHaveAttribute("id", "luc-content");
    const skip = screen.getByRole("link", { name: "Skip to content" });
    expect(skip).toHaveAttribute("href", "#luc-content");
  });

  it("marks the active item with aria-current and uses the injected link", () => {
    renderShell();
    const active = screen.getAllByRole("link", { name: /Reports/ })[0]!;
    expect(active).toHaveAttribute("aria-current", "page");
    expect(active).toHaveAttribute("data-testid", "adapter-link");
    expect(screen.getByRole("link", { name: "Overview" })).not.toHaveAttribute("aria-current");
  });

  it("gives aria-current to exactly one item when a section contains the page", () => {
    // The Showcase shape: an overview route and detail routes under it. The
    // section stays lit so the map still makes sense, but only the page itself
    // may claim `aria-current="page"` — before V1 both did, and every screenshot
    // showed two "selected" rows.
    render(
      <LucProvider defaultTheme="dark">
        <AppShell
          pathname="/components/alert"
          renderLink={(props) => <Link {...props} />}
          sidebar={
            <SidebarContent ariaLabel="Primary">
              <SidebarGroup>
                <SidebarMenu>
                  <SidebarItem label="Components" href="/components" />
                  <SidebarItem label="Alerts" href="/components/alert" />
                </SidebarMenu>
              </SidebarGroup>
            </SidebarContent>
          }
          topbar={
            <AppShellTopbar>
              <span>Workspace</span>
            </AppShellTopbar>
          }
        >
          <AppShellContent>
            <p>Body</p>
          </AppShellContent>
        </AppShell>
      </LucProvider>,
    );

    expect(screen.getAllByRole("link", { name: "Alerts" })[0]).toHaveAttribute("aria-current", "page");
    expect(screen.getAllByRole("link", { name: "Components" })[0]).not.toHaveAttribute("aria-current");

    const claims = screen.getAllByRole("link").filter((link) => link.getAttribute("aria-current") === "page");
    expect(claims).toHaveLength(1);

    const section = document.querySelector('[data-slot="sidebar-item"][data-active="true"]:not([data-current="true"])');
    expect(section).not.toBeNull();
  });

  it("collapses and expands from the rail, and marks the collapsed state", async () => {
    const user = userEvent.setup();
    renderShell();
    const aside = document.querySelector('[data-slot="app-shell-sidebar"]')!;
    expect(aside).toHaveAttribute("data-state", "expanded");

    await user.click(screen.getByRole("button", { name: "Collapse sidebar" }));
    expect(aside).toHaveAttribute("data-state", "collapsed");

    await user.click(screen.getByRole("button", { name: "Expand sidebar" }));
    expect(aside).toHaveAttribute("data-state", "expanded");
  });

  it("toggles with Ctrl+B and skips the chord while typing in a field", async () => {
    const user = userEvent.setup();
    renderShell({
      sidebar: (
        <>
          {sidebar()}
          <input aria-label="Note" />
        </>
      ),
    });
    const aside = document.querySelector('[data-slot="app-shell-sidebar"]')!;

    await user.keyboard("{Control>}b{/Control}");
    expect(aside).toHaveAttribute("data-state", "collapsed");

    await user.click(screen.getByLabelText("Note"));
    await user.keyboard("{Control>}b{/Control}");
    expect(aside).toHaveAttribute("data-state", "collapsed");
  });

  it("honours collapsibleSidebar=false", () => {
    renderShell({ collapsibleSidebar: false });
    expect(screen.queryByRole("button", { name: /sidebar/i })).not.toBeInTheDocument();
    expect(document.querySelector('[data-slot="app-shell-sidebar"]')).toHaveAttribute(
      "data-state",
      "expanded",
    );
  });

  it("supports a controlled collapsed state", async () => {
    const user = userEvent.setup();
    const onSidebarCollapsedChange = vi.fn();
    function Harness() {
      const [collapsed, setCollapsed] = useState(false);
      return (
        <LucProvider defaultTheme="dark">
          <AppShell
            sidebar={sidebar()}
            sidebarCollapsed={collapsed}
            onSidebarCollapsedChange={(next) => {
              onSidebarCollapsedChange(next);
              setCollapsed(next);
            }}
          >
            <p>Body</p>
          </AppShell>
        </LucProvider>
      );
    }
    render(<Harness />);
    const aside = document.querySelector('[data-slot="app-shell-sidebar"]')!;
    await user.click(screen.getByRole("button", { name: "Collapse sidebar" }));
    expect(onSidebarCollapsedChange).toHaveBeenCalledWith(true);
    await waitFor(() => expect(aside).toHaveAttribute("data-state", "collapsed"));
  });

  it("restores a persisted collapsed state after mount", async () => {
    const storage = createMemoryStorage({
      "luc-ui:shell": JSON.stringify({ v: 1, value: true }),
    });
    renderShell({ sidebarPersistKey: "luc-ui:shell", storage });
    await waitFor(() =>
      expect(document.querySelector('[data-slot="app-shell-sidebar"]')).toHaveAttribute(
        "data-state",
        "collapsed",
      ),
    );
  });
});

describe("AppShellMobileNav", () => {
  it("opens as a sheet, traps the nav inside it, and closes on Escape", async () => {
    const user = userEvent.setup();
    renderShell();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Open navigation" }));
    const dialog = await screen.findByRole("dialog");
    expect(dialog).toHaveAttribute("data-slot", "sheet");
    // The drawer has no rail: the nav inside it renders expanded.
    expect(within(dialog).getByRole("navigation", { name: "Primary" })).toBeInTheDocument();

    await user.keyboard("{Escape}");
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  });

  it("closes the drawer when a nav item is used", async () => {
    const user = userEvent.setup();
    renderShell();
    await user.click(screen.getByRole("button", { name: "Open navigation" }));
    const dialog = await screen.findByRole("dialog");
    await user.click(within(dialog).getByRole("link", { name: /Reports/ }));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  });
});

describe("Breadcrumbs", () => {
  it("uses ordered list semantics, a labelled landmark and aria-current", () => {
    render(
      <Breadcrumbs
        items={[
          { label: "Research", href: "/research" },
          { label: "Datasets", href: "/research/datasets" },
          { label: "Prices" },
        ]}
      />,
    );
    const nav = screen.getByRole("navigation", { name: "Breadcrumb" });
    expect(within(nav).getByRole("list")).toBeInTheDocument();
    expect(within(nav).getAllByRole("listitem").length).toBeGreaterThanOrEqual(3);
    expect(within(nav).getByText("Prices")).toHaveAttribute("aria-current", "page");
  });

  it("folds a long trail behind an ellipsis that can reveal the hidden crumbs", async () => {
    const user = userEvent.setup();
    render(
      <Breadcrumbs
        items={[
          { label: "Research", href: "/research" },
          { label: "Datasets", href: "/research/datasets" },
          { label: "Prices", href: "/research/datasets/prices" },
          { label: "Daily", href: "/research/datasets/prices/daily" },
          { label: "Overview" },
        ]}
      />,
    );
    const trigger = screen.getByRole("button", { name: /hidden breadcrumb/i });
    await user.click(trigger);
    expect(await screen.findByText("Prices")).toBeInTheDocument();
  });
});
