/*
 * The server half of the Feedback family overview.
 *
 * A family page is the one place a *choice* between components can be made
 * honestly, and making it needs live specimens — which means most of the page is
 * a client component. What cannot live in a client component is the family's own
 * index: that comes from the registry, so the list of members is built here and
 * handed in, exactly like the API section on a detail page.
 */

import { FamilyEntryList } from "@/components/doc-pages/family-page";
import { entriesInFamily } from "@/lib/docs/registry";
import { FeedbackPage } from "./page-client";

export default function Page() {
  return <FeedbackPage members={<FamilyEntryList entries={entriesInFamily("feedback")} />} />;
}
