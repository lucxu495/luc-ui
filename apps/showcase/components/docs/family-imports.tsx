"use client";

/*
 * How to get the components a *family* page documents.
 *
 * UX-003's last open criterion. The five pages that document a family rather
 * than one registry entry — Buttons, Inputs, Cards, AI, Slider — had no
 * installation guidance at all, because the generated `InstallSection` is built
 * from one entry's distribution mode and these pages have no single entry to
 * read it from. A reader who arrived from search reached the API table and then
 * had to guess the import line.
 *
 * It prints the import lines the page's own specimens use — the same names its
 * `Demo` blocks import, so the snippet a reader copies is the snippet the page
 * runs — and points at `/docs/installation` for the package-level setup
 * (peer requirements, the stylesheet, the provider), which is a real page with
 * the real commands. It does not invent a per-component install command, because
 * there is no such thing: these are exports of one package.
 */

import Link from "next/link";
import { Stack, Text } from "@luc/ui";
import { CopyButton } from "./copy-button";
import { useI18n } from "@/lib/i18n/provider";

export interface FamilyImportsProps {
  /** The import lines this page's specimens actually use, verbatim. */
  imports: readonly string[];
}

/**
 * One copyable import statement — the Components V2 shape.
 *
 * A component page prints *the* import line for its component, once, near the
 * top, and links to Installation for the package setup instead of repeating it.
 * Same markup as a family page's row, because it is the same promise.
 */
export function ImportLine({ line }: { line: string }) {
  const { tcs } = useI18n();
  return (
    <div
      data-slot="import-line"
      className="flex items-start justify-between gap-3 rounded-lg border border-line-subtle bg-surface-sunken px-3 py-2"
    >
      <code className="min-w-0 font-mono text-caption break-words text-fg-secondary">{line}</code>
      <CopyButton value={line} label={tcs("Copy import")} />
    </div>
  );
}

export function FamilyImports({ imports }: FamilyImportsProps) {
  const { tcs, href } = useI18n();
  return (
    <Stack gap="sm">
      <Text variant="body" tone="muted" as="p" className="max-w-[68ch]">
        {tcs(
          "These are exports of one package, so there is nothing to install per component: install @luc/ui and import the names you use.",
        )}
      </Text>
      <ul className="flex flex-col gap-2">
        {imports.map((line) => (
          <li key={line} className="contents">
            <ImportLine line={line} />
          </li>
        ))}
      </ul>
      <Text variant="caption" tone="muted" as="p" className="max-w-[68ch]">
        {tcs("Package setup — peer requirements, the stylesheet and the provider — is on")}{" "}
        <Link href={href("/docs/installation")} className="text-fg-accent underline luc-focus">
          {tcs("installation")}
        </Link>
        .
      </Text>
    </Stack>
  );
}
