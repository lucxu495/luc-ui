import type { Metadata } from "next";
import { AppShellContent } from "@luc/ui";
import { ExperienceFrame } from "../../frame";
import { AcademicProfile } from "./site";

export const metadata: Metadata = { title: "Academic profile" };

export default function AcademicExperiencePage() {
  return (
    <AppShellContent width="bleed" className="min-h-screen px-4 py-8 sm:px-8">
      <ExperienceFrame
        kind="personal"
        /* Also a whole-page starter: see /templates. */
        template="/experiences/personal/academic"
        product="Dr. Rita Silva"
        title="A bibliography you can narrow"
        lead="Research interests, six publications with facets derived from the entries themselves, talks, teaching, and identifiers that appear only where the author supplied one."
        components={["ProfileHero", "PublicationList", "SocialLinks", "Timeline", "Badge", "Card"]}
        journey="Filter the bibliography by year, then by type, then by topic, and watch the live count follow; clear a filter and the full list returns."
        appearance="Graphite with the editorial serif at instrument geometry — a monochrome page where the bibliography is the only colour."
        scope={{ palette: "graphite", typeface: "editorial", personality: "instrument" }}
      >
        <AcademicProfile />
      </ExperienceFrame>
    </AppShellContent>
  );
}
