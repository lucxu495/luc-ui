import { cn } from "../utils/cn";

/**
 * LUC SocialLinks — the row of "where else to find me" links under a profile.
 *
 * It is small and it is easy to get wrong in the same three ways: an icon-only
 * link with no accessible name, a link that opens a new tab with no warning, and
 * a list of `<div>`s that a screen reader reads as a run-on sentence. This
 * component exists so a product gets all three right without thinking about it.
 *
 * The handle is the point of the row — a link to `github.com/ada` should read
 * "GitHub, ada", not "GitHub" — so `handle` is rendered as text and folded into
 * the accessible name rather than being decorative.
 */

export interface SocialLink {
  id: string;
  /** Service or destination name, always visible. "GitHub", "ORCID", "Email". */
  label: string;
  href: string;
  /** Account handle, address or id: `ada`, `0000-0002-1825-0097`. */
  handle?: string;
  /** Leading glyph. Rendered `aria-hidden`; the label carries the meaning. */
  icon?: React.ReactNode;
  /** Default `true` for absolute URLs, `false` for `mailto:`/`tel:`/relative. */
  external?: boolean;
  /** Screen-reader hint appended to the name. Default "opens in a new tab". */
  externalHint?: string;
}

export interface SocialLinksProps extends Omit<React.ComponentPropsWithRef<"ul">, "children"> {
  links: readonly SocialLink[];
  /** `row` wraps; `column` stacks for a narrow sidebar. Default `row`. */
  orientation?: "row" | "column";
  /** Show the handle next to the label. Default `true`. */
  withHandles?: boolean;
  size?: "sm" | "md";
  /** Accessible name for the list. Default "Profiles and contact". */
  label?: string;
}

export function SocialLinks({
  links,
  orientation = "row",
  withHandles = true,
  size = "md",
  label = "Profiles and contact",
  className,
  ...props
}: SocialLinksProps) {
  return (
    <ul
      data-slot="social-links"
      data-orientation={orientation}
      aria-label={label}
      className={cn(
        "flex list-none gap-2",
        orientation === "row" ? "flex-wrap items-center" : "flex-col items-stretch",
        className,
      )}
      {...props}
    >
      {links.map((link) => {
        const external = link.external ?? /^https?:\/\//i.test(link.href);
        const name = link.handle ? `${link.label}, ${link.handle}` : link.label;
        return (
          <li key={link.id} className={cn(orientation === "column" && "w-full")}>
            <a
              href={link.href}
              {...(external
                ? { target: "_blank", rel: "noreferrer noopener" }
                : {})}
              aria-label={external ? `${name} — ${link.externalHint ?? "opens in a new tab"}` : name}
              className={cn(
                "luc-rest luc-hover luc-settle group flex items-center gap-2",
                "rounded-sm border border-line-subtle bg-surface-raised text-fg-secondary",
                "hover:text-fg-primary",
                size === "sm" ? "h-8 px-2.5 text-caption" : "h-9 px-3 text-label",
                orientation === "column" && "w-full",
              )}
            >
              {link.icon ? (
                <span aria-hidden="true" className="shrink-0 text-fg-muted group-hover:text-fg-accent">
                  {link.icon}
                </span>
              ) : null}
              <span className="truncate font-medium">{link.label}</span>
              {withHandles && link.handle ? (
                <span className="truncate text-fg-muted luc-numeric">{link.handle}</span>
              ) : null}
            </a>
          </li>
        );
      })}
    </ul>
  );
}
