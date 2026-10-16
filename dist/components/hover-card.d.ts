import { HoverCard } from "radix-ui";
//#region src/components/hover-card.d.ts
/**
 * LUC HoverCard — a rich preview on hover, for a *pointer*.
 *
 * The distinction from Tooltip is the whole reason this exists:
 *
 *   Tooltip    a short label for one control      ~500ms, keyboard-focusable
 *   HoverCard  a preview with content and actions ~700ms, pointer only
 *
 * A HoverCard is never the only way to reach its content: the trigger is
 * focusable and the card follows focus, and anything the card offers must also
 * exist on the page it previews. That is why `openDelay` defaults high — a
 * preview that fires while the pointer crosses a list is worse than none.
 */
declare const HoverCard$1: import("react").FC<HoverCard.HoverCardProps>;
export declare const HoverCardTrigger: import("react").ForwardRefExoticComponent<HoverCard.HoverCardTriggerProps & import("react").RefAttributes<HTMLAnchorElement>>;
export declare const HoverCardPortal: import("react").FC<HoverCard.HoverCardPortalProps>;
export interface HoverCardContentProps extends React.ComponentPropsWithRef<typeof HoverCard.Content> {
  width?: "sm" | "md" | "lg";
}
export declare function HoverCardContent({ className, width, align, sideOffset, ...props }: HoverCardContentProps): import("react").JSX.Element;
//#endregion
export { HoverCard$1 as HoverCard };
//# sourceMappingURL=hover-card.d.ts.map