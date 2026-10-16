import { Container, cn } from "@luc/ui";
import { DocsBreadcrumbs } from "../doc-pages/docs-breadcrumbs";
import { PageOutline } from "./page-outline";

/**
 * How much room a page asks for.
 *
 * The five intents are the whole width vocabulary of the Showcase; a page picks
 * one instead of inventing a `max-w-[…]`, which is what keeps sixty pages from
 * drifting into sixty measures. The values live in `app/globals.css` as
 * `--layout-*-max`, because a token is easier to review than a class repeated
 * across a hundred files — and easier to change when the answer turns out to be
 * wrong.
 *
 *   reading  prose only: a description, a guide, a changelog
 *   docs     the default: header, preview, controls, tables, API reference
 *   wide     charts and Studios, where the plot is the product
 *   canvas   a complete simulated website, which is nobody else's layout
 *   compact  one small control on a deliberately composed stage
 */
export type LayoutIntent = "reading" | "docs" | "wide" | "canvas" | "compact";

const INTENT_CLASS: Record<LayoutIntent, string> = {
  reading: "max-w-[var(--layout-reading-max)]",
  docs: "max-w-[var(--layout-docs-max)]",
  wide: "max-w-[var(--layout-wide-max)]",
  canvas: "max-w-none",
  compact: "max-w-[var(--layout-compact-max)]",
};

export interface DocPageProps {
  children: React.ReactNode;
  className?: string;
  /** Default `docs`. See `LayoutIntent`. */
  intent?: LayoutIntent;
  /**
   * Render the "on this page" rail. Off only where a page has no scrollable
   * prose — a full-bleed canvas, for instance, whose own header is inside the
   * simulated product rather than in the documentation.
   */
  outline?: boolean;
}

/**
 * The one page wrapper.
 *
 * It owns three things and delegates everything else: the measure (the intent),
 * the trail (from the URL and the registry, never written per page) and the
 * outline rail. Putting them here rather than in a route-group layout is what
 * lets a wide page be genuinely wide: a group layout has to pick its width
 * before it knows which page is inside it, so it must pick the narrowest one,
 * and every chart page then pays for the widest prose page in the group.
 */
export function DocPage({ children, className, intent = "docs", outline = true }: DocPageProps) {
  return (
    <Container
      width="full"
      data-layout-intent={intent}
      className={cn("flex flex-col gap-9 py-8 sm:py-10", INTENT_CLASS[intent], className)}
    >
      {/*
       * The rail is narrower on a laptop than on a desktop.
       *
       * A 224px rail plus its gutter is a fifth of the content column at
       * 1280px, which is where the chart is supposed to be. The rail is worth
       * keeping at that width — it is the only thing that says where you are on
       * a six-screen API page — but it is worth less than 48px of plot, so it
       * tightens rather than disappears.
       */}
      <div className="flex w-full gap-6 2xl:gap-8">
        <div className="flex min-w-0 flex-1 flex-col gap-9">
          <DocsBreadcrumbs />
          {children}
        </div>
        {outline ? <PageOutline /> : null}
      </div>
    </Container>
  );
}
