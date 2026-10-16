"use client";

import { useState } from "react";
import {
  Button,
  CalendarDate,
  Card,
  DateRangePicker,
  Field,
  FieldGroup,
  Form,
  FormActions,
  FormErrorSummary,
  Input,
  Section,
  SegmentedControl,
  SegmentedItem,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Sheet,
  SheetBody,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  Switch,
  Text,
  TimePicker,
  Time,
  toast,
  type DateRange,
  type FormErrorItem,
} from "@luc/ui";
import { DocPage } from "@/components/docs/doc-page";
import { PageHeader } from "@/components/docs/page-header";
import { Demo } from "@/components/docs/demo";
import { DEMO_TODAY, RANGE_PRESETS } from "@/lib/form-data";
import { useI18n } from "@/lib/i18n/provider";

export default function SettingsFormPatternPage() {
  const { tcs } = useI18n();
  const [open, setOpen] = useState(false);
  const [density, setDensity] = useState("comfortable");

  return (
    <DocPage>
      <PageHeader
        eyebrow={tcs("Patterns · Forms in a Sheet")}
        title="Settings in a sheet"
        lead="V0.3 gave LUC a Sheet; V0.4 gives it a form. Sticky actions, a scrolling body, validation that keeps the panel open, and a toast only after the save actually succeeded."
      />

      <Section
        title={tcs("The workspace settings panel")}
        description={tcs("Opened from the toolbar, closed by Escape, the overlay or the Cancel button — never silently, and never while a save is in flight.")}
      >
        <Demo layout="block">
          <Card className="flex flex-col gap-4 p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-col gap-1">
                <Text variant="label">Workspace settings</Text>
                <Text variant="caption" tone="muted">
                  {tcs("Digest window, default clock and delivery preferences.")}</Text>
              </div>
              <Button variant="secondary" onClick={() => setOpen(true)}>
                Edit settings
              </Button>
            </div>
            <FieldGroup columns={3}>
              <Field label={tcs("Digest window")} description={tcs("Stored as two calendar dates.")}>
                <Input readOnly defaultValue="2026-09-01 → 2026-09-26" />
              </Field>
              <Field label={tcs("Send at")}>
                <Input readOnly defaultValue="07:30" />
              </Field>
              <Field label={tcs("Layout density")}>
                <Input readOnly defaultValue={density} />
              </Field>
            </FieldGroup>
          </Card>
        </Demo>
      </Section>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="right" size="md">
          <SettingsSheetBody onClose={() => setOpen(false)} onDensityChange={setDensity} />
        </SheetContent>
      </Sheet>

      <Section
        title={tcs("Why the form lives in the Sheet")}
        description={tcs("The body scrolls, the header and actions do not, and the layout is the same one a page-level settings form uses — the Sheet only changes the container.")}
      >
        <div className="grid gap-4 lg:grid-cols-3">
          {[
            {
              title: "Focus",
              body: tcs("The dialog traps focus, Escape closes it, and focus returns to the button that opened it."),
            },
            {
              title: "Validation",
              body: tcs("A failed save keeps the panel open and lists what is wrong, in place."),
            },
            {
              title: "Feedback",
              body: tcs("The toast fires after the save resolves — never as the only signal that something failed."),
            },
          ].map((item) => (
            <Card key={item.title} className="flex flex-col gap-2 p-5">
              <Text variant="label">{item.title}</Text>
              <Text variant="caption" tone="muted">
                {tcs(item.body)}
              </Text>
            </Card>
          ))}
        </div>
      </Section>
    </DocPage>
  );
}

interface WorkspaceSettings {
  name: string;
  window: DateRange | null;
  sendAt: Time | null;
  timezone: string;
  density: string;
  digest: boolean;
}

function SettingsSheetBody({
  onClose,
  onDensityChange,
}: {
  onClose: () => void;
  onDensityChange: (density: string) => void;
}) {
  const { tcs } = useI18n();
  const [values, setValues] = useState<WorkspaceSettings>({
    name: "Macro research",
    window: { start: new CalendarDate(2026, 9, 1), end: new CalendarDate(2026, 9, 26) },
    sendAt: new Time(7, 30),
    timezone: "UTC",
    density: "comfortable",
    digest: true,
  });
  const [errors, setErrors] = useState<FormErrorItem[]>([]);

  const set = <K extends keyof WorkspaceSettings>(key: K, value: WorkspaceSettings[K]) =>
    setValues((current) => ({ ...current, [key]: value }));

  return (
    <Form
      errors={errors}
      className="flex min-h-0 flex-1 flex-col gap-0"
      onSubmit={async () => {
        const next: FormErrorItem[] = [];
        if (values.name.trim().length < 4) {
          next.push({
            id: "sheet-name",
            label: "Workspace name",
            message: "Use at least four characters",
            focus: () => document.getElementById("sheet-name")?.focus(),
          });
        }
        if (!values.window) {
          next.push({ id: "sheet-window", label: "Digest window", message: "Choose a period" });
        }
        if (next.length > 0) {
          setErrors(next);
          return "error";
        }
        setErrors([]);
        await new Promise((resolve) => setTimeout(resolve, 700));
        toast.success("Workspace settings saved");
        onClose();
      }}
    >
      <SheetHeader>
        <SheetTitle>Workspace settings</SheetTitle>
        <SheetDescription>
          {tcs("Digest period, delivery clock and layout. Changes apply to every member.")}</SheetDescription>
      </SheetHeader>

      <SheetBody className="flex flex-col gap-5">
        <FormErrorSummary />

        <FieldGroup columns={1}>
          <Field label={tcs("Workspace name")} required>
            <Input
              id="sheet-name"
              value={values.name}
              onChange={(event) => set("name", event.target.value)}
            />
          </Field>
          <Field
            label={tcs("Digest window")}
            id="sheet-window"
            description={tcs("Inclusive at both ends, in the workspace time zone.")}
          >
            <DateRangePicker
              value={values.window}
              onValueChange={(next) => set("window", next as unknown as DateRange)}
              presets={RANGE_PRESETS}
              todayValue={DEMO_TODAY}
              months={1}
              locale="en-US"
            />
          </Field>
          <Field label={tcs("Send at")} description={tcs("Local wall clock in the selected time zone.")}>
            <TimePicker
              value={values.sendAt}
              onValueChange={(next) => set("sendAt", next)}
              hourCycle={24}
              minuteStep={15}
              locale="en-US"
            />
          </Field>
          <Field label={tcs("Time zone")} description={tcs("Decides what “07:30” means for delivery.")}>
            <Select value={values.timezone} onValueChange={(next) => set("timezone", next)}>
              <SelectTrigger aria-label="Time zone">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="UTC">UTC</SelectItem>
                <SelectItem value="Europe/Berlin">Europe/Berlin</SelectItem>
                <SelectItem value="America/New_York">America/New_York</SelectItem>
                <SelectItem value="Asia/Tokyo">Asia/Tokyo</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label={tcs("Layout density")} description={tcs("Dense tables, or roomier defaults.")}>
            <SegmentedControl
              value={values.density}
              onValueChange={(next) => {
                if (!next) return;
                set("density", next);
                onDensityChange(next);
              }}
            >
              <SegmentedItem value="comfortable">Comfortable</SegmentedItem>
              <SegmentedItem value="compact">Compact</SegmentedItem>
            </SegmentedControl>
          </Field>
          <Field label={tcs("Daily digest")}>
            <Switch
              checked={values.digest}
              onCheckedChange={(next) => set("digest", next)}
              label={tcs("Send the daily digest")}
              description={tcs("One email per trading day, at the clock above.")}
            />
          </Field>
        </FieldGroup>
      </SheetBody>

      <SheetFooter>
        <FormActions sticky={false} className="w-full">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary">
            Save settings
          </Button>
        </FormActions>
      </SheetFooter>
    </Form>
  );
}
