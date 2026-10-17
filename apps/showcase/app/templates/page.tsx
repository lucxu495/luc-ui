/*
 * Templates.
 *
 * A Template is a whole page or site: components and Blocks wired together,
 * with the routing, the content shape and the layout decisions already made.
 * The Showcase's templates are *reference pages*, not downloadable archives —
 * there is no packaging step that would let a download be honest yet, so none
 * is offered. What is offered is what actually exists: a working page you can
 * open, inspect, and copy from.
 *
 * The distinction matters commercially as well as technically: a template that
 * claims to be a starter kit and cannot be extracted is a dead end, so the page
 * says plainly what a reader gets and how they get it.
 */

import type { Metadata } from "next";
import Link from "next/link";
import { Badge, Card, Heading, Inline, Section, Text, buttonVariants } from "@luc/ui";
import { DocPage } from "@/components/docs/doc-page";
import { PageHeader } from "@/components/docs/page-header";
import { TEMPLATES } from "@/lib/templates";
import { getServerCopy } from "@/lib/i18n/server";
import { localizeHref } from "@/lib/i18n/config";

export const metadata: Metadata = {
  title: "Templates",
  description:
    "Whole-page starters built from Luc UI components and Blocks: personal sites, a marketing page, a product console and a research workspace.",
};


const KINDS = {
  personal: "Personal",
  general: "General purpose",
  vertical: "Vertical",
} as const;

export default async function TemplatesPage() {
  const { tcs, locale } = await getServerCopy();
  const href = (target: string) => localizeHref(target, locale);

  return (
    <DocPage>
      <PageHeader
        eyebrow={tcs("Build with it")}
        title="Templates"
        lead="A Template is a whole page: components and Blocks wired together, with the layout and the content shape decided. Each one is a live reference page in this Showcase — open it, read the source, and copy what you need."
      />

      <Card variant="outline" className="gap-2 p-4">
        <Inline gap="sm" align="center" wrap>
          <Badge tone="warning" size="sm" dot>
            {tcs("No download")}
          </Badge>
          <Text variant="caption" tone="muted" as="p">
            {tcs(
              "There is no archive to download, and this page will not offer one until a packaged starter contains every file, token and asset it needs — a download that does not build is worse than no download.",
            )}
          </Text>
        </Inline>
      </Card>

      <Section
        title={tcs("Reference pages")}
        description={tcs(
          "Every entry below is a working route. What a reader supplies is stated, because a template that hides its data contract is a template nobody can use.",
        )}
      >
        <div className="grid gap-4 md:grid-cols-2">
          {TEMPLATES.map((template) => (
            <Card key={template.id} className="gap-3 p-4">
              <Inline justify="between" align="center" wrap>
                <Heading size="title" as="h3">
                  {template.title}
                </Heading>
                <Badge tone="neutral" size="sm">
                  {KINDS[template.kind]}
                </Badge>
              </Inline>
              <Text variant="caption" tone="muted" as="p">
                {tcs(template.summary)}
              </Text>
              <Text variant="caption" tone="muted" as="p">
                {tcs("You supply")}: {tcs(template.supply)}
              </Text>
              <Inline gap="xs" wrap>
                {template.stack.map((symbol) => (
                  <code
                    key={symbol}
                    className="rounded-sm border border-line-subtle bg-surface-sunken px-1.5 py-0.5 font-mono text-micro text-fg-secondary"
                  >
                    {symbol}
                  </code>
                ))}
              </Inline>
              <Inline gap="sm">
                <Link href={href(template.route)} className={buttonVariants({ variant: "primary", size: "sm" })}>
                  {tcs("Open the page")}
                </Link>
              </Inline>
            </Card>
          ))}
        </div>
      </Section>

      <Section
        title={tcs("Copying a template")}
        description={tcs(
          "The honest workflow today: read the page, take the composition, bring your own data.",
        )}
      >
        <ol className="flex flex-col gap-2 text-body text-fg-secondary">
          <li>
            {tcs("1. Open the reference page and copy the composition you want — the structure is plain JSX over public exports.")}
          </li>
          <li>
            {tcs("2. Replace the local fixtures with your data. Every template keeps its data in a small module beside the page, which is what makes that a mechanical edit.")}
          </li>
          <li>
            {tcs("3. Install the library and import the styles once at your app root — see the installation page for the commands that work today.")}
          </li>
        </ol>
        <Inline gap="sm">
          <Link href={href("/docs/installation")} className={buttonVariants({ variant: "outline", size: "sm" })}>
            {tcs("Installation")}
          </Link>
          <Link href={href("/blocks")} className={buttonVariants({ variant: "outline", size: "sm" })}>
            {tcs("Blocks")}
          </Link>
        </Inline>
      </Section>
    </DocPage>
  );
}
