import { Button, Card, Heading, Input, Text } from "@luc/ui";
import { ChartDemo } from "./chart-demo";

export default function Page() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-3xl flex-col gap-6 p-8">
      <Card className="gap-4 p-6">
        <Heading size="title" as="h1">
          Luc UI Next.js consumer
        </Heading>
        <Text tone="muted">A Server Component renders Luc UI; the provider is the client boundary.</Text>
        <div className="flex flex-wrap items-end gap-3">
          <Button data-testid="consumer-button" variant="primary">
            Server-rendered action
          </Button>
          <Input data-testid="consumer-input" aria-label="Workspace name" defaultValue="macro-desk" />
        </div>
      </Card>
      <ChartDemo />
    </main>
  );
}
