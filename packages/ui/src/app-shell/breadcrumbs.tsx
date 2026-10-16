"use client";

import { Fragment } from "react";
import { RiArrowRightSLine, RiMoreLine } from "@remixicon/react";
import { cn } from "../utils/cn";
import { PopoverContent, PopoverRoot, PopoverTrigger } from "../components/popover";
import { NavigationLink } from "./navigation-context";

/* =============================================================================
 * Breadcrumbs
 *
 * Real `nav > ol > li` semantics: a navigation landmark with a name, an ordered
 * list (the trail *is* ordered), `aria-current="page"` on the last crumb and
 * decorative separators hidden from the accessibility tree.
 *
 * The pieces are exported for composition, and `Breadcrumbs` is the data-driven
 * shorthand for the common case.
 * ========================================================================== */

export function Breadcrumb({ className, ...props }: React.ComponentPropsWithRef<"nav">) {
  return (
    <nav
      aria-label="Breadcrumb"
      data-slot="breadcrumb"
      className={cn("min-w-0", className)}
      {...props}
    />
  );
}

export function BreadcrumbList({ className, ...props }: React.ComponentPropsWithRef<"ol">) {
  return (
    <ol
      data-slot="breadcrumb-list"
      className={cn("flex min-w-0 flex-wrap items-center gap-1.5 text-label", className)}
      {...props}
    />
  );
}

export function BreadcrumbItem({ className, ...props }: React.ComponentPropsWithRef<"li">) {
  return (
    <li
      data-slot="breadcrumb-item"
      className={cn("flex min-w-0 items-center gap-1.5", className)}
      {...props}
    />
  );
}

export interface BreadcrumbLinkProps
  extends Omit<React.ComponentPropsWithRef<"a">, "href" | "children"> {
  href: string;
  children: React.ReactNode;
}

export function BreadcrumbLink({ className, href, children, ...props }: BreadcrumbLinkProps) {
  return (
    <NavigationLink
      href={href}
      className={cn(
        "luc-transition luc-focus truncate rounded-xs text-fg-muted hover:text-fg-primary",
        className,
      )}
      {...props}
    >
      {children}
    </NavigationLink>
  );
}

export function BreadcrumbPage({ className, ...props }: React.ComponentPropsWithRef<"span">) {
  return (
    <span
      aria-current="page"
      data-slot="breadcrumb-page"
      className={cn("truncate text-fg-primary", className)}
      {...props}
    />
  );
}

export function BreadcrumbSeparator({ className, children, ...props }: React.ComponentPropsWithRef<"li">) {
  return (
    <li
      role="presentation"
      aria-hidden="true"
      data-slot="breadcrumb-separator"
      className={cn("flex shrink-0 text-fg-disabled", className)}
      {...props}
    >
      {children ?? <RiArrowRightSLine className="size-3.5" />}
    </li>
  );
}

export interface BreadcrumbTrailItem {
  label: string;
  href?: string;
}

function BreadcrumbEllipsis({ items }: { items: readonly BreadcrumbTrailItem[] }) {
  return (
    <PopoverRoot>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={`Show ${items.length} hidden breadcrumb${items.length === 1 ? "" : "s"}`}
          className="luc-transition luc-focus grid size-5 shrink-0 place-items-center rounded-xs text-fg-muted hover:bg-surface-interactive-hover hover:text-fg-primary"
        >
          <RiMoreLine className="size-4" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="flex flex-col gap-0.5 p-1.5">
        {items.map((item) => (
          <BreadcrumbLink key={`${item.href ?? item.label}`} href={item.href ?? "#"} className="px-2 py-1 hover:bg-surface-interactive-hover">
            {item.label}
          </BreadcrumbLink>
        ))}
      </PopoverContent>
    </PopoverRoot>
  );
}

export interface BreadcrumbsProps {
  items: readonly BreadcrumbTrailItem[];
  /**
   * Collapse the middle of a long trail behind an ellipsis once it exceeds this
   * many crumbs. The first and last are always visible. `false` disables it.
   */
  maxItems?: number | false;
  className?: string;
  /** Rendered after the trail (a copy-link button, a status chip). */
  trailing?: React.ReactNode;
}

/**
 * The shorthand trail.
 *
 * A deep path on a phone is unreadable, so by default anything past four crumbs
 * folds into an ellipsis that opens the hidden ones — the trail keeps its
 * meaning instead of being clipped.
 */
export function Breadcrumbs({ items, maxItems = 4, className, trailing }: BreadcrumbsProps) {
  const collapse = maxItems !== false && items.length > maxItems;
  const hidden = collapse ? items.slice(1, items.length - 2) : [];
  const visible = collapse ? [items[0]!, ...items.slice(-2)] : items;

  return (
    <Breadcrumb className={cn("flex min-w-0 items-center gap-2", className)}>
      <BreadcrumbList>
        {visible.map((item, index) => {
          const isLast = index === visible.length - 1;
          return (
            <Fragment key={`${item.href ?? item.label}-${index}`}>
              {index > 0 ? <BreadcrumbSeparator /> : null}
              {collapse && index === 1 ? (
                <>
                  <BreadcrumbEllipsis items={hidden} />
                  <BreadcrumbSeparator />
                </>
              ) : null}
              <BreadcrumbItem>
                {isLast || !item.href ? (
                  <BreadcrumbPage>{item.label}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink href={item.href}>{item.label}</BreadcrumbLink>
                )}
              </BreadcrumbItem>
            </Fragment>
          );
        })}
      </BreadcrumbList>
      {trailing ? <span className="flex shrink-0 items-center gap-1.5">{trailing}</span> : null}
    </Breadcrumb>
  );
}
