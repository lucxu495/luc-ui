"use client";

/*
 * "On this page".
 *
 * The outline is read from the rendered *page*, not declared by each page, for a
 * specific reason: the hand-written pages from earlier phases already have real
 * headings, and a page-authoring convention that requires every page to restate
 * its own sections is a convention that rots. The headings are the source of
 * truth, so the outline stays right — including on pages nobody has touched in
 * a year.
 *
 * The document is not the only thing on the page, though. A live specimen also
 * contains headings — an Accordion renders its items as `h3`, a Card Stack
 * prints sample project titles, a chart legend labels its series — and those
 * used to become outline rows. That produced rails whose labels looked like
 * unrelated product concepts ("Ingestion ok", "Analytics 7", "APAC"), rows that
 * led nowhere useful, and near-duplicate generated ids such as
 * `#built-for-dense-interfacesbuilt-for-dense-interfaces`.
 *
 * So the rule has two halves:
 *
 *   1. **A specimen subtree is never a source of sections.** Anything inside
 *      `data-slot="demo"`, `data-slot="playground"`, `data-slot="card-stack"`,
 *      a `figure`, a `canvas` or an `aria-hidden` region is skipped, whatever
 *      its heading looks like.
 *   2. **A catalogue is not a table of contents.** A page may mark a subtree
 *      `data-outline-ignore` — a grid of cards whose titles are `h3` elements
 *      is a catalogue, and its 30 rows belong in the grid, not in the rail
 *      (`03_SHOWCASE_DESIGN_SPEC.md` §3.1: the sidebar navigates destinations,
 *      catalog controls filter content, page-local navigation moves within the
 *      page).
 *   3. **A section is anchored, and its anchor is unique.** A heading that
 *      carries `data-anchor-id` or its own `id` keeps it; anything else gets a
 *      deterministic slug, and the slug is made unique against the whole
 *      document (not just against the other rows) so a link can never resolve
 *      to two elements.
 *   4. **The rail is top-level sections.** `h2` is the section level; `h3` is a
 *      sub-heading *within* a section, and a rail that lists every sub-heading
 *      stops being navigation and becomes a table of contents for the page's
 *      own prose — `/components/popover` listed one row per component in its own
 *      API table, and `/motion/spatial` listed the captions inside its demos.
 *      A page with no `h2` structure at all still gets a rail: when fewer than
 *      two `h2` headings exist, `h3` is used instead.
 */

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { cn } from "@luc/ui";
import { useI18n } from "@/lib/i18n/provider";

interface OutlineItem {
  id: string;
  label: string;
  level: number;
}

/*
 * Subtrees that belong to a specimen, not to the page's own structure.
 *
 * `figure` and `canvas` are included because the chart and media demos use them
 * as their outer element, and `aria-hidden` because a decorative duplicate of a
 * visible label must never become a reachable section.
 */
const SPECIMEN_SELECTOR = [
  '[data-slot="demo"]',
  '[data-slot="demo-stage"]',
  /*
   * The Components V2 example frame.
   *
   * `Example` is the frame every component page renders its capabilities in
   * (`components/docs/example.tsx`), and its stage is a specimen like any other
   * — so a heading inside it is content, not a page section. The one it was
   * found with: `/components/section` documents the `Section` component, whose
   * own specimen renders an `<h2>` reading "Position sizing", and the rail listed
   * it between "Examples" and "Usage" as though the page had a section by that
   * name. Only the *stage* is skipped rather than the whole `[data-slot="example"]`
   * frame: the frame's own `<h3>` is the example's name, which is what a page
   * with no `h2` structure falls back to.
   */
  '[data-slot="example-stage"]',
  '[data-slot="playground"]',
  '[data-slot="playground-stage"]',
  '[data-slot="playground-controls"]',
  '[data-slot="card-stack"]',
  '[data-slot="chart"]',
  '[data-slot="page-outline"]',
  "figure",
  "canvas",
  '[aria-hidden="true"]',
  /*
   * A card is a composition, not a document section.
   *
   * `<article>` is the HTML element for "a complete, self-contained
   * composition", and it is what the catalogue cards use — one card per
   * capability, in a grid of sixty. Their `h3` is the *name of the thing in the
   * card*, so harvesting them turned `/visuals/elements` into a 73-row rail
   * (UX-004). Excluding `article` leaves the nine real family sections and
   * removes nothing on any page whose sections are sections.
   */
  "article",
].join(", ");

/**
 * The heading level that owns "a section". Everything deeper is a sub-heading
 * of one, and is used for the rail only when a page has no `h2` structure.
 */
const SECTION_LEVEL = 2;

/** A page needs this many sections before its `h2` structure is trusted. */
const SECTION_THRESHOLD = 2;

/** The deepest level the rail will fall back to on a page with no `h2`s. */
const MAX_LEVEL = 3;

function slugify(text: string, index: number): string {
  const slug = text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-|-$/g, "");
  return slug ? `${slug}` : `section-${index}`;
}

/**
 * The anchor for one heading, guaranteed to resolve to exactly that element.
 *
 * A generated slug is checked against the live document, not only against the
 * other rows, so a section id can never collide with an id some component
 * already put on the page.
 */
function anchorFor(heading: HTMLHeadingElement, index: number, taken: Set<string>): string {
  /* `element.id` is `""`, never `null`, when the attribute is absent — so the
   * fallback has to be `||`, not `??`, or every anonymous heading collides on
   * the empty id. */
  const declared = heading.dataset.anchorId || heading.id;
  if (declared && !taken.has(declared)) {
    heading.id = declared;
    taken.add(declared);
    return declared;
  }
  /* A heading without an anchor, or a second heading that claims one already in
   * use, gets a document-unique slug derived from its own text. */
  const base = declared || slugify(heading.textContent?.trim() ?? "", index);
  let candidate = base;
  let suffix = 2;
  while (taken.has(candidate) || (document.getElementById(candidate) !== null && document.getElementById(candidate) !== heading)) {
    candidate = `${base}-${suffix++}`;
  }
  heading.id = candidate;
  taken.add(candidate);
  return candidate;
}

export function PageOutline({ selector = "main" }: { selector?: string }) {
  const [items, setItems] = useState<OutlineItem[]>([]);
  const [active, setActive] = useState<string | null>(null);
  const pathname = usePathname();
  /*
   * DOC-005: the rail's label was a hardcoded English literal on every page in
   * both locales — "On this page" in the visible header *and* as the `nav`'s
   * accessible name. The chrome dictionary already had the key; nothing used it.
   */
  const { t } = useI18n();

  useEffect(() => {
    /*
     * The scan runs after the first paint, not during the effect body.
     *
     * Two reasons, and both are real: heading positions only exist once layout
     * has happened, and committing state synchronously in an effect would
     * render the outline twice for no benefit. The frame callback is where a
     * measurement belongs.
     */
    let observer: IntersectionObserver | null = null;
    const frame = requestAnimationFrame(() => {
      const root = document.querySelector(selector) ?? document.body;
      /* Rules 1–3 first: a heading inside a specimen, a catalogue grid or a
       * card is not part of the page's own structure at any level. */
      const candidates = [...root.querySelectorAll<HTMLHeadingElement>(`h2, h3`)].filter(
        (heading) =>
          !heading.closest(SPECIMEN_SELECTOR) &&
          !heading.closest("[data-outline-ignore]") &&
          (heading.textContent ?? "").trim() !== "",
      );
      /* Rule 4: sections are the rail; sub-headings only stand in when a page
       * declares no sections of its own. */
      const sections = candidates.filter((heading) => heading.tagName === `H${SECTION_LEVEL}`);
      const headings = sections.length >= SECTION_THRESHOLD ? sections : candidates;
      const taken = new Set<string>();
      const collected: OutlineItem[] = [];
      for (const [index, heading] of headings.entries()) {
        const level = Number(heading.tagName.slice(1));
        if (!Number.isFinite(level) || level > MAX_LEVEL) continue;
        const label = heading.textContent?.trim() ?? "";
        if (!label) continue;
        /* Rule 2: an anchor that resolves to this element and nothing else. */
        const id = anchorFor(heading, index, taken);
        collected.push({ id, label, level });
      }
      setItems(collected);
      if (collected.length === 0) return;

      observer = new IntersectionObserver(
        (entries) => {
          const visible = entries
            .filter((entry) => entry.isIntersecting)
            .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
          const first = visible[0]?.target;
          if (first instanceof HTMLElement && first.id) setActive(first.id);
        },
        { rootMargin: "-72px 0px -70% 0px", threshold: [0, 1] },
      );
      for (const item of collected) {
        const node = document.getElementById(item.id);
        if (node) observer.observe(node);
      }
    });
    return () => {
      cancelAnimationFrame(frame);
      observer?.disconnect();
    };
  }, [selector, pathname]);

  /*
   * Nothing to outline means nothing is rendered — not an empty rail.
   *
   * The rail is a flex child, so returning `null` genuinely gives the width
   * back to the page. A grid column would keep reserving its track, which is
   * how 280px of every short page used to sit empty next to the content.
   */
  if (items.length < 2) return null;

  return (
    <aside data-slot="page-outline" className="hidden w-44 shrink-0 xl:block 2xl:w-56">
      <nav
        aria-label={t("docs.onThisPage")}
        className="sticky top-20 flex max-h-[calc(100vh-6rem)] w-full flex-col gap-1 overflow-y-auto"
      >
        <p className="mb-1 text-micro tracking-[0.14em] text-fg-muted uppercase">{t("docs.onThisPage")}</p>
        {items.map((item) => (
          <a
            key={item.id}
            href={`#${item.id}`}
            aria-current={active === item.id ? "location" : undefined}
            className={cn(
              "rounded-sm border-l-2 py-1 pr-2 pl-3 text-caption luc-transition",
              item.level === 3 && "pl-5",
              active === item.id
                ? "border-l-line-accent text-fg-primary"
                : "border-l-transparent text-fg-muted hover:text-fg-secondary",
            )}
          >
            {item.label}
          </a>
        ))}
      </nav>
    </aside>
  );
}
