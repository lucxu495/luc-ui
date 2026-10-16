import { ReactNode } from "react";
//#region src/layout/section.d.ts
export interface SectionProps extends Omit<React.ComponentPropsWithRef<"section">, "title"> {
  title?: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  /** Vertical space between the header and the content. */
  gap?: "sm" | "md" | "lg";
}
/** A titled block of page content with a consistent header rhythm. */
export declare function Section({ className, title, description, actions, gap, children, ...props }: SectionProps): import("react").JSX.Element;
//#endregion
//# sourceMappingURL=section.d.ts.map