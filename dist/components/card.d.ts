import { VariantProps } from "class-variance-authority";
//#region src/components/card.d.ts
export declare const cardVariants: (props?: ({
  variant?: "default" | "raised" | "outline" | "ghost" | null | undefined;
  interactive?: boolean | null | undefined;
  interaction?: "interactive" | "static" | "selectable" | "featured" | null | undefined;
  selected?: boolean | null | undefined;
  padding?: "sm" | "md" | "lg" | "none" | null | undefined;
} & import("class-variance-authority/types").ClassProp) | undefined) => string;
export interface CardProps extends React.ComponentPropsWithRef<"div">, VariantProps<typeof cardVariants> {
  as?: "div" | "article" | "section" | "li" | "button" | "a";
  /** Anchor target. Only meaningful when `as="a"`. */
  href?: string;
  target?: string;
  rel?: string;
}
/**
 * LUC Card — foundational surface.
 *
 * Deliberately quiet: a hairline, a small shadow, a luminance step above the
 * canvas. Interactive and selected states are opt-in. Creative effects
 * (BorderGlow, SpotlightSurface) *wrap* a Card; they are never baked in.
 */
export declare function Card({ className, variant, interactive, interaction, selected, padding, as, ...props }: CardProps): import("react").JSX.Element;
export interface CardHeaderProps extends React.ComponentPropsWithRef<"div"> {
  /** Right-aligned slot for a menu, badge or icon button. */
  actions?: React.ReactNode;
  /** Leading slot for an icon or avatar. */
  icon?: React.ReactNode;
}
export declare function CardHeader({ className, actions, icon, children, ...props }: CardHeaderProps): import("react").JSX.Element;
export declare function CardTitle({ className, children, ...props }: React.ComponentPropsWithRef<"h3">): import("react").JSX.Element;
export declare function CardDescription({ className, ...props }: React.ComponentPropsWithRef<"p">): import("react").JSX.Element;
export declare function CardContent({ className, ...props }: React.ComponentPropsWithRef<"div">): import("react").JSX.Element;
export declare function CardFooter({ className, ...props }: React.ComponentPropsWithRef<"div">): import("react").JSX.Element;
//#endregion
//# sourceMappingURL=card.d.ts.map