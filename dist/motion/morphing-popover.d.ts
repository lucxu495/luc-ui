import { MotionDivProps, MotionPropConflicts } from "./types.js";
import { Popover } from "radix-ui";
//#region src/motion/morphing-popover.d.ts
export declare const MorphingPopoverClose: import("react").ForwardRefExoticComponent<Popover.PopoverCloseProps & import("react").RefAttributes<HTMLButtonElement>>;
export declare const MorphingPopoverAnchor: import("react").ForwardRefExoticComponent<Popover.PopoverAnchorProps & import("react").RefAttributes<HTMLDivElement>>;
export interface MorphingPopoverProps {
  children: React.ReactNode;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}
/**
 * LUC MorphingPopover — the lighter sibling of `MorphingDialog`.
 *
 * The same shared-geometry idea at popover scale: a metric detail, a chart
 * setting, a context preview. Radix keeps the focus/dismiss/placement contract
 * *and* the unmount-after-exit behaviour; Motion carries one `layoutId` between
 * the trigger and the panel so the surface reads as *that* element expanding
 * rather than a new box appearing.
 */
export declare function MorphingPopover({ children, open, defaultOpen, onOpenChange }: MorphingPopoverProps): import("react").JSX.Element;
export type MorphingPopoverTriggerProps = MotionDivProps;
/**
 * The popover's trigger, as a real control for the same reason as the dialog
 * trigger: Radix puts `aria-haspopup` / `aria-expanded` here, which is only
 * valid on an element that has a role, and Enter/Space must open it.
 */
export declare function MorphingPopoverTrigger({ className, children, ...props }: MorphingPopoverTriggerProps): import("react").JSX.Element;
type MotionCompatibleProps = Omit<React.ComponentPropsWithRef<typeof Popover.Content>, MotionPropConflicts | "children">;
export interface MorphingPopoverContentProps extends MotionCompatibleProps {
  children: React.ReactNode;
  /** Extra classes for the panel itself. */
  panelClassName?: string;
  width?: "auto" | "sm" | "md" | "lg";
}
export declare function MorphingPopoverContent({ className, panelClassName, width, sideOffset, align, children, ...props }: MorphingPopoverContentProps): import("react").JSX.Element;
//#endregion
export {};
//# sourceMappingURL=morphing-popover.d.ts.map