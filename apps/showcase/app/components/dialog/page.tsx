"use client";

import {
  Badge,
  Button,
  Card,
  Code,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogRoot,
  DialogTitle,
  DialogTrigger,
  Field,
  Inline,
  Input,
  Kbd,
  Section,
  Text,
} from "@luc/ui";
import { RiDeleteBinLine, RiInformationLine, RiPlayLine } from "@remixicon/react";
import { DocPage } from "@/components/docs/doc-page";
import { EntryFooter } from "@/components/docs/entry-footer";
import { ImportLine } from "@/components/docs/family-imports";
import { Example } from "@/components/docs/example";
import { PageHeader } from "@/components/docs/page-header";
import { PropsTable } from "@/components/docs/tables";
import { useI18n } from "@/lib/i18n/provider";
import { EntryNotes } from "@/components/docs/entry-notes";
import { ExamplesHeading } from "@/components/docs/examples-heading";

/*
 * Dialog, in the Components V2 shape.
 *
 * Three specimens, one per capability a reader has to see: the standard
 * title/body/footer composition, a width preset with a destructive confirm, and a
 * long body that scrolls inside the dialog. Each is an `<Example>` with its own
 * code, so the page reads as three answers rather than one wall.
 */
export default function DialogPage() {
  const { tcs } = useI18n();
  return (
    <DocPage>
      <PageHeader
        eyebrow={tcs("Components")}
        title="Dialog"
        lead={tcs("A decision that needs the page stopped: a restrained scrim, trapped focus, and Escape or an outside click to leave.")}
      />
      <ExamplesHeading />

      <ImportLine line={'import { DialogRoot, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogBody, DialogFooter } from "@luc/ui";'} />

      <Example
        title={tcs("Title, description, body, footer")}
        description={tcs("The close affordance is always present and always labelled; the body is where the work happens.")}
        layout="stage"
        code={`<DialogRoot>
  <DialogTrigger asChild>
    <Button variant="primary" leadingIcon={<RiPlayLine />}>New run</Button>
  </DialogTrigger>
  <DialogContent>
    <DialogHeader icon={<RiPlayLine />}>
      <DialogTitle>Start a backtest run</DialogTitle>
      <DialogDescription>Runs against the retained hourly candle set.</DialogDescription>
    </DialogHeader>
    <DialogBody>
      <Field label="Strategy" required>
        <Input defaultValue="btc_sma_dca" />
      </Field>
    </DialogBody>
    <DialogFooter>
      <Button variant="ghost">Cancel</Button>
      <Button variant="primary">Start run</Button>
    </DialogFooter>
  </DialogContent>
</DialogRoot>`}
      >
        <DialogRoot>
          <DialogTrigger asChild>
            <Button variant="primary" leadingIcon={<RiPlayLine />}>
              {"New run"}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader icon={<RiPlayLine />}>
              <DialogTitle>{tcs("Start a backtest run")}</DialogTitle>
              <DialogDescription>
                {tcs("Runs against the retained hourly candle set. Results are written to luc-artifact/backtests/<run_id>/report.html.")}
              </DialogDescription>
            </DialogHeader>
            <DialogBody className="flex flex-col gap-4">
              <Field label={tcs("Strategy")} description={tcs("Registered in luc-research.")} required>
                <Input defaultValue="btc_sma_dca" />
              </Field>
              <Field label={tcs("Experiment tag")} description={tcs("Used for grouping in the comparison view.")}>
                <Input placeholder="momentum-sweep" />
              </Field>
              <Inline gap="xs">
                <Badge size="sm" tone="outline">
                  {"daily bars"}
                </Badge>
                <Badge size="sm" tone="outline">
                  2019 → 2026
                </Badge>
              </Inline>
            </DialogBody>
            <DialogFooter>
              <Text variant="caption" tone="muted" className="mr-auto flex items-center gap-1.5">
                <Kbd>Esc</Kbd> {"to close"}
              </Text>
              <Button variant="ghost">{"Cancel"}</Button>
              <Button variant="primary">{"Start run"}</Button>
            </DialogFooter>
          </DialogContent>
        </DialogRoot>
      </Example>

      <Example
        title={tcs("A narrow confirm")}
        description={tcs("`width=\"sm\"` for a decision with no body — the button that opens it is already the sentence.")}
        layout="stage"
        code={`<DialogRoot>
  <DialogTrigger asChild>
    <Button variant="danger" leadingIcon={<RiDeleteBinLine />}>Delete run</Button>
  </DialogTrigger>
  <DialogContent width="sm">
    <DialogHeader icon={<RiDeleteBinLine />}>
      <DialogTitle>Delete this run?</DialogTitle>
      <DialogDescription>The report and its machine artifacts are removed.</DialogDescription>
    </DialogHeader>
    <DialogFooter>
      <Button variant="ghost">Cancel</Button>
      <Button variant="danger">Delete run</Button>
    </DialogFooter>
  </DialogContent>
</DialogRoot>`}
      >
        <DialogRoot>
          <DialogTrigger asChild>
            <Button variant="danger" leadingIcon={<RiDeleteBinLine />}>
              {"Delete run"}
            </Button>
          </DialogTrigger>
          <DialogContent width="sm">
            <DialogHeader icon={<RiDeleteBinLine />}>
              <DialogTitle>{"Delete this run?"}</DialogTitle>
              <DialogDescription>
                {tcs("The report and its machine artifacts are removed. This cannot be undone.")}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="ghost">{"Cancel"}</Button>
              <Button variant="danger">{"Delete run"}</Button>
            </DialogFooter>
          </DialogContent>
        </DialogRoot>
      </Example>

      <Example
        title={tcs("A long body scrolls inside")}
        description={tcs("`width=\"lg\"` with a `max-h` on the body: the page behind stays locked and the header and footer stay put.")}
        layout="stage"
        code={`<DialogContent width="lg">
  <DialogHeader>
    <DialogTitle>Data provenance</DialogTitle>
    <DialogDescription>Where the bars in this run actually came from.</DialogDescription>
  </DialogHeader>
  <DialogBody className="max-h-[46vh] overflow-y-auto">
    {/* long content */}
  </DialogBody>
  <DialogFooter>…</DialogFooter>
</DialogContent>`}
      >
        <DialogRoot>
          <DialogTrigger asChild>
            <Button variant="outline" leadingIcon={<RiInformationLine />}>
              {"Long content"}
            </Button>
          </DialogTrigger>
          <DialogContent width="lg">
            <DialogHeader>
              <DialogTitle>{"Data provenance"}</DialogTitle>
              <DialogDescription>
                {tcs("Where the bars in this run actually came from, and what the reader is using.")}
              </DialogDescription>
            </DialogHeader>
            <DialogBody className="flex max-h-[46vh] flex-col gap-3 overflow-y-auto">
              {[
                tcs("Candle writes land in luc_quant.market_candles_1h, _1d and _1w — the machine source of truth."),
                tcs("The legacy luc_quant.market_candles table is retained for compatibility and rollback only."),
                tcs("luc-data/injest is a retained Parquet snapshot. luc-injest no longer writes it."),
                tcs("Until the reader is switched, luc-research still reads that snapshot and therefore does not see ClickHouse-only data."),
                tcs("This dialog exists to prove the scroll container and the fixed header/footer behave."),
              ].map((line) => (
                <Text key={line} variant="label" tone="muted">
                  {line}
                </Text>
              ))}
            </DialogBody>
            <DialogFooter>
              <Button variant="secondary">{"Copy summary"}</Button>
              <Button variant="primary">{"Close"}</Button>
            </DialogFooter>
          </DialogContent>
        </DialogRoot>
      </Example>

      <Section title={tcs("Behaviour")} description={tcs("What the foundation guarantees, from one component.")}>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[
            { title: tcs("Focus"), body: tcs("Focus moves into the dialog on open, is trapped while open, and returns to the trigger on close.") },
            { title: tcs("Dismissal"), body: tcs("Escape and outside-click close it. Interactive content inside does not.") },
            { title: tcs("Scroll"), body: tcs("The page behind is locked; long bodies scroll inside `DialogBody` with a fixed header and footer.") },
            { title: tcs("Motion"), body: tcs("200ms entrance, 140ms exit. Under reduced motion both collapse to a fade.") },
            { title: tcs("Labelling"), body: tcs("`DialogTitle` and `DialogDescription` are wired to the dialog's ARIA attributes automatically.") },
            { title: tcs("Layering"), body: tcs("Scrim at z-overlay, content at z-modal. Nothing in a page can sit above a dialog by accident.") },
          ].map((item) => (
            <Card key={item.title} variant="outline" className="gap-1.5 p-4">
              <Text variant="label" tone="primary" as="p">
                {item.title}
              </Text>
              <Text variant="caption" tone="muted">
                {item.body}
              </Text>
            </Card>
          ))}
        </div>
      </Section>

      <Section title={tcs("API")}>
        <PropsTable
          rows={[
            { name: "DialogContent width", type: '"sm" | "md" | "lg"', default: '"md"', description: tcs("Max width; the dialog is always inset 1rem from the viewport.") },
            { name: "DialogContent showClose", type: "boolean", default: "true", description: tcs("Built-in, labelled close button.") },
            { name: "DialogHeader icon", type: "ReactNode", description: tcs("Optional 32px icon tile for orientation.") },
            { name: "DialogRoot open / onOpenChange", type: "boolean / (open: boolean) => void", description: tcs("Controlled usage; uncontrolled by default.") },
            { name: "DialogTrigger asChild", type: "boolean", description: tcs("Attach the trigger to any focusable element.") },
          ]}
        />
      </Section>

      <Section title={tcs("Rules")}>
        <div className="grid gap-4 md:grid-cols-2">
          <Card variant="outline" className="gap-2 p-4">
            <Text variant="micro" tone="positive" as="p">
              {tcs("Do")}
            </Text>
            <ul className="flex list-disc flex-col gap-1.5 pl-4 text-label text-fg-secondary">
              <li>{tcs("Use a dialog for a decision that needs context, not for every edit.")}</li>
              <li>{tcs("Put the primary action last in the footer.")}</li>
              <li>{tcs("Keep the title short enough to read in one glance.")}</li>
            </ul>
          </Card>
          <Card variant="outline" className="gap-2 p-4">
            <Text variant="micro" tone="negative" as="p">
              {tcs("Don't")}
            </Text>
            <ul className="flex list-disc flex-col gap-1.5 pl-4 text-label text-fg-secondary">
              <li>{tcs("Open a dialog from inside another dialog.")}</li>
              <li>{tcs("Hide the only way to continue behind a scroll.")}</li>
              <li>
                {tcs("Use")} <Code>alert()</Code> {tcs("or a browser-native confirm.")}
              </li>
            </ul>
          </Card>
        </div>
      </Section>

      <EntryNotes entryIds={["dialog"]} />
      <EntryFooter entryId="dialog" />
    </DocPage>
  );
}
