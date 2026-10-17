"use client";

import { useState, type ReactNode } from "react";
import { Text, TransferList } from "@luc/ui";
import { DocPage } from "@/components/docs/doc-page";
import { PageHeader } from "@/components/docs/page-header";
import { Example } from "@/components/docs/example";
import { ImportLine } from "@/components/docs/family-imports";
import { CodeBlock } from "@/components/docs/code-block";
import { GuidanceCards } from "@/components/docs/guidance";
import { EntryFooter } from "@/components/docs/entry-footer";
import { ENTRY_NOTES } from "@/lib/docs/curation/notes";
import { useI18n } from "@/lib/i18n/provider";
import { EntryNotes } from "@/components/docs/entry-notes";
import { ExamplesHeading } from "@/components/docs/examples-heading";

/*
 * The two fixtures, built from the dictionary.
 *
 * A list passed as an `items` prop is *content* the reader reads, and it sits
 * outside both the sentence extractor and the shared specimen localizer — which
 * walks text nodes and caption props, not arrays of objects. So the page builds
 * its fixtures with the same `tcs` it uses for its own prose, and the ids stay
 * as they are: an id is a key, not a sentence.
 */
function fixtures(tcs: (source: string) => string) {
  return {
    columns: [
      { id: "symbol", label: "symbol", description: tcs("Ticker") },
      { id: "price", label: "price", description: tcs("Close, adjusted") },
      { id: "volume", label: "volume", description: tcs("Base units") },
      { id: "returns", label: "returns", description: tcs("Log return") },
      { id: "volatility", label: "volatility", description: tcs("20d realised") },
      { id: "regime", label: "regime", description: tcs("Classified state") },
    ],
    permissions: [
      { id: "read", label: "read", description: tcs("See the run and its artifacts") },
      { id: "write", label: "write", description: tcs("Edit the spec and save revisions") },
      { id: "run", label: "run", description: tcs("Queue a backtest") },
      { id: "publish", label: "publish", description: tcs("Publish a revision") },
      { id: "admin", label: "admin", description: tcs("Change members and policies") },
    ],
  };
}

/*
 * The TransferList page.
 *
 * It keeps the working example that lived on the combined colour page — the
 * column set — and adds the two configurations a reader actually has to decide
 * between: how tall the panes are, and whether the value is controlled. The
 * component itself is unchanged; this is documentation.
 */
export function TransferListPage({ apiSection }: { apiSection?: ReactNode }) {
  const { tcs } = useI18n();
  const { columns, permissions } = fixtures(tcs);
  const notes = ENTRY_NOTES["transfer-list"];
  const [chosen, setChosen] = useState<string[]>(["symbol", "price"]);
  const [granted, setGranted] = useState<string[]>(["read", "run"]);

  return (
    <DocPage>
      <PageHeader
        eyebrow={tcs("Components")}
        title="TransferList"
        lead={tcs(
          "Move items between two sets with the keyboard: the ids on the right are the whole value, so a form saves one array.",
        )}
      />
      <ExamplesHeading />

      {/* ------------------------------------------------------------ examples */}
      <section className="flex flex-col gap-5">
        <h2 id="examples" className="text-title text-fg-primary">
          {tcs("Examples")}
        </h2>

        <Example
          title={tcs("Two panes, one value")}
          description={tcs(
            "`value` is the right-hand set. Name both panes: `sourceLabel` and `targetLabel` are the names a screen-reader user navigates by.",
          )}
          layout="block"
          code={`<TransferList
  items={columns}
  value={chosen}
  onValueChange={setChosen}
  sourceLabel="Available fields"
  targetLabel="Selected fields"
/>`}
        >
          <TransferList
            items={columns}
            value={chosen}
            onValueChange={setChosen}
            sourceLabel={tcs("Available fields")}
            targetLabel={tcs("Selected fields")}
            height={220}
          />
          <Text variant="caption" tone="muted" className="font-mono">
            {chosen.length > 0 ? chosen.join(", ") : tcs("Nothing selected")}
          </Text>
        </Example>

        <Example
          title={tcs("Dense panes")}
          description={tcs(
            "Set `height` to the dense end when the list sits inside a panel or a settings row; 240 px is the default that keeps both panes scannable.",
          )}
          layout="block"
          code={`<TransferList
  items={permissions}
  value={granted}
  onValueChange={setGranted}
  sourceLabel="Available"
  targetLabel="Granted"
  height={140}
/>`}
        >
          <TransferList
            items={permissions}
            value={granted}
            onValueChange={setGranted}
            sourceLabel={tcs("Available")}
            targetLabel={tcs("Granted")}
            height={140}
          />
        </Example>

        <Example
          title={tcs("Uncontrolled, with a starting set")}
          description={tcs(
            "With `onValueChange` omitted the component keeps its own selection; `defaultValue` decides where it starts.",
          )}
          layout="block"
          code={`<TransferList
  items={permissions}
  defaultValue={["read", "write", "run"]}
  sourceLabel="Available"
  targetLabel="Granted"
  height={200}
/>`}
        >
          <TransferList
            items={permissions}
            defaultValue={["read", "write", "run"]}
            sourceLabel={tcs("Available")}
            targetLabel={tcs("Granted")}
            height={200}
          />
        </Example>
      </section>

      {/* --------------------------------------------------------------- usage */}
      <section className="flex flex-col gap-3">
        <h2 id="usage" className="text-title text-fg-primary">
          {tcs("Usage")}
        </h2>
        <ImportLine line={'import { TransferList } from "@luc/ui";'} />
        <CodeBlock
          code={`<TransferList items={columns} value={chosen} onValueChange={setChosen} />`}
          label={tcs("Copy the minimal call")}
        />
        <Text variant="caption" tone="muted" as="p" className="max-w-[68ch]">
          {tcs(
            "Items are `{ id, label, description? }` and the value is an array of ids, so the selection survives a re-render that rebuilds the item objects.",
          )}
        </Text>
      </section>

      {apiSection}

      {/* ---------------------------------------------------------- guidelines */}
      <section className="flex flex-col gap-4">
        <h2 id="guidelines" className="text-title text-fg-primary">
          {tcs("Guidelines")}
        </h2>
        <GuidanceCards use={notes?.guidance?.use ?? []} avoid={notes?.guidance?.avoid ?? []} tcs={tcs} />
        {notes?.accessibility?.detail ? (
          <div className="flex flex-col gap-1.5">
            <h3 className="text-title text-fg-primary">{tcs("Accessibility")}</h3>
            <Text variant="body" tone="muted" as="p" className="max-w-[68ch]">
              {tcs(notes.accessibility.detail)}
            </Text>
          </div>
        ) : null}
      </section>

      <EntryNotes entryIds={["transfer-list"]} />
      <EntryFooter entryId="transfer-list" related={["sortable-list", "kanban-board", "list"]} />
    </DocPage>
  );
}
