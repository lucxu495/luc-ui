//#region src/motion/collapse.d.ts
/**
 * LUC Collapse — a disclosure that opens with height *and* opacity.
 *
 * Height alone snaps the content into place; opacity alone clips it. Together
 * they read as the panel unfolding. The trigger is a real `<button>` with
 * `aria-expanded` / `aria-controls`, so keyboard and screen-reader behaviour
 * comes for free, and reduced motion jumps straight to the open state.
 */
export interface CollapseProps extends Omit<React.ComponentPropsWithRef<"div">, "children" | "title"> {
  open: boolean;
  /**
   * Called when the reader activates the trigger. The component stays fully
   * controlled — the caller owns `open` — so a disclosure can be driven by URL
   * state, a keyboard shortcut or a parent, not only by its own click.
   */
  onOpenChange?: (open: boolean) => void;
  /** Heading shown in the trigger. */
  title: React.ReactNode;
  /** Optional second line under the trigger. */
  description?: React.ReactNode;
  /** Right-aligned trigger slot (a value, a badge). */
  aside?: React.ReactNode;
  children: React.ReactNode;
  /** `sm` is for inline disclosures, `md` for research sections. */
  size?: "sm" | "md";
  /** Start the panel padded (a bordered card) or flush. */
  variant?: "plain" | "card";
}
export declare function Collapse({ className, open, onOpenChange, title, description, aside, children, size, variant, ...props }: CollapseProps): import("react").JSX.Element;
//#endregion
//# sourceMappingURL=collapse.d.ts.map