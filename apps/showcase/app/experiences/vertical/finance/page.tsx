import type { Metadata } from "next";
import { AppShellContent } from "@luc/ui";
import { ExperienceFrame } from "../../frame";
import { DeskTerminal } from "./site";

export const metadata: Metadata = { title: "Quantitative analytics" };

export default function FinanceExperiencePage() {
  return (
    <AppShellContent width="bleed" className="min-h-screen px-4 py-8 sm:px-8">
      <ExperienceFrame
        kind="vertical"
        product="Desk"
        title="A range, a book and the figures behind a row"
        lead="Candles with supplied overlays, an underwater curve on a real date axis, signed factor exposures, a position table, and an inspector that follows the selected row."
        components={["SegmentedControl", "CandlestickChart", "DrawdownChart", "FactorExposureChart", "DataTable", "Badge", "Card"]}
        journey="Narrow the window to thirty sessions and watch all three figures follow, then select a position row and read its own numbers in the panel beside it."
        appearance="Emerald with Inter at the dense personality and flat depth — the console end of the range, where a table must not move."
        scope={{ palette: "emerald", typeface: "inter", personality: "dense", space: "flat" }}
      >
        <DeskTerminal />
      </ExperienceFrame>
    </AppShellContent>
  );
}
