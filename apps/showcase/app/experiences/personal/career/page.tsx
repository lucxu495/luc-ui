import type { Metadata } from "next";
import { AppShellContent } from "@luc/ui";
import { ExperienceFrame } from "../../frame";
import { CareerProfile } from "./site";

export const metadata: Metadata = { title: "Career profile" };

export default function CareerExperiencePage() {
  return (
    <AppShellContent width="bleed" className="min-h-screen px-4 py-8 sm:px-8">
      <ExperienceFrame
        kind="personal"
        /* Also a whole-page starter: see /templates. */
        template="/experiences/personal/career"
        product="Ada Okonkwo"
        title="A career that reads like a career"
        lead="An editorial hero, a timeline of roles with a real open end, selected work that opens in place, and a résumé action that prints the page instead of promising a file that was never bundled."
        components={["ProfileHero", "SocialLinks", "ExperienceTimeline", "ProjectShowcase", "Badge", "Button", "Separator"]}
        journey="Open and close a project, follow the related link, read the timeline, and press Print a CV to see the print layout strip its own controls."
        appearance="Cobalt with Inter at the layered default — the same palette as the marketing page, and a completely different page."
        scope={{ palette: "cobalt", typeface: "inter" }}
      >
        <CareerProfile />
      </ExperienceFrame>
    </AppShellContent>
  );
}
