import { IconButton } from "../components/icon-button.js";
import { KeyValueStorage } from "../utils/storage.js";
import { ReactNode } from "react";
//#region src/app-shell/sidebar.d.ts
export interface SidebarContextValue {
  collapsed: boolean;
  setCollapsed: (next: boolean) => void;
  toggleCollapsed: () => void;
  /** `false` pins the sidebar open — the consumer disables collapsing. */
  collapsible: boolean;
  mobileOpen: boolean;
  setMobileOpen: (next: boolean) => void;
}
export declare function useSidebar(): SidebarContextValue;
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
export declare function SidebarProvider({ children, collapsed: collapsedProp, defaultCollapsed, onCollapsedChange, collapsible, persistKey, persistVersion, storage, shortcut, mobileOpen: mobileOpenProp, defaultMobileOpen, onMobileOpenChange }: SidebarProviderProps): import("react").JSX.Element;
/** The sidebar column's contents. Its width and edge belong to `AppShell`. */
export declare function Sidebar({ className, children, ...props }: React.ComponentPropsWithRef<"div">): import("react").JSX.Element;
export declare function SidebarHeader({ className, ...props }: React.ComponentPropsWithRef<"div">): import("react").JSX.Element;
export interface SidebarContentProps extends React.ComponentPropsWithRef<"nav"> {
  /** Accessible name for the navigation landmark. */
  ariaLabel?: string;
}
/**
 * The scrolling navigation region — and the sidebar's single `<nav>` landmark.
 * One named landmark per sidebar, so a screen-reader user can jump straight to
 * it and hear which sidebar it is.
 */
export declare function SidebarContent({ className, ariaLabel, ...props }: SidebarContentProps): import("react").JSX.Element;
export declare function SidebarFooter({ className, ...props }: React.ComponentPropsWithRef<"div">): import("react").JSX.Element;
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
export declare function SidebarGroup({ label, children, collapsible, defaultOpen, badge, className, ...props }: SidebarGroupProps): import("react").JSX.Element;
/**
 * The group heading.
 *
 * Normal case, at the same size as the rows and heavier than them — the two
 * signals that survive being skimmed. The `data-slot` is the hook the browser
 * gates read to check the hierarchy is really rendered.
 */
export declare function SidebarGroupLabel({ className, children, ...props }: React.ComponentPropsWithRef<"p">): import("react").JSX.Element;
export declare function SidebarMenu({ className, ...props }: React.ComponentPropsWithRef<"ul">): import("react").JSX.Element;
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
export declare function SidebarItem({ label, href, icon, badge, active, disabled, children, defaultOpen, onSelect, className, ...props }: SidebarItemProps): import("react").JSX.Element;
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
export declare function SidebarSubmenu({ label, href, icon, badge, active, defaultOpen, className, children, ...props }: SidebarSubmenuProps): import("react").JSX.Element;
export interface SidebarRailProps extends React.ComponentPropsWithRef<"button"> {
  /** Accessible names for the two states. */
  expandLabel?: string;
  collapseLabel?: string;
}
/**
 * The thin edge strip that collapses the sidebar, like a rail you can push.
 * It is a real button, so the action is in the tab order and announced.
 */
export declare function SidebarRail({ className, expandLabel, collapseLabel, ...props }: SidebarRailProps): import("react").JSX.Element | null;
/** A labelled toggle for the topbar or the sidebar header. */
export declare function SidebarToggle({ className, label, ...props }: Omit<React.ComponentPropsWithRef<typeof IconButton>, "icon" | "label"> & {
  label?: string;
}): import("react").JSX.Element | null;
//#endregion
//# sourceMappingURL=sidebar.d.ts.map