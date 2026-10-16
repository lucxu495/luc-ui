import type { Metadata } from "next";
import { Callout, Section, Text } from "@luc/ui";
import { DocPage } from "@/components/docs/doc-page";
import { PageHeader } from "@/components/docs/page-header";
import { getServerCopy } from "@/lib/i18n/server";
import { ExperienceCard, type ExperienceKind } from "./frame";

export const metadata: Metadata = { title: "Experiences" };

/**
 * The experiences index.
 *
 * Grouped by *what a visitor is trying to build*, not by component family: a
 * developer looking for "something like a personal site" should not have to
 * translate their problem into the library's taxonomy first. The three groups
 * mirror the product's own layering — general-purpose products, personal
 * websites, and one vertical each — and every card names the public components
 * it is actually built from, so the index doubles as a discovery surface.
 */

interface Entry {
  href: string;
  product: string;
  title: string;
  summary: string;
  kind: ExperienceKind;
  components: readonly string[];
}

const GENERAL: Entry[] = [
  {
    href: "/experiences/general/marketing",
    product: "Meridian",
    title: "Marketing site",
    summary:
      "A landing page that has to sell something: hero, feature storytelling, pricing, an FAQ that opens, and a lead form that validates before it thanks you.",
    kind: "general",
    components: ["AppShell", "Button", "Card", "Accordion", "Field", "Input"],
  },
  {
    href: "/experiences/general/saas",
    product: "Ledgerline",
    title: "SaaS console",
    summary:
      "The application shell a working tool lives in — sidebar, a filterable table, an invite dialog that really adds a row, and a settings sheet.",
    kind: "general",
    components: ["AppShell", "DataTable", "Dialog", "Sheet", "Select", "Toast"],
  },
  {
    href: "/experiences/general/publishing",
    product: "Field notes",
    title: "Publishing platform",
    summary:
      "An article index you can search and filter by topic, a reading view with editorial typography, and a share control that copies a real link.",
    kind: "general",
    components: ["SearchInput", "Tag", "Card", "Avatar", "Toast", "Breadcrumbs"],
  },
  {
    href: "/experiences/general/community",
    product: "Common room",
    title: "Community product",
    summary:
      "A feed with a composer, reactions, comments and a moderation flow — including the confirmation step before anything is deleted.",
    kind: "general",
    components: ["Card", "Avatar", "Textarea", "AlertDialog", "Badge", "Toast"],
  },
];

const PERSONAL: Entry[] = [
  {
    href: "/experiences/personal/career",
    product: "Ada Okonkwo",
    title: "Career profile",
    summary:
      "A professional site that reads like a career rather than a résumé: identity, a timeline of roles, selected work, and an honest print action.",
    kind: "personal",
    components: ["ProfileHero", "SocialLinks", "ExperienceTimeline", "ProjectShowcase"],
  },
  {
    href: "/experiences/personal/academic",
    product: "R. Silva",
    title: "Academic profile",
    summary:
      "A research page where the bibliography is the product: publications narrowed by year, type and topic, with DOI links that appear only when there is one.",
    kind: "personal",
    components: ["ProfileHero", "PublicationList", "Timeline", "Badge", "Card"],
  },
  {
    href: "/experiences/personal/portfolio",
    product: "Studio Kestrel",
    title: "Creative portfolio",
    summary:
      "The expressive one: a display-scale hero, a project grid that opens in place, and spatial motion that answers the pointer instead of performing for it.",
    kind: "personal",
    components: ["ProjectShowcase", "ParallaxScene", "Marquee", "Lightbox", "KineticHeadline"],
  },
  {
    href: "/experiences/personal/garden",
    product: "Field notebook",
    title: "Journal & digital garden",
    summary:
      "An exploratory personal site: a now block with a date on it, a reading shelf with real progress, tagged notes, and topics that filter the whole page.",
    kind: "personal",
    components: ["NowSection", "ReadingShelf", "Tag", "Card", "SearchInput", "SegmentedControl"],
  },
];

const VERTICAL: Entry[] = [
  {
    href: "/experiences/vertical/ai",
    product: "Copilot desk",
    title: "AI workspace",
    summary:
      "A provider-neutral agent session: a message list, a response that streams, a tool-call timeline that reports durations, and a prompt composer that holds its state.",
    kind: "vertical",
    components: ["MessageList", "StreamingText", "ToolCallTimeline", "PromptComposer", "AgentActivity"],
  },
  {
    href: "/experiences/vertical/science",
    product: "Bench",
    title: "Research bench",
    summary:
      "A measurement instrument: parameters drive the chart, the distribution and the contour update together, and every number on screen is supplied rather than derived.",
    kind: "vertical",
    components: ["Slider", "SegmentedControl", "HistogramChart", "ContourChart", "DataTable"],
  },
  {
    href: "/experiences/vertical/finance",
    product: "Desk",
    title: "Quantitative analytics",
    summary:
      "A time-range control over a candle chart, an underwater curve on a real date axis, factor exposure, and an inspector bound to the selected row.",
    kind: "vertical",
    components: ["SegmentedControl", "CandlestickChart", "DrawdownChart", "DataTable", "InspectorPane"],
  },
  {
    href: "/experiences/vertical/commerce",
    product: "Northlight",
    title: "Commerce flow",
    summary:
      "A product page with variants that change the price and the stock line, a cart that counts what is in it, and a three-step checkout that can go back.",
    kind: "vertical",
    components: ["Carousel", "Badge", "RadioGroup", "Stepper", "Button", "Toast"],
  },
  {
    href: "/experiences/vertical/education",
    product: "Course",
    title: "Learning module",
    summary:
      "Lesson navigation, a checked quiz that scores itself and explains each answer, and progress that survives moving between lessons.",
    kind: "vertical",
    components: ["Sidebar", "RadioGroup", "Progress", "Callout", "Button"],
  },
  {
    href: "/experiences/vertical/media",
    product: "Reel",
    title: "Creator studio",
    summary:
      "A media library with a gallery, a lightbox that keeps its place, a collection that can be reordered, and metadata that can be edited and saved.",
    kind: "vertical",
    components: ["ImageGallery", "Lightbox", "SortableList", "Field", "Textarea", "Rating"],
  },
  {
    href: "/experiences/vertical/productivity",
    product: "Planner",
    title: "Productivity board",
    summary:
      "A board you can actually move work on — pointer or keyboard — with a status roll-up, bulk selection and a resizable workspace beside it.",
    kind: "vertical",
    components: ["KanbanBoard", "SortableList", "Checkbox", "Workspace", "Progress", "Toast"],
  },
  {
    href: "/experiences/vertical/forum",
    product: "Signal",
    title: "Discussion forum",
    summary:
      "A topic list, a threaded discussion, reaction counts that update, and a report flow whose destructive step is confirmed rather than instant.",
    kind: "vertical",
    components: ["Card", "Textarea", "Avatar", "AlertDialog", "Timeline", "Badge"],
  },
];

export default async function ExperiencesIndex() {
  const { tcs } = await getServerCopy();
  return (
    <DocPage>
      <PageHeader
        eyebrow={tcs("Experiences")}
        title="Reference products"
        lead="Sixteen working pages built from the public API, grouped by what you are trying to build. Each one names the components it uses, runs on deterministic local data, and is driven by a real browser test rather than a screenshot."
      />

      <Callout tone="neutral" title={tcs("What these pages are for")}>
        <Text variant="body" tone="secondary">
          {tcs(
            "A component gallery proves a control works. A product proves the controls compose. These pages exist to find the second kind of failure — the spacing that only breaks when four components meet, the focus that is lost when an overlay opens over a table, the empty state nobody wrote because the demo data was never empty.",
          )}
        </Text>
      </Callout>

      <Section
        title={tcs("General-purpose products")}
        description={tcs(
          "Marketing, software, publishing and community. Four different products, one component set, and no finance vocabulary anywhere in them.",
        )}
      >
        <ul className="grid list-none gap-4 md:grid-cols-2">
          {GENERAL.map((entry) => (
            <ExperienceCard key={entry.href} {...entry} />
          ))}
        </ul>
      </Section>

      <Section
        title={tcs("Personal websites")}
        description={tcs(
          "Personal sites are a first-class product direction, not a smaller marketing page. These four are deliberately different from each other — a career, a bibliography, a portfolio and a garden — because one template with a different accent colour serves none of them.",
        )}
      >
        <ul className="grid list-none gap-4 md:grid-cols-2">
          {PERSONAL.map((entry) => (
            <ExperienceCard key={entry.href} {...entry} />
          ))}
        </ul>
      </Section>

      <Section
        title={tcs("Vertical journeys")}
        description={tcs(
          "One convincing flow each, rather than eight half-finished applications. Every one of them is a user journey with a beginning, an action and a result.",
        )}
      >
        <ul className="grid list-none gap-4 md:grid-cols-2">
          {VERTICAL.map((entry) => (
            <ExperienceCard key={entry.href} {...entry} />
          ))}
        </ul>
      </Section>

      <Section
        title={tcs("How to read these pages")}
        description={tcs(
          "Every experience states the components it uses and the journey its browser test drives. The state is local and deterministic; the appearance pinned at the top of each page is part of the demonstration, not a requirement.",
        )}
      >
        <div className="flex flex-col gap-3">
          <Text variant="body" tone="secondary">
            {tcs(
              "Change the palette, type voice or spatial depth in the appearance controls and the whole page follows, because nothing here is styled by hand — the same attributes that restyle the component gallery restyle a product.",
            )}
          </Text>
          <Text variant="caption" tone="muted">
            {tcs(
              "Two things are intentionally absent: real checkout, and real model calls. Both are represented by local state with the same shape as the real interaction.",
            )}
          </Text>
        </div>
      </Section>
    </DocPage>
  );
}
