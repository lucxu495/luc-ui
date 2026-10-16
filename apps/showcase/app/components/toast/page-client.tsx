"use client";

/*
 * The body of the Toaster page.
 *
 * Four examples, and each one is a *button you press*: a toast has no closed
 * rendering, so a specimen that was a picture of a toast would be a screenshot.
 * They cover the tones, the promise lifecycle, an action the reader can take, a
 * toast that waits for the reader, and the stack.
 *
 * Sonner owns the mechanics (stacking, swipe dismissal, hover pause, promise
 * transitions, the live region). LUC owns the skin, which lives in one stylesheet
 * and changes CSS variables plus a tone rail. That division is why this page
 * documents *when* to use a toast rather than how its queue works.
 */

import type { ReactNode } from "react";

import { Button, Heading, Panel, Text, toast } from "@luc/ui";
import { DocPage } from "@/components/docs/doc-page";
import { PageHeader } from "@/components/docs/page-header";
import { ImportLine } from "@/components/docs/family-imports";
import { Example } from "@/components/docs/example";
import { CodeBlock } from "@/components/docs/code-block";
import { GuidanceCards } from "@/components/docs/guidance";
import { ENTRY_NOTES } from "@/lib/docs/curation/notes";
import { useI18n } from "@/lib/i18n/provider";
import { EntryFooter } from "@/components/docs/entry-footer";

const PROMISE_CODE = `toast.promise(runStudy(), {\n  loading: "Running the study…",\n  success: "Study finished · report written",\n  error: "Study failed",\n});\n\ntoast("Deleted 4 runs", { action: { label: "Undo", onClick: restore } });`;

export function ToastPage({ apiSection }: { apiSection?: ReactNode }) {
  const { tcs } = useI18n();
  const notes = ENTRY_NOTES.toast;

  const runPromise = () => {
    toast.promise(new Promise<void>((resolve) => window.setTimeout(resolve, 1600)), {
      loading: tcs("Running the study…"),
      success: tcs("Study finished · report written"),
      error: tcs("Study failed"),
    });
  };

  return (
    <DocPage>
      <PageHeader
        eyebrow={tcs("Feedback")}
        title="Toaster"
        lead="Transient, announced notifications with a LUC skin on Sonner's behaviour."
      />

      <section className="flex flex-col gap-5">
        <Heading size="title" as="h2" id="examples">
          {tcs("Examples")}
        </Heading>

        <Example
          title={tcs("Five tones")}
          description={tcs(
            "Title, optional description, optional action. The surface never changes shade; the rail and the icon do, which is what keeps a green wall out of a dense page.",
          )}
          layout="inline"
          code={`toast("Deployment queued");\ntoast.success("Saved", { description: "3 rows updated" });\ntoast.warning("Stale quote window");\ntoast.error("Ingest failed", { description: "Provider returned 503" });\ntoast.info("Two jobs are waiting");`}
        >
          <Button onClick={() => toast(tcs("Deployment queued"))}>{tcs("Default")}</Button>
          <Button
            variant="secondary"
            onClick={() => toast.success(tcs("Saved"), { description: tcs("3 rows updated") })}
          >
            {tcs("Success")}
          </Button>
          <Button
            variant="secondary"
            onClick={() =>
              toast.warning(tcs("Stale quote window"), { description: tcs("Last tick 4 minutes ago") })
            }
          >
            {tcs("Warning")}
          </Button>
          <Button
            variant="secondary"
            onClick={() =>
              toast.error(tcs("Ingest failed"), { description: tcs("Provider returned 503") })
            }
          >
            {tcs("Error")}
          </Button>
          <Button variant="secondary" onClick={() => toast.info(tcs("Two jobs are waiting"))}>
            {tcs("Info")}
          </Button>
        </Example>

        <Example
          title={tcs("Loading, promises and actions")}
          description={tcs(
            "A promise toast is the honest way to show a long task: it changes in place rather than stacking three toasts, and it keeps the same element — so the live region announces one message, not three.",
          )}
          layout="inline"
          code={PROMISE_CODE}
        >
          <Button
            onClick={() =>
              toast.loading(tcs("Running the study…"), { description: tcs("Stays until it resolves.") })
            }
          >
            {tcs("Loading")}
          </Button>
          <Button variant="secondary" onClick={runPromise}>
            {tcs("Promise")}
          </Button>
          <Button
            variant="secondary"
            onClick={() =>
              toast(tcs("Deleted 4 runs"), {
                description: tcs("Kept for 30 days."),
                action: { label: tcs("Undo"), onClick: () => toast.success(tcs("Restored")) },
              })
            }
          >
            {tcs("With an undo")}
          </Button>
        </Example>

        <Example
          title={tcs("A toast that waits for the reader")}
          description={tcs(
            "A toast carrying an action deserves more than four seconds. `duration: Infinity` keeps it until the reader answers it, and hovering or focusing any toast pauses its timer — so a slow reader is never cut off mid-sentence.",
          )}
          layout="inline"
          code={`toast("Two datasets are stale", {\n  description: "Refresh them from the pipeline page.",\n  duration: Infinity,\n  action: { label: "Refresh", onClick: refresh },\n});`}
        >
          <Button
            variant="secondary"
            onClick={() =>
              toast(tcs("Two datasets are stale"), {
                description: tcs("Refresh them from the pipeline page."),
                duration: Infinity,
                action: { label: tcs("Refresh"), onClick: () => toast.success(tcs("Refreshed")) },
              })
            }
          >
            {tcs("Persistent, with an action")}
          </Button>
          <Button variant="ghost" onClick={() => toast.dismiss()}>
            {tcs("Dismiss everything")}
          </Button>
        </Example>

        <Example
          title={tcs("A stack, not a queue of surprises")}
          description={tcs(
            "Several toasts collapse into a stack with the newest in front. The viewport shows four and the rest wait behind them, so a burst of six jobs cannot cover the page.",
          )}
          layout="inline"
          code={`["BTC-USD", "ETH-USD", "SOL-USD"].forEach((symbol, index) =>\n  toast("Quote refreshed", { description: symbol, duration: 4000 + index * 600 }),\n);`}
        >
          <Button
            onClick={() =>
              ["BTC-USD", "ETH-USD", "SOL-USD"].forEach((symbol, index) =>
                toast(tcs("Quote refreshed"), {
                  description: symbol,
                  duration: 4000 + index * 600,
                }),
              )
            }
          >
            {tcs("Fire three at once")}
          </Button>
          <Button
            variant="secondary"
            onClick={() =>
              Array.from({ length: 6 }, (_, index) =>
                toast(tcs("Validation pass {number} finished").replace("{number}", String(index + 1))),
              )
            }
          >
            {tcs("Fire six at once")}
          </Button>
        </Example>
      </section>

      <section className="flex flex-col gap-3">
        <Heading size="title" as="h2" id="usage">
          {tcs("Usage")}
        </Heading>
        <ImportLine line={`import { Toaster, toast } from "@luc/ui/components/toast";`} />
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
        <Panel className="flex flex-col gap-3 p-4">
          <Text variant="micro" tone="muted" as="p">
            {tcs("Where it appears, and where it is styled")}
          </Text>
          <Text variant="caption" tone="muted" as="p" className="max-w-[68ch]">
            {tcs(
              "`position`, `offset` and `visibleToasts` belong to the single `Toaster` you mount, not to an individual toast: the viewport is one surface, and moving it per message is how two toasts end up on top of each other. The visual layer is one file — it maps Sonner's documented custom properties to LUC tokens, then styles the parts variables cannot reach, under a `.luc-toaster` prefix.",
            )}
          </Text>
        </Panel>
      </section>

      <EntryFooter entryId="toast" related={["notification-center", "alert"]} />
    </DocPage>
  );
}
