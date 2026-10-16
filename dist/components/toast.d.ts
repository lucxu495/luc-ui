import { ToasterProps, toast } from "sonner";
//#region src/components/toast.d.ts
export interface ToasterComponentProps extends Omit<ToasterProps, "theme" | "className"> {
  /** Extra classes for the toast viewport. */
  className?: string;
}
/**
 * Mount once, at the app root. The theme is taken from `LucProvider` so the
 * toasts follow an explicit theme choice rather than the OS preference.
 */
export declare function Toaster({ position, className, ...props }: ToasterComponentProps): import("react").JSX.Element;
//#endregion
export { type ToasterProps, toast };
//# sourceMappingURL=toast.d.ts.map