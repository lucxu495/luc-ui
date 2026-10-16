import type { Metadata } from "next";
import { AppShellContent } from "@luc/ui";
import { ExperienceFrame } from "../../frame";
import { KestrelPortfolio } from "./site";

export const metadata: Metadata = { title: "Creative portfolio" };

export default function PortfolioExperiencePage() {
  return (
    <AppShellContent width="bleed" className="min-h-screen px-4 py-8 sm:px-8">
      <ExperienceFrame
        kind="personal"
        /* Also a whole-page starter: see /templates. */
        template="/experiences/personal/portfolio"
        product="Studio Kestrel"
        title="The expressive one"
        lead="A pointer-driven spatial hero, a kinetic headline that assembles once, a client marquee, commissions that open in place, a full sleeve series with a real lightbox, and three surfaces that lean toward the cursor."
        components={["ParallaxScene", "KineticHeadline", "Marquee", "TiltSurface", "ProjectShowcase", "ImageGallery", "Lightbox", "Card"]}
        journey="Move the pointer across the hero to see the layers separate, open a commission, open a sleeve in the gallery and step through it with the arrow keys, then close and confirm focus comes back."
        appearance="Electric violet with the editorial serif, the expressive personality and deep spatial depth — the loudest combination the system offers, on purpose."
        scope={{ palette: "violet", typeface: "editorial", personality: "expressive", space: "deep" }}
      >
        <KestrelPortfolio />
      </ExperienceFrame>
    </AppShellContent>
  );
}
