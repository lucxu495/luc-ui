import type { Metadata } from "next";
import { AppShellContent } from "@luc/ui";
import { ExperienceFrame } from "../../frame";
import { CommonRoomSite } from "./site";

export const metadata: Metadata = { title: "Community product" };

export default function CommunityExperiencePage() {
  return (
    <AppShellContent width="bleed" className="min-h-screen px-4 py-8 sm:px-8">
      <ExperienceFrame
        kind="general"
        product="Common room"
        title="A feed where every action changes something"
        lead="A composer, reactions that count, replies that append, a follow that flips, and a moderation flow with a confirmation that quotes the post and can be cancelled."
        components={["Card", "Avatar", "Textarea", "Field", "Button", "Menu", "AlertDialog", "Badge", "Toast"]}
        journey="Post a note (and be told off for posting two words), react to a post, reply to it, follow its author, then delete a post and confirm — or cancel."
        appearance="Rose with the humanist system sans and no webfont, which keeps a social surface warm without a font payload."
        scope={{ palette: "rose", typeface: "humanist" }}
      >
        <CommonRoomSite />
      </ExperienceFrame>
    </AppShellContent>
  );
}
