"use client";

/*
 * The body of the TreeView page.
 *
 * Four examples, and they are the four decisions a reader has to make: what
 * selection reports, whether the arrows move the selection as well as the focus,
 * who owns the expansion set, and what the tree looks like when labels are long
 * and a branch is unavailable.
 *
 * The keyboard contract stays on the page, in Guidelines, as a table — it is the
 * reason to reach for this component instead of a list of links, and a sentence
 * listing seven keys is not something anyone reads twice. What the page no longer
 * carries is a hand-written props table and a "Public API" section of its own:
 * that is the compiler's job now.
 */

import { useState, type ReactNode } from "react";
import {
  Badge,
  Button,
  Card,
  Heading,
  IconButton,
  Text,
  TreeView,
  treeBranchIds,
  type TreeNode,
} from "@luc/ui";
import {
  RiAddLine,
  RiDatabase2Line,
  RiFileChartLine,
  RiFolderLine,
  RiNodeTree,
} from "@remixicon/react";
import { DocPage } from "@/components/docs/doc-page";
import { PageHeader } from "@/components/docs/page-header";
import { ImportLine } from "@/components/docs/family-imports";
import { Example } from "@/components/docs/example";
import { CodeBlock } from "@/components/docs/code-block";
import { GuidanceCards } from "@/components/docs/guidance";
import { EntryFooter } from "@/components/docs/entry-footer";
import { ENTRY_NOTES } from "@/lib/docs/curation/notes";
import { useI18n } from "@/lib/i18n/provider";

const tree: TreeNode[] = [
  {
    id: "markets",
    label: "Markets",
    icon: <RiFolderLine />,
    children: [
      { id: "equities", label: "Equities", meta: "12" },
      { id: "rates", label: "Rates", meta: "7" },
      {
        id: "crypto",
        label: "Crypto",
        meta: "4",
        children: [
          { id: "spot", label: "Spot", meta: "2" },
          { id: "perps", label: "Perpetuals", meta: "2" },
        ],
      },
    ],
  },
  {
    id: "research",
    label: "Research",
    icon: <RiFolderLine />,
    children: [
      { id: "reports", label: "Reports", icon: <RiFileChartLine />, meta: "28" },
      { id: "datasets", label: "Datasets", icon: <RiDatabase2Line />, meta: "9" },
    ],
  },
  { id: "archive", label: "Archive", disabled: true },
];

/*
 * The deep fixture: three levels, a label that has to truncate, and both kinds of
 * unavailability — a whole row and a branch whose children are mostly gone.
 */
const deepTree: TreeNode[] = [
  {
    id: "portfolios",
    label: "Portfolios",
    icon: <RiFolderLine />,
    meta: "4",
    children: [
      {
        id: "momentum",
        label: "Momentum and trend following across global futures",
        meta: "live",
      },
      {
        id: "carry",
        label: "Carry",
        meta: "12",
        children: [
          { id: "fx", label: "FX carry", meta: "8" },
          { id: "rates", label: "Rates carry", meta: "4", disabled: true },
          { id: "commodity", label: "Commodity carry", meta: "—", disabled: true },
        ],
      },
    ],
  },
  { id: "archive-2019", label: "Archive 2019", disabled: true },
];

/** The keys the `tree` pattern defines, and what each one does here. */
const KEYBOARD: readonly (readonly [string, string])[] = [
  ["↑ / ↓", "Move along the rows that are visible."],
  ["→", "Open a closed branch, then step into its first child."],
  ["←", "Close an open branch, then step out to its parent."],
  ["Home / End", "Jump to the first or the last visible row."],
  ["Enter / Space", "Select the focused row."],
  ["*", "Open every closed sibling of the focused row."],
];

export function TreeViewPage({ apiSection }: { apiSection?: ReactNode }) {
  const { tcs } = useI18n();
  const notes = ENTRY_NOTES["tree-view"];
  const [selected, setSelected] = useState<string | null>("rates");
  const [expanded, setExpanded] = useState<readonly string[]>(["markets"]);

  return (
    <DocPage>
      <PageHeader
        eyebrow={tcs("Navigation")}
        title="TreeView"
        lead="A hierarchy with roving focus, expansion state and selection."
      />

      <section className="flex flex-col gap-5">
        <Heading size="title" as="h2" id="examples">
          {tcs("Examples")}
        </Heading>

        <Example
          title={tcs("Selection, and what it reports")}
          description={tcs(
            "One tree, one selection. The callback carries the node as well as the id, so a caller never has to search its own data to find out what was clicked.",
          )}
          layout="grid"
          code={`const [selected, setSelected] = useState<string | null>("rates");\n\n<TreeView\n  nodes={tree}\n  label="Data catalogue"\n  defaultExpandedIds={["markets", "crypto"]}\n  selectedId={selected}\n  onSelect={setSelected}\n/>`}
        >
          <Card variant="outline" className="p-4">
            <TreeView
              nodes={tree}
              label={tcs("Data catalogue")}
              defaultExpandedIds={["markets", "crypto"]}
              selectedId={selected}
              onSelect={setSelected}
            />
          </Card>
          <Card variant="outline" className="flex flex-col gap-3 p-4">
            <Text variant="label">{tcs("Selected id")}</Text>
            <Text variant="caption" tone="muted" className="font-mono">
              {selected ?? "null"}
            </Text>
            <Text variant="caption" tone="muted">
              {tcs(
                "Click a row, or tab into the tree once and walk it with the arrow keys — the selection follows the focus by default.",
              )}
            </Text>
          </Card>
        </Example>

        <Example
          title={tcs("Selection does not follow focus")}
          description={tcs(
            "With `selectionFollowsFocus={false}` the arrows browse and only Enter or Space commits — the shape a picker inside a panel wants, where arrowing past a row must not change the pane beside it.",
          )}
          layout="block"
          code={`<TreeView\n  nodes={tree}\n  label="Datasets"\n  defaultExpandedIds={["research"]}\n  selectionFollowsFocus={false}\n  indent={20}\n/>`}
        >
          <Card variant="outline" className="flex flex-col gap-3 p-4">
            <div className="flex items-center justify-between gap-3">
              <span className="flex items-center gap-2 text-label text-fg-primary">
                <RiNodeTree aria-hidden="true" className="size-4 text-fg-accent" />
                {tcs("Datasets")}
              </span>
              <IconButton
                variant="ghost"
                size="sm"
                label={tcs("New dataset")}
                icon={<RiAddLine />}
              />
            </div>
            <TreeView
              nodes={tree}
              label={tcs("Datasets")}
              defaultExpandedIds={["research"]}
              selectionFollowsFocus={false}
              indent={20}
            />
          </Card>
        </Example>

        <Example
          title={tcs("Expansion the caller owns")}
          description={tcs(
            "`expandedIds` makes the open set the caller's, which is what a saved view or a remembered position needs. `treeBranchIds` is the helper for an expand-all control.",
          )}
          layout="block"
          code={`const [expanded, setExpanded] = useState(["markets"]);\n\n<Button onClick={() => setExpanded(treeBranchIds(tree))}>Expand all</Button>\n<Button onClick={() => setExpanded([])}>Collapse all</Button>\n\n<TreeView\n  nodes={tree}\n  label="Data catalogue"\n  expandedIds={expanded}\n  onExpandedChange={setExpanded}\n/>`}
        >
          <Card variant="outline" className="flex flex-col gap-3 p-4">
            <div className="flex flex-wrap items-center gap-3">
              <Button size="sm" variant="secondary" onClick={() => setExpanded(treeBranchIds(tree))}>
                {tcs("Expand all")}
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setExpanded([])}>
                {tcs("Collapse all")}
              </Button>
              <Text variant="caption" tone="muted">
                {tcs("{count} branches open").replace("{count}", String(expanded.length))}
              </Text>
            </div>
            <TreeView
              nodes={tree}
              label={tcs("Data catalogue")}
              expandedIds={expanded}
              onExpandedChange={setExpanded}
            />
          </Card>
        </Example>

        <Example
          title={tcs("Long labels, and nodes that are not available")}
          description={tcs(
            "A long label truncates rather than pushing its metadata out of the row. A `disabled` node stays visible and announced — the arrow keys step over it — because a branch the reader is told about and cannot see is worse than one they can see and cannot open.",
          )}
          layout="block"
          code={`<TreeView\n  nodes={[\n    {\n      id: "portfolios",\n      label: "Portfolios",\n      meta: "4",\n      children: [\n        { id: "momentum", label: "Momentum and trend following across global futures", meta: "live" },\n        {\n          id: "carry",\n          label: "Carry",\n          meta: "12",\n          children: [\n            { id: "fx", label: "FX carry", meta: "8" },\n            { id: "rates", label: "Rates carry", meta: "4", disabled: true },\n          ],\n        },\n      ],\n    },\n    { id: "archive-2019", label: "Archive 2019", disabled: true },\n  ]}\n  label="Portfolios"\n  defaultExpandedIds={["portfolios", "carry"]}\n/>`}
        >
          <Card variant="outline" className="p-4">
            <TreeView
              nodes={deepTree}
              label={tcs("Portfolios")}
              defaultExpandedIds={["portfolios", "carry"]}
            />
          </Card>
        </Example>
      </section>

      <section className="flex flex-col gap-3">
        <Heading size="title" as="h2" id="usage">
          {tcs("Usage")}
        </Heading>
        <ImportLine line={`import { TreeView } from "@luc/ui";`} />
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
        <div className="flex flex-col gap-2">
          <Heading size="title" as="h3">
            {tcs("Accessibility")}
          </Heading>
          {notes?.accessibility?.detail ? (
            <Text variant="body" tone="muted" as="p" className="max-w-[68ch]">
              {tcs(notes.accessibility.detail)}
            </Text>
          ) : null}
        </div>
        <Card variant="outline" className="flex flex-col gap-2 p-4">
          {KEYBOARD.map(([keys, description]) => (
            <div key={keys} className="flex items-baseline gap-3">
              <Badge tone="outline" className="min-w-24 justify-center font-mono">
                {keys}
              </Badge>
              <Text variant="caption" tone="muted">
                {tcs(description)}
              </Text>
            </div>
          ))}
        </Card>
      </section>

      <EntryFooter entryId="tree-view" />
    </DocPage>
  );
}
