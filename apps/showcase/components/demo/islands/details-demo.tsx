"use client";

/*
 * The `DataDetails` specimen.
 *
 * `DataDetails` renders its children inside a portal — desktop opens a
 * right-hand panel, a narrow viewport a bottom sheet — so the specimen has to
 * be a client component that owns the trigger, exactly as a product would write
 * it. The rows are a fixed eight-session fixture: the panel shows real markup,
 * not a screenshot of a panel.
 */

import { DataDetails } from "@luc/ui";

const ROWS = [
  { date: "2026-09-25", close: 96.1 },
  { date: "2026-09-28", close: 97.3 },
  { date: "2026-09-29", close: 98.0 },
  { date: "2026-09-30", close: 97.4 },
  { date: "2026-10-01", close: 96.8 },
  { date: "2026-10-02", close: 97.9 },
  { date: "2026-10-05", close: 99.1 },
  { date: "2026-10-06", close: 98.6 },
];

export function DataDetailsDemo() {
  return (
    <DataDetails
      title="Close, eight sessions"
      description="The exact rows behind the chart."
      size="md"
    >
      <table className="w-full text-caption tabular-nums">
        <caption className="sr-only">Close price per session</caption>
        <thead>
          <tr className="text-left text-fg-muted">
            <th scope="col" className="py-1.5 pr-4 font-medium">
              Date
            </th>
            <th scope="col" className="py-1.5 font-medium">
              Close
            </th>
          </tr>
        </thead>
        <tbody>
          {ROWS.map((row) => (
            <tr key={row.date} className="border-t border-line-subtle">
              <td className="py-1.5 pr-4 text-fg-secondary">{row.date}</td>
              <td className="py-1.5 luc-numeric">{row.close.toFixed(1)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </DataDetails>
  );
}
