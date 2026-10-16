/*
 * Installation.
 *
 * Two distribution modes, one of which does not work yet, and two peer
 * requirements — all read from `lib/docs/install.ts`, which is the only place
 * an install command or a version is written in this Showcase. A page that
 * invents a command costs a reader ten minutes; a page that says "not
 * published yet" costs them none.
 */

import type { Metadata } from "next";
import { Card, Heading, Inline, Stack, Text, Badge } from "@luc/ui";
import { CopyButton } from "@/components/docs/copy-button";
import { DocPage } from "@/components/docs/doc-page";
import { PageHeader } from "@/components/docs/page-header";
import {
  DISTRIBUTION_MODES,
  PACKAGE_MANAGERS,
  PEER_REQUIREMENTS,
  distributionSpec,
  installCommand,
  setupSnippets,
  type DistributionMode,
} from "@/lib/docs/install";
import { getServerCopy } from "@/lib/i18n/server";

export const metadata: Metadata = {
  title: "Installation — LUC UI",
  description: "Install @luc/ui, import its styles and mount one provider.",
};

const MODES: readonly DistributionMode[] = ["source", "package"];

export default async function InstallationPage() {
  const { tcs } = await getServerCopy();

  return (
    <DocPage intent="reading">
      <PageHeader
        eyebrow={tcs("Documentation")}
        title={tcs("Installation")}
        lead={tcs(
          "One stylesheet, one provider, and a component imported from its own subpath. Nothing here is a guess: the commands come from the same module the component pages use.",
        )}
      />

      {MODES.map((mode) => {
        const info = DISTRIBUTION_MODES[mode];
        return (
          <Stack gap="md" key={mode}>
            <Heading size="title" as="h2" id={`mode-${mode}`}>
              {tcs(info.label)}
            </Heading>
            <Inline gap="sm" align="center" wrap>
              <Badge tone={info.available ? "positive" : "warning"} size="sm">
                {info.available ? tcs("Works today") : tcs("Not published yet")}
              </Badge>
            </Inline>
            <Text variant="body" tone="muted" as="p" className="max-w-[68ch]">
              {tcs(info.note)}
            </Text>
            <div className="flex flex-col gap-2">
              {PACKAGE_MANAGERS.map((manager) => {
                const command = installCommand(manager, distributionSpec(mode));
                return (
                  <div
                    key={manager}
                    className="flex items-center justify-between gap-3 rounded-sm border border-line-subtle bg-surface-sunken px-3 py-2"
                  >
                    <code className="font-mono text-caption text-fg-secondary">{command}</code>
                    <CopyButton value={command} label={manager} />
                  </div>
                );
              })}
            </div>
          </Stack>
        );
      })}

      <Stack gap="md">
        <Heading size="title" as="h2" id="setup">
          {tcs("The three setup steps")}
        </Heading>
        {setupSnippets("source").map((snippet) => (
          <Card key={snippet.title} className="gap-2 p-4">
            <Heading size="title" as="h3">
              {tcs(snippet.title)}
            </Heading>
            <Text variant="caption" tone="muted" as="p" className="max-w-[68ch]">
              {tcs(snippet.description)}
            </Text>
            <div className="relative rounded-sm border border-line-subtle bg-surface-sunken">
              <div className="absolute top-1.5 right-1.5">
                <CopyButton value={snippet.code} label={snippet.title} />
              </div>
              <pre
                tabIndex={0}
                className="luc-table-scroll overflow-x-auto px-3 py-2.5 font-mono text-caption leading-[1.7] text-fg-secondary"
              >
                <code>{snippet.code}</code>
              </pre>
            </div>
          </Card>
        ))}
      </Stack>

      <Stack gap="md">
        <Heading size="title" as="h2" id="requirements">
          {tcs("Requirements")}
        </Heading>
        <ul className="flex flex-col gap-1">
          {PEER_REQUIREMENTS.map((requirement) => (
            <li key={requirement} className="text-caption text-fg-muted">
              <code className="font-mono">{requirement}</code>
            </li>
          ))}
        </ul>
        <Text variant="caption" tone="muted" as="p" className="max-w-[68ch]">
          {tcs(
            "Components are imported from their own subpath, which is what keeps a chart engine out of a bundle that only needed a button.",
          )}
        </Text>
      </Stack>
    </DocPage>
  );
}
