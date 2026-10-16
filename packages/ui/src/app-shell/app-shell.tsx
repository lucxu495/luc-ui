"use client";

import { useCallback, type ReactNode } from "react";
import { RiMenuLine } from "@remixicon/react";
import { cn } from "../utils/cn";
import type { KeyValueStorage } from "../utils/storage";
import { IconButton } from "../components/icon-button";
import { Sheet, SheetContent, SheetTitle } from "../components/sheet";
import { NavigationProvider, type NavigationLinkProps } from "./navigation-context";
import { Sidebar, SidebarProvider, SidebarRail, useSidebar } from "./sidebar";

/* =============================================================================
 * AppShell
 *
 * The application frame: a sidebar column, a sticky topbar, a scrolling main
 * region and an optional status strip. It owns landmark structure, the skip
 * link, the scroll model and the responsive switch to off-canvas navigation —
 * so a product never writes page-local shell CSS.
 *
 * Router-agnostic by construction: it receives `renderLink`, `pathname` and
 * `onNavigate` and passes them down; nothing here imports a router.
 *
 * Scroll model (documented in `docs/APP_SHELL_GUIDE.md`):
 *   sidebar   its own scroll region
 *   topbar    never scrolls
 *   main      the page scrolls the document by default
 *   pane      a workspace pane scrolls itself
 * ========================================================================== */

export interface AppShellProps {
  children: ReactNode;
  /**
   * Sidebar contents, rendered inside the shell's `aside` and `nav`.
   *
   * Omitting this is a supported shell shape, not a misconfiguration: a product
   * landing page has no sidebar, and the shell must not leave a reserved empty
   * column where one would have been. Pass `mobileNav` as well to keep the
   * off-canvas drawer on narrow viewports without a desktop column.
   */
  sidebar?: ReactNode;
  /** Sticky topbar. Compose it from `AppShellTopbar` or your own markup. */
  topbar?: ReactNode;
  /** Optional status strip below the main region. */
  statusBar?: ReactNode;
  /**
   * Contents of the mobile navigation sheet. Defaults to `sidebar`.
   *
   * Either one being present gives the shell a drawer. Below `lg` the drawer *is*
   * the navigation, so a shell with no desktop sidebar still needs a way in.
   */
  mobileNav?: ReactNode;
  mobileNavTitle?: string;
  /**
   * Whether the sidebar renders as a column beside the content.
   *
   * `true` (default) is the application frame. `false` is the landing-page shape:
   * the same contents render in the off-canvas drawer only, and the content
   * region takes the full width instead of leaving an empty column behind. This
   * is a layout decision, not a visibility one — nothing is reserved.
   */
  sidebarColumn?: boolean;

  /** Controlled / uncontrolled sidebar collapse. */
  sidebarCollapsed?: boolean;
  defaultSidebarCollapsed?: boolean;
  onSidebarCollapsedChange?: (collapsed: boolean) => void;
  /** `false` pins the sidebar open. Default `true`. */
  collapsibleSidebar?: boolean;
  /** Persist the collapsed state under this key. */
  sidebarPersistKey?: string;
  sidebarPersistVersion?: number;
  storage?: KeyValueStorage;
  /** Enable the Ctrl/Cmd + B sidebar toggle. Default `true`. */
  sidebarShortcut?: boolean;

  /** How to render internal links. Injected by the product's router adapter. */
  renderLink?: (props: NavigationLinkProps) => ReactNode;
  /** The current location, used for active state. */
  pathname?: string | null;
  /** Called on any in-shell navigation (close the drawer, prefetch, track). */
  onNavigate?: (href: string) => void;

  density?: "comfortable" | "compact";
  /**
   * `viewport` (default) fills the document and lets the page scroll.
   * `fill` sizes to a bounded parent instead — use it to embed a shell in a
   * dashboard, a preview, or a test.
   */
  height?: "viewport" | "fill";
  /** Target of the skip link. */
  contentId?: string;
  className?: string;
}

export function AppShell({
  children,
  sidebar,
  topbar,
  statusBar,
  mobileNav,
  mobileNavTitle = "Navigation",
  sidebarColumn = true,
  sidebarCollapsed,
  defaultSidebarCollapsed = false,
  onSidebarCollapsedChange,
  collapsibleSidebar = true,
  sidebarPersistKey,
  sidebarPersistVersion = 1,
  storage,
  sidebarShortcut = true,
  renderLink,
  pathname,
  onNavigate,
  density = "comfortable",
  height = "viewport",
  contentId = "luc-content",
  className,
}: AppShellProps) {
  return (
    <SidebarProvider
      collapsed={sidebarCollapsed}
      defaultCollapsed={defaultSidebarCollapsed}
      onCollapsedChange={onSidebarCollapsedChange}
      collapsible={collapsibleSidebar}
      persistKey={sidebarPersistKey}
      persistVersion={sidebarPersistVersion}
      storage={storage}
      shortcut={sidebarShortcut && collapsibleSidebar}
    >
      <ShellChrome
        sidebar={sidebar}
        topbar={topbar}
        statusBar={statusBar}
        mobileNav={mobileNav}
        mobileNavTitle={mobileNavTitle}
        sidebarColumn={sidebarColumn}
        renderLink={renderLink}
        pathname={pathname}
        onNavigate={onNavigate}
        density={density}
        height={height}
        contentId={contentId}
        className={className}
      >
        {children}
      </ShellChrome>
    </SidebarProvider>
  );
}

function ShellChrome({
  children,
  sidebar,
  topbar,
  statusBar,
  mobileNav,
  mobileNavTitle,
  sidebarColumn = true,
  renderLink,
  pathname,
  onNavigate,
  density,
  height,
  contentId,
  className,
}: AppShellProps & { children: ReactNode }) {
  const { setMobileOpen } = useSidebar();

  // One place closes the drawer: every in-shell navigation goes through here.
  const handleNavigate = useCallback(
    (href: string) => {
      setMobileOpen(false);
      onNavigate?.(href);
    },
    [onNavigate, setMobileOpen],
  );

  return (
    <NavigationProvider renderLink={renderLink} pathname={pathname} onNavigate={handleNavigate}>
      <div
        data-slot="app-shell"
        data-density={density === "compact" ? "compact" : undefined}
        data-height={height}
        className={cn(
          "flex w-full",
          height === "fill" ? "h-full min-h-0" : "min-h-dvh",
          className,
        )}
      >
        <a
          href={`#${contentId}`}
          className={cn(
            "luc-focus sr-only focus:not-sr-only",
            "focus:fixed focus:top-3 focus:left-3 focus:z-[var(--z-tooltip)]",
            "focus:rounded-md focus:border focus:border-line-default focus:bg-surface-overlay",
            "focus:px-3 focus:py-2 focus:text-label focus:text-fg-primary focus:luc-float",
          )}
        >
          Skip to content
        </a>

        {sidebar && sidebarColumn ? (
          <AppShellSidebar className={height === "fill" ? "h-full" : undefined}>
            <Sidebar>{sidebar}</Sidebar>
            <SidebarRail />
          </AppShellSidebar>
        ) : null}

        <div className="flex min-w-0 flex-1 flex-col">
          {topbar}
          <main id={contentId} className="flex min-w-0 flex-1 flex-col">
            {children}
          </main>
          {statusBar}
        </div>

        {sidebar || mobileNav ? (
          <AppShellMobileNav title={mobileNavTitle}>{mobileNav ?? sidebar}</AppShellMobileNav>
        ) : null}
      </div>
    </NavigationProvider>
  );
}

/**
 * The sidebar `aside`. Its width is a token, and its whole purpose is to be the
 * one place that changes when the sidebar collapses.
 */
export function AppShellSidebar({ className, children, ...props }: React.ComponentPropsWithRef<"aside">) {
  const { collapsed, collapsible } = useSidebar();
  return (
    <aside
      data-slot="app-shell-sidebar"
      data-state={collapsed ? "collapsed" : "expanded"}
      className={cn(
        "sticky top-0 hidden h-dvh shrink-0 flex-col border-r border-line-subtle bg-surface-sunken lg:flex",
        "transition-[width] duration-[var(--motion-normal)] ease-[var(--ease-standard)] motion-reduce:transition-none",
        collapsed ? "w-[var(--shell-sidebar-rail-width)]" : "w-[var(--shell-sidebar-width)]",
        !collapsible && "[&_[data-slot=sidebar-rail]]:hidden",
        className,
      )}
      {...props}
    >
      {children}
    </aside>
  );
}

/**
 * The sticky topbar region.
 *
 * Opaque on purpose: a translucent bar carrying text is the exact pattern
 * DESIGN_SYSTEM.md forbids. The hairline underneath does the separation.
 */
export function AppShellTopbar({ className, children, ...props }: React.ComponentPropsWithRef<"header">) {
  return (
    <header
      data-slot="app-shell-topbar"
      className={cn(
        "sticky top-0 z-[var(--z-sticky)] flex h-[var(--shell-topbar-height)] shrink-0 items-center gap-2",
        "border-b border-line-subtle bg-surface-canvas px-3 sm:px-4",
        className,
      )}
      {...props}
    >
      {children}
    </header>
  );
}

export interface AppShellContentProps extends React.ComponentPropsWithRef<"div"> {
  /** `bleed` removes the page gutters for a full-width research workspace. */
  width?: "content" | "prose" | "bleed";
}

/** The standard page container. Padding and max width live here, once. */
export function AppShellContent({ className, width = "content", ...props }: AppShellContentProps) {
  return (
    <div
      data-slot="app-shell-content"
      className={cn(
        "w-full",
        width === "content" && "mx-auto max-w-[var(--container-content)] px-4 py-6 sm:px-6",
        width === "prose" && "mx-auto max-w-[var(--container-prose)] px-4 py-6 sm:px-6",
        width === "bleed" && "flex min-h-0 flex-1 flex-col",
        className,
      )}
      {...props}
    />
  );
}

/** Optional status strip for research and developer surfaces. */
export function AppShellStatusBar({ className, ...props }: React.ComponentPropsWithRef<"div">) {
  return (
    <div
      data-slot="app-shell-status-bar"
      /*
       * A single line that scrolls, never a paragraph that wraps.
       *
       * The bar is a fixed height by design, and flex children shrink, so on a
       * narrow shell the labels used to wrap onto a second line and be clipped
       * by the height they are not allowed to exceed — four pixels of a word
       * cut off, which reads as a broken status bar rather than as a layout
       * decision. One line is the contract, so the line is not allowed to
       * break; the strip scrolls instead.
       *
       * It is focusable because it scrolls: a region a keyboard user cannot
       * enter is unreachable content, and this one has no interactive child to
       * reach it through. `role="region"` says what it is, and callers that
       * render a named strip pass `aria-label` — this is a plain `div` and
       * takes every HTML attribute.
       */
      role="region"
      tabIndex={0}
      className={cn(
        "flex h-[var(--shell-statusbar-height)] shrink-0 items-center gap-3 overflow-x-auto whitespace-nowrap",
        "border-t border-line-subtle bg-surface-sunken px-3 text-caption text-fg-muted",
        className,
      )}
      {...props}
    />
  );
}

/** The mobile navigation trigger. Place it in the topbar; it hides at `lg`. */
export function AppShellMobileTrigger({ className }: { className?: string }) {
  const { mobileOpen, setMobileOpen } = useSidebar();
  return (
    <IconButton
      label="Open navigation"
      aria-expanded={mobileOpen}
      icon={<RiMenuLine />}
      variant="ghost"
      size="sm"
      onClick={() => setMobileOpen(true)}
      className={cn("lg:hidden", className)}
    />
  );
}

export interface AppShellMobileNavProps {
  children: ReactNode;
  title?: string;
}

/**
 * Off-canvas navigation.
 *
 * It is the existing LUC `Sheet` — Radix Dialog underneath — so focus trapping,
 * focus restore, Escape and the scrim are the behaviour the system already
 * ships. The nav inside runs in a non-collapsible `SidebarProvider`, because a
 * drawer has no rail.
 */
export function AppShellMobileNav({ children, title = "Navigation" }: AppShellMobileNavProps) {
  const { mobileOpen, setMobileOpen } = useSidebar();
  return (
    <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
      <SheetContent side="left" size="sm" className="p-0 lg:hidden">
        <SheetTitle className="sr-only">{title}</SheetTitle>
        <div className="flex min-h-0 flex-1 flex-col py-4">
          <SidebarProvider collapsible={false} shortcut={false}>
            <Sidebar>{children}</Sidebar>
          </SidebarProvider>
        </div>
      </SheetContent>
    </Sheet>
  );
}
