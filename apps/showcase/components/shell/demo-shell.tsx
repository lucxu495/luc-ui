"use client";

import {
  AppShell,
  AppShellMobileTrigger,
  AppShellStatusBar,
  AppShellTopbar,
  Badge,
  Breadcrumbs,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarItem,
  SidebarMenu,
  SidebarToggle,
  Text,
  cn,
} from "@luc/ui";
import type { NavigationGroup } from "@luc/ui/app-shell";
import { useI18n } from "@/lib/i18n/provider";
import { RiBarChartBoxLine, RiDatabase2Line, RiFileList3Line, RiSettings3Line } from "@remixicon/react";

/**
 * A bounded AppShell for the documentation pages.
 *
 * The real shell fills the viewport; these demos need a fixed height so two
 * states can sit side by side, which is what `height="fill"` is for. Nothing
 * else is special-cased — it is the same component the Showcase itself uses.
 */

export const demoGroups: NavigationGroup[] = [
  {
    id: "overview",
    label: "Overview",
    items: [
      { id: "home", label: "Overview", href: "/application", icon: <RiBarChartBoxLine /> },
      {
        id: "datasets",
        label: "Datasets",
        icon: <RiDatabase2Line />,
        children: [
          { id: "prices", label: "Prices", href: "/application/navigation" },
          { id: "flows", label: "Flows", href: "/application/navigation" },
        ],
      },
      { id: "reports", label: "Reports", href: "/application/workspace", icon: <RiFileList3Line />, badge: 3 },
    ],
  },
  {
    id: "account",
    label: "Account",
    items: [
      { id: "settings", label: "Settings", href: "/application/url-state", icon: <RiSettings3Line /> },
      { id: "billing", label: "Billing", href: "/application/url-state", disabled: true },
    ],
  },
];

export interface DemoShellProps {
  collapsed?: boolean;
  defaultCollapsed?: boolean;
  /**
   * Report the rail's own toggle.
   *
   * Without it a *controlled* demo cannot be collapsed from the inside: the rail
   * and the header toggle call `setCollapsed`, and a controlled shell with no
   * handler swallows that. The Navigation page drives the state so the reader can
   * push the rail and watch it stay where they left it.
   */
  onCollapsedChange?: (collapsed: boolean) => void;
  title?: string;
  breadcrumbs?: { label: string; href?: string }[];
  className?: string;
  /** Content of the shell's main region. */
  children?: React.ReactNode;
  statusBar?: React.ReactNode;
  /** `false` pins the sidebar open, for a fixed-rail demonstration. */
  collapsible?: boolean;
  /**
   * Put the off-canvas trigger in the topbar.
   *
   * The trigger is `lg:hidden` because that is what it is: below 1024px the shell
   * replaces the sidebar column with a drawer, and the demo box inherits the
   * viewport's breakpoint rather than a container query — so a reader on a phone
   * sees the drawer, and a reader on a desktop sees the column.
   */
  mobileTrigger?: boolean;
}

export function DemoShell({
  collapsed,
  defaultCollapsed = false,
  onCollapsedChange,
  title = "Overview",
  breadcrumbs = [{ label: "Overview" }],
  className,
  children,
  statusBar,
  collapsible = true,
  mobileTrigger = false,
}: DemoShellProps) {
  /*
   * The shell demo renders *real* anchors to real Showcase routes, so on a
   * Chinese page they have to be Chinese URLs — an unprefixed one gets a 307
   * that Next's prefetch caches (`qa/locale.mjs`). `pathname` is passed through
   * too: the shell uses it for its active-state match, and it has to match what
   * the anchor actually points at.
   */
  const { href } = useI18n();
  const resolvedBreadcrumbs = breadcrumbs.map((item) => (item.href ? { ...item, href: href(item.href) } : item));
  return (
    <AppShell
      height="fill"
      className={cn("overflow-hidden rounded-lg border border-line-subtle bg-surface-canvas", className)}
      sidebarCollapsed={collapsed}
      defaultSidebarCollapsed={defaultCollapsed}
      {...(onCollapsedChange ? { onSidebarCollapsedChange: onCollapsedChange } : {})}
      collapsibleSidebar={collapsible}
      sidebarShortcut={false}
      pathname={resolvedBreadcrumbs.at(-1)?.href ?? "/"}
      sidebar={
        <>
          <SidebarHeader>
            <span className="grid size-7 shrink-0 place-items-center rounded-md border border-line-accent bg-accent-soft text-micro text-fg-accent">
              LQ
            </span>
            <Text className="group-data-[state=collapsed]/sidebar:hidden">Research</Text>
            <span className="ml-auto group-data-[state=collapsed]/sidebar:hidden">
              <Badge size="sm" tone="neutral">
                v1.0
              </Badge>
            </span>
          </SidebarHeader>
          <SidebarContent ariaLabel="Demo navigation">
            {demoGroups.map((group) => (
              <SidebarGroup key={group.id}>
                <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
                <SidebarMenu>
                  {group.items.map((item) => (
                    <SidebarItem
                      key={item.id}
                      label={item.label}
                      href={item.href ? href(item.href) : undefined}
                      icon={item.icon}
                      badge={item.badge}
                      disabled={item.disabled}
                    >
                      {item.children
                        ? item.children.map((child) => (
                            <SidebarItem
                              key={child.id}
                              label={child.label}
                              href={child.href ? href(child.href) : undefined}
                            />
                          ))
                        : undefined}
                    </SidebarItem>
                  ))}
                </SidebarMenu>
              </SidebarGroup>
            ))}
          </SidebarContent>
          <SidebarFooter>
            <SidebarToggle />
          </SidebarFooter>
        </>
      }
      topbar={
        <AppShellTopbar>
          {mobileTrigger ? <AppShellMobileTrigger /> : null}
          <Breadcrumbs items={[{ label: "Luc UI", href: href("/") }, ...resolvedBreadcrumbs]} />
          <span className="ml-auto text-caption text-fg-muted">{title}</span>
        </AppShellTopbar>
      }
      statusBar={
        /* Named because it is a scrollable region, and therefore a tab stop. */
        <AppShellStatusBar aria-label="Shell status">
          <span>Prepared locally</span>
          <span aria-hidden="true" className="text-fg-disabled">
            ·
          </span>
          <span>Updated 12:04 UTC</span>
          {statusBar}
        </AppShellStatusBar>
      }
    >
      <div className="flex min-h-0 flex-1 flex-col gap-3 p-4">
        {children ?? (
          <>
            <div className="flex flex-wrap gap-3">
              <Placeholder label="Window" value="1Y" />
              <Placeholder label="Samples" value="365" />
              <Placeholder label="Series" value="3" />
            </div>
            <div className="min-h-0 flex-1 rounded-md border border-line-subtle bg-surface-sunken" />
          </>
        )}
      </div>
    </AppShell>
  );
}

function Placeholder({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex min-w-32 flex-col gap-1 rounded-md border border-line-subtle bg-surface-default px-3 py-2">
      <span className="text-micro text-fg-muted uppercase">{label}</span>
      <span className="luc-numeric text-title text-fg-primary">{value}</span>
    </div>
  );
}
