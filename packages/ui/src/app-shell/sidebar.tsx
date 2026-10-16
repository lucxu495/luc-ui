"use client";

import { Collapsible as RadixCollapsible } from "radix-ui";
import {
  RiArrowDownSLine,
  RiArrowRightSLine,
  RiSidebarFoldLine,
  RiSidebarUnfoldLine,
} from "@remixicon/react";
import { createContext, useCallback, useContext, useEffect, useMemo, type ReactNode } from "react";
import { useControllableState } from "../hooks/use-controllable-state";
import { usePersistentState } from "../hooks/use-persistent-state";
import { Tooltip } from "../components/tooltip";
import { IconButton } from "../components/icon-button";
import { cn } from "../utils/cn";
import type { KeyValueStorage } from "../utils/storage";
import { isNavigationItemActive, isNavigationItemCurrent } from "./navigation";
import { NavigationLink, useNavigation } from "./navigation-context";

/* =============================================================================
 * Sidebar
 *
 * A navigation column with three states, one implementation:
 *
 *   expanded    full labels, groups, nested items
 *   rail        icons only, labels kept in the DOM as the accessible name and
 *               revealed by the existing LUC Tooltip
 *   off-canvas  the same markup inside the existing LUC Sheet, on mobile
 *
 * Collapsed state is *personal presentation state*: it is controlled or
 * uncontrolled, optionally persisted, and never written to the URL.
 * ========================================================================== */

export interface SidebarContextValue {
  collapsed: boolean;
  setCollapsed: (next: boolean) => void;
  toggleCollapsed: () => void;
  /** `false` pins the sidebar open — the consumer disables collapsing. */
  collapsible: boolean;
  mobileOpen: boolean;
  setMobileOpen: (next: boolean) => void;
}

const SidebarContext = createContext<SidebarContextValue | null>(null);

export function useSidebar(): SidebarContextValue {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error("useSidebar must be used inside <SidebarProvider> (or <AppShell>).");
  }
  return context;
}

export interface SidebarProviderProps {
  children: ReactNode;
  /** Controlled collapsed state. */
  collapsed?: boolean;
  defaultCollapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
  /** `false` means the sidebar cannot collapse. Default `true`. */
  collapsible?: boolean;
  /** Persist the collapsed state locally under this key. */
  persistKey?: string;
  persistVersion?: number;
  storage?: KeyValueStorage;
  /** Enable the `Ctrl/⌘ + B` toggle. Default `true`. */
  shortcut?: boolean;
  mobileOpen?: boolean;
  defaultMobileOpen?: boolean;
  onMobileOpenChange?: (open: boolean) => void;
}

export function SidebarProvider({
  children,
  collapsed: collapsedProp,
  defaultCollapsed = false,
  onCollapsedChange,
  collapsible = true,
  persistKey,
  persistVersion = 1,
  storage,
  shortcut = true,
  mobileOpen: mobileOpenProp,
  defaultMobileOpen = false,
  onMobileOpenChange,
}: SidebarProviderProps) {
  // Persistence is opt-in: without a key the hook is given `storage: undefined`
  // and never reads or writes anything.
  const [persistedCollapsed, setPersistedCollapsed] = usePersistentState<boolean>({
    key: persistKey ?? "luc-ui:sidebar",
    version: persistVersion,
    defaultValue: defaultCollapsed,
    storage: persistKey ? storage : undefined,
    decode: (raw) => (typeof raw === "boolean" ? raw : undefined),
  });

  const collapsed = collapsible ? (collapsedProp ?? persistedCollapsed) : false;

  const setCollapsed = useCallback(
    (next: boolean) => {
      if (!collapsible) return;
      if (collapsedProp === undefined) setPersistedCollapsed(next);
      onCollapsedChange?.(next);
    },
    [collapsedProp, collapsible, onCollapsedChange, setPersistedCollapsed],
  );

  const toggleCollapsed = useCallback(() => setCollapsed(!collapsed), [collapsed, setCollapsed]);

  const [mobileOpen, setMobileOpen] = useControllableState<boolean>({
    value: mobileOpenProp,
    defaultValue: defaultMobileOpen,
    onChange: onMobileOpenChange,
  });

  // Ctrl/⌘ + B. Opt-out, because a product with a different shortcut policy
  // should not have to fight a hard-coded chord.
  useEffect(() => {
    if (!collapsible || !shortcut) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "b" && event.key !== "B") return;
      if (!event.metaKey && !event.ctrlKey) return;
      // Leave the browser's own bindings alone inside text entry.
      const target = event.target as HTMLElement | null;
      if (target && (target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName))) return;
      event.preventDefault();
      toggleCollapsed();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [collapsible, shortcut, toggleCollapsed]);

  const value = useMemo<SidebarContextValue>(
    () => ({ collapsed, setCollapsed, toggleCollapsed, collapsible, mobileOpen, setMobileOpen }),
    [collapsed, collapsible, mobileOpen, setCollapsed, setMobileOpen, toggleCollapsed],
  );

  return <SidebarContext.Provider value={value}>{children}</SidebarContext.Provider>;
}

/** The sidebar column's contents. Its width and edge belong to `AppShell`. */
export function Sidebar({ className, children, ...props }: React.ComponentPropsWithRef<"div">) {
  const { collapsed } = useSidebar();
  return (
    <div
      data-slot="sidebar"
      data-state={collapsed ? "collapsed" : "expanded"}
      className={cn(
        "group/sidebar relative flex h-full min-h-0 flex-col gap-2",
        collapsed ? "px-2" : "px-3",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function SidebarHeader({ className, ...props }: React.ComponentPropsWithRef<"div">) {
  const { collapsed } = useSidebar();
  return (
    <div
      data-slot="sidebar-header"
      className={cn(
        "flex shrink-0 items-center gap-2",
        collapsed ? "justify-center" : "px-1",
        className,
      )}
      {...props}
    />
  );
}

export interface SidebarContentProps extends React.ComponentPropsWithRef<"nav"> {
  /** Accessible name for the navigation landmark. */
  ariaLabel?: string;
}

/**
 * The scrolling navigation region — and the sidebar's single `<nav>` landmark.
 * One named landmark per sidebar, so a screen-reader user can jump straight to
 * it and hear which sidebar it is.
 */
export function SidebarContent({
  className,
  ariaLabel = "Sections",
  ...props
}: SidebarContentProps) {
  return (
    <nav
      aria-label={ariaLabel}
      data-slot="sidebar-content"
      className={cn(
        "luc-table-scroll flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto overscroll-contain pb-4",
        className,
      )}
      {...props}
    />
  );
}

export function SidebarFooter({ className, ...props }: React.ComponentPropsWithRef<"div">) {
  const { collapsed } = useSidebar();
  return (
    <div
      data-slot="sidebar-footer"
      className={cn("mt-auto flex shrink-0 flex-col gap-2", collapsed ? "items-center" : undefined, className)}
      {...props}
    />
  );
}

export interface SidebarGroupProps extends Omit<React.ComponentPropsWithRef<"div">, "children"> {
  /** Section heading. Omit for an ungrouped run of items. */
  label?: string;
  children: ReactNode;
  /**
   * Render the heading as a disclosure, so the group's rows can be folded away.
   *
   * The heading is a `<button>` and never a link: it has no destination, and a
   * control that looks like navigation but does not navigate is the defect this
   * shape exists to avoid. A group that *has* an overview page lists it as its
   * first row, which is a real link with a real name.
   */
  collapsible?: boolean;
  /** Open on first render. The caller derives this from the current route. */
  defaultOpen?: boolean;
  /** Trailing marker beside the heading, e.g. a count. */
  badge?: ReactNode;
}

/**
 * One section of the sidebar: a heading and its rows.
 *
 * Two visual tiers, deliberately: the heading is a normal-case, heavier, brighter
 * label, and the rows sit indented beneath it. The previous heading was 11px
 * uppercase in a muted grey — *smaller* and quieter than the 13px links below it,
 * so eight sections read as one long list of forty links. Hierarchy that a reader
 * has to reconstruct from letter-spacing is not hierarchy.
 *
 * Collapsing is opt-in per group because it is only worth it on a long tree; the
 * caller decides, from the length of the list it is rendering. The open state is
 * held by Radix, which is what keeps this a disclosure rather than a second
 * implementation of one — `aria-expanded`, `aria-controls`, the height animation
 * hooks and the state attribute are all the library's.
 *
 * "Open when the current route moves inside it" is the caller's job, and it does
 * it by remounting: the route-derived `defaultOpen` is part of the group's key in
 * `components/shell/app-frame.tsx`, so entering a section unfolds it, and a
 * reader's own fold survives navigation that does not change where they are.
 */
export function SidebarGroup({
  label,
  children,
  collapsible = false,
  defaultOpen = false,
  badge,
  className,
  ...props
}: SidebarGroupProps) {
  const { collapsed } = useSidebar();
  const groupClass = cn("flex flex-col gap-1", className);

  /* A rail has no room for a heading, and the off-canvas drawer is always
   * expanded — neither can host a disclosure. */
  if (!label || collapsed || !collapsible) {
    return (
      <div data-slot="sidebar-group" className={groupClass} {...props}>
        {label ? <SidebarGroupLabel>{label}</SidebarGroupLabel> : null}
        {children}
      </div>
    );
  }

  return (
    <RadixCollapsible.Root
      data-slot="sidebar-group"
      defaultOpen={defaultOpen}
      className={cn("group/group", groupClass)}
      {...props}
    >
      <RadixCollapsible.Trigger asChild>
        <button
          type="button"
          data-slot="sidebar-group-label"
          className={cn(
            "luc-transition luc-focus flex h-7 w-full items-center gap-2 rounded-sm px-2 text-left",
            "text-label font-semibold text-fg-secondary",
            "hover:bg-surface-interactive-hover hover:text-fg-primary",
            /* Pressed, or holding a row the reader is on: the heading says so
             * without relying on the chevron being noticed. */
            "group-data-[state=open]/group:text-fg-primary",
          )}
        >
          <span className="min-w-0 flex-1 truncate">{label}</span>
          {badge ? <span className="shrink-0 text-micro text-fg-muted">{badge}</span> : null}
          <RiArrowDownSLine
            aria-hidden="true"
            className={cn(
              "size-3.5 shrink-0 text-fg-muted luc-transition",
              "group-data-[state=closed]/group:-rotate-90",
            )}
          />
        </button>
      </RadixCollapsible.Trigger>
      <RadixCollapsible.Content
        className={cn(
          "overflow-hidden",
          "data-[state=open]:animate-[luc-collapsible-in_var(--motion-normal)_var(--ease-enter)]",
          "data-[state=closed]:animate-[luc-collapsible-out_var(--motion-fast)_var(--ease-exit)]",
        )}
      >
        {/* One step of indentation, so a row is visibly *inside* its group. */}
        <div className="pl-2">{children}</div>
      </RadixCollapsible.Content>
    </RadixCollapsible.Root>
  );
}

/**
 * The group heading.
 *
 * Normal case, at the same size as the rows and heavier than them — the two
 * signals that survive being skimmed. The `data-slot` is the hook the browser
 * gates read to check the hierarchy is really rendered.
 */
export function SidebarGroupLabel({ className, children, ...props }: React.ComponentPropsWithRef<"p">) {
  const { collapsed } = useSidebar();
  if (collapsed) {
    // A rail has no room for a heading. Keep the groups separated instead of
    // leaving an empty orphan line.
    return (
      <span aria-hidden="true" className={cn("mt-1 h-px w-full bg-line-subtle", className)} />
    );
  }
  return (
    <p
      data-slot="sidebar-group-label"
      className={cn("flex h-7 items-center px-2 text-label font-semibold text-fg-secondary", className)}
      {...props}
    >
      <span className="min-w-0 flex-1 truncate">{children}</span>
    </p>
  );
}

export function SidebarMenu({ className, ...props }: React.ComponentPropsWithRef<"ul">) {
  return <ul data-slot="sidebar-menu" className={cn("flex flex-col gap-px", className)} {...props} />;
}

const itemBase =
  "luc-transition luc-focus group/item relative flex h-8 w-full items-center gap-2.5 rounded-sm text-label text-left";
const itemIdle = "text-fg-secondary hover:bg-surface-interactive-hover hover:text-fg-primary";
const itemActive = "bg-surface-selected text-fg-primary";
/** The section an item belongs to is lit, but never filled: one selection only. */
const itemInSection = "text-fg-accent hover:bg-surface-interactive-hover";
const itemDisabled = "pointer-events-none text-fg-disabled";

/**
 * Two states, one row:
 *   current  → the page the reader is on (selected surface, accent edge, aria-current)
 *   section  → an ancestor of that page (accent text only)
 * Anything else is idle. Before this split a section and its detail page were
 * both rendered as selected *and* both claimed `aria-current="page"`.
 */
function itemStateClass(isActive: boolean, isCurrentPage: boolean) {
  if (isCurrentPage) return itemActive;
  if (isActive) return itemInSection;
  return itemIdle;
}

function ActiveEdge() {
  return (
    <span
      aria-hidden="true"
      className="absolute inset-y-1.5 left-0 w-0.5 rounded-full bg-accent-default motion-safe:animate-[luc-enter-fade_var(--motion-fast)_var(--ease-enter)]"
    />
  );
}

function ItemRow({
  label,
  icon,
  badge,
  isActive,
  collapsed,
}: {
  label: string;
  icon?: ReactNode;
  badge?: ReactNode;
  isActive: boolean;
  collapsed: boolean;
}) {
  return (
    <span
      className={cn(
        "relative flex size-full items-center",
        collapsed ? "justify-center" : "gap-2.5 px-2",
      )}
    >
      {isActive ? <ActiveEdge /> : null}
      {icon ? (
        <span
          aria-hidden="true"
          className={cn(
            "grid size-4 shrink-0 place-items-center [&_svg]:size-4",
            isActive ? "text-fg-accent" : "text-fg-muted group-hover/item:text-fg-secondary",
          )}
        >
          {icon}
        </span>
      ) : null}
      <span className={cn("min-w-0 flex-1 truncate text-left", collapsed && "sr-only")}>{label}</span>
      {badge ? (
        <span
          className={cn(
            "shrink-0 text-micro text-fg-muted",
            collapsed &&
              "absolute -top-0.5 -right-0.5 rounded-full border border-line-default bg-surface-raised px-1 py-px text-[9px] leading-none",
          )}
        >
          {badge}
        </span>
      ) : null}
    </span>
  );
}

export interface SidebarItemProps extends Omit<React.ComponentPropsWithRef<"li">, "onSelect"> {
  label: string;
  href?: string;
  icon?: ReactNode;
  badge?: ReactNode;
  /** Override active detection, e.g. for a route alias. */
  active?: boolean;
  disabled?: boolean;
  /** Nested items. One level; a deeper tree wants a different pattern. */
  children?: ReactNode;
  defaultOpen?: boolean;
  /** Fires after a click — the AppShell uses it to close the mobile drawer. */
  onSelect?: () => void;
}

export function SidebarItem({
  label,
  href,
  icon,
  badge,
  active,
  disabled = false,
  children,
  defaultOpen = false,
  onSelect,
  className,
  ...props
}: SidebarItemProps) {
  const { collapsed } = useSidebar();
  const navigation = useNavigation();
  const isActive = active ?? isNavigationItemActive(navigation.pathname, href);
  const isCurrentPage = active ?? isNavigationItemCurrent(navigation.pathname, href);

  if (children) {
    return (
      <SidebarSubmenu
        label={label}
        href={href}
        icon={icon}
        badge={badge}
        active={isActive}
        defaultOpen={defaultOpen}
        className={className}
        {...props}
      >
        {children}
      </SidebarSubmenu>
    );
  }

  const row = <ItemRow label={label} icon={icon} badge={badge} isActive={isCurrentPage} collapsed={collapsed} />;

  const content = disabled ? (
    <span className={cn(itemBase, itemDisabled, collapsed && "justify-center")} aria-disabled="true">
      {row}
    </span>
  ) : href ? (
    <NavigationLink
      href={href}
      aria-current={isCurrentPage ? "page" : undefined}
      onNavigate={onSelect}
      className={cn(itemBase, itemStateClass(isActive, isCurrentPage), collapsed && "justify-center")}
    >
      {row}
    </NavigationLink>
  ) : (
    <button
      type="button"
      onClick={onSelect}
      aria-current={isCurrentPage ? "page" : undefined}
      className={cn(itemBase, itemStateClass(isActive, isCurrentPage), collapsed && "justify-center")}
    >
      {row}
    </button>
  );

  return (
    <li
      data-slot="sidebar-item"
      data-active={isActive ? "true" : undefined}
      data-current={isCurrentPage ? "true" : undefined}
      className={className}
      {...props}
    >
      {collapsed ? (
        <Tooltip content={label} side="right" align="center">
          {content}
        </Tooltip>
      ) : (
        content
      )}
    </li>
  );
}

export interface SidebarSubmenuProps extends Omit<React.ComponentPropsWithRef<"li">, "onSelect"> {
  label: string;
  href?: string;
  icon?: ReactNode;
  badge?: ReactNode;
  active?: boolean;
  defaultOpen?: boolean;
}

/**
 * A parent item with nested children.
 *
 * Radix `Collapsible` owns `aria-expanded`/`aria-controls` and the height
 * animation hooks, so this is composition rather than another disclosure
 * implementation. In rail mode there is no room to expand inline, so the first
 * click expands the sidebar and opens the tree — nested navigation stays
 * reachable instead of becoming decorative.
 */
export function SidebarSubmenu({
  label,
  href,
  icon,
  badge,
  active,
  defaultOpen = false,
  className,
  children,
  ...props
}: SidebarSubmenuProps) {
  const { collapsed, setCollapsed, collapsible } = useSidebar();
  const navigation = useNavigation();
  const isActive = active ?? isNavigationItemActive(navigation.pathname, href);
  const isCurrentPage = active ?? isNavigationItemCurrent(navigation.pathname, href);
  const [open, setOpen] = useControllableState<boolean>({ defaultValue: defaultOpen || isActive });

  const handleTrigger = () => {
    if (collapsed && collapsible) setCollapsed(false);
    setOpen(!open);
  };

  const trigger = (
    <button
      type="button"
      aria-current={isCurrentPage ? "page" : undefined}
      onClick={handleTrigger}
      className={cn(itemBase, itemStateClass(isActive, isCurrentPage), collapsed && "justify-center")}
    >
      <span
        className={cn(
          "relative flex size-full items-center",
          collapsed ? "justify-center" : "gap-2.5 px-2",
        )}
      >
        {isCurrentPage ? <ActiveEdge /> : null}
        {icon ? (
          <span
            aria-hidden="true"
            className={cn(
              "grid size-4 shrink-0 place-items-center [&_svg]:size-4",
              isCurrentPage ? "text-fg-accent" : "text-fg-muted group-hover/item:text-fg-secondary",
            )}
          >
            {icon}
          </span>
        ) : null}
        <span className={cn("min-w-0 flex-1 truncate text-left", collapsed && "sr-only")}>{label}</span>
        {badge ? <span className="shrink-0 text-micro text-fg-muted">{badge}</span> : null}
        {collapsed ? null : (
          <RiArrowRightSLine
            aria-hidden="true"
            className={cn("size-4 shrink-0 text-fg-muted luc-transition", open && "rotate-90")}
          />
        )}
      </span>
    </button>
  );

  return (
    <li
      data-slot="sidebar-item"
      data-active={isActive ? "true" : undefined}
      data-current={isCurrentPage ? "true" : undefined}
      className={className}
      {...props}
    >
      <RadixCollapsible.Root open={open} onOpenChange={setOpen}>
        <RadixCollapsible.Trigger asChild>{trigger}</RadixCollapsible.Trigger>
        <RadixCollapsible.Content
          className={cn(
            "overflow-hidden",
            "data-[state=open]:animate-[luc-collapsible-in_var(--motion-normal)_var(--ease-enter)]",
            "data-[state=closed]:animate-[luc-collapsible-out_var(--motion-fast)_var(--ease-exit)]",
          )}
        >
          <ul className="relative mt-0.5 flex flex-col gap-px pl-4">
            {/* A quiet guide line makes the nesting legible without a box. */}
            <span aria-hidden="true" className="absolute inset-y-0.5 left-2 w-px bg-line-subtle" />
            {children}
          </ul>
        </RadixCollapsible.Content>
      </RadixCollapsible.Root>
    </li>
  );
}

export interface SidebarRailProps extends React.ComponentPropsWithRef<"button"> {
  /** Accessible names for the two states. */
  expandLabel?: string;
  collapseLabel?: string;
}

/**
 * The thin edge strip that collapses the sidebar, like a rail you can push.
 * It is a real button, so the action is in the tab order and announced.
 */
export function SidebarRail({
  className,
  expandLabel = "Expand sidebar",
  collapseLabel = "Collapse sidebar",
  ...props
}: SidebarRailProps) {
  const { collapsed, toggleCollapsed, collapsible } = useSidebar();
  if (!collapsible) return null;
  return (
    <button
      type="button"
      data-slot="sidebar-rail"
      aria-label={collapsed ? expandLabel : collapseLabel}
      aria-expanded={!collapsed}
      onClick={toggleCollapsed}
      className={cn(
        /*
         * The hit area is 24px wide and straddles the edge; the mark stays a
         * hairline.
         *
         * It was an 8px strip inside the sidebar, which axe flags as a serious
         * `target-size` failure in all three engines (WCAG 2.2 "Target Size
         * (Minimum)", 24×24) — measured, 45 occurrences across 15 routes, the
         * same ones in Chromium, Firefox and WebKit. Widening the *button* rather
         * than drawing a bigger line keeps the visual identical and moves the
         * mark onto the edge it actually describes; the 12px that overhangs the
         * sidebar lands in the content column's own gutter, which is padding
         * rather than anything clickable.
         */
        "group/rail absolute inset-y-0 -right-3 z-[var(--z-raised)] flex w-6 cursor-col-resize items-center justify-center",
        "luc-focus",
        className,
      )}
      {...props}
    >
      <span
        aria-hidden="true"
        className={cn(
          "h-10 w-px rounded-full bg-line-default luc-transition",
          "group-hover/rail:h-full group-hover/rail:bg-accent-default group-focus-visible/rail:bg-accent-default",
        )}
      />
    </button>
  );
}

/** A labelled toggle for the topbar or the sidebar header. */
export function SidebarToggle({
  className,
  label,
  ...props
}: Omit<React.ComponentPropsWithRef<typeof IconButton>, "icon" | "label"> & { label?: string }) {
  const { collapsed, toggleCollapsed, collapsible } = useSidebar();
  if (!collapsible) return null;
  return (
    <IconButton
      variant="ghost"
      size="sm"
      label={label ?? (collapsed ? "Expand sidebar" : "Collapse sidebar")}
      onClick={toggleCollapsed}
      className={className}
      icon={collapsed ? <RiSidebarUnfoldLine /> : <RiSidebarFoldLine />}
      {...props}
    />
  );
}

export { SidebarContext };
