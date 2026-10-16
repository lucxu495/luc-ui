import { Popover } from "radix-ui";
//#region src/components/popover.d.ts
export declare const PopoverRoot: import("react").FC<Popover.PopoverProps>;
export declare const PopoverTrigger: import("react").ForwardRefExoticComponent<Popover.PopoverTriggerProps & import("react").RefAttributes<HTMLButtonElement>>;
export declare const PopoverAnchor: import("react").ForwardRefExoticComponent<Popover.PopoverAnchorProps & import("react").RefAttributes<HTMLDivElement>>;
export declare const PopoverClose: import("react").ForwardRefExoticComponent<Popover.PopoverCloseProps & import("react").RefAttributes<HTMLButtonElement>>;
export interface PopoverContentProps extends React.ComponentPropsWithRef<typeof Popover.Content> {
  /** Width preset. `auto` lets the content define its own size. */
  width?: "auto" | "sm" | "md" | "lg";
}
/**
 * LUC Popover surface. Layout only — compose with `Stack`/`Section` inside.
 * Enter/exit use the shared overlay keyframes so every floating surface in LUC
 * UI arrives the same way.
 */
export declare function PopoverContent({ className, width, sideOffset, align, ...props }: PopoverContentProps): import("react").JSX.Element;
//#endregion
//# sourceMappingURL=popover.d.ts.map