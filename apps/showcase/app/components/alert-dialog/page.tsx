"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogTrigger,
  Button,
  Card,
  Input,
  Section,
  Text,
  toast,
} from "@luc/ui";
import { DocPage } from "@/components/docs/doc-page";
import { PageHeader } from "@/components/docs/page-header";
import { ImportLine } from "@/components/docs/family-imports";
import { Example } from "@/components/docs/example";
import { PropsTable } from "@/components/docs/tables";
import { useI18n } from "@/lib/i18n/provider";
import { EntryFooter } from "@/components/docs/entry-footer";

export default function AlertDialogPage() {
  const { tc, tcs } = useI18n();
  return (
    <DocPage>
      <PageHeader eyebrow={tcs("Components")} title="AlertDialog" lead={tc("components.alertDialog.lead")} />

      <ImportLine line={'import {\n  AlertDialog,\n  AlertDialogAction,\n  AlertDialogCancel,\n  AlertDialogContent,\n  AlertDialogDescription,\n  AlertDialogFooter,\n  AlertDialogTitle,\n  AlertDialogTrigger,\n} from "@luc/ui";'} />

      <Example
        title={tc("components.alertDialog.default.title")}
        description={tc("components.alertDialog.default.lead")}
        layout="inline"
        code={'<AlertDialog>\n  <AlertDialogTrigger asChild><Button variant="danger">Delete dataset</Button></AlertDialogTrigger>\n  <AlertDialogContent>…</AlertDialogContent>\n</AlertDialog>'}
      >

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="danger">Delete dataset</Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogTitle>Delete this dataset?</AlertDialogTitle>
            <AlertDialogDescription>
              {tcs("312 rows and every derived analytics partition will be removed. This cannot be undone.")}</AlertDialogDescription>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={() => toast.success("Dataset deleted")}>Delete dataset</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="secondary">Publish revision</Button>
          </AlertDialogTrigger>
          <AlertDialogContent width="md">
            <AlertDialogTitle>Publish revision 42?</AlertDialogTitle>
            <AlertDialogDescription>
              {tcs("Publishing moves the live pointer. The previous generation stays readable until retention walks it.")}</AlertDialogDescription>
            <AlertDialogFooter>
              <AlertDialogCancel>Not yet</AlertDialogCancel>
              <AlertDialogAction tone="primary" onClick={() => toast.success("Revision 42 published")}>
                Publish
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </Example>

      <Example
        title={tc("components.alertDialog.form.title")}
        description={tc("components.alertDialog.form.lead")}
        layout="inline"
        code={`<AlertDialog>
  <AlertDialogTrigger asChild>
    <Button variant="outline">Rename workspace</Button>
  </AlertDialogTrigger>
  <AlertDialogContent>
    <AlertDialogTitle>Rename workspace</AlertDialogTitle>
    <AlertDialogDescription>Links keep working; the slug changes immediately.</AlertDialogDescription>
    <Input defaultValue="research" aria-label="Workspace slug" />
    <AlertDialogFooter>
      <AlertDialogCancel>Cancel</AlertDialogCancel>
      <AlertDialogAction tone="primary">Rename</AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>`}
      >

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="outline">Rename workspace</Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogTitle>Rename workspace</AlertDialogTitle>
            <AlertDialogDescription>{tcs("Links keep working; the slug changes immediately.")}</AlertDialogDescription>
            <div className="mt-4 flex flex-col gap-1.5">
              <Input defaultValue="research" aria-label="Workspace slug" />
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction tone="primary" onClick={() => toast.success("Workspace renamed")}>
                Save name
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </Example>

      <Section title={tc("components.alertDialog.rules.title")} description={tc("components.alertDialog.rules.lead")}>
        <div className="grid gap-4 md:grid-cols-2">
          <Card variant="outline" className="gap-2 p-4">
            <Text variant="micro" tone="positive" as="p">
              Do
            </Text>
            <ul className="flex list-disc flex-col gap-1.5 pl-4 text-label text-fg-secondary">
              <li>{tcs("Name the action (“Delete dataset”), never “OK”.")}</li>
              <li>{tcs("Say what is lost and whether it can be undone.")}</li>
              <li>{tcs("Reserve it for a decision that cannot be reverted in place.")}</li>
            </ul>
          </Card>
          <Card variant="outline" className="gap-2 p-4">
            <Text variant="micro" tone="negative" as="p">
              Don&apos;t
            </Text>
            <ul className="flex list-disc flex-col gap-1.5 pl-4 text-label text-fg-secondary">
              <li>{tcs("Use it for a confirmation that could be a Button with an undo.")}</li>
              <li>{tcs("Stack two alert dialogs — one decision per moment.")}</li>
              <li>{tcs("Put an irreversible action in the first focus position.")}</li>
            </ul>
          </Card>
        </div>
      </Section>

      <Section title={tcs("API")}>
        <PropsTable
          rows={[
            { name: "AlertDialog width", type: '"sm" | "md"', default: '"sm"', description: tcs("A confirmation is a decision, not a page.") },
            { name: "AlertDialogAction tone", type: '"danger" | "primary"', default: '"danger"', description: tcs("The safe reading of a confirmation is a destructive one.") },
            { name: "AlertDialogAction / Cancel", type: "Radix Action / Cancel", description: tcs("They close the dialog; the work stays in your handler.") },
            { name: "Dismissal", type: "Escape only", description: tcs("Radix removes outside-click dismissal from the contract entirely.") },
          ]}
        />
      </Section>
      <EntryFooter />
    </DocPage>
  );
}
