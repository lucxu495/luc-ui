/*
 * Theming.
 *
 * The system's theme is data, not a build step: a document element carries the
 * theme, the brand palette, the type voice and the personality, and every token
 * resolves against those attributes. This page states where each one lives and
 * links to the foundations pages that render them, because a theming guide that
 * re-draws the palettes is a second source of truth.
 */

import type { Metadata } from "next";
import Link from "next/link";
import { Card, Heading, Inline, Stack, Text } from "@luc/ui";
import { CopyButton } from "@/components/docs/copy-button";
import { DocPage } from "@/components/docs/doc-page";
import { PageHeader } from "@/components/docs/page-header";
import { getServerCopy } from "@/lib/i18n/server";

export const metadata: Metadata = {
  title: "Theming — LUC UI",
  description: "Theme, brand palette, type voice and personality as document attributes.",
};

const ATTRIBUTES = [
  { name: "data-theme", detail: "dark or light — the reference is dark." },
  { name: "data-palette", detail: "The brand palette the accent tokens resolve against." },
  { name: "data-typeface", detail: "The type voice used by display and body text." },
  { name: "data-personality", detail: "Radius, depth and motion character, as one choice." },
];

const SNIPPET = `<html
  lang="en"
  className="dark"
  data-theme="dark"
  data-palette="aurora"
  data-typeface="inter-tight"
  data-personality="precise"
>`;

const FOUNDATIONS = [
  { href: "/foundations/themes", key: "Themes" },
  { href: "/foundations/colors", key: "Colors" },
  { href: "/foundations/typography", key: "Typography" },
  { href: "/foundations/motion", key: "Motion" },
];

export default async function ThemingPage() {
  const { tcs, href } = await getServerCopy();

  return (
    <DocPage>
      <PageHeader
        eyebrow={tcs("Documentation")}
        title={tcs("Theming")}
        lead={tcs(
          "A theme is four attributes on the document element. Tokens resolve against them, so a product changes its whole look without overriding a single component.",
        )}
      />

      <Stack gap="md">
        <Heading size="title" as="h2" id="attributes">
          {tcs("The four attributes")}
        </Heading>
        <div className="relative rounded-lg border border-line-subtle bg-surface-sunken">
          <div className="absolute top-2 right-2">
            <CopyButton value={SNIPPET} label={tcs("Theme attributes")} />
          </div>
          <pre
            tabIndex={0}
            className="luc-table-scroll overflow-x-auto px-3.5 py-3 font-mono text-caption leading-[1.7] text-fg-secondary"
          >
            <code>{SNIPPET}</code>
          </pre>
        </div>
        <ul className="flex flex-col gap-2">
          {ATTRIBUTES.map((attribute) => (
            <li key={attribute.name} className="flex flex-col gap-0.5">
              <code className="font-mono text-caption text-fg-accent">{attribute.name}</code>
              <Text variant="caption" tone="muted" as="p">
                {tcs(attribute.detail)}
              </Text>
            </li>
          ))}
        </ul>
        <Text variant="body" tone="muted" as="p" className="max-w-[68ch]">
          {tcs(
            "Dark mode is the reference, not a filter over the light theme: depth comes from the token luminance step and a hairline border rather than from shadow alone.",
          )}
        </Text>
      </Stack>

      <Stack gap="md">
        <Heading size="title" as="h2" id="foundations">
          {tcs("Where the values come from")}
        </Heading>
        <Text variant="body" tone="muted" as="p" className="max-w-[68ch]">
          {tcs(
            "The palette, type face and personality registries live in the Showcase's appearance module, and the foundations pages render them so you can judge them next to real components.",
          )}
        </Text>
        <Inline gap="sm" wrap>
          {FOUNDATIONS.map((item) => (
            <Link
              key={item.href}
              href={href(item.href)}
              className="rounded-lg border border-line-subtle px-3 py-2 text-label text-fg-primary luc-transition hover:border-line-strong"
            >
              {tcs(item.key)}
            </Link>
          ))}
        </Inline>
      </Stack>

      <Stack gap="md">
        <Heading size="title" as="h2" id="motion">
          {tcs("Motion and reduced motion")}
        </Heading>
        <Card className="gap-2 p-4">
          <Text variant="body" tone="muted" as="p" className="max-w-[68ch]">
            {tcs(
              "Every primitive reads the reduced-motion preference. If you compose your own animation, honour it too: the Showcase's motion control exists so the difference can be seen rather than argued about.",
            )}
          </Text>
        </Card>
      </Stack>
    </DocPage>
  );
}
