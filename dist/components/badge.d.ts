import { VariantProps } from "class-variance-authority";
//#region src/components/badge.d.ts
export declare const badgeVariants: (props?: ({
  tone?: "outline" | "neutral" | "accent" | "positive" | "negative" | "warning" | "info" | null | undefined;
  size?: "sm" | "md" | "lg" | null | undefined;
  shape?: "rounded" | "pill" | null | undefined;
} & import("class-variance-authority/types").ClassProp) | undefined) => string;
export interface BadgeProps extends React.ComponentPropsWithRef<"span">, VariantProps<typeof badgeVariants> {
  /** Small leading status dot. */
  dot?: boolean;
  dotClassName?: string;
}
export declare function Badge({ className, tone, size, shape, dot, dotClassName, children, ...props }: BadgeProps): import("react").JSX.Element;
export interface TagProps extends React.ComponentPropsWithRef<"span"> {
  onRemove?: () => void;
  removeLabel?: string;
}
/** Editable token/label chip — a Badge that can be dismissed. */
export declare function Tag({ className, children, onRemove, removeLabel, ...props }: TagProps): import("react").JSX.Element;
//#endregion
//# sourceMappingURL=badge.d.ts.map