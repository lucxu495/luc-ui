import { ReactNode } from "react";
//#region src/layout/stack.d.ts
export type Gap = "none" | "2xs" | "xs" | "sm" | "md" | "lg" | "xl" | "2xl";
export type Align = "start" | "center" | "end" | "stretch" | "baseline";
export type Justify = "start" | "center" | "end" | "between" | "around";
export declare const gapClass: Record<Gap, string>;
export declare const alignClass: Record<Align, string>;
export declare const justifyClass: Record<Justify, string>;
export interface StackProps extends React.ComponentPropsWithRef<"div"> {
  gap?: Gap;
  align?: Align;
  justify?: Justify;
  /** Render as `<section>`, `<ul>`, `<nav>` … without losing the API. */
  as?: "div" | "section" | "ul" | "ol" | "nav" | "aside" | "header" | "footer" | "form";
  children?: ReactNode;
}
/** Vertical rhythm primitive. One direction, one gap, no surprises. */
export declare function Stack({ className, gap, align, justify, as, ...props }: StackProps): import("react").JSX.Element;
//#endregion
//# sourceMappingURL=stack.d.ts.map