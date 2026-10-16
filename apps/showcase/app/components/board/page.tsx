"use client";

import { useState } from "react";
import { Card, KanbanBoard, Section, SortableList, Text, type KanbanColumn } from "@luc/ui";
import { DocPage } from "@/components/docs/doc-page";
import { PageHeader } from "@/components/docs/page-header";
import { ImportLine } from "@/components/docs/family-imports";
import { Example } from "@/components/docs/example";
import { PropsTable } from "@/components/docs/tables";
import { useI18n } from "@/lib/i18n/provider";
import { EntryFooter } from "@/components/docs/entry-footer";

const initialOrder = [
  { id: "ingest", label: "Ingest", description: "04:00 · 1,284 bars" },
  { id: "analytics", label: "Analytics", description: "04:12 · seven domains" },
  { id: "materialize", label: "Materialize", description: "04:24 · serving generation" },
  { id: "research", label: "Research pass", description: "05:02 · RP01" },
  { id: "notify", label: "Notify", description: "05:10 · Lark" },
];

const initialBoard: KanbanColumn[] = [
  {
    id: "backlog",
    title: "Backlog",
    cards: [
      { id: "b1", title: "Volatility surface 3D", description: "Projected surface, no GPU", meta: "charts" },
      { id: "b2", title: "Chord diagram", description: "Matrix → arcs", meta: "charts" },
    ],
  },
  {
    id: "doing",
    title: "Doing",
    cards: [{ id: "d1", title: "Bilingual bodies", description: "Long-form copy", meta: "showcase" }],
  },
  {
    id: "done",
    title: "Done",
    cards: [{ id: "o1", title: "Spatial design language", meta: "tokens" }],
  },
];

export default function BoardPage() {
  const { tc, tcs } = useI18n();
  const [order, setOrder] = useState(initialOrder.map((item) => item.id));
  const [columns, setColumns] = useState<KanbanColumn[]>(initialBoard);

  return (
    <DocPage>
      <PageHeader eyebrow={tcs("Components")} title="Sortable list and board" lead={tc("components.board.lead")} />

      <ImportLine line={'import { KanbanBoard, SortableList } from "@luc/ui";'} />

      <Example
        title={tc("components.board.list.title")}
        description={tc("components.board.list.lead")}
        layout="grid"
        code={'<SortableList items={items} onReorder={setOrder} />'}
      >

        <Card variant="outline" className="p-4">
          <SortableList
            label={tc("components.board.list.label")}
            items={order.map((id) => initialOrder.find((item) => item.id === id)!)}
            onReorder={setOrder}
          />
        </Card>
        <Card variant="outline" className="flex flex-col gap-2 p-4">
          <Text variant="label">{tc("components.board.list.order")}</Text>
          <Text variant="caption" tone="muted" className="font-mono">
            {order.join(" → ")}
          </Text>
          <Text variant="caption" tone="muted">
            {tc("components.board.list.hint")}
          </Text>
        </Card>
      </Example>

      <Example
        title={tc("components.board.kanban.title")}
        description={tc("components.board.kanban.lead")}
        layout="block"
        code={'<KanbanBoard columns={columns} onMove={handleMove} />'}
      >

        <KanbanBoard
          label={tc("components.board.kanban.label")}
          columns={columns}
          onMove={({ cardId, from, to, index }) => {
            setColumns((current) => {
              const source = current.find((column) => column.id === from);
              const card = source?.cards.find((entry) => entry.id === cardId);
              if (!card) return current;
              return current.map((column) => {
                const without = column.cards.filter((entry) => entry.id !== cardId);
                if (column.id !== to) return { ...column, cards: without };
                const next = [...without];
                next.splice(index, 0, card);
                return { ...column, cards: next };
              });
            });
          }}
        />
      </Example>

      <Section title={tc("components.board.api.title")} description={tc("components.board.api.lead")}>
        <PropsTable
          rows={[
            { name: "SortableList.items", type: "SortableItem[]", description: tc("components.board.api.items") },
            { name: "SortableList.onReorder", type: "(ids: string[]) => void", description: tc("components.board.api.reorder") },
            { name: "KanbanBoard.columns", type: "KanbanColumn[]", description: tc("components.board.api.columns") },
            {
              name: "KanbanBoard.onMove",
              type: "({ cardId, from, to, index }) => void",
              description: tc("components.board.api.move"),
            },
          ]}
        />
        <Text variant="caption" tone="muted">
          {tc("components.board.api.note")}
        </Text>
      </Section>
      <EntryFooter />
    </DocPage>
  );
}
