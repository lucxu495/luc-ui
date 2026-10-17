import { Button, Card, Heading, Input, Text, useTheme } from "@luc/ui";
import { LineChart } from "@luc/ui/charts";

const rows = [
  { date: "2026-08-01", close: 94.2 },
  { date: "2026-08-08", close: 95.1 },
  { date: "2026-08-15", close: 96.4 },
  { date: "2026-08-22", close: 95.8 },
  { date: "2026-08-29", close: 97.1 },
  { date: "2026-09-05", close: 98.6 },
];

export function App() {
  const { resolvedTheme, toggleTheme } = useTheme();

  return (
    <main className="mx-auto flex min-h-dvh max-w-3xl flex-col gap-6 p-8">
      <Card className="gap-4 p-6">
        <Heading size="title" as="h1">
          Luc UI consumer
        </Heading>
        <Text tone="muted">The same packed export works in a plain Vite application.</Text>
        <div className="flex flex-wrap items-end gap-3">
          <Button data-testid="consumer-button" variant="primary">
            Run query
          </Button>
          <Button data-testid="theme-toggle" variant="outline" onClick={toggleTheme}>
            Theme: {resolvedTheme}
          </Button>
          <Input data-testid="consumer-input" aria-label="Notebook name" defaultValue="research-notes" />
        </div>
      </Card>

      <Card className="gap-3 p-6" data-testid="chart-card">
        <Heading size="title" as="h2">
          Prepared price series
        </Heading>
        <LineChart
          data={rows}
          xKey="date"
          series={[{ key: "close", label: "Close", type: "line", tone: "accent" }]}
          height={240}
          ariaLabel="Prepared weekly closes"
        />
      </Card>
    </main>
  );
}
