/**
 * Shared prop vocabulary for Luc UI's kinetic primitives.
 *
 * Motion for React redefines the pointer/drag/animation handlers on `div`
 * (`onDrag` becomes `(event, info) => void`, `style` becomes a motion style).
 * A component that *is* a motion element therefore cannot simply extend
 * `React.ComponentPropsWithRef<"div">` — TypeScript will reject the spread of
 * the two handler shapes. This is the one place that reconciles them, so the
 * conflict is documented once instead of being rediscovered per component.
 */
export type MotionPropConflicts =
  | "style"
  | "onDrag"
  | "onDragEnd"
  | "onDragEnter"
  | "onDragExit"
  | "onDragLeave"
  | "onDragOver"
  | "onDragStart"
  | "onDrop"
  | "onAnimationStart"
  | "onAnimationEnd"
  | "onAnimationIteration";

/** DOM `div` props that are safe to spread onto a Motion `div`. */
export type MotionDivProps = Omit<React.ComponentPropsWithRef<"div">, MotionPropConflicts>;
