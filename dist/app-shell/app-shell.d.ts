import { NavigationLinkProps } from "./navigation-context.js";
import { KeyValueStorage } from "../utils/storage.js";
import { ReactNode } from "react";
//#region src/app-shell/app-shell.d.ts
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
export declare function AppShell({ children, sidebar, topbar, statusBar, mobileNav, mobileNavTitle, sidebarColumn, sidebarCollapsed, defaultSidebarCollapsed, onSidebarCollapsedChange, collapsibleSidebar, sidebarPersistKey, sidebarPersistVersion, storage, sidebarShortcut, renderLink, pathname, onNavigate, density, height, contentId, className }: AppShellProps): import("react").JSX.Element;
/**
 * The sidebar `aside`. Its width is a token, and its whole purpose is to be the
 * one place that changes when the sidebar collapses.
 */
export declare function AppShellSidebar({ className, children, ...props }: React.ComponentPropsWithRef<"aside">): import("react").JSX.Element;
/**
 * The sticky topbar region.
 *
 * Opaque on purpose: a translucent bar carrying text is the exact pattern
 * DESIGN_SYSTEM.md forbids. The hairline underneath does the separation.
 */
export declare function AppShellTopbar({ className, children, ...props }: React.ComponentPropsWithRef<"header">): import("react").JSX.Element;
export interface AppShellContentProps extends React.ComponentPropsWithRef<"div"> {
  /** `bleed` removes the page gutters for a full-width research workspace. */
  width?: "content" | "prose" | "bleed";
}
/** The standard page container. Padding and max width live here, once. */
export declare function AppShellContent({ className, width, ...props }: AppShellContentProps): import("react").JSX.Element;
/** Optional status strip for research and developer surfaces. */
export declare function AppShellStatusBar({ className, ...props }: React.ComponentPropsWithRef<"div">): import("react").JSX.Element;
/** The mobile navigation trigger. Place it in the topbar; it hides at `lg`. */
export declare function AppShellMobileTrigger({ className }: {
  className?: string;
}): import("react").JSX.Element;
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
export declare function AppShellMobileNav({ children, title }: AppShellMobileNavProps): import("react").JSX.Element;
//#endregion
//# sourceMappingURL=app-shell.d.ts.map