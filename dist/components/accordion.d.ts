import { Accordion, Collapsible } from "radix-ui";
//#region src/components/accordion.d.ts
/**
 * LUC Accordion — a stack of sections where one (or several) is open.
 *
 * Radix owns the disclosure model: `aria-expanded` / `aria-controls`, the
 * header button, roving arrow keys, Home/End, and a single-open mode that never
 * silently closes the last item. LUC owns the surface, the row rhythm and the
 * movement — the panel does not "pop" open, it settles (`luc-layer-rise`), which
 * is the same gesture the Popover and the Card stack use.
 *
 *   Accordion   a set of sections that open and close
 *   Collapsible one section, no item wrapper, no roving focus
 */
declare const Accordion$1: import("react").ForwardRefExoticComponent<(Accordion.AccordionSingleProps | Accordion.AccordionMultipleProps) & import("react").RefAttributes<HTMLDivElement>>;
export type AccordionProps = React.ComponentPropsWithRef<typeof Accordion.Root>;
declare const Collapsible$1: import("react").ForwardRefExoticComponent<Collapsible.CollapsibleProps & import("react").RefAttributes<HTMLDivElement>>;
export declare const CollapsibleTrigger: import("react").ForwardRefExoticComponent<Collapsible.CollapsibleTriggerProps & import("react").RefAttributes<HTMLButtonElement>>;
type AccordionVariant = "card" | "flush";
export interface AccordionItemProps extends React.ComponentPropsWithRef<typeof Accordion.Item> {
  /**
   * `card` gives every section its own surface (settings, filters); `flush`
   * keeps one surface and separates rows with a hairline (long-form docs, FAQ).
   */
  variant?: AccordionVariant;
}
export declare function AccordionItem({ className, variant, ...props }: AccordionItemProps): import("react").JSX.Element;
export interface AccordionTriggerProps extends React.ComponentPropsWithRef<typeof Accordion.Trigger> {
  /** Leading slot: an icon, an Avatar, a step number. */
  icon?: React.ReactNode;
  /**
   * Right-aligned slot before the chevron: a `Badge`, a count, a timestamp.
   *
   * **Non-interactive by contract.** A button inside a button is invalid HTML,
   * and the browser's own parser un-nests it — so the server HTML and the client
   * tree disagree and React reports a hydration failure. Put a control *outside*
   * the trigger instead.
   */
  aside?: React.ReactNode;
}
export declare function AccordionTrigger({ className, children, icon, aside, ...props }: AccordionTriggerProps): import("react").JSX.Element;
export interface AccordionContentProps extends React.ComponentPropsWithRef<typeof Accordion.Content> {
  /** Inner padding. Disable when the panel is a list or a table. */
  padded?: boolean;
}
export declare function AccordionContent({ className, children, padded, ...props }: AccordionContentProps): import("react").JSX.Element;
export interface CollapsibleContentProps extends React.ComponentPropsWithRef<typeof Collapsible.Content> {
  padded?: boolean;
}
export declare function CollapsibleContent({ className, children, padded, ...props }: CollapsibleContentProps): import("react").JSX.Element;
/**
 * A disclosure row for `Collapsible` that looks like the Accordion's trigger.
 *
 * Exported separately rather than shared with `AccordionTrigger` because the
 * two are different ARIA roles (`button` with `aria-expanded` either way, but
 * only the Accordion trigger participates in the header/roving-focus model).
 */
export declare function CollapsibleTriggerRow({ className, children, aside, ...props }: React.ComponentPropsWithRef<typeof Collapsible.Trigger> & {
  /** Non-interactive by contract — see `AccordionTriggerProps.aside`. */
  aside?: React.ReactNode;
}): import("react").JSX.Element;
//#endregion
export { Accordion$1 as Accordion, Collapsible$1 as Collapsible };
//# sourceMappingURL=accordion.d.ts.map