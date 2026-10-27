import { DocPage } from "@/components/docs/doc-page";
import { PageHeader } from "@/components/docs/page-header";
import { FinancialCrosshairDemo } from "@/components/charts/financial-crosshair-demo";

export const metadata = {
  title: "Professional financial crosshair",
  description:
    "Luc UI Cartesian crosshair, per-axis labels and TradingView-style axis drag scaling.",
};

export default function FinancialCrosshairPage() {
  return (
    <DocPage intent="wide">
      <PageHeader
        eyebrow="Charts · Financial interaction"
        title="Professional financial crosshair"
        lead="Read time and value at the pointer, keep the Tooltip on real observations, and drag each Cartesian plate to scale the view."
      />
      <FinancialCrosshairDemo />
    </DocPage>
  );
}
