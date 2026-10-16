//#region src/components/link.d.ts
export interface LinkProps extends React.ComponentPropsWithRef<"a"> {
  variant?: "default" | "muted" | "accent";
  /** Show the underline on hover only (default) or always. */
  underline?: "hover" | "always" | "none";
}
/**
 * Text link. Uses a background-image underline so the rule sits below the
 * descenders and animates without shifting layout.
 */
export declare function Link({ className, variant, underline, children, ...props }: LinkProps): import("react").JSX.Element;
//#endregion
//# sourceMappingURL=link.d.ts.map