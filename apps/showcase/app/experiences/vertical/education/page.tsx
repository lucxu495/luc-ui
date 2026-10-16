import type { Metadata } from "next";
import { AppShellContent } from "@luc/ui";
import { ExperienceFrame } from "../../frame";
import { CourseModule } from "./site";

export const metadata: Metadata = { title: "Learning module" };

export default function EducationExperiencePage() {
  return (
    <AppShellContent width="bleed" className="min-h-screen px-4 py-8 sm:px-8">
      <ExperienceFrame
        kind="vertical"
        product="Course"
        title="A lesson that teaches, then checks"
        lead="Lesson navigation with accumulating progress, three short readings, and a two-question check that explains every answer — including the wrong ones, because the explanation is the product."
        components={["Progress", "RadioGroup", "Radio", "Callout", "Badge", "Card", "Button"]}
        journey="Read a lesson and mark it complete, watch the sidebar percentage move, answer both questions, press Check my answers and read the reasoning for a correct and an incorrect choice."
        appearance="Electric violet with Inter at instrument geometry — quiet, legible, and pointed at reading rather than at a dashboard."
        scope={{ palette: "violet", typeface: "inter", personality: "instrument" }}
      >
        <CourseModule />
      </ExperienceFrame>
    </AppShellContent>
  );
}
