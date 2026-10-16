import { ReactNode } from "react";
import { VariantProps } from "class-variance-authority";
//#region src/components/icon-button.d.ts
declare const iconButtonVariants: (props?: ({
  variant?: "ghost" | "accent" | "danger" | "solid" | null | undefined;
  size?: "sm" | "md" | "lg" | null | undefined;
} & import("class-variance-authority/types").ClassProp) | undefined) => string;
export interface IconButtonProps extends Omit<React.ComponentPropsWithRef<"button">, "aria-label">, VariantProps<typeof iconButtonVariants> {
  /**
   * Required: an icon-only control must have an accessible name.
   */
  label: string;
  icon: ReactNode;
  loading?: boolean;
  /** Show the label as a real tooltip on hover. Use `@luc/ui` Tooltip for rich content. */
  showTooltip?: boolean;
  /** Press ink and pointer light. Off for a static or print surface. */
  tactile?: boolean;
}
export declare function IconButton({ className, variant, size, label, icon, loading, showTooltip, tactile, type, title, onClick, onPointerDown, onPointerEnter, onPointerMove, onPointerLeave, ref, ...props }: IconButtonProps): import("react").JSX.Element;
//#endregion
export { iconButtonVariants };
//# sourceMappingURL=icon-button.d.ts.map