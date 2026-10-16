import type { Metadata } from "next";
import { AppShellContent } from "@luc/ui";
import { ExperienceFrame } from "../../frame";
import { NorthlightStore } from "./site";

export const metadata: Metadata = { title: "Commerce flow" };

export default function CommerceExperiencePage() {
  return (
    <AppShellContent width="bleed" className="min-h-screen px-4 py-8 sm:px-8">
      <ExperienceFrame
        kind="vertical"
        product="Northlight"
        title="A product page with a real basket"
        lead="Four variants that change the price, the stock line and the delivery estimate; a quantity that changes the subtotal; and a three-step checkout that can always go back — with no card field anywhere."
        components={["RadioGroup", "NativeSelect", "Stepper", "Rating", "Badge", "Card", "Field", "Button", "Toast"]}
        journey="Switch finish and watch the price and stock change, set a quantity, step through checkout and back again, then place the order and read what the demonstration refuses to do."
        appearance="Rose with the humanist system sans — a storefront's warmth, and no webfont payload to pay for it."
        scope={{ palette: "rose", typeface: "humanist" }}
      >
        <NorthlightStore />
      </ExperienceFrame>
    </AppShellContent>
  );
}
