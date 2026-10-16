import { MotionDivProps, MotionPropConflicts } from "./types.js";
import { Dialog } from "radix-ui";
//#region src/motion/morphing-dialog.d.ts
export declare const MorphingDialogClose: import("react").ForwardRefExoticComponent<Dialog.DialogCloseProps & import("react").RefAttributes<HTMLButtonElement>>;
export declare const MorphingDialogTitle: import("react").ForwardRefExoticComponent<Dialog.DialogTitleProps & import("react").RefAttributes<HTMLHeadingElement>>;
export declare const MorphingDialogDescription: import("react").ForwardRefExoticComponent<Dialog.DialogDescriptionProps & import("react").RefAttributes<HTMLParagraphElement>>;
export interface MorphingDialogProps {
  children: React.ReactNode;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}
/**
 * LUC MorphingDialog — a dialog that grows *out of* the thing you clicked.
 *
 * Radix still owns every hard part: the focus trap and restore, Escape,
 * outside-click, scroll lock, `role="dialog"`, `aria-modal` and — critically —
 * unmounting the panel when it closes, so a closed dialog never leaves a hidden
 * `role="dialog"` region behind. Motion contributes exactly one thing: a shared
 * `layoutId`, so opening projects the trigger's rectangle onto the panel instead
 * of cutting to a centred box. Enter/exit themselves use the same CSS keyframes
 * as every other LUC overlay, so a morphing dialog and a plain dialog arrive
 * identically.
 *
 * Under reduced motion the shared geometry is skipped entirely (no `layoutId`),
 * not slowed down.
 */
export declare function MorphingDialog({ children, open, defaultOpen, onOpenChange }: MorphingDialogProps): import("react").JSX.Element;
export type MorphingDialogTriggerProps = MotionDivProps;
/**
 * The source of the shared geometry. It renders `children` unchanged and hides
 * itself while the dialog is open, so the panel appears to have taken its place.
 *
 * It is a real control, not a decorated `div`: Radix attaches `aria-haspopup`
 * and `aria-expanded` here, and those are only valid on an element with a role
 * (axe fails the page otherwise). `role="button"` + Enter/Space activation also
 * gives the trigger the keyboard behaviour a mouse click already had.
 */
export declare function MorphingDialogTrigger({ className, children, ...props }: MorphingDialogTriggerProps): import("react").JSX.Element;
type MotionCompatibleProps = Omit<React.ComponentPropsWithRef<typeof Dialog.Content>, MotionPropConflicts | "children">;
export interface MorphingDialogContentProps extends MotionCompatibleProps {
  children: React.ReactNode;
  /** Extra classes for the panel itself (not the centring wrapper). */
  panelClassName?: string;
  /**
   * Layout for the centring wrapper, when the framing depends on a measurement
   * rather than a breakpoint (a panel that fills a shell's workspace has to set
   * its own insets). Plain CSS properties only — motion owns the animated ones.
   */
  frameStyle?: React.CSSProperties;
  /**
   * Layout for the panel box itself.
   *
   * A resizable panel owns its own width/height as inline style (a `dvh`-based
   * class cannot express "whatever the reader dragged to"), and the style has to
   * land on the panel rather than on the centring frame so the box the reader
   * sees is the box the geometry describes.
   */
  panelStyle?: React.CSSProperties;
  /**
   * `data-slot` for the panel box itself. The wrapper keeps `morphing-dialog`,
   * so a caller can name the box it actually sizes (`h-…`/`w-…` land on the
   * panel, not on the full-viewport centring frame).
   */
  panelSlot?: string;
  /** Panel width preset. `none` lets the panel (or its own classes) decide. */
  width?: "sm" | "md" | "lg" | "xl" | "none";
}
export declare function MorphingDialogContent({ className, panelClassName, frameStyle, panelStyle, panelSlot, width, children, ...props }: MorphingDialogContentProps): import("react").JSX.Element;
//#endregion
export {};
//# sourceMappingURL=morphing-dialog.d.ts.map