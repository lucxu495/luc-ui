"use client";

import { useState, type ReactNode } from "react";
import {
  DropZone,
  Field,
  FileInput,
  FileUpload,
  Text,
  formatBytes,
  toast,
  type FileUploadItem,
} from "@luc/ui";
import { DocPage } from "@/components/docs/doc-page";
import { PageHeader } from "@/components/docs/page-header";
import { ImportLine } from "@/components/docs/family-imports";
import { CodeBlock } from "@/components/docs/code-block";
import { Example } from "@/components/docs/example";
import { GuidanceCards } from "@/components/docs/guidance";
import { StateGrid } from "@/components/docs/state-grid";
import { ENTRY_NOTES } from "@/lib/docs/curation/notes";
import { useI18n } from "@/lib/i18n/provider";
import { EntryFooter } from "@/components/docs/entry-footer";

/** Small local fixtures — no binaries in the repository, nothing uploaded. */
function fixture(name: string, size: number, type = "text/csv") {
  return new File([new Uint8Array(size)], name, { type });
}

export function FileUploadPage({ apiSection }: { apiSection?: ReactNode }) {
  const { tcs } = useI18n();
  const selectionNotes = ENTRY_NOTES["file-input"];
  const transferNotes = ENTRY_NOTES["file-upload"];
  const [files, setFiles] = useState<File[]>([fixture("prices-2026-09.csv", 184_320)]);
  const [rejected, setRejected] = useState(0);
  /*
   * The transfer rows are fixtures, not a fake upload: every status the
   * component can render, in one list, with the two controls that make the list
   * live (remove, retry) wired to real handlers. Nothing is sent anywhere.
   */
  /*
   * The fixture, built from the dictionary. A file *name* is data — it stays as
   * it is, because it is the file on disk — while the row's own message is copy,
   * so the one sentence goes through `tcs`.
   */
  const [rows, setRows] = useState<FileUploadItem[]>(() => [
    { id: "queued", name: "prices-2026-09.csv", size: 184_320, status: "queued" },
    { id: "uploading", name: "funding.csv", size: 12_288, status: "uploading", progress: 46 },
    { id: "done", name: "universe.parquet", size: 2_411_724, status: "done" },
    {
      id: "error",
      name: "signals.csv",
      size: 90_112,
      status: "error",
      error: tcs("The server rejected this file (413)"),
    },
  ]);
  const retry = (id: string) => {
    setRows((current) =>
      /* `error` is cleared with the status: the row prints `item.error` in place
       * of the status label, so leaving the message behind would keep showing the
       * failure after the retry that answered it. */
      current.map((item) => (item.id === id ? { ...item, status: "queued", error: undefined } : item)),
    );
    toast.info("Back in the queue — a real page would start the transfer again");
  };

  return (
    <DocPage>
      <PageHeader
        eyebrow={tcs("Components · FileInput and FileUpload")}
        title="FileInput and FileUpload"
        lead="Two vocabularies and one transfer surface: a compact row for ordinary attachments, a larger drop target when dragging is the point, and FileUpload when the rows themselves have to show progress. None of them uploads anything — they hand you File objects and stop."
      />

      <ImportLine line={'import { DropZone, Field, FileInput, FileUpload } from "@luc/ui";'} />

      <section className="flex flex-col gap-5">
        <h2 id="examples" className="text-title text-fg-primary">
          {tcs("Examples")}
        </h2>

      <Example
        title={tcs("Compact file field")}
        code={`<Field label="Attachments" description="CSV or Parquet, up to 10 MB each.">
  <FileInput
    accept={[".csv", ".parquet", "text/csv"]}
    multiple
    maxSize={10_000_000}
    value={files}
    onFilesChange={setFiles}
    onReject={(items) => setRejected(items.length)}
    hint="CSV up to 10 MB"
  />
</Field>`}
        description={tcs("A field row, not a giant dashed rectangle. Drop a file on either variant — the accept list and the size limit are enforced in both.")}
        layout="block"
      >

        <Field
          label={tcs("Attachments")}
          description={tcs("CSV or Parquet, up to 10 MB each.")}
        >
          <FileInput
            accept={[".csv", ".parquet", "text/csv"]}
            multiple
            maxSize={10_000_000}
            value={files}
            onFilesChange={setFiles}
            onReject={(items) => setRejected(items.length)}
            hint={tcs("CSV up to 10 MB")}
          />
        </Field>
        <Text variant="caption" tone="muted">
          {files.length} file{files.length === 1 ? "" : "s"} selected ·{" "}
          {formatBytes(files.reduce((total, file) => total + file.size, 0))} total
          {rejected > 0 ? ` · ${rejected} rejected` : ""}
        </Text>
      </Example>

      <Example
        title={tcs("Drop zone")}
        code={`<DropZone
  accept={["image/*", ".csv"]}
  multiple
  maxSize={4_000_000}
  hint="PNG, JPEG or CSV · up to 4 MB"
/>`}
        description={tcs("Use it when dropping is the primary gesture — an import step, a bulk upload. It is still a file *selection* surface: no progress bar, no retry, no network.")}
        layout="block"
      >

        <DropZone
          accept={["image/*", ".csv"]}
          multiple
          maxSize={4_000_000}
          hint={tcs("PNG, JPEG or CSV · up to 4 MB")}
        />
      </Example>

      <Example
        title={tcs("Transfer rows")}
        description={tcs("`FileUpload` renders the transfer rather than performing it: queue, progress, success, failure with a retry, and the remove control — all driven by the `items` you own.")}
        layout="block"
        code={`<FileUpload
  items={items}
  onFiles={startUpload}
  onRemove={removeItem}
  onRetry={retryItem}
  accept=".csv"
  multiple
  hint="CSV or Parquet, up to 10 MB each"
  listLabel="Uploaded runs"
/>`}
      >

        <FileUpload
          items={rows}
          onFiles={setFiles}
          accept=".csv,.parquet"
          multiple
          hint={tcs("Nothing here leaves the browser: the rows are fixtures, and the transfer is the caller's.")}
          listLabel={tcs("Selected files")}
          onRemove={(id) => setRows((current) => current.filter((item) => item.id !== id))}
          onRetry={retry}
        />
      </Example>

      <Example
        title={tcs("Rejections are visible")}
        code={`<Field label="Strict import" error="2 files were rejected">
  <FileInput accept={[".csv"]} multiple maxSize={1_000} defaultValue={files} />
</Field>`}
        description={tcs("A rejected file gets a name and a reason instead of disappearing. The field also reports it as invalid, so a form can block submission.")}
        layout="block"
      >

        <Field
          label={tcs("Strict import")}
          error={tcs("2 files were rejected")}
          description={tcs("Only .csv, and nothing over 1 kB in this demo.")}
        >
          <FileInput
            accept={[".csv"]}
            multiple
            maxSize={1_000}
            defaultValue={[fixture("prices.csv", 400), fixture("notes.txt", 300, "text/plain"), fixture("huge.csv", 4000)]}
          />
        </Field>
      </Example>

      <Example
        title={tcs("States")}
        description={tcs("Empty, filled, disabled and the drop target — the same component, four states a reviewer has to see.")}
        layout="grid"
        code={`<FileInput accept={[".csv"]} hint="CSV up to 10 MB" />
<FileInput multiple accept={[".csv"]} defaultValue={files} />
<FileInput disabled accept={[".csv"]} hint="Uploads are closed for this workspace." />
<DropZone accept={[".csv"]} hint="Drop or browse" />`}
      >

        <StateGrid
          columns={2}
          states={[
            {
              label: "Empty",
              render: <FileInput accept={[".csv"]} hint={tcs("CSV up to 10 MB")} className="w-full" />,
            },
            {
              label: "Selected",
              render: (
                <FileInput
                  multiple
                  accept={[".csv"]}
                  defaultValue={[fixture("prices-2026-09.csv", 184_320), fixture("funding.csv", 12_288)]}
                />
              ),
            },
            {
              label: "Disabled",
              render: <FileInput disabled accept={[".csv"]} hint={tcs("Uploads are closed for this workspace.")} />,
            },
            {
              label: "Drop zone",
              render: <DropZone accept={[".csv"]} hint="Drop or browse" />,
            },
          ]}
        />
      </Example>
      </section>

      {/* --------------------------------------------------------------- usage */}
      <section className="flex flex-col gap-3">
        <h2 id="usage" className="text-title text-fg-primary">
          {tcs("Usage")}
        </h2>
        <ImportLine line={`import { DropZone, FileInput, FileUpload } from "@luc/ui";`} />
        {selectionNotes?.usage?.code ? (
          <CodeBlock code={selectionNotes.usage.code} label={tcs("Copy the selection call")} />
        ) : null}
        {selectionNotes?.usage?.note ? (
          <Text variant="caption" tone="muted" as="p" className="max-w-[68ch]">
            {tcs(selectionNotes.usage.note)}
          </Text>
        ) : null}
        {transferNotes?.usage?.code ? (
          <CodeBlock code={transferNotes.usage.code} label={tcs("Copy the transfer call")} />
        ) : null}
        {transferNotes?.usage?.note ? (
          <Text variant="caption" tone="muted" as="p" className="max-w-[68ch]">
            {tcs(transferNotes.usage.note)}
          </Text>
        ) : null}
        <Text variant="caption" tone="muted" as="p" className="max-w-[68ch]">
          {tcs("The components select, validate and render the transfer; the application uploads. Nothing here sends a byte anywhere.")}
        </Text>
      </section>

      {apiSection}

      {/* ---------------------------------------------------------- guidelines */}
      <section className="flex flex-col gap-4">
        <h2 id="guidelines" className="text-title text-fg-primary">
          {tcs("Guidelines")}
        </h2>
        <GuidanceCards
          use={[...(selectionNotes?.guidance?.use ?? []), ...(transferNotes?.guidance?.use ?? [])]}
          avoid={[...(selectionNotes?.guidance?.avoid ?? []), ...(transferNotes?.guidance?.avoid ?? [])]}
          tcs={tcs}
        />
        {selectionNotes?.accessibility?.detail ? (
          <div className="flex flex-col gap-1.5">
            <h3 className="text-title text-fg-primary">{tcs("Accessibility")}</h3>
            <Text variant="body" tone="muted" as="p" className="max-w-[68ch]">
              {tcs(selectionNotes.accessibility.detail)}
            </Text>
            {transferNotes?.accessibility?.detail ? (
              <Text variant="body" tone="muted" as="p" className="max-w-[68ch]">
                {tcs(transferNotes.accessibility.detail)}
              </Text>
            ) : null}
          </div>
        ) : null}
      </section>

      <EntryFooter entryId="file-upload" related={["field", "input", "sections"]} />
    </DocPage>
  );
}
