/*
 * Do / Don't, the two columns the Showcase has printed since Phase 1.
 *
 * Extracted so the curated pages and the registry-generated ones render the same
 * frame over the same curated rows (`lib/docs/curation/notes.ts`), and so a
 * sentence of advice lives in exactly one place: the notes file. A page passes
 * its own `tcs` because this renders both inside a server component and inside a
 * client one, and neither should re-resolve the locale to draw two lists.
 *
 * Deliberately not `"use client"`: it holds no state and no hooks, so it belongs
 * to whichever bundle imported it.
 */

import { Card, Text } from "@luc/ui";

export interface GuidanceCardsProps {
  use?: readonly string[];
  avoid?: readonly string[];
  tcs: (source: string) => string;
}

export function GuidanceCards({ use = [], avoid = [], tcs }: GuidanceCardsProps) {
  const columns = [
    { key: "use", label: "Do", tone: "positive" as const, rows: use },
    { key: "avoid", label: "Don't", tone: "negative" as const, rows: avoid },
  ].filter((column) => column.rows.length > 0);

  if (columns.length === 0) return null;

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {columns.map((column) => (
        <Card key={column.key} variant="outline" className="gap-2 p-4">
          <Text variant="micro" tone={column.tone} as="p">
            {tcs(column.label)}
          </Text>
          <ul className="flex list-disc flex-col gap-1.5 pl-4 text-label text-fg-secondary">
            {column.rows.map((row) => (
              <li key={row}>{tcs(row)}</li>
            ))}
          </ul>
        </Card>
      ))}
    </div>
  );
}
