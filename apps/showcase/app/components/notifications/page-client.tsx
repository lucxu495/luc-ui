"use client";

/*
 * The body of the NotificationCenter page.
 *
 * This page used to document two components — the centre *and* `GuidedTour` —
 * and the tour already has its own canonical page at `/components/guided-tour`,
 * which meant the same island was described twice under two different headings.
 * The split is the same one the Forms review made for ColourPicker and
 * TransferList: one page, one subject, and a Related row for the neighbour.
 *
 * What the examples had to gain: the list was one specimen with a badge on it.
 * Now the reader can watch the state change — mark a row read, mark everything
 * read, dismiss, and see the empty state — because that is the whole contract of
 * a controlled inbox.
 */

import { useMemo, useState, type ReactNode } from "react";
import { Button, Card, Heading, Inline, NotificationCenter, Panel, Text, type NotificationItem } from "@luc/ui";
import { DocPage } from "@/components/docs/doc-page";
import { PageHeader } from "@/components/docs/page-header";
import { ImportLine } from "@/components/docs/family-imports";
import { Example } from "@/components/docs/example";
import { CodeBlock } from "@/components/docs/code-block";
import { GuidanceCards } from "@/components/docs/guidance";
import { EntryFooter } from "@/components/docs/entry-footer";
import { ENTRY_NOTES } from "@/lib/docs/curation/notes";
import { useI18n } from "@/lib/i18n/provider";

/*
 * The fixture, built from the dictionary.
 *
 * A notification's own sentence is the content of this page, not a value like a
 * chart's series name: the reader is being shown what an inbox looks like, so
 * those sentences go through `tcs` like every other sentence on the page. The
 * ids, the timestamps and the tones are data and stay as they are.
 */
function seedItems(tcs: (source: string) => string): NotificationItem[] {
  return [
    {
      id: "n1",
      title: tcs("Ingest finished for 44 sectors"),
      description: tcs("1,284,902 rows written; two sectors were skipped."),
      timestamp: "2m",
      tone: "positive",
    },
    {
      id: "n2",
      title: tcs("Provider B is degraded"),
      description: tcs("Latency above the 800 ms budget for eleven minutes."),
      timestamp: "18m",
      tone: "warning",
    },
    {
      id: "n3",
      title: tcs("Backtest report is ready"),
      description: "btc-sma-2026-09 · 4 artifacts",
      timestamp: "1h",
      read: true,
      tone: "info",
    },
    {
      id: "n4",
      title: tcs("Two datasets are stale"),
      timestamp: "3h",
      tone: "warning",
    },
  ];
}

/** A long inbox, for the shape that has to scroll rather than grow. */
function manyItems(tcs: (source: string) => string): NotificationItem[] {
  return Array.from({ length: 18 }, (_, index) => ({
    id: `m${index}`,
    title: tcs("Validation pass {number} finished").replace("{number}", String(18 - index)),
    description:
      index % 3 === 0 ? tcs("Seven domains matched; one carried a warning.") : undefined,
    timestamp: `${index + 1}h`,
    read: index > 4,
    tone: index % 5 === 0 ? ("info" as const) : ("neutral" as const),
  }));
}

export function NotificationsPage({ apiSection }: { apiSection?: ReactNode }) {
  const { tcs, href } = useI18n();
  const notes = ENTRY_NOTES["notification-center"];
  const seed = useMemo(() => seedItems(tcs), [tcs]);
  const [items, setItems] = useState<NotificationItem[]>(seed);
  const [lastAction, setLastAction] = useState("—");
  const [longItems, setLongItems] = useState<NotificationItem[]>(() => manyItems(tcs));

  const unread = items.filter((item) => !item.read).length;

  return (
    <DocPage>
      <PageHeader
        eyebrow={tcs("Feedback")}
        title="NotificationCenter"
        lead="An inbox for the notifications a user has already been shown, with read state."
      />

      <section className="flex flex-col gap-5">
        <Heading size="title" as="h2" id="examples">
          {tcs("Examples")}
        </Heading>

        <Example
          title={tcs("The bell, the badge and the list")}
          description={tcs(
            "Open it and work through it: the count is the list's own state, marking a row read moves the badge, and dismissing removes it. The panel's open state stays local — a popover is not a route.",
          )}
          layout="block"
          code={`const [items, setItems] = useState(seed);\n\n<NotificationCenter\n  items={items}\n  onRead={(id) => markRead(id)}\n  onReadAll={() => markAllRead()}\n  onDismiss={(id) => remove(id)}\n  footer={<Button variant="ghost" size="sm">View all</Button>}\n/>`}
        >
          <Card variant="outline" className="flex w-full flex-wrap items-center gap-4 p-4">
            <NotificationCenter
              items={items}
              onRead={(id) => {
                setLastAction(tcs("read {id}").replace("{id}", id));
                setItems((current) =>
                  current.map((item) => (item.id === id ? { ...item, read: true } : item)),
                );
              }}
              onReadAll={() => {
                setLastAction(tcs("marked every row read"));
                setItems((current) => current.map((item) => ({ ...item, read: true })));
              }}
              onDismiss={(id) => {
                setLastAction(tcs("dismissed {id}").replace("{id}", id));
                setItems((current) => current.filter((item) => item.id !== id));
              }}
              onOpenItem={(id) => setLastAction(tcs("opened {id}").replace("{id}", id))}
              footer={
                <Button variant="ghost" size="sm">
                  {tcs("View all notifications")}
                </Button>
              }
            />
            <Inline gap="sm" align="center">
              <Text variant="caption" tone="muted">
                {tcs("{count} unread").replace("{count}", String(unread))}
              </Text>
              <Button size="sm" variant="secondary" onClick={() => setItems(seed)}>
                {tcs("Reset the inbox")}
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setItems([])}>
                {tcs("Empty it")}
              </Button>
            </Inline>
          </Card>
          <Text variant="caption" tone="muted" as="p" className="max-w-[68ch]">
            {tcs("Last action:")} <span className="font-mono">{lastAction}</span>
          </Text>
        </Example>

        <Example
          title={tcs("The empty inbox")}
          description={tcs(
            "An inbox is empty the moment the last row is read or dismissed, and that is a state worth writing: the default copy says the reader is up to date, and `footer` is where the follow-up action goes.",
          )}
          layout="block"
          code={`<NotificationCenter\n  items={[]}\n  emptyTitle="You are up to date"\n  emptyDescription="New notifications appear here."\n  footer={<Button size="sm" variant="ghost">Open the log</Button>}\n/>`}
        >
          <Card variant="outline" className="flex w-full flex-wrap items-center gap-4 p-4">
            <NotificationCenter
              items={[]}
              emptyTitle={tcs("You are up to date")}
              emptyDescription={tcs("New notifications appear here, newest first.")}
              footer={
                <Button size="sm" variant="ghost">
                  {tcs("Open the ingest log")}
                </Button>
              }
            />
            <Text variant="caption" tone="muted">
              {tcs("Nothing expires here: the list is empty because every row was read, not because a timer ran out.")}
            </Text>
          </Card>
        </Example>

        <Example
          title={tcs("A long list scrolls, it does not grow")}
          description={tcs(
            "Eighteen rows, and the panel keeps its own height. The list is a scroll region, so it takes a tab stop — a keyboard user cannot drag a scrollbar.",
          )}
          layout="block"
          code={`<NotificationCenter\n  items={items}\n  footer={<Button size="sm" variant="ghost">View all 240</Button>}\n/>`}
        >
          <Card variant="outline" className="flex w-full flex-wrap items-center gap-4 p-4">
            <NotificationCenter
              items={longItems}
              onReadAll={() => setLongItems((current) => current.map((item) => ({ ...item, read: true })))}
              footer={
                <Button size="sm" variant="ghost">
                  {tcs("View all 240")}
                </Button>
              }
            />
            <Text variant="caption" tone="muted">
              {tcs(
                "The panel is capped at 70vh and the rows scroll inside it; the footer stays pinned below the list.",
              )}
            </Text>
          </Card>
        </Example>

        <Example
          title={tcs("Rows that navigate")}
          description={tcs(
            "A row with an `href` renders as a real anchor, so middle-click and \"open in a new tab\" keep working. A row without one is a button, with the keyboard handler the pattern needs.",
          )}
          layout="block"
          code={`<NotificationCenter\n  items={[{ id: "report", title: "Report is ready", href: "/runs/128" }]}\n/>`}
        >
          <Card variant="outline" className="flex w-full flex-wrap items-center gap-4 p-4">
            <NotificationCenter
              items={[
                {
                  id: "report",
                  title: tcs("Backtest report is ready"),
                  description: tcs("btc-sma-2026-09 · 4 artifacts"),
                  timestamp: "1h",
                  tone: "info",
                },
                {
                  id: "patterns",
                  title: tcs("The patterns index moved"),
                  href: href("/components/feedback"),
                  timestamp: "2d",
                  read: true,
                },
              ]}
            />
            <Text variant="caption" tone="muted">
              {tcs("The second row is an anchor; the first is a button that reports the click to the caller.")}
            </Text>
          </Card>
        </Example>

        <Example
          title={tcs("In a topbar")}
          description={tcs(
            "Where it lives: one control in a row of controls, so the badge has to read at a glance and the panel has to align to the edge it hangs from.",
          )}
          layout="block"
          code={`<Inline justify="between">\n  <Text>Momentum overlay</Text>\n  <NotificationCenter items={items} label="Run notifications" />\n</Inline>`}
        >
          <Panel className="flex w-full items-center justify-between gap-4 p-3">
            <Inline gap="sm" align="center">
              <Text variant="label" as="p">
                Momentum overlay
              </Text>
              <Text variant="caption" tone="muted" as="p">
                {tcs("Updated 2 minutes ago")}
              </Text>
            </Inline>
            <NotificationCenter
              items={items.filter((item) => !item.read)}
              label={tcs("Run notifications")}
            />
          </Panel>
        </Example>
      </section>

      <section className="flex flex-col gap-3">
        <Heading size="title" as="h2" id="usage">
          {tcs("Usage")}
        </Heading>
        <ImportLine line={`import { NotificationCenter } from "@luc/ui";`} />
        {notes?.usage?.code ? (
          <CodeBlock code={notes.usage.code} label={tcs("Copy the minimal call")} />
        ) : null}
        {notes?.usage?.note ? (
          <Text variant="caption" tone="muted" as="p" className="max-w-[68ch]">
            {tcs(notes.usage.note)}
          </Text>
        ) : null}
      </section>

      {apiSection}

      <section className="flex flex-col gap-4">
        <Heading size="title" as="h2" id="guidelines">
          {tcs("Guidelines")}
        </Heading>
        <GuidanceCards use={notes?.guidance?.use ?? []} avoid={notes?.guidance?.avoid ?? []} tcs={tcs} />
        {notes?.accessibility?.detail ? (
          <div className="flex flex-col gap-1.5">
            <Heading size="title" as="h3">
              {tcs("Accessibility")}
            </Heading>
            <Text variant="body" tone="muted" as="p" className="max-w-[68ch]">
              {tcs(notes.accessibility.detail)}
            </Text>
          </div>
        ) : null}
      </section>

      {/*
        * The tour used to live on this page. It has a canonical page of its own —
        * `/components/guided-tour` — and the related row is where a reader who
        * arrived here looking for it will find it.
        */}
      <EntryFooter entryId="notification-center" related={["toast", "guided-tour"]} />
    </DocPage>
  );
}
