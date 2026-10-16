/**
 * LUC application shell — the application language.
 *
 * Sidebar, topbar, breadcrumbs, page header and the off-canvas mobile
 * navigation, all router-agnostic. See `docs/APP_SHELL_GUIDE.md` and
 * `docs/NAVIGATION_GUIDE.md`.
 */

export {
  flattenNavigation,
  filterNavigation,
  findActiveNavigationItem,
  isNavigationItemActive,
  navigationCommandEntries,
  normalizePathname,
  type NavigationCommandEntry,
  type NavigationGroup,
  type NavigationItem,
} from "./navigation";

export {
  NavigationLink,
  NavigationProvider,
  useNavigation,
  type NavigationContextValue,
  type NavigationLinkProps,
  type NavigationProviderProps,
} from "./navigation-context";

export {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarItem,
  SidebarMenu,
  SidebarProvider,
  SidebarRail,
  SidebarSubmenu,
  SidebarToggle,
  useSidebar,
  type SidebarContentProps,
  type SidebarContextValue,
  type SidebarItemProps,
  type SidebarProviderProps,
  type SidebarRailProps,
  type SidebarSubmenuProps,
} from "./sidebar";

export {
  AppShell,
  AppShellContent,
  AppShellMobileNav,
  AppShellMobileTrigger,
  AppShellSidebar,
  AppShellStatusBar,
  AppShellTopbar,
  type AppShellContentProps,
  type AppShellMobileNavProps,
  type AppShellProps,
} from "./app-shell";

export {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  Breadcrumbs,
  BreadcrumbPage,
  BreadcrumbSeparator,
  type BreadcrumbLinkProps,
  type BreadcrumbsProps,
  type BreadcrumbTrailItem,
} from "./breadcrumbs";

export { PageHeader, PageHeaderMeta, type PageHeaderMetaProps, type PageHeaderProps } from "./page-header";
