//#region src/layout/container.d.ts
export interface ContainerProps extends React.ComponentPropsWithRef<"div"> {
  width?: "content" | "prose" | "full";
  /** Horizontal padding. `false` when the caller owns the gutter. */
  gutter?: boolean;
}
/** Page-level width constraint. The only component allowed to set max-width. */
export declare function Container({ className, width, gutter, ...props }: ContainerProps): import("react").JSX.Element;
//#endregion
//# sourceMappingURL=container.d.ts.map