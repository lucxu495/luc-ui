/*
 * Live Demos — Experiences.
 *
 * `experience-timeline`, `now-section`, `profile-hero`, `project-showcase`,
 * `publication-list`, `reading-shelf`, `social-links`.
 */

/*
 * Personal-site composites.
 *
 * These are the components that make "a personal website" a first-class product
 * category rather than a demo of a card: a CV timeline, a `/now` block, a
 * profile hero, a project gallery, a filterable bibliography, a reading shelf
 * and a profile list. The fixtures are one plausible person's — complete enough
 * that the component's density can be judged, and obviously fictional.
 */

import {
  ExperienceTimeline,
  NowSection,
  ProfileHero,
  PublicationList,
  ReadingShelf,
  SocialLinks,
} from "@luc/ui/experiences";
import { ProjectShowcaseDemo } from "@/components/demo/islands/experience-demo";
import { fixture } from "@/lib/i18n/specimen";
import { composition, type DemoSpec } from "../index";

/*
 * A fictional researcher's contact list.
 *
 * Every target is external and explicitly reserved (`.example` is RFC 2606), so
 * the fixture is self-consistent: a *profile* link points at the person's own
 * site, not at a page inside this Showcase. An internal href here would also
 * have to be language-prefixed, and fixture data declared at module scope cannot
 * know the reader's language (`qa/locale.mjs`).
 */
const LINKS = [
  { id: "email", label: "Email", href: "mailto:ada@example.com", handle: "ada@example.com" },
  { id: "orcid", label: "ORCID", href: "https://orcid.org/0000-0002-1825-0097", handle: "0000-0002-1825-0097" },
  { id: "writing", label: "Writing", href: "https://ada.example/notes", handle: "notes" },
];

export const experienceDemos: readonly DemoSpec[] = [
  composition({
    id: "profile-hero",
    node: (
      <ProfileHero
        name="Ada Rensselaer"
        title="Quantitative researcher"
        eyebrow="Available for collaborations"
        lead="I study how markets absorb information, and I build the tools I need to do it."
        facts={[
          { id: "based", label: "Based", value: "Rotterdam" },
          { id: "focus", label: "Focus", value: "Market microstructure" },
        ]}
        links={LINKS}
      />
    ),
    layout: "block",
    note: "The page's `h1` is the name, the lead is two sentences, and the facts are a definition list rather than a row of chips.",
    code: `<ProfileHero
  name="Ada Rensselaer"
  title="Quantitative researcher"
  eyebrow="Available for collaborations"
  lead="I study how markets absorb information, and I build the tools I need to do it."
  facts={[
    { id: "based", label: "Based", value: "Rotterdam" },
    { id: "focus", label: "Focus", value: "Market microstructure" },
  ]}
  links={links}
/>`,
  }),
  composition({
    id: "experience-timeline",
    node: (
      <ExperienceTimeline
        items={fixture([
          {
            id: "now",
            role: "Principal researcher",
            org: "Delta Desk",
            from: "2023",
            summary: "Microstructure research, and the tooling it depends on.",
            highlights: ["Published a tick-level imbalance study", "Built the desk's signal review process"],
            tags: ["microstructure", "Python"],
          },
          {
            id: "prev",
            role: "Quantitative analyst",
            org: "Northgate Capital",
            from: "2019",
            to: "2023",
            summary: "Cross-sectional equity signals and execution research.",
            tags: ["equities", "execution"],
          },
        ], ["summary"])}
      />
    ),
    layout: "block",
    note: "A role with no `to` date is current, and the label for that is a prop so a site can localise it.",
    code: `<ExperienceTimeline
  items={[
    {
      id: "now",
      role: "Principal researcher",
      org: "Delta Desk",
      from: "2023",
      highlights: ["Published a tick-level imbalance study"],
      tags: ["microstructure"],
    },
  ]}
/>`,
  }),
  composition({
    id: "project-showcase",
    node: <ProjectShowcaseDemo />,
    layout: "block",
    note: "Cover art is optional and falls back to a typographic tile, so the gallery works with no images at all.",
    code: `<ProjectShowcase
  projects={projects}
  label="Projects"
  columns={2}
  renderDetail={(project) => <Text variant="body">{project.summary}</Text>}
/>`,
  }),
  composition({
    id: "publication-list",
    node: (
      <PublicationList
        publications={fixture([
          {
            id: "imbalance",
            title: "Queue imbalance and short-horizon returns",
            authors: "Rensselaer, A., Okafor, N.",
            venue: "Journal of Market Microstructure",
            year: 2025,
            kind: "Journal article",
            topics: ["microstructure"],
            doi: "10.1000/example.2025.1",
            citations: 14,
          },
          {
            id: "execution",
            title: "Execution quality under a volatility regime change",
            authors: "Rensselaer, A.",
            venue: "Preprint",
            year: 2024,
            kind: "Preprint",
            topics: ["execution"],
            /* A publication links to the publication. */
            url: "https://doi.org/10.1000/example.2024.2",
            citations: 6,
          },
        ], ["title"])}
      />
    ),
    layout: "block",
    note: "Facets are derived from the entries themselves, and a citation count is shown only when the caller supplies one.",
    code: `<PublicationList
  publications={publications}
  defaultValue={{ year: "all", kind: "all", topic: "all" }}
/>`,
  }),
  composition({
    id: "reading-shelf",
    node: (
      <ReadingShelf
        items={fixture([
          { id: "b1", title: "Trading and Exchanges", author: "Larry Harris", status: "reading", progress: 0.38, progressLabel: "p. 142 of 380" },
          { id: "b2", title: "Thinking in Systems", author: "Donella Meadows", status: "queued", note: "For the regime chapter." },
          { id: "b3", title: "The Visual Display of Quantitative Information", author: "Edward Tufte", status: "finished" },
        ], ["title", "note"])}
      />
    ),
    layout: "block",
    note: "Grouped by status, with progress rendered only for the statuses where progress means anything.",
    code: `<ReadingShelf
  items={items}
  layout="list"
  label="Reading shelf"
/>`,
  }),
  composition({
    id: "now-section",
    node: (
      <NowSection
        updatedAt="2026-10-01"
        items={fixture([
          { id: "building", label: "Building", value: "A replay tool for one exchange feed." },
          { id: "reading", label: "Reading", value: "Trading and Exchanges." },
          { id: "place", label: "Place", value: "Rotterdam" },
        ], ["label", "value"])}
      />
    ),
    layout: "block",
    note: "The date is an ISO string, not a `Date`: a reader in Auckland and a reader in Lima see the same day.",
    code: `<NowSection
  updatedAt="2026-10-01"
  title="Now"
  items={[
    { id: "building", label: "Building", value: "A replay tool." },
    { id: "place", label: "Place", value: "Rotterdam" },
  ]}
/>`,
  }),
  composition({
    id: "social-links",
    node: <SocialLinks links={LINKS} label="Profiles and contact" />,
    code: `<SocialLinks
  links={[
    { id: "email", label: "Email", href: "mailto:ada@example.com", handle: "ada@example.com" },
    { id: "orcid", label: "ORCID", href: "https://orcid.org/0000-0002-1825-0097" },
  ]}
  label="Profiles and contact"
/>`,
    note: "The label is always visible, the glyph is decorative, and the handle distinguishes two accounts on one service.",
  }),
];
