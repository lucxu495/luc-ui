import NextLink from "next/link";
import { Badge, cn } from "@luc/ui";
import { CollectionReturn } from "@/components/docs/collection-return";
import { ExperienceStage } from "@/components/doc-pages/full-preview";
import { templateForRoute } from "@/lib/templates";
import { getServerCopy } from "@/lib/i18n/server";

/**
 * The shell every reference experience wears.
 *
 * An experience is not a component page. A component page shows one control in
 * every state; an experience shows what a *product* looks like when sixty of
 * those controls are assembled with real content and a real flow. So the page
 * has to state three things before a reviewer scrolls: which family it belongs
 * to, which public components it is actually built from, and what part of it is
 * illustrative application state rather than library behaviour.
 *
 * The last one matters most. Every experience below runs on deterministic local
 * data with no network — a reviewer has to be able to tell a working library
 * from a convincing screenshot, and saying so in the header is cheaper than
 * making them guess.
 *
 * This file lives beside the pages it decorates (`app/experiences/`), not in the
 * shared `components/` tree, so its copy is required — and verified — on the
 * experience routes and nowhere else.
 */

export type ExperienceKind = "general" | "personal" | "vertical";

const KIND_LABEL: Record<ExperienceKind, string> = {
  general: "General-purpose",
  personal: "Personal site",
  vertical: "Vertical",
};

const KIND_TONE = {
  general: "accent",
  personal: "info",
  vertical: "warning",
} as const;

export interface ExperienceFrameProps {
  kind: ExperienceKind;
  /**
   * The route this experience is served at, when it is also a template.
   *
   * Four of the sixteen reference products are the whole-page starters
   * `/templates` sells: the same page answers "what does this look like
   * finished" and "what do I supply to build it". Passing the route rather than
   * a boolean lets the frame read the template registry, so the link's label and
   * destination cannot drift from the row on `/templates` that points here.
   *
   * Omitted, and the frame renders nothing extra — which is thirteen of them.
   */
  template?: string;
  /** One-line name of the product being simulated: "Northwind", "Field notes". */
  product: string;
  /** What the visitor is looking at. */
  title: string;
  lead: string;
  /** Public components this page actually renders. */
  components: readonly string[];
  /** The user journey the browser QA drives, in one sentence. */
  journey: string;
  /** Which appearance pair the page pins, and why. */
  appearance: string;
  /** Palette, typeface, personality and depth for the whole page. */
  scope?: { palette: string; typeface: string; personality?: string; space?: string };
  children: React.ReactNode;
}

export async function ExperienceFrame({
  kind,
  template,
  product,
  title,
  lead,
  components,
  journey,
  appearance,
  scope,
  children,
}: ExperienceFrameProps) {
  const { tcs } = await getServerCopy();
  /* The template this page is, if it is one. See `template` above. */
  const asTemplate = template ? templateForRoute(template) : undefined;
  const scopeAttributes = scope
    ? {
        "data-palette": scope.palette,
        "data-typeface": scope.typeface,
        ...(scope.personality ? { "data-personality": scope.personality } : {}),
        ...(scope.space ? { "data-space": scope.space } : {}),
      }
    : {};

  return (
    <div className="flex flex-col gap-8" {...scopeAttributes}>
      <header className="flex flex-col gap-4 border-b border-line-subtle pb-6">
        {/*
          * The way back, before anything else on the page.
          *
          * A reference product is one of sixteen, and the page it sits on says
          * nothing about that — a reader who deep-linked here saw a whole website
          * and no statement that it belonged to a collection. The link names the
          * collection by the same row the sidebar uses.
          */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
          <CollectionReturn to="/experiences" label="All experiences" />
          {/*
            * The second way back, and only where there is one.
            *
            * A reader who arrived from `/templates` came through a card that
            * promised composition instructions, and the page they landed on is
            * the finished product. Saying so — and offering the way back to the
            * recipe — is the difference between "this is one of the demos" and
            * "this is the template you asked about".
            */}
          {asTemplate ? <CollectionReturn to="/templates" label="Templates" /> : null}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone={KIND_TONE[kind]} size="sm">
            {tcs(KIND_LABEL[kind])}
          </Badge>
          <span className="text-label text-fg-muted">{tcs(product)}</span>
        </div>
        <div className="flex flex-col gap-2">
          <h1 className="max-w-[26ch] font-display text-display-sm font-semibold tracking-[-0.026em] text-fg-primary text-balance">
            {tcs(title)}
          </h1>
          <p className="max-w-[68ch] text-body-lg text-fg-secondary text-pretty">{tcs(lead)}</p>
        </div>
        <dl className="grid gap-x-8 gap-y-3 sm:grid-cols-3">
          <div className="flex flex-col gap-1">
            <dt className="text-micro text-fg-muted">{tcs("Built from")}</dt>
            <dd className="flex flex-wrap gap-1.5">
              {components.map((name) => (
                <span
                  key={name}
                  className="rounded-xs border border-line-subtle bg-surface-interactive px-1.5 py-0.5 text-micro text-fg-secondary"
                >
                  {name}
                </span>
              ))}
            </dd>
          </div>
          <div className="flex flex-col gap-1">
            <dt className="text-micro text-fg-muted">{tcs("What the browser test drives")}</dt>
            <dd className="text-caption text-fg-secondary text-pretty">{tcs(journey)}</dd>
          </div>
          <div className="flex flex-col gap-1">
            <dt className="text-micro text-fg-muted">{tcs("Appearance")}</dt>
            <dd className="text-caption text-fg-secondary text-pretty">{tcs(appearance)}</dd>
          </div>
        </dl>
      </header>

      {/*
       * The stage. Every experience is rendered on the canvas surface inside a
       * hairline frame so a reviewer can tell where the simulated product starts
       * — and so a product section that is supposed to be full-bleed (a hero, a
       * gallery rail) still reads as belonging to the page.
       *
       * The frame also owns the way out of the documentation's width: see
       * `ExperienceStage`. A website reviewed at 1100px inside a documentation
       * column is not being reviewed at all.
       */}
      <ExperienceStage product={product}>{children}</ExperienceStage>

      <p className="text-caption text-fg-muted">
        {tcs(
          "Interactive, not live: every action below changes local state in this page. No network request is made, no market data is fetched and no message is sent anywhere.",
        )}
      </p>
    </div>
  );
}

export interface ExperienceCardProps {
  href: string;
  product: string;
  title: string;
  summary: string;
  kind: ExperienceKind;
  components: readonly string[];
}

export async function ExperienceCard({
  /* Renamed on the way in: `href` is the localizer below, and a parameter that
   * shadows it is how the Chinese site ended up handing out English URLs. */
  href: route,
  product,
  title,
  summary,
  kind,
  components,
}: ExperienceCardProps) {
  const { tcs, href } = await getServerCopy();
  return (
    <li className="min-w-0">
      <NextLink
        href={href(route)}
        className={cn(
          "luc-rest luc-hover luc-settle luc-focus group flex h-full flex-col gap-3 no-underline",
          "rounded-md border border-line-subtle bg-surface-raised p-5",
        )}
      >
        <span className="flex items-center gap-2">
          <Badge tone={KIND_TONE[kind]} size="sm">
            {tcs(KIND_LABEL[kind])}
          </Badge>
          <span className="text-micro text-fg-muted">{tcs(product)}</span>
        </span>
        <span className="font-display text-heading-sm font-semibold text-fg-primary text-balance">
          {tcs(title)}
        </span>
        <span className="text-body text-fg-secondary text-pretty">{tcs(summary)}</span>
        <span className="mt-auto flex flex-wrap gap-1.5 pt-1">
          {components.slice(0, 6).map((name) => (
            <span
              key={name}
              className="rounded-xs border border-line-subtle bg-surface-interactive px-1.5 py-0.5 text-micro text-fg-muted"
            >
              {name}
            </span>
          ))}
        </span>
      </NextLink>
    </li>
  );
}
