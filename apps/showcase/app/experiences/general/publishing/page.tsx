import type { Metadata } from "next";
import { AppShellContent } from "@luc/ui";
import { ExperienceFrame } from "../../frame";
import { FieldNotesSite } from "./site";

export const metadata: Metadata = { title: "Publishing platform" };

export default function PublishingExperiencePage() {
  return (
    <AppShellContent width="bleed" className="min-h-screen px-4 py-8 sm:px-8">
      <ExperienceFrame
        kind="general"
        product="Field notes"
        title="An index, a reading view and a share control"
        lead="Search and topic filters over a six-article index, a reading view set in the editorial serif at a comfortable measure, related pieces chosen from shared topics, and a share control that copies the address the reader is actually on."
        components={["SearchInput", "Tag", "Badge", "Avatar", "Button", "IconButton", "EmptyState", "Separator", "Toast"]}
        journey="Filter by a topic, search for a word, open the lead story, follow a related link, and copy a link (the toast reports a refusal honestly if the clipboard is blocked)."
        appearance="Ember with the editorial serif, which also loosens the leading — the palette and the type voice are one editorial decision, not two."
        scope={{ palette: "ember", typeface: "editorial" }}
      >
        <FieldNotesSite />
      </ExperienceFrame>
    </AppShellContent>
  );
}
