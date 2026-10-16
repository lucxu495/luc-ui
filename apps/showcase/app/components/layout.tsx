/*
 * The chrome for every page under `/components`.
 *
 * A layout is the only place shared chrome can live without touching each page:
 * this wraps the generated component pages, the family landings and the ~35
 * handwritten pages alike, so a reader moving between a reviewed page and a
 * generated one sees the same trail, the same measure and the same outline.
 *
 * It adds no navigation tree of its own. The sidebar is the application
 * shell's, built from the same registry, and two menus that could disagree
 * about where a component lives would be worse than no breadcrumb at all.
 */

import { DocsSection } from "@/components/doc-pages/docs-section";

export default function ComponentsLayout({ children }: { children: React.ReactNode }) {
  return <DocsSection>{children}</DocsSection>;
}
