import { ReactNode } from "react";
//#region src/app-shell/page-header.d.ts
export interface PageHeaderProps extends Omit<React.ComponentPropsWithRef<"div">, "title"> {
  /** Small context line above the title, e.g. a section or a dataset kind. */
  eyebrow?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  /** Inline metadata row under the description: status, timestamp, counts. */
  meta?: ReactNode;
  /** Primary actions, right-aligned on wide screens. */
  actions?: ReactNode;
  /** Secondary controls that belong with the header, e.g. a view toggle. */
  controls?: ReactNode;
  /** Sub-navigation: a `Tabs`/`SegmentedControl` row pinned under the header. */
  tabs?: ReactNode;
  /**
   * `dense` tightens the vertical rhythm for analytical pages. It changes
   * spacing, never type size or touch targets.
   */
  density?: "comfortable" | "dense";
  /** Keep the header pinned while the page scrolls. */
  sticky?: boolean;
}
export declare function PageHeader({ eyebrow, title, description, meta, actions, controls, tabs, density, sticky, className, children, ...props }: PageHeaderProps): import("react").JSX.Element;
export interface PageHeaderMetaProps extends React.ComponentPropsWithRef<"span"> {
  /** A leading marker: a status dot, an icon. Decorative. */
  marker?: ReactNode;
}
/** One quiet fact in the header's metadata row. */
export declare function PageHeaderMeta({ marker, className, children, ...props }: PageHeaderMetaProps): import("react").JSX.Element;
//#endregion
//# sourceMappingURL=page-header.d.ts.map