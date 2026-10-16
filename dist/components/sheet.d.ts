import { Dialog } from "radix-ui";
//#region src/components/sheet.d.ts
export type SheetRootProps = React.ComponentProps<typeof Dialog.Root>;
/**
 * Root of the sheet.
 *
 * A thin wrapper rather than a straight re-export: it mirrors the open state
 * (controlled and uncontrolled) into the context `SheetContent` reads. The
 * `onOpenChange` prop is forwarded untouched, and every other prop reaches
 * Radix unchanged, so this stays a pass-through for callers.
 */
export declare function SheetRoot({ open, defaultOpen, onOpenChange, children, ...props }: SheetRootProps): import("react").JSX.Element;
/** Root of the sheet. Aliased as `Sheet` — the name most callers use. */
export declare const Sheet: typeof SheetRoot;
export declare const SheetTrigger: import("react").ForwardRefExoticComponent<Dialog.DialogTriggerProps & import("react").RefAttributes<HTMLButtonElement>>;
export declare const SheetClose: import("react").ForwardRefExoticComponent<Dialog.DialogCloseProps & import("react").RefAttributes<HTMLButtonElement>>;
export declare const SheetTitle: import("react").ForwardRefExoticComponent<Dialog.DialogTitleProps & import("react").RefAttributes<HTMLHeadingElement>>;
export declare const SheetDescription: import("react").ForwardRefExoticComponent<Dialog.DialogDescriptionProps & import("react").RefAttributes<HTMLParagraphElement>>;
export type SheetSide = "right" | "left" | "top" | "bottom";
export type SheetSize = "sm" | "md" | "lg" | "xl" | "full";
export interface SheetContentProps extends React.ComponentPropsWithRef<typeof Dialog.Content> {
  /** Edge the panel is anchored to. Default `right`. */
  side?: SheetSide;
  /** Width (vertical edges) or height (horizontal edges). Default `md`. */
  size?: SheetSize;
  /** Show the built-in close affordance. Default `true`. */
  showClose?: boolean;
}
export declare function SheetContent({ className, children, side, size, showClose, onOpenAutoFocus, onCloseAutoFocus, ...props }: SheetContentProps): import("react").JSX.Element;
export interface SheetHeaderProps extends React.ComponentPropsWithRef<"div"> {
  icon?: React.ReactNode;
}
export declare function SheetHeader({ className, icon, children, ...props }: SheetHeaderProps): import("react").JSX.Element;
/** The scrolling region. Header and footer stay put while this moves. */
export declare function SheetBody({ className, ...props }: React.ComponentPropsWithRef<"div">): import("react").JSX.Element;
export declare function SheetFooter({ className, ...props }: React.ComponentPropsWithRef<"div">): import("react").JSX.Element;
//#endregion
//# sourceMappingURL=sheet.d.ts.map