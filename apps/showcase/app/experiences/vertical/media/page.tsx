import type { Metadata } from "next";
import { AppShellContent } from "@luc/ui";
import { ExperienceFrame } from "../../frame";
import { CreatorStudio } from "./site";

export const metadata: Metadata = { title: "Creator studio" };

export default function MediaExperiencePage() {
  return (
    <AppShellContent width="bleed" className="min-h-screen px-4 py-8 sm:px-8">
      <ExperienceFrame
        kind="vertical"
        product="Reel"
        title="A library and an order that is still moving"
        lead="A footage gallery, a reel you can reorder by pointer or keyboard, and metadata that edits the selected asset and survives switching between them."
        components={["ImageGallery", "SortableList", "Rating", "Textarea", "Field", "Card", "Badge", "Toast"]}
        journey="Open an asset from the library, edit its title and note, change its rating, switch to another asset and come back to prove the edit persisted, then reorder the reel and read the announcement."
        appearance="Graphite with the editorial serif — monochrome so the footage is the only colour on the page."
        scope={{ palette: "graphite", typeface: "editorial" }}
      >
        <CreatorStudio />
      </ExperienceFrame>
    </AppShellContent>
  );
}
