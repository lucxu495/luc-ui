"use client";

import {
  Avatar,
  AvatarGroup,
  Badge,
  Card,
  Rating,
  Section,
  Text,
} from "@luc/ui";
import { DocPage } from "@/components/docs/doc-page";
import { PageHeader } from "@/components/docs/page-header";
import { ImportLine } from "@/components/docs/family-imports";
import { Demo } from "@/components/docs/demo";
import { Example } from "@/components/docs/example";
import { PropsTable } from "@/components/docs/tables";
import { useI18n } from "@/lib/i18n/provider";
import { EntryFooter } from "@/components/docs/entry-footer";
import { EntryNotes } from "@/components/docs/entry-notes";
import { ExamplesHeading } from "@/components/docs/examples-heading";

const PEOPLE = [
  { name: "Ada Lovelace", role: "Research", status: "online" as const },
  { name: "Grace Hopper", role: "Data platform", status: "away" as const },
  { name: "Alan Turing", role: "Modelling", status: "offline" as const },
  { name: "Katherine Johnson", role: "Verification" },
  { name: "谢健", role: "Serving" },
];

export default function AvatarPage() {
  const { tc, tcs } = useI18n();
  return (
    <DocPage intent="compact">
      <PageHeader eyebrow={tcs("Components")} title="Avatar and Rating" lead={tc("components.avatar.lead")} />
      <ExamplesHeading />

      <ImportLine line={'import { Avatar, AvatarGroup } from "@luc/ui";'} />

      <Section title={tc("components.avatar.fallback.title")} description={tc("components.avatar.fallback.lead")}>
        <Demo layout="inline" code={'<Avatar name="Ada Lovelace" status="online" />'}>
          <Avatar size="xs" name="Ada Lovelace" />
          <Avatar size="sm" name="Grace Hopper" />
          <Avatar size="md" name="Alan Turing" status="online" />
          <Avatar size="lg" name="Katherine Johnson" status="away" />
          <Avatar size="xl" name="谢健" shape="rounded" />
          <Avatar size="md" name="Workspace" shape="square" fallback="LQ" />
        </Demo>
        <Card variant="outline" className="mt-4 gap-2 p-4">
          <Text variant="caption" tone="secondary">
            {tc("components.avatar.tint")}
          </Text>
        </Card>
      </Section>

      <Example
        title={tc("components.avatar.group.title")}
        description={tc("components.avatar.group.lead")}
        layout="inline"
        code={'<AvatarGroup max={3} total={12}>…</AvatarGroup>'}
      >

        <AvatarGroup max={3} total={12}>
          {PEOPLE.slice(0, 5).map((person) => (
            <Avatar key={person.name} name={person.name} status={person.status} />
          ))}
        </AvatarGroup>
        <AvatarGroup max={5}>
          {PEOPLE.map((person) => (
            <Avatar key={person.name} size="sm" name={person.name} />
          ))}
        </AvatarGroup>
      </Example>

      <Example
        title={tc("components.avatar.list.title")}
        description={tc("components.avatar.list.lead")}
        layout="block"
        code={`<Card variant="outline" className="divide-y divide-line-subtle">
  {people.map((person) => (
    <div key={person.name} className="flex items-center gap-3 p-3">
      <Avatar name={person.name} status={person.status} />
      <span className="flex min-w-0 flex-1 flex-col">
        <Text variant="label">{person.name}</Text>
        <Text variant="caption" tone="muted">{person.role}</Text>
      </span>
      <Badge tone={person.status === "online" ? "positive" : "neutral"} size="sm">
        {person.status ?? "offline"}
      </Badge>
    </div>
  ))}
</Card>`}
      >

        <Card variant="outline" className="divide-y divide-line-subtle">
          {PEOPLE.slice(0, 4).map((person) => (
            <div key={person.name} className="flex items-center gap-3 p-3">
              <Avatar name={person.name} status={person.status} />
              <span className="flex min-w-0 flex-1 flex-col">
                <Text variant="label">{person.name}</Text>
                <Text variant="caption" tone="muted">
                  {person.role}
                </Text>
              </span>
              <Badge tone={person.status === "online" ? "positive" : "neutral"} size="sm">
                {person.status ?? "offline"}
              </Badge>
              <Rating
                readOnly
                allowHalf
                value={3.5}
                size="sm"
                label={`${person.name} rating`}
              />
            </div>
          ))}
        </Card>
      </Example>

      <Example
        title={tc("components.avatar.rating.title")}
        description={tc("components.avatar.rating.lead")}
        layout="inline"
        code={'<Rating label="Quality" defaultValue={4} />'}
      >

        <Rating label={tcs("Quality")} defaultValue={4} />
        <Rating label={tcs("Confidence")} defaultValue={2} allowHalf />
        <Rating label={tcs("Read only")} value={3.5} allowHalf readOnly size="lg" />
      </Example>

      <Section title={tcs("API")}>
        <PropsTable
          rows={[
            { name: "Avatar name", type: "string", description: tcs("Accessible name and the deterministic tint seed.") },
            { name: "Avatar fallback", type: "ReactNode", description: tcs("Initials by default; any node to override.") },
            { name: "Avatar size / shape", type: '"xs"…"xl" · "circle" | "rounded" | "square"', default: '"md" · "circle"', description: tcs("Geometry is independent of the name.") },
            { name: "Avatar status", type: '"online" | "away" | "offline"', description: tcs("Decorative dot; the label still carries the name.") },
            { name: "AvatarGroup max / total", type: "number", default: "4 / children", description: tcs("Overflow is rendered as real text, not hidden.") },
            { name: "Rating value / onValueChange", type: "number", description: tcs("Controlled or uncontrolled; a radiogroup under the hood.") },
            { name: "Rating allowHalf / readOnly", type: "boolean", description: tcs("Half steps, or a score that is data rather than a control.") },
          ]}
        />
      </Section>
      <EntryNotes entryIds={["avatar"]} />
      <EntryFooter />
    </DocPage>
  );
}
