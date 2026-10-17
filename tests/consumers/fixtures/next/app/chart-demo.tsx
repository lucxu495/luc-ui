"use client";

import { Button, Card, Heading, useTheme } from "@luc/ui";
import { LineChart } from "@luc/ui/charts";

const rows = [
  { date: "2026-08-01", close: 94.2 },
  { date: "2026-08-08", close: 95.1 },
  { date: "2026-08-15", close: 96.4 },
  { date: "2026-08-22", close: 95.8 },
  { date: "2026-08-29", close: 97.1 },
  { date: "2026-09-05", close: 98.6 },
];

export function ChartDemo() {
  const { resolvedTheme, toggleTheme } = useTheme();
  return (
    <Card className="gap-3 p-6" data-testid="chart-card">
      <div className="flex items-center justify-between gap-3">
        <Heading size="title" as="h2">
          Client chart island
        </Heading>
        <Button data-testid="theme-toggle" variant="outline" onClick={toggleTheme}>
          Theme: {resolvedTheme}
        </Button>
      </div>
      <LineChart
        data={rows}
        xKey="date"
        series={[{ key: "close", label: "Close", type: "line", tone: "accent" }]}
        height={240}
        ariaLabel="Prepared weekly closes"
      />
    </Card>
  );
}
