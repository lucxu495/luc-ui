import type { Metadata } from "next";
import { AppShellContent } from "@luc/ui";
import { ExperienceFrame } from "../../frame";
import { LedgerlineConsole } from "./site";

export const metadata: Metadata = { title: "SaaS console" };

export default function SaasExperiencePage() {
  return (
    <AppShellContent width="bleed" className="min-h-screen px-4 py-8 sm:px-8">
      <ExperienceFrame
        kind="general"
        product="Ledgerline"
        title="The console a working tool lives in"
        lead="A sidebar, a filter bar, a table that is the product, an invite dialog that really adds a row, a settings sheet, and a notification inbox with read state. Rendered at flat depth, because a dense table must not move under the reader."
        components={[
          "DataTable",
          "StatusBadge",
          "SearchInput",
          "NativeSelect",
          "Dialog",
          "Sheet",
          "Switch",
          "NotificationCenter",
          "EmptyState",
          "Tabs",
          "Toast",
        ]}
        journey="Filter the directory by role, search for a name, invite a member and watch the row appear, clear a notification, open the settings sheet and save."
        appearance="Emerald with Inter, the dense personality and flat depth — the opposite end of the appearance range from the marketing page."
        scope={{ palette: "emerald", typeface: "inter", personality: "dense", space: "flat" }}
      >
        <LedgerlineConsole />
      </ExperienceFrame>
    </AppShellContent>
  );
}
