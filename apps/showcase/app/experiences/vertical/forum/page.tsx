import type { Metadata } from "next";
import { AppShellContent } from "@luc/ui";
import { ExperienceFrame } from "../../frame";
import { SignalForum } from "./site";

export const metadata: Metadata = { title: "Discussion forum" };

export default function ForumExperiencePage() {
  return (
    <AppShellContent width="bleed" className="min-h-screen px-4 py-8 sm:px-8">
      <ExperienceFrame
        kind="vertical"
        product="Signal"
        title="A topic list and a thread that can be moderated"
        lead="A topic list with activity, a thread with replies that score, a reply composer, and a report flow that shows what is being reported and can be cancelled."
        components={["Card", "Avatar", "Textarea", "Field", "Button", "AlertDialog", "Badge", "Timeline", "Toast"]}
        journey="Open the pinned thread, mark a reply helpful, post a reply, then report a reply — and read the confirmation before deciding whether to send it."
        appearance="Electric violet with the humanist system sans — conversational rather than corporate, with no webfont to load."
        scope={{ palette: "violet", typeface: "humanist" }}
      >
        <SignalForum />
      </ExperienceFrame>
    </AppShellContent>
  );
}
