/*
 * The homepage's installation section.
 *
 * Documentation for a library that is not yet on a registry has one specific
 * way to be dishonest: print `npm install @luc/ui` and let the reader discover
 * the 404. So the two distribution modes are shown side by side — the workspace
 * and tarball path that works today, and the registry command that does not
 * yet — and the second one says so in the badge and in the sentence above it.
 * The commands come from `lib/docs/install.ts`, the same module every component
 * page uses, so a page cannot drift from the front door.
 *
 * The section is static: the commands are strings and the copy buttons are the
 * only interactive parts.
 */

import { Badge, Card, Heading, Inline, Section, Text } from "@luc/ui";
import {
  DISTRIBUTION_MODES,
  PACKAGE_MANAGERS,
  PEER_REQUIREMENTS,
  distributionSpec,
  installCommand,
} from "@/lib/docs/install";
import { CopyButton } from "@/components/docs/copy-button";
import { getServerCopy } from "@/lib/i18n/server";

export async function HomeInstall() {
  const { tcs } = await getServerCopy();

  return (
    <Section
      data-testid="home-install"
      title={tcs("Two ways to install it, one of them real")}
      description={tcs(
        "The package is built, packed and installed by an external consumer fixture on every release gate — but it is not published to a registry, so only the tarball path resolves today.",
      )}
    >
      <div className="grid gap-4 lg:grid-cols-2">
        {(["source", "package"] as const).map((mode) => {
          const info = DISTRIBUTION_MODES[mode];
          return (
            <Card key={mode} variant="outline" className="gap-3 p-4">
              <Inline justify="between" align="center" wrap>
                <Heading size="title" as="h3">
                  {info.label}
                </Heading>
                <Badge tone={info.available ? "positive" : "warning"} size="sm" dot>
                  {info.available
                    ? tcs("Works today")
                    : tcs("Not published yet")}
                </Badge>
              </Inline>
              <Text variant="caption" tone="muted" as="p">
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
                      <CopyButton value={command} label={tcs("Copy command")} />
                    </div>
                  );
                })}
              </div>
            </Card>
          );
        })}
      </div>
      <Text variant="caption" tone="muted" as="p">
        {tcs("Requires")}: {PEER_REQUIREMENTS.join(" · ")}
      </Text>
    </Section>
  );
}
