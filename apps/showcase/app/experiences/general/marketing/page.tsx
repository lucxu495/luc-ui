import type { Metadata } from "next";
import { AppShellContent } from "@luc/ui";
import { ExperienceFrame } from "../../frame";
import { MeridianSite } from "./site";

export const metadata: Metadata = { title: "Marketing site" };

/**
 * The page is a server component and the product is a client component, which
 * is the division every real application has: the shell and the copy render on
 * the server, and only the part that holds state ships as client JavaScript.
 */
export default function MarketingExperiencePage() {
  return (
    <AppShellContent width="bleed" className="min-h-screen px-4 py-8 sm:px-8">
      <ExperienceFrame
        kind="general"
        product="Meridian"
        title="A landing page that has to sell something"
        lead="Navigation, a hero built around the product's own surface, feature storytelling, social proof, pricing that changes with the billing period, an FAQ that opens, and a lead form that validates before it thanks you."
        components={["Button", "Card", "Badge", "Progress", "Accordion", "Field", "Input", "NativeSelect", "Callout", "Rating"]}
        journey="Switch the billing period and watch the prices change; open an FAQ row; follow any call to action down to the walkthrough form; submit it empty, then with a broken address, then correctly."
        appearance="Cobalt with the technical mono display face, at the loaded (layered) depth."
        scope={{ palette: "cobalt", typeface: "technical" }}
      >
        <MeridianSite />
      </ExperienceFrame>
    </AppShellContent>
  );
}
