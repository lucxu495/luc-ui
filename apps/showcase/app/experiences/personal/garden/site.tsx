"use client";

import Image from "next/image";

import { useMemo, useState } from "react";
import { Badge, Button, Card, CardContent, SearchInput, SegmentedControl, SegmentedItem, Separator, Tag } from "@luc/ui";
import { NowSection, ReadingShelf } from "@luc/ui/experiences";
import { useI18n } from "@/lib/i18n/provider";
import { NOTES, NOW_ITEMS, SHELF, type NoteKind } from "./data";
import { placeholderArt } from "../../placeholder-art";

// Field notebook — a journal and digital garden.
//
// The interaction has to feel exploratory rather than analytical, so the whole
// page is one filter that the reader moves around inside: a kind selector, a
// search box and topic chips, all narrowing the same set. Nothing is paginated,
// nothing is counted at the reader, and the empty state tells them how to get
// back rather than reporting a number.

const KINDS: Array<{ id: NoteKind | "all"; label: string }> = [
  { id: "all", label: "Everything" },
  { id: "note", label: "Notes" },
  { id: "essay", label: "Essays" },
  { id: "link", label: "Links" },
  { id: "photo", label: "Photos" },
];

export function FieldNotebookSite() {
  const { tcs } = useI18n();
  const [kind, setKind] = useState<NoteKind | "all">("all");
  const [topic, setTopic] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  const topics = useMemo(
    () => Array.from(new Set(NOTES.flatMap((note) => note.topics))).sort(),
    [],
  );

  const visible = NOTES.filter(
    (note) =>
      (kind === "all" || note.kind === kind) &&
      (!topic || note.topics.includes(topic)) &&
      (query.trim() === "" ||
        `${note.title} ${note.body} ${note.topics.join(" ")}`
          .toLowerCase()
          .includes(query.trim().toLowerCase())),
  );

  const clear = () => {
    setKind("all");
    setTopic(null);
    setQuery("");
  };

  return (
    <div data-slot="field-notebook" className="mx-auto flex w-full max-w-[var(--experience-max)] flex-col gap-10 px-6 py-12">
      <header className="flex flex-col gap-3">
        <p className="text-micro text-fg-accent">{tcs("Leith, mostly on foot")}</p>
        <h2 className="max-w-[20ch] font-display text-display-sm font-semibold tracking-[-0.03em] text-fg-primary text-balance">
          {tcs("Field notebook")}
        </h2>
        <p className="max-w-[62ch] text-body-lg text-fg-secondary text-pretty">
          {tcs(
            "Notes, links and photographs, kept in public and tidied occasionally. The garden metaphor is a promise that things stay half-grown here on purpose.",
          )}
        </p>
      </header>

      <NowSection
        updatedAt="2026-09-22"
        title={tcs("Now")}
        lead={tcs("What the last month actually contained, as opposed to what was planned.")}
        updatedLabel={tcs("Updated {date}")}
        locale="en-US"
        items={NOW_ITEMS.map((item) => ({
          id: item.id,
          label: tcs(item.label),
          value: tcs(item.value),
        }))}
      />

      <Separator />

      <section aria-labelledby="garden-notes" className="flex flex-col gap-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="flex flex-col gap-1">
            <h3 id="garden-notes" className="font-display text-heading font-semibold text-fg-primary">
              {tcs("Growing now")}
            </h3>
            <p aria-live="polite" className="text-caption text-fg-muted luc-numeric">
              {visible.length} {tcs("entries shown")}
            </p>
          </div>
          <SearchInput
            aria-label={tcs("Search the notebook")}
            placeholder={tcs("Search notes…")}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="w-full sm:w-64"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <SegmentedControl
            value={kind}
            onValueChange={(next) => setKind(next as NoteKind | "all")}
            aria-label={tcs("Filter by kind")}
          >
            {KINDS.map((entry) => (
              <SegmentedItem key={entry.id} value={entry.id}>
                {tcs(entry.label)}
              </SegmentedItem>
            ))}
          </SegmentedControl>
          <ul className="flex list-none flex-wrap items-center gap-1.5">
            {topics.map((entry) => (
              <li key={entry}>
                <button
                  type="button"
                  aria-pressed={topic === entry}
                  onClick={() => setTopic(topic === entry ? null : entry)}
                  className="luc-focus rounded-xs"
                >
                  <Tag
                    className={
                      topic === entry
                        ? "border-line-accent bg-accent-soft text-fg-accent"
                        : undefined
                    }
                  >
                    {entry}
                  </Tag>
                </button>
              </li>
            ))}
          </ul>
        </div>

        {visible.length === 0 ? (
          <div className="flex flex-col items-start gap-3 rounded-md border border-dashed border-line-default bg-surface-sunken p-6">
            <p className="text-body text-fg-secondary text-pretty">
              {tcs(
                "Nothing in the notebook matches that combination yet. That is a gap in the garden rather than a failure of the search.",
              )}
            </p>
            <Button size="sm" variant="outline" onClick={clear}>
              {tcs("Show everything")}
            </Button>
          </div>
        ) : (
          <ul className="flex list-none flex-col gap-4">
            {visible.map((note) => (
              <li key={note.id}>
                <Card variant={note.kind === "essay" ? "raised" : "default"} as="article">
                  <CardContent className="flex flex-col gap-3 p-5">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge
                        tone={note.kind === "essay" ? "accent" : "neutral"}
                        size="sm"
                      >
                        {tcs(KINDS.find((entry) => entry.id === note.kind)?.label ?? "Note")}
                      </Badge>
                      <span className="text-micro text-fg-muted">{note.topics.join(" · ")}</span>
                      <time
                        dateTime={note.added}
                        className="ml-auto text-micro text-fg-muted luc-numeric"
                      >
                        {note.added}
                      </time>
                    </div>
                    <h4 className="font-display text-title font-semibold text-fg-primary text-balance">
                      {tcs(note.title)}
                    </h4>
                    {note.kind === "photo" ? (
                      <Image
                        unoptimized
                        {...placeholderArt(note.id, note.title)}
                        alt={tcs(note.title)}
                        className="aspect-video w-full max-w-[38rem] rounded-sm object-cover"
                      />
                    ) : null}
                    <p className="max-w-[68ch] text-body text-fg-secondary text-pretty">
                      {tcs(note.body)}
                    </p>
                    {note.source ? (
                      <a
                        href={note.source.href}
                        target="_blank"
                        rel="noreferrer noopener"
                        className="luc-focus rounded-xs self-start text-caption font-medium text-fg-accent underline decoration-line-accent underline-offset-4"
                      >
                        {tcs(note.source.label)}
                      </a>
                    ) : null}
                  </CardContent>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </section>

      <Separator />

      <ReadingShelf
        label={tcs("Reading shelf")}
        layout="list"
        items={SHELF.map((item) => ({
          ...item,
          title: tcs(item.title),
          progressLabel: item.progressLabel ? tcs(item.progressLabel) : undefined,
          note: item.note ? tcs(item.note) : undefined,
          cover: (
            <Image
              unoptimized
              {...placeholderArt(`shelf-${item.id}`, item.title, "tall")}
              alt={tcs("Cover of {title}").replace("{title}", tcs(item.title))}
              className="size-full object-cover"
            />
          ),
        }))}
        statusLabels={{
          reading: tcs("On the go"),
          queued: tcs("Waiting"),
          finished: tcs("Finished"),
        }}
      />
    </div>
  );
}
