/*
 * Motion Studio.
 *
 * The motion primitives take the props their docs describe, so the Studio
 * exposes those and nothing else: no invented knob, and no pretending that a
 * callback is a control.
 */

import type { Metadata } from "next";
import { DocPage } from "@/components/docs/doc-page";
import { CollectionReturn } from "@/components/docs/collection-return";
import { PageHeader } from "@/components/docs/page-header";
import { MotionStudio } from "@/components/studios/motion-studio";
import { getServerCopy } from "@/lib/i18n/server";

export const metadata: Metadata = {
  title: "Motion Studio — LUC UI",
  description: "Tune the motion primitives against the intensity register they actually read.",
};

export default async function MotionStudioPage() {
  const { tcs } = await getServerCopy();
  return (
    <DocPage intent="wide">
      <PageHeader
        eyebrow={tcs("Studios")}
        title={tcs("Motion Studio")}
        lead={tcs(
          "Tune the real props of a motion primitive against the intensity register it reads, and see the difference rather than argue about it.",
        )}
        actions={<CollectionReturn to="/blocks" label="Build" />}
      />

      <MotionStudio />
    </DocPage>
  );
}
