import { Dialog } from "radix-ui";
//#region src/components/dialog.d.ts
export declare const DialogRoot: import("react").FC<Dialog.DialogProps>;
export declare const DialogTrigger: import("react").ForwardRefExoticComponent<Dialog.DialogTriggerProps & import("react").RefAttributes<HTMLButtonElement>>;
export declare const DialogClose: import("react").ForwardRefExoticComponent<Dialog.DialogCloseProps & import("react").RefAttributes<HTMLButtonElement>>;
export declare const DialogTitle: import("react").ForwardRefExoticComponent<Dialog.DialogTitleProps & import("react").RefAttributes<HTMLHeadingElement>>;
export declare const DialogDescription: import("react").ForwardRefExoticComponent<Dialog.DialogDescriptionProps & import("react").RefAttributes<HTMLParagraphElement>>;
export interface DialogContentProps extends React.ComponentPropsWithRef<typeof Dialog.Content> {
  /** Width preset. */
  width?: "sm" | "md" | "lg" | "xl";
  /** Show the built-in close affordance. Default `true`. */
  showClose?: boolean;
}
export declare function DialogContent({ className, children, width, showClose, onOpenAutoFocus, onCloseAutoFocus, ...props }: DialogContentProps): import("react").JSX.Element;
export interface DialogHeaderProps extends React.ComponentPropsWithRef<"div"> {
  icon?: React.ReactNode;
}
export declare function DialogHeader({ className, icon, children, ...props }: DialogHeaderProps): import("react").JSX.Element;
export declare function DialogBody({ className, ...props }: React.ComponentPropsWithRef<"div">): import("react").JSX.Element;
export declare function DialogFooter({ className, ...props }: React.ComponentPropsWithRef<"div">): import("react").JSX.Element;
//#endregion
//# sourceMappingURL=dialog.d.ts.map