import { Align, Gap, Justify } from "./stack.js";
import { ReactNode } from "react";
//#region src/layout/inline.d.ts
export interface InlineProps extends React.ComponentPropsWithRef<"div"> {
  gap?: Gap;
  align?: Align;
  justify?: Justify;
  /** Allow items to wrap onto multiple lines. Default `true`. */
  wrap?: boolean;
  as?: "div" | "span" | "ul" | "li" | "nav" | "header" | "footer" | "label";
  children?: ReactNode;
}
/** Horizontal cluster: toolbars, meta rows, label+value pairs. */
export declare function Inline({ className, gap, align, justify, wrap, as, ...props }: InlineProps): import("react").JSX.Element;
//#endregion
//# sourceMappingURL=inline.d.ts.map