import type { Metadata } from "next";
import { AppShellContent } from "@luc/ui";
import { ExperienceFrame } from "../../frame";
import { PlannerBoard } from "./site";

export const metadata: Metadata = { title: "Productivity board" };

export default function ProductivityExperiencePage() {
  return (
    <AppShellContent width="bleed" className="min-h-screen px-4 py-8 sm:px-8">
      <ExperienceFrame
        kind="vertical"
        product="Planner"
        title="Work you can actually move"
        lead="A four-column board with pointer and keyboard movement, a completion roll-up that follows it, and a bulk selection that changes what the toolbar says it will act on."
        components={["KanbanBoard", "Checkbox", "Progress", "Badge", "Button", "Card", "Toast"]}
        journey="Move a card between columns with the pointer and again with the keyboard, watch the roll-up change, and select two tasks to enable the bulk action."
        appearance="Cyan with Inter at the dense personality — a board is a dense surface, and the default depth is right for it."
        scope={{ palette: "cyan", typeface: "inter", personality: "dense" }}
      >
        <PlannerBoard />
      </ExperienceFrame>
    </AppShellContent>
  );
}
