import type { Metadata } from "next";
import { DocPage } from "@/components/docs/doc-page";
import {
  HomeChartFeature,
  HomeClosing,
  HomeHero,
  HomeInstall,
  HomeMotionFeature,
  HomeProductStory,
  HomeResources,
} from "@/components/home";

/*
 * The Showcase homepage — the front door of a documented design system.
 *
 * What changed in Phase 10A, and why:
 *
 *  - **It is wider.** The page used the `docs` intent (104 rem), the same column
 *    as a component page, which left a third of a 2560 px display unused and made
 *    the hero read like documentation rather than like a front door. It is now
 *    `wide`, and the sections inside it decide their own composition.
 *  - **It shows range.** The previous version demonstrated one thing — a
 *    component page in miniature. This one runs the length of the system: a
 *    specimen sheet of live components, the rules, a real chart, real motion, the
 *    catalog with its counts, the honest installation story, and a closing
 *    statement about where the project actually stands.
 *  - **It stays a server component.** Every interactive part is a named client
 *    island (`HomeMotionFeature`, and the lazily loaded chart inside
 *    `HomeChartFeature`); nothing else pays for hydration.
 *  - **It makes only claims it can demonstrate.** Every destination is a real
 *    route, every count is read from the discovery catalog, and the installation
 *    section still says out loud that no registry release exists yet.
 *
 * The V4-era marketing strips (personalities, palettes, industries, engineering)
 * remain where they belong — `/foundations`, `/patterns` and `/motion` — rather
 * than being repeated here.
 */

export const metadata: Metadata = {
  title: "Luc UI — precision meets expression",
  description:
    "A React and TypeScript design system: tokens, accessible components, spatial motion, professional charts and sixteen reference products — documented one page at a time, in English and Simplified Chinese.",
};

export default function HomePage() {
  return (
    <DocPage intent="wide" outline={false} className="gap-12">
      <HomeHero />
      <HomeProductStory />
      <HomeChartFeature />
      <HomeMotionFeature />
      <HomeResources />
      <HomeInstall />
      <HomeClosing />
    </DocPage>
  );
}
