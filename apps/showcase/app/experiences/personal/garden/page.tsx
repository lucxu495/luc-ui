import type { Metadata } from "next";
import { AppShellContent } from "@luc/ui";
import { ExperienceFrame } from "../../frame";
import { FieldNotebookSite } from "./site";

export const metadata: Metadata = { title: "Journal & digital garden" };

export default function GardenExperiencePage() {
  return (
    <AppShellContent width="bleed" className="min-h-screen px-4 py-8 sm:px-8">
      <ExperienceFrame
        kind="personal"
        /* Also a whole-page starter: see /templates. */
        template="/experiences/personal/garden"
        product="Field notebook"
        title="A garden, not a blog"
        lead="A now block that dates itself, notes of four different kinds in one filterable stream, topic chips that narrow the page, a reading shelf with real progress, and an empty state that explains the gap rather than counting zero."
        components={["NowSection", "ReadingShelf", "SegmentedControl", "SearchInput", "Tag", "Badge", "Card"]}
        journey="Switch the kind selector, tap a topic chip, search for a word, land on an empty combination and take the way out of it."
        appearance="Ember with the humanist system sans — warm and unpolished, with no webfont at all."
        scope={{ palette: "ember", typeface: "humanist", personality: "editorial" }}
      >
        <FieldNotebookSite />
      </ExperienceFrame>
    </AppShellContent>
  );
}
