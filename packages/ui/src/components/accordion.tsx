"use client";

import { createContext, useContext } from "react";
import { Accordion as RadixAccordion, Collapsible as RadixCollapsible } from "radix-ui";
import { RiArrowDownSLine } from "@remixicon/react";
import { cn } from "../utils/cn";

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

export const Accordion = RadixAccordion.Root;
export type AccordionProps = React.ComponentPropsWithRef<typeof RadixAccordion.Root>;

export const Collapsible = RadixCollapsible.Root;
export const CollapsibleTrigger = RadixCollapsible.Trigger;

type AccordionVariant = "card" | "flush";

const AccordionVariantContext = createContext<AccordionVariant>("card");

export interface AccordionItemProps extends React.ComponentPropsWithRef<typeof RadixAccordion.Item> {
  /**
   * `card` gives every section its own surface (settings, filters); `flush`
   * keeps one surface and separates rows with a hairline (long-form docs, FAQ).
   */
  variant?: AccordionVariant;
}

export function AccordionItem({ className, variant, ...props }: AccordionItemProps) {
  return (
    <AccordionVariantContext.Provider value={variant ?? "card"}>
      <RadixAccordion.Item
        data-slot="accordion-item"
        className={cn(
          "group/accordion-item luc-transition",
          "data-[state=open]:shadow-rest",
          variant === "flush"
            ? "border-b border-line-subtle last:border-b-0"
            : "overflow-hidden rounded-lg border border-line-subtle bg-surface-default shadow-rest open:shadow-hover",
          className,
        )}
        {...props}
      />
    </AccordionVariantContext.Provider>
  );
}

export interface AccordionTriggerProps
  extends React.ComponentPropsWithRef<typeof RadixAccordion.Trigger> {
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

export function AccordionTrigger({
  className,
  children,
  icon,
  aside,
  ...props
}: AccordionTriggerProps) {
  const variant = useContext(AccordionVariantContext);
  return (
    <RadixAccordion.Header className="flex">
      <RadixAccordion.Trigger
        data-slot="accordion-trigger"
        className={cn(
          "flex flex-1 items-center gap-3 text-left text-label text-fg-primary",
          "cursor-pointer select-none luc-transition",
          "hover:bg-surface-interactive-hover hover:text-fg-primary",
          "data-[state=open]:text-fg-primary",
          "luc-focus-inset",
          variant === "flush" ? "px-1 py-3.5" : "px-4 py-3.5",
          className,
        )}
        {...props}
      >
        {icon ? (
          <span className="grid size-7 shrink-0 place-items-center rounded-md border border-line-subtle bg-surface-interactive text-fg-secondary luc-transition group-hover/accordion-item:shadow-xs">
            {icon}
          </span>
        ) : null}
        <span className="min-w-0 flex-1">{children}</span>
        {aside ? <span className="shrink-0">{aside}</span> : null}
        <RiArrowDownSLine
          aria-hidden="true"
          className={cn(
            "size-4 shrink-0 text-fg-muted luc-transition",
            "group-data-[state=open]/accordion-item:text-fg-accent",
            "group-data-[state=open]/accordion-item:rotate-180",
          )}
        />
      </RadixAccordion.Trigger>
    </RadixAccordion.Header>
  );
}

export interface AccordionContentProps
  extends React.ComponentPropsWithRef<typeof RadixAccordion.Content> {
  /** Inner padding. Disable when the panel is a list or a table. */
  padded?: boolean;
}

export function AccordionContent({ className, children, padded = true, ...props }: AccordionContentProps) {
  const variant = useContext(AccordionVariantContext);
  return (
    <RadixAccordion.Content
      data-slot="accordion-content"
      className={cn(
        "overflow-hidden text-label text-fg-secondary",
        "data-[state=open]:animate-[luc-accordion-down_var(--motion-normal)_var(--ease-enter)]",
        "data-[state=closed]:animate-[luc-accordion-up_var(--motion-normal)_var(--ease-exit)]",
        className,
      )}
      {...props}
    >
      <div className={cn("border-t border-line-subtle", padded && (variant === "flush" ? "px-1 py-3" : "px-4 py-3.5"))}>
        {children}
      </div>
    </RadixAccordion.Content>
  );
}

export interface CollapsibleContentProps
  extends React.ComponentPropsWithRef<typeof RadixCollapsible.Content> {
  padded?: boolean;
}

export function CollapsibleContent({ className, children, padded = true, ...props }: CollapsibleContentProps) {
  return (
    <RadixCollapsible.Content
      data-slot="collapsible-content"
      className={cn(
        "overflow-hidden text-label text-fg-secondary",
        "data-[state=open]:animate-[luc-collapsible-down_var(--motion-normal)_var(--ease-enter)]",
        "data-[state=closed]:animate-[luc-collapsible-up_var(--motion-normal)_var(--ease-exit)]",
        padded && "py-3",
        className,
      )}
      {...props}
    >
      {children}
    </RadixCollapsible.Content>
  );
}

/**
 * A disclosure row for `Collapsible` that looks like the Accordion's trigger.
 *
 * Exported separately rather than shared with `AccordionTrigger` because the
 * two are different ARIA roles (`button` with `aria-expanded` either way, but
 * only the Accordion trigger participates in the header/roving-focus model).
 */
export function CollapsibleTriggerRow({
  className,
  children,
  aside,
  ...props
}: React.ComponentPropsWithRef<typeof RadixCollapsible.Trigger> & {
  /** Non-interactive by contract — see `AccordionTriggerProps.aside`. */
  aside?: React.ReactNode;
}) {
  return (
    <RadixCollapsible.Trigger
      data-slot="collapsible-trigger"
      className={cn(
        "group/collapsible flex w-full items-center gap-3 text-left text-label text-fg-primary",
        "cursor-pointer select-none rounded-md px-3 py-2.5 luc-transition",
        "hover:bg-surface-interactive-hover",
        "luc-focus-inset",
        className,
      )}
      {...props}
    >
      <span className="min-w-0 flex-1">{children}</span>
      {aside ? <span className="shrink-0">{aside}</span> : null}
      <RiArrowDownSLine
        aria-hidden="true"
        className="size-4 shrink-0 text-fg-muted luc-transition group-data-[state=open]/collapsible:rotate-180"
      />
    </RadixCollapsible.Trigger>
  );
}
