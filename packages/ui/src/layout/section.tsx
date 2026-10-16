import type { ReactNode } from "react";
import { cn } from "../utils/cn";

export interface SectionProps extends Omit<React.ComponentPropsWithRef<"section">, "title"> {
  title?: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  /** Vertical space between the header and the content. */
  gap?: "sm" | "md" | "lg";
}

const gapClass = { sm: "gap-3", md: "gap-5", lg: "gap-7" } as const;

/** A titled block of page content with a consistent header rhythm. */
export function Section({ className, title, description, actions, gap = "md", children, ...props }: SectionProps) {
  return (
    <section data-slot="section" className={cn("flex flex-col", gapClass[gap], className)} {...props}>
      {title || description || actions ? (
        <header className="flex flex-wrap items-end justify-between gap-3">
          <div className="flex min-w-0 flex-col gap-1">
            {title ? <h2 className="text-heading-sm text-fg-primary">{title}</h2> : null}
            {description ? (
              <p className="max-w-[var(--container-prose)] text-body text-fg-secondary">{description}</p>
            ) : null}
          </div>
          {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
        </header>
      ) : null}
      {children}
    </section>
  );
}
