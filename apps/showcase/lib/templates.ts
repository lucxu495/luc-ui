/*
 * The template registry.
 *
 * Four whole-page starters, each one a reference product that is also a
 * composition recipe: the same page answers "what does this look like finished"
 * (Experiences) and "what do I supply to build it" (here).
 *
 * It lives outside the page because two things read it now. `/templates` renders
 * it, and the four experience pages ask it whether they are also a template — so
 * a reader who arrived from Templates gets a way back to Templates, and the fact
 * that a page is a template is declared once rather than remembered in a boolean.
 */

export interface Template {
  id: string;
  /** The page's heading for the starter. */
  title: string;
  /** The reference product that *is* this template. */
  route: string;
  /** Which family of reference product the starter belongs to. */
  kind: "personal" | "general" | "vertical";
  summary: string;
  /** What a reader has to replace to make it theirs. */
  supply: string;
  /** Public exports the composition is built from. */
  stack: readonly string[];
}

export const TEMPLATES: readonly Template[] = [
  {
    id: "career",
    title: "Career profile",
    route: "/experiences/personal/career",
    kind: "personal",
    summary: "Editorial hero, a timeline with a real open end, work that expands in place, and a print action.",
    supply: "Your roles, projects and the CV you are willing to publish.",
    stack: ["ProfileHero", "ExperienceTimeline", "ProjectShowcase", "Timeline"],
  },
  {
    id: "academic",
    title: "Academic profile",
    route: "/experiences/personal/academic",
    kind: "personal",
    summary: "Publications with year, kind and topic facets derived from the entries — and no invented citation counts.",
    supply: "A publication list with author lines exactly as the venues print them.",
    stack: ["ProfileHero", "PublicationList", "Timeline"],
  },
  {
    id: "portfolio",
    title: "Creative portfolio",
    route: "/experiences/personal/portfolio",
    kind: "personal",
    summary: "A gallery-led grid where the chosen project grows into a detail region.",
    supply: "Cover media, project copy and the links a visitor should follow.",
    stack: ["ProjectShowcase", "ImageGallery", "Lightbox"],
  },
  {
    id: "garden",
    title: "Journal and garden",
    route: "/experiences/personal/garden",
    kind: "personal",
    summary: "Notes in date order, a reading shelf grouped by status, and a /now block that carries its date.",
    supply: "Entries and their real dates; the /now timestamp is required by the component.",
    stack: ["Timeline", "ReadingShelf", "NowSection"],
  },
  {
    id: "marketing",
    title: "Marketing page",
    route: "/experiences/general/marketing",
    kind: "general",
    summary: "Hero, capability narrative, proof, pricing that follows the billing period, and a validating lead form.",
    supply: "Your claims, your proof and a destination for the form.",
    stack: ["Section", "Card", "Form", "Field", "Accordion"],
  },
  {
    id: "saas",
    title: "SaaS console",
    route: "/experiences/general/saas",
    kind: "general",
    summary: "Shell, toolbar, a table that is the product, a dialog that adds a row, and a settings sheet.",
    supply: "Columns, data and the actions that change them.",
    stack: ["AppShell", "DataTable", "Dialog", "Sheet", "Toaster"],
  },
  {
    id: "publishing",
    title: "Publishing platform",
    route: "/experiences/general/publishing",
    kind: "general",
    summary: "An index with search and topic filters, a comfortable reading view and a share control.",
    supply: "Articles, topics and a canonical URL per piece.",
    stack: ["SearchInput", "SegmentedControl", "Container", "Heading"],
  },
  {
    id: "research",
    title: "Research workspace",
    route: "/patterns/research-workspace",
    kind: "vertical",
    summary: "The flagship composition: shell, resizable panes, a chart with an inspector, a table, URL state and toasts.",
    supply: "A real dataset and the metric definitions behind it.",
    stack: ["Workspace", "InspectorPane", "DataTable", "LineChart", "useUrlState"],
  },
];

/** Is this experience also a template? Keyed by the route it lives at. */
export function templateForRoute(route: string): Template | undefined {
  return TEMPLATES.find((template) => template.route === route);
}
