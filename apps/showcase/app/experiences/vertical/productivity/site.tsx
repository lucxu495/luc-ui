"use client";

import { useState } from "react";
import {
  Badge,
  Button,
  Card,
  CardContent,
  Checkbox,
  KanbanBoard,
  Progress,
  toast,
  type KanbanColumn,
  type KanbanMove,
} from "@luc/ui";
import { useI18n } from "@/lib/i18n/provider";

// Planner — a productivity board.
//
// The board is the product, so the page does not decorate it. Moving a card is a
// real state change with a real announcement, and the component reports where the
// card landed rather than a delta, so an application can persist the move
// without reconciling two lists.
//
// Bulk selection is the other half of a planning tool and is easy to fake; here
// checking rows genuinely changes what the toolbar says it will act on.

interface Task {
  id: string;
  title: string;
  description: string;
  owner: string;
  due: string;
}

const TASKS: Task[] = [
  { id: "t1", title: "Move the reconciliation job off the nightly window", description: "Blocks the settlement import.", owner: "Priya", due: "Fri" },
  { id: "t2", title: "Retire the legacy report endpoint", description: "Two callers left.", owner: "Tomas", due: "Thu" },
  { id: "t3", title: "Write the tolerance policy down", description: "Nobody can explain the current one.", owner: "Rae", due: "Wed" },
  { id: "t4", title: "Add the drift alert to the settlement pair", description: "Uses the existing alert route.", owner: "Mei", due: "Tue" },
  { id: "t5", title: "Audit the retry budget", description: "Last touched in March.", owner: "Aiko", due: "—" },
  { id: "t6", title: "Draft the incident review for the 24th", description: "Waiting on the timeline.", owner: "Priya", due: "Mon" },
  { id: "t7", title: "Delete the 2019 import shim", description: "Nothing imports it.", owner: "Danilo", due: "—" },
  { id: "t8", title: "Pin the ClickHouse version", description: "Two patches behind.", owner: "Samir", due: "Thu" },
];

const COLUMNS = [
  { id: "backlog", label: "Backlog" },
  { id: "doing", label: "In progress" },
  { id: "review", label: "In review" },
  { id: "done", label: "Done" },
] as const;

const INITIAL: Record<string, string[]> = {
  backlog: ["t5", "t7", "t8"],
  doing: ["t1", "t3"],
  review: ["t4"],
  done: ["t2", "t6"],
};

export function PlannerBoard() {
  const { tcs } = useI18n();
  const [placement, setPlacement] = useState<Record<string, string[]>>(INITIAL);
  const [selected, setSelected] = useState<string[]>([]);
  const [lastMove, setLastMove] = useState<string | null>(null);

  const columns: KanbanColumn[] = COLUMNS.map((column) => ({
    id: column.id,
    title: (
      <span className="flex items-center gap-2">
        {tcs(column.label)}
        <span className="text-micro text-fg-muted luc-numeric">
          {placement[column.id]?.length ?? 0}
        </span>
      </span>
    ),
    cards: (placement[column.id] ?? []).map((id) => {
      const task = TASKS.find((entry) => entry.id === id)!;
      return {
        id: task.id,
        /*
         * The board renders what it is handed, so the caller localises — the
         * same division ExperienceTimeline, PublicationList and ReadingShelf
         * follow. A published composite never reaches for a dictionary.
         */
        title: tcs(task.title),
        description: tcs(task.description),
        meta: (
          <span className="flex items-center gap-2">
            <span className="text-micro text-fg-muted">{task.owner}</span>
            <span aria-hidden="true" className="text-fg-muted">
              ·
            </span>
            <span className="text-micro text-fg-muted luc-numeric">{task.due}</span>
          </span>
        ),
      };
    }),
  }));

  const move = ({ cardId, from, to, index }: KanbanMove) => {
    setPlacement((current) => {
      const source = (current[from] ?? []).filter((id) => id !== cardId);
      const destination = [...(current[to] ?? [])];
      destination.splice(index, 0, cardId);
      return { ...current, [from]: source, [to]: destination };
    });
    const task = TASKS.find((entry) => entry.id === cardId);
    const column = COLUMNS.find((entry) => entry.id === to);
    setLastMove(`${task?.title ?? cardId} → ${column?.label ?? to}`);
    toast.success(tcs("Card moved"), {
      description: `${task?.title ?? cardId} → ${tcs(column?.label ?? to)}`,
    });
  };

  const total = TASKS.length;
  const done = placement.done?.length ?? 0;
  const complete = Math.round((done / total) * 100);

  const toggle = (id: string, checked: boolean) =>
    setSelected((current) =>
      checked ? [...current, id] : current.filter((entry) => entry !== id),
    );

  return (
    <div data-slot="planner" className="flex flex-col gap-5 p-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h2 className="font-display text-heading-sm font-semibold text-fg-primary">
            {tcs("Settlement, this week")}
          </h2>
          <p className="text-caption text-fg-muted">
            {tcs("Eight tasks, four columns, and a move that reports where it landed.")}
          </p>
        </div>
        <div className="flex min-w-[12rem] flex-col gap-1.5">
          <span className="flex items-center justify-between text-micro text-fg-muted">
            <span>{tcs("Done this week")}</span>
            <span className="luc-numeric">
              {done} / {total}
            </span>
          </span>
          <Progress value={complete} aria-label={tcs("Share of tasks done")} />
        </div>
      </header>

      <div className="flex flex-wrap items-center gap-3">
        <Badge tone="info" size="sm">
          {selected.length} {tcs("selected")}
        </Badge>
        <Button
          size="sm"
          variant="outline"
          disabled={selected.length === 0}
          onClick={() => {
            toast.success(`${selected.length} ${tcs("cards reassigned")}`, {
              description: tcs("Bulk actions apply to the selection, not the whole board."),
            });
            setSelected([]);
          }}
        >
          {tcs("Reassign selection")}
        </Button>
        <span aria-live="polite" className="text-caption text-fg-muted">
          {lastMove ? `${tcs("Last move:")} ${lastMove}` : tcs("Move a card to see it reported here.")}
        </span>
      </div>

      <KanbanBoard
        label={tcs("Settlement board")}
        columns={columns}
        onMove={move}
        className="overflow-x-auto"
      />

      <Card variant="default">
        <CardContent className="flex flex-col gap-2 p-4">
          <h3 className="text-label font-semibold text-fg-primary">{tcs("Bulk selection")}</h3>
          <ul className="flex list-none flex-col">
            {TASKS.map((task) => (
              <li
                key={task.id}
                className="flex items-center justify-between gap-3 border-b border-line-subtle py-2 last:border-b-0"
              >
                <Checkbox
                  checked={selected.includes(task.id)}
                  onCheckedChange={(checked) => toggle(task.id, checked === true)}
                  label={tcs(task.title)}
                />
                <span className="shrink-0 text-micro text-fg-muted">{task.owner}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
