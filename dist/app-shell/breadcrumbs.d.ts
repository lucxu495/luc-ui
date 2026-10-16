//#region src/app-shell/breadcrumbs.d.ts
export declare function Breadcrumb({ className, ...props }: React.ComponentPropsWithRef<"nav">): import("react").JSX.Element;
export declare function BreadcrumbList({ className, ...props }: React.ComponentPropsWithRef<"ol">): import("react").JSX.Element;
export declare function BreadcrumbItem({ className, ...props }: React.ComponentPropsWithRef<"li">): import("react").JSX.Element;
export interface BreadcrumbLinkProps extends Omit<React.ComponentPropsWithRef<"a">, "href" | "children"> {
  href: string;
  children: React.ReactNode;
}
export declare function BreadcrumbLink({ className, href, children, ...props }: BreadcrumbLinkProps): import("react").JSX.Element;
export declare function BreadcrumbPage({ className, ...props }: React.ComponentPropsWithRef<"span">): import("react").JSX.Element;
export declare function BreadcrumbSeparator({ className, children, ...props }: React.ComponentPropsWithRef<"li">): import("react").JSX.Element;
export interface BreadcrumbTrailItem {
  label: string;
  href?: string;
}
export interface BreadcrumbsProps {
  items: readonly BreadcrumbTrailItem[];
  /**
   * Collapse the middle of a long trail behind an ellipsis once it exceeds this
   * many crumbs. The first and last are always visible. `false` disables it.
   */
  maxItems?: number | false;
  className?: string;
  /** Rendered after the trail (a copy-link button, a status chip). */
  trailing?: React.ReactNode;
}
/**
 * The shorthand trail.
 *
 * A deep path on a phone is unreadable, so by default anything past four crumbs
 * folds into an ellipsis that opens the hidden ones — the trail keeps its
 * meaning instead of being clipped.
 */
export declare function Breadcrumbs({ items, maxItems, className, trailing }: BreadcrumbsProps): import("react").JSX.Element;
//#endregion
//# sourceMappingURL=breadcrumbs.d.ts.map