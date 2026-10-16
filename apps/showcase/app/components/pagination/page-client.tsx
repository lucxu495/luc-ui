"use client";

/*
 * The body of the Pagination page.
 *
 * Four examples, in the order a reader meets the questions: what the window looks
 * like over a real result set, what it collapses to in a footer, which two props
 * change the window, and what happens at the ends — where the control is, and
 * what it does when there is nowhere to go.
 *
 * The page used to also document `ScrollArea`, with two full specimens of it. That
 * was two components in one page: the scroll region has its own page in Layout
 * (`/components/scroll-area`), and the only thing this page owed it was a sentence
 * saying which of the two answers the reader's problem — there is one now, in
 * Guidelines.
 */

import { useState, type ReactNode } from "react";
import { Card, Heading, NativeSelect, Pagination, PaginationSummary, Text } from "@luc/ui";
import { DocPage } from "@/components/docs/doc-page";
import { PageHeader } from "@/components/docs/page-header";
import { ImportLine } from "@/components/docs/family-imports";
import { Example } from "@/components/docs/example";
import { CodeBlock } from "@/components/docs/code-block";
import { GuidanceCards } from "@/components/docs/guidance";
import { EntryFooter } from "@/components/docs/entry-footer";
import { ENTRY_NOTES } from "@/lib/docs/curation/notes";
import { useI18n } from "@/lib/i18n/provider";

/**
 * A pagination that owns its own page.
 *
 * The boundary specimens below each need their own position — the first page, the
 * last page, the only page — and a specimen that only *looks* disabled is a dead
 * control: every one of these is clickable and moves.
 */
function LivePagination({
  from = 1,
  pageCount,
  ...rest
}: {
  from?: number;
  pageCount: number;
  siblings?: number;
  compact?: boolean;
  edges?: boolean;
}) {
  const [page, setPage] = useState(from);
  return <Pagination page={page} pageCount={pageCount} onPageChange={setPage} {...rest} />;
}

export function PaginationPage({ apiSection }: { apiSection?: ReactNode }) {
  const { tcs } = useI18n();
  const notes = ENTRY_NOTES.pagination;
  const [page, setPage] = useState(4);
  const [pageCount, setPageCount] = useState(24);
  const [pageSize, setPageSize] = useState(20);
  const total = pageCount * pageSize;

  return (
    <DocPage>
      <PageHeader
        eyebrow={tcs("Navigation")}
        title="Pagination"
        lead="Move through a result set that already knows its size, with the page sizes people actually use."
      />

      <section className="flex flex-col gap-5">
        <Heading size="title" as="h2" id="examples">
          {tcs("Examples")}
        </Heading>

        <Example
          title={tcs("A summary and the pages")}
          description={tcs(
            "The row count belongs beside the controls: the reader answers \"is the thing I want on this page\" before deciding whether to move.",
          )}
          layout="block"
          code={`<PaginationSummary from={61} to={80} total={480} unit="rows" />\n\n<Pagination page={page} pageCount={24} onPageChange={setPage} />`}
        >
          <Card variant="outline" className="flex flex-wrap items-center justify-between gap-4 p-4">
            <PaginationSummary
              from={(page - 1) * pageSize + 1}
              to={Math.min(page * pageSize, total)}
              total={total}
              unit="rows"
            />
            <div className="flex flex-wrap items-center gap-3">
              <NativeSelect
                aria-label={tcs("Rows per page")}
                value={String(pageSize)}
                onChange={(event) => setPageSize(Number(event.target.value))}
                options={[
                  { value: "20", label: "20 rows" },
                  { value: "50", label: "50 rows" },
                  { value: "100", label: "100 rows" },
                ]}
                className="w-32"
              />
              <Pagination page={page} pageCount={pageCount} onPageChange={setPage} />
            </div>
          </Card>
        </Example>

        <Example
          title={tcs("Compact, for a footer")}
          description={tcs(
            "Arrows and a status: the shape a card footer or a mobile toolbar has room for, with both end jumps still one click away.",
          )}
          layout="block"
          code={`<Pagination page={page} pageCount={24} onPageChange={setPage} compact />`}
        >
          <Card variant="outline" className="flex flex-wrap items-center justify-between gap-4 p-4">
            <Text variant="caption" tone="muted">
              {tcs("Prepared locally · 480 rows")}
            </Text>
            <Pagination page={page} pageCount={pageCount} onPageChange={setPage} compact />
          </Card>
        </Example>

        <Example
          title={tcs("Neighbours, and the end jumps")}
          description={tcs(
            "`siblings` widens the window; `edges` is the pair of double chevrons that jumps to either end. The page numbers themselves are derived — never a list you maintain.",
          )}
          layout="grid"
          code={`<Pagination page={page} pageCount={24} onPageChange={setPage} siblings={2} />\n\n<Pagination page={page} pageCount={24} onPageChange={setPage} edges={false} />`}
        >
          <Card variant="outline" className="flex flex-col gap-3 p-4">
            <Text variant="label">{tcs("siblings = 2")}</Text>
            <LivePagination from={4} pageCount={24} siblings={2} />
          </Card>
          <Card variant="outline" className="flex flex-col gap-3 p-4">
            <Text variant="label">{tcs("edges = false")}</Text>
            <LivePagination from={4} pageCount={24} edges={false} />
          </Card>
        </Example>

        <Example
          title={tcs("At the ends, and when the total changes")}
          description={tcs(
            "The first page, the last page, and a set that fits on one: the arrows disable themselves and the window collapses to the pages that exist. Lower the page count while you are deep in the set and the position clamps instead of pointing at a page that is gone.",
          )}
          layout="block"
          code={`/* One page: nothing to disable, and the set is still named. */\n<Pagination page={1} pageCount={1} onPageChange={setPage} />\n\n/* The window is re-derived whenever pageCount changes. */\n<Pagination page={page} pageCount={pageCount} onPageChange={setPage} />`}
        >
          <Card variant="outline" className="flex flex-col gap-4 p-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <Text variant="caption" tone="muted">
                {tcs("Page count")}
              </Text>
              <NativeSelect
                aria-label={tcs("Page count")}
                value={String(pageCount)}
                onChange={(event) => setPageCount(Number(event.target.value))}
                options={[
                  { value: "1", label: "1 page" },
                  { value: "3", label: "3 pages" },
                  { value: "24", label: "24 pages" },
                  { value: "120", label: "120 pages" },
                ]}
                className="w-36"
              />
            </div>
            <Pagination page={page} pageCount={pageCount} onPageChange={setPage} />
            <div className="flex flex-wrap items-start gap-6">
              <div className="flex flex-col gap-1.5">
                <Text variant="micro" tone="muted">
                  {tcs("First page")}
                </Text>
                <LivePagination from={1} pageCount={24} />
              </div>
              <div className="flex flex-col gap-1.5">
                <Text variant="micro" tone="muted">
                  {tcs("Last page")}
                </Text>
                <LivePagination from={24} pageCount={24} />
              </div>
            </div>
          </Card>
        </Example>
      </section>

      <section className="flex flex-col gap-3">
        <Heading size="title" as="h2" id="usage">
          {tcs("Usage")}
        </Heading>
        <ImportLine line={`import { Pagination, PaginationSummary } from "@luc/ui";`} />
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

      <EntryFooter entryId="pagination" />
    </DocPage>
  );
}
