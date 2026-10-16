import { buttonVariants } from "./button-variants.js";
import { ReactNode } from "react";
import { VariantProps } from "class-variance-authority";
//#region src/components/button-base.d.ts
export interface ButtonProps extends React.ComponentPropsWithRef<"button">, Omit<VariantProps<typeof buttonVariants>, "block"> {
  leadingIcon?: ReactNode;
  trailingIcon?: ReactNode;
  /**
   * Busy state. The button keeps its width, stays in the tab order and reports
   * `aria-busy` — it is *not* the same as `disabled`.
   */
  loading?: boolean;
  loadingLabel?: string;
  block?: boolean;
  /**
   * Press ink and pointer light. On by default — a filled control that answers
   * the finger is the family's signature — and switchable off for print, dense
   * toolbars or a surface that already moves.
   */
  tactile?: boolean;
}
export declare function Button({ className, variant, size, block, leadingIcon, trailingIcon, loading, loadingLabel, tactile, disabled, children, onClick, type, onPointerDown, onPointerMove, onPointerEnter, onPointerLeave, ref, ...props }: ButtonProps): import("react").JSX.Element;
//#endregion
//# sourceMappingURL=button-base.d.ts.map