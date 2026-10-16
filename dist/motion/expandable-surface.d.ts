import { MotionPropConflicts } from "./types.js";
//#region src/motion/expandable-surface.d.ts
export interface ExpandableSurfaceProps {
  children: React.ReactNode;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  className?: string;
}
/**
 * LUC `ExpandableSurface` — a card that becomes the page, in place.
 *
 * `MorphingDialog` solves "open this elsewhere"; this solves "become more, right
 * here". A compact summary and its expanded detail are laid out in the *same*
 * grid cell and share one `layoutId`, so the surface grows from its own
 * rectangle into the full one and settles back — continuity rather than an
 * entrance animation on top of an exit animation.
 *
 * The decisions that matter:
 *
 *  - **No portal, no scroll lock, no focus trap.** The expanded surface is in
 *    flow, so the page keeps its scroll position and a keyboard user keeps their
 *    place in the document. This is the right shape for a dashboard card or a
 *    list item that reveals detail; a modal is the wrong shape for it.
 *  - **The trigger stays mounted.** It is the focus target we return to, and it
 *    is what carries `aria-expanded`/`aria-controls`. It fades rather than
 *    unmounting, which is also what lets the two share one layout identity.
 *  - **Focus is moved deliberately.** Opening focuses the panel (so a keyboard
 *    user lands inside the new content), Escape restores the trigger.
 *  - **Reduced motion drops the shared layout** instead of slowing it: the
 *    surface simply swaps, which is the correct static reading of the same
 *    composition.
 */
export declare function ExpandableSurface({ children, open, defaultOpen, onOpenChange, className }: ExpandableSurfaceProps): import("react").JSX.Element;
export interface ExpandableSurfaceTriggerProps extends Omit<React.ComponentPropsWithRef<"button">, MotionPropConflicts | "onClick" | "type"> {
  children: React.ReactNode;
}
/**
 * The collapsed face. It is a real button: `aria-expanded`, `aria-controls` and
 * Enter/Space come from the element, not from a keyboard handler we maintain.
 * While open it is `inert` and invisible, so its interactive content can never
 * be tabbed into behind the expanded panel.
 */
export declare function ExpandableSurfaceTrigger({ className, children, ...props }: ExpandableSurfaceTriggerProps): import("react").JSX.Element;
export interface ExpandableSurfaceContentProps extends Omit<React.ComponentPropsWithRef<"div">, MotionPropConflicts> {
  children: React.ReactNode;
}
export interface ExpandableSurfaceCloseProps extends Omit<React.ComponentPropsWithRef<"button">, "onClick" | "type"> {
  children: React.ReactNode;
}
/**
 * Close, from inside the expanded surface.
 *
 * A sibling of `ExpandableSurfaceTrigger` rather than a second trigger: the
 * trigger owns the surface's identity (`layoutId`, `id`, `aria-controls`) and a
 * document may only have one element claiming it. This is the escape hatch for
 * content that wants its own "Collapse" affordance, and it reads the same
 * context so the state stays in one place.
 */
export declare function ExpandableSurfaceClose({ className, children, ...props }: ExpandableSurfaceCloseProps): import("react").JSX.Element;
/**
 * The expanded face. Mounted only while open (so a closed surface costs nothing
 * and holds no stale DOM), `tabIndex={-1}` so it can receive focus on open, and
 * Escape closes it because a keyboard user should not have to hunt for the way
 * back.
 */
export declare function ExpandableSurfaceContent({ className, children, onKeyDown, ...props }: ExpandableSurfaceContentProps): import("react").JSX.Element | null;
//#endregion
//# sourceMappingURL=expandable-surface.d.ts.map