import { AnchorHTMLAttributes, ReactNode } from "react";
//#region src/app-shell/navigation-context.d.ts
/**
 * The router boundary for navigation.
 *
 * `@luc/ui` never imports a router. A product supplies three things and gets
 * navigation that is fully aware of its routing:
 *
 *   - `renderLink` — how to render an anchor. Next passes `next/link`; a plain
 *     React app passes nothing and gets an `<a>`.
 *   - `pathname`   — the current location, used to derive active state.
 *   - `onNavigate` — a hook for closing a mobile drawer, prefetching, analytics.
 */
export interface NavigationLinkProps extends Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> {
  href: string;
  ref?: React.Ref<HTMLAnchorElement>;
}
export interface NavigationContextValue {
  renderLink?: (props: NavigationLinkProps) => ReactNode;
  pathname?: string | null;
  onNavigate?: (href: string) => void;
}
export interface NavigationProviderProps extends NavigationContextValue {
  children: ReactNode;
}
export declare function NavigationProvider({ renderLink, pathname, onNavigate, children }: NavigationProviderProps): import("react").JSX.Element;
export declare function useNavigation(): NavigationContextValue;
export interface NavigationLinkExtendedProps extends NavigationLinkProps {
  children: ReactNode;
}
/**
 * Render a link through the consumer's adapter.
 *
 * The default is a real `<a href>`: keyboard, middle-click and "open in new
 * tab" keep working even without a router, and an app that never configures a
 * provider still gets correct semantics.
 */
export declare function NavigationLink({ href, onNavigate, onClick, children, ...props }: NavigationLinkExtendedProps & {
  onNavigate?: (href: string) => void;
}): import("react").JSX.Element;
//#endregion
//# sourceMappingURL=navigation-context.d.ts.map