/*
 * The chrome for every page under `/charts`, generated chart pages and the
 * handwritten family overviews alike. See `app/components/layout.tsx`.
 */

import { DocsSection } from "@/components/doc-pages/docs-section";

export default function ChartsLayout({ children }: { children: React.ReactNode }) {
  return <DocsSection>{children}</DocsSection>;
}
