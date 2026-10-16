import type { Metadata } from "next";
import { AppShellContent } from "@luc/ui";
import { ExperienceFrame } from "../../frame";
import { ResearchBench } from "./site";

export const metadata: Metadata = { title: "Research bench" };

export default function ScienceExperiencePage() {
  return (
    <AppShellContent width="bleed" className="min-h-screen px-4 py-8 sm:px-8">
      <ExperienceFrame
        kind="vertical"
        product="Bench"
        title="A figure that changes when the instrument does"
        lead="Parameters on the left, figures on the right, and a table of every observation behind the same control. The sliders change the display — bins, marker size, which figure — and never the data."
        components={["Slider", "SegmentedControl", "HistogramChart", "ScatterRegressionChart", "ContourChart", "DataTable", "Card"]}
        journey="Move the bin slider and watch the histogram rebuild, switch figure between density, field and table, and read the sample summary beside it."
        appearance="Cyan with Inter at instrument geometry — calibrated and quiet, which is what a measurement surface should be."
        scope={{ palette: "cyan", typeface: "inter", personality: "instrument" }}
      >
        <ResearchBench />
      </ExperienceFrame>
    </AppShellContent>
  );
}
