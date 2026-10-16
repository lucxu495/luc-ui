import { cn } from "../utils/cn";
import { SocialLinks, type SocialLink } from "./social-links";

/**
 * LUC ProfileHero — the top of a personal site.
 *
 * A career page, a research page, a portfolio and a blog all open the same way:
 * a name, what the person does, one paragraph of orientation, a portrait, a row
 * of links, and one primary action. Every one of those sites re-builds this and
 * gets the heading hierarchy slightly different, so it lives here with the
 * hierarchy fixed: the name is the page's `h1` and everything else is content.
 *
 * `variant` is the design axis, not a cosmetic one. `editorial` sets the name in
 * the display face at display scale with the lead set in a reading measure;
 * `instrument` keeps the same components at a technical scale with the facts
 * moved into a definition list. A research page and a magazine page should not
 * look the same, and one attribute is enough to make them differ.
 *
 * The professional descriptor prop is `title`, not `role`: a JSX attribute
 * named `role` makes `eslint-plugin-jsx-a11y` report an invalid ARIA role on
 * every consumer that renders one, which is a DX defect the library refuses to
 * ship. `ChatMessage` takes its author as `from` for the same reason.
 */

export interface ProfileFact {
  id: string;
  label: string;
  value: React.ReactNode;
}

export interface ProfileHeroProps extends React.ComponentPropsWithRef<"header"> {
  /** The person's name. Rendered as the page `h1`. */
  name: string;
  /** Job title, field or discipline. Rendered under the name. */
  title?: string;
  /** One paragraph of orientation. Keep it to two sentences. */
  lead?: React.ReactNode;
  /** Short line above the name — affiliation, location, availability. */
  eyebrow?: string;
  /** Portrait, monogram or illustration. Sized by the component. */
  portrait?: React.ReactNode;
  /** Facts rendered as a definition list (location, since, focus). */
  facts?: readonly ProfileFact[];
  /** Where else to find the person. */
  links?: readonly SocialLink[];
  /** Primary and secondary actions. */
  actions?: React.ReactNode;
  /** Which way round the portrait and the copy sit. Default `portrait-end`. */
  align?: "portrait-start" | "portrait-end" | "centered";
  variant?: "editorial" | "instrument";
}

export function ProfileHero({
  name,
  title,
  lead,
  eyebrow,
  portrait,
  facts,
  links,
  actions,
  align = "portrait-end",
  variant = "editorial",
  className,
  ...props
}: ProfileHeroProps) {
  const centered = align === "centered";
  return (
    <header
      data-slot="profile-hero"
      data-variant={variant}
      data-align={align}
      className={cn(
        "flex flex-col gap-8",
        !centered && "sm:flex-row sm:items-start sm:gap-10",
        !centered && align === "portrait-start" && "sm:flex-row-reverse",
        centered && "items-center text-center",
        className,
      )}
      {...props}
    >
      <div className={cn("flex min-w-0 flex-1 flex-col gap-4", centered && "items-center")}>
        {eyebrow ? (
          <p className="text-micro font-medium text-fg-accent">{eyebrow}</p>
        ) : null}
        <div className="flex flex-col gap-2">
          <h1
            className={cn(
              "font-display font-semibold text-fg-primary text-balance",
              variant === "editorial"
                ? "text-display tracking-[-0.03em]"
                : "text-display-sm tracking-[-0.02em]",
            )}
          >
            {name}
          </h1>
          {title ? (
            <p className="text-body-lg text-fg-secondary text-pretty">{title}</p>
          ) : null}
        </div>
        {lead ? (
          <div
            className={cn(
              "max-w-[62ch] text-body text-fg-secondary text-pretty",
              variant === "editorial" && "leading-[1.7]",
            )}
          >
            {lead}
          </div>
        ) : null}
        {facts && facts.length > 0 ? (
          <dl className="flex flex-wrap gap-x-8 gap-y-3">
            {facts.map((fact) => (
              <div key={fact.id} className="flex min-w-0 flex-col gap-0.5">
                <dt className="text-micro text-fg-muted">{fact.label}</dt>
                <dd className="text-label text-fg-primary luc-numeric">{fact.value}</dd>
              </div>
            ))}
          </dl>
        ) : null}
        {links && links.length > 0 ? (
          <SocialLinks links={links} orientation="row" size="sm" withHandles={false} />
        ) : null}
        {actions ? (
          <div className={cn("flex flex-wrap items-center gap-2 pt-1", centered && "justify-center")}>
            {actions}
          </div>
        ) : null}
      </div>
      {portrait ? (
        <div
          className={cn(
            "shrink-0",
            centered ? "order-first" : "",
            variant === "editorial" ? "luc-float" : "luc-rest",
          )}
        >
          {portrait}
        </div>
      ) : null}
    </header>
  );
}
