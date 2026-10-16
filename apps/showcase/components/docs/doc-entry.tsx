/*
 * The parts every component or chart page is assembled from.
 *
 * These are server components: a documentation page is mostly text, and text
 * does not need the client. Only what the reader *operates* is a client island
 * — the Playground, the copy buttons, the search field and the outline.
 *
 * Nothing here is written by hand per page. The header, the API table, the
 * install block, the AI guidance and the related list are all views of the
 * registry, which is generated from the real package exports and the real
 * TypeScript program. That is what makes 220 pages trustworthy rather than 220
 * chances to be wrong.
 */

import Link from "next/link";
import {
  Badge,
  Card,
  Heading,
  Inline,
  Separator,
  Stack,
  Text,
  buttonVariants,
  cn,
} from "@luc/ui";
import { buildAiPrompt } from "@/lib/docs/ai-prompt";
import {
  DISTRIBUTION_MODES,
  PACKAGE_MANAGERS,
  PEER_REQUIREMENTS,
  distributionSpec,
  installCommand,
  setupSnippets,
  type DistributionMode,
} from "@/lib/docs/install";
import {
  apiFor,
  familyOf,
  familyPeers,
  neighbours,
  relatedEntries,
  type DocEntry,
} from "@/lib/docs/registry";
import type { ApiSymbol } from "@/lib/docs/api-types";
import type { Translate } from "@/lib/docs/lead";
import { CopyButton } from "./copy-button";

/** Endonym for each locale the docs dictionary covers. */
const LOCALE_LABEL: Record<string, string> = { en: "English", "zh-CN": "简体中文" };

/**
 * The page header.
 *
 * The breadcrumb trail is rendered by the section layout, not here, so a page
 * cannot disagree with the sidebar about where it sits.
 */
/**
 * The page's title block.
 *
 * `lead` is passed in already localised rather than looked up here.
 *
 * The entry's summary is *data* — it comes from the generated registry or the
 * curation table, not from a `tcs("…")` call in a page — so rendering
 * `{entry.summary}` straight into the header shipped English sentences onto
 * Chinese pages, and the coverage gate could not see them because nothing in the
 * source ever named those strings (`qa-independent` C-04). The caller is a server
 * component that already resolved the locale, so it does the lookup and this
 * component stays a pure printer.
 */
export function DocEntryHeader({
  entry,
  lead,
  tcs,
}: {
  entry: DocEntry;
  lead?: string;
  /** The page's own localizer: the accessible name of a control is user-facing copy. */
  tcs: Translate;
}) {
  const family = familyOf(entry);
  return (
    <header className="flex flex-col gap-3">
      <Inline gap="sm" align="center" wrap>
        <span className="text-micro tracking-[0.14em] text-fg-muted uppercase">
          {family?.title ?? entry.group}
        </span>
        <StatusBadge status={entry.status} tcs={tcs} />
      </Inline>
      <Heading size="display" as="h1" id="overview">
        {entry.title}
      </Heading>
      <Text variant="body-lg" tone="muted" as="p" className="max-w-[68ch]">
        {lead ?? entry.summary}
      </Text>
      <Inline gap="sm" align="center" wrap>
        <code className="rounded-sm border border-line-subtle bg-surface-sunken px-2 py-1 font-mono text-caption text-fg-secondary">
          {entry.importPath}
        </code>
        <CopyButton value={entry.importPath} label={tcs("Copy import path")} />
      </Inline>
    </header>
  );
}

/**
 * The status badge.
 *
 * The three states are a promise about how much a reader should trust the page
 * to be reviewed, so they are stated rather than implied by omission.
 */
export function StatusBadge({ status, tcs }: { status: DocEntry["status"]; tcs: Translate }) {
  if (status === "curated") {
    return (
      <Badge tone="positive" size="sm">
        {tcs("Reviewed page")}
      </Badge>
    );
  }
  if (status === "generated") {
    return (
      <Badge tone="neutral" size="sm">
        {tcs("Generated from the public API")}
      </Badge>
    );
  }
  return (
    <Badge tone="neutral" size="sm">
      {tcs("Documented on its family page")}
    </Badge>
  );
}

/* --------------------------------------------------------------------- API */

function symbolSummary(symbol: ApiSymbol, tcs: Translate): string {
  if (symbol.props && symbol.props.length > 0) {
    /* One key for both numbers: Chinese does not inflect, and a singular key that
     * exists only to say "prop" rather than "props" is a translation nobody needs. */
    return tcs("{count} documented props").replace("{count}", String(symbol.props.length));
  }
  return symbol.kind === "value" ? "export" : "type";
}

/**
 * The exports a page documents.
 *
 * A page usually documents one component plus the parts that only exist
 * alongside it (`CardHeader`, `CardFooter`), so the table lists every export of
 * the module with its real compiler signature.
 */
export function ExportsTable({ entry, tcs }: { entry: DocEntry; tcs: Translate }) {
  const symbols = apiFor(entry.id);
  if (symbols.length === 0) {
    return (
      <Text variant="caption" tone="muted" as="p">
        This page documents a provider or a composed surface. Its exports come from the package entry point.
      </Text>
    );
  }
  return (
    /* `data-skip-i18n`: this table is the compiler's own output — export names,
       signatures and the JSDoc carried on the declaration. `i18n-coverage.mjs`
       excludes `generated/` for the same reason, so the runtime probe has to
       exclude what that text becomes once it is rendered. An API description is
       not documentation prose: it is API text, and it reads in English in both
       locales, exactly like the code sample underneath it. */
    /*
     * A scroll box has to be reachable from the keyboard.
     *
     * At 390px this table is 801px wide, so the Signature column is off-screen
     * and mouse-only: `overflow-x-auto` on a plain `div` gives a scroll region no
     * tab stop, which axe reports as `scrollable-region-focusable` (serious). The
     * generic `DataTable` has carried `role="region"` + `tabIndex={0}` since
     * Phase 9; these two hand-rolled tables were the ones that did not, and the
     * mobile sweep found them on every component page that has an API section.
     * The name repeats the caption so the region and the table announce as one
     * thing rather than two.
     */
    <div
      className="overflow-x-auto"
      data-skip-i18n
      role="region"
      aria-label={tcs("Exported symbols")}
      tabIndex={0}
    >
      <table className="w-full border-collapse text-left">
        <caption className="sr-only">{tcs("Exported symbols")}</caption>
        <thead>
          <tr className="border-b border-line-subtle">
            <th scope="col" className="py-2 pr-4 text-micro font-medium text-fg-muted uppercase">
              {tcs("Export")}
            </th>
            <th scope="col" className="py-2 pr-4 text-micro font-medium text-fg-muted uppercase">
              {tcs("Kind")}
            </th>
            <th scope="col" className="py-2 text-micro font-medium text-fg-muted uppercase">
              {tcs("Signature")}
            </th>
          </tr>
        </thead>
        <tbody>
          {symbols.map((symbol) => (
            <tr key={symbol.name} className="border-b border-line-subtle/60 align-top">
              <td className="py-2.5 pr-4">
                <code className="font-mono text-caption text-fg-primary">{symbol.name}</code>
              </td>
              <td className="py-2.5 pr-4 text-caption text-fg-muted">{symbolSummary(symbol, tcs)}</td>
              <td className="py-2.5">
                <code className="font-mono text-caption break-words text-fg-secondary">
                  {symbol.signature || "—"}
                </code>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/**
 * The props table for one symbol.
 *
 * Read from the compiler, not from a document: an optional prop stays optional,
 * a union keeps its members, and a `@default` tag is what the library actually
 * wrote. DOM attributes are excluded by the generator, so the table shows the
 * library's own props rather than a hundred inherited ones.
 */
export function PropsTable({ symbol, tcs }: { symbol: ApiSymbol; tcs: Translate }) {
  const props = symbol.props ?? [];
  return (
    /* Same reason as `ExportsTable`: the props and their descriptions come from
       the published TypeScript declarations, not from a sentence anybody wrote
       for this page. See the note there. */
    <div className="flex flex-col gap-2" data-skip-i18n>
      <Heading size="title" as="h3" id={`props-${symbol.name}`}>
        {tcs("{name} props").replace("{name}", symbol.name)}
      </Heading>
      {symbol.propsType ? (
        <Text variant="caption" tone="muted" as="p">
          {/*
           * `break-words`, because a generated type signature is one
           * unbreakable token: the compiler writes
           * `Omit<Pick<Pick<DetailedHTMLProps<InputHTMLAttributes<HTMLInputElement>, …`
           * with no space to wrap at, so on `/components/command` at 390px a
           * 515px `<code>` sat inline in a 350px paragraph and dragged the whole
           * document 145px sideways. Breaking inside the word is ugly and
           * correct; scrolling the page is neither.
           */}
          {tcs("Type:")} <code className="break-words font-mono">{symbol.propsType}</code>
        </Text>
      ) : null}
      <Text variant="caption" tone="muted" as="p">
        {tcs("Values the compiler reads from the declaration.")}
      </Text>
      {props.length === 0 ? (
        <Text variant="caption" tone="muted" as="p">
          {tcs("This export takes no props of its own.")}
        </Text>
      ) : (
        <div
          className="overflow-x-auto"
          role="region"
          aria-label={tcs("{name} props").replace("{name}", symbol.name)}
          tabIndex={0}
        >
          <table className="w-full border-collapse text-left">
            <caption className="sr-only">{tcs("{name} props").replace("{name}", symbol.name)}</caption>
            <thead>
              <tr className="border-b border-line-subtle">
                <th scope="col" className="py-2 pr-4 text-micro font-medium text-fg-muted uppercase">
                  {tcs("Prop")}
                </th>
                <th scope="col" className="py-2 pr-4 text-micro font-medium text-fg-muted uppercase">
                  {tcs("Type")}
                </th>
                <th scope="col" className="py-2 pr-4 text-micro font-medium text-fg-muted uppercase">
                  {tcs("Default")}
                </th>
                <th scope="col" className="py-2 text-micro font-medium text-fg-muted uppercase">
                  {tcs("Notes")}
                </th>
              </tr>
            </thead>
            <tbody>
              {props.map((prop) => (
                <tr key={prop.name} className="border-b border-line-subtle/60 align-top">
                  <td className="py-2.5 pr-4">
                    <code className="font-mono text-caption text-fg-primary">
                      {prop.name}
                      {prop.optional ? "?" : ""}
                    </code>
                    {prop.inherited ? (
                      <span className="ml-2 text-micro text-fg-subtle">inherited</span>
                    ) : null}
                  </td>
                  <td className="py-2.5 pr-4">
                    <code className="font-mono text-caption break-words text-fg-accent">
                      {prop.type ?? "—"}
                    </code>
                  </td>
                  <td className="py-2.5 pr-4">
                    <code className="font-mono text-caption text-fg-muted">
                      {prop.default ?? "—"}
                    </code>
                  </td>
                  <td className="py-2.5 text-caption text-fg-muted">{prop.description ?? ""}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

/* --------------------------------------------------------------- install */

/**
 * Installation.
 *
 * Both distribution modes are shown, and the one that does not work today says
 * so. A reader who copies the registry command and gets a 404 has been lied to
 * by a documentation page, which is the specific failure this section exists to
 * prevent.
 */
export function InstallSection({ entry, tcs }: { entry: DocEntry; tcs: Translate }) {
  const modes: DistributionMode[] = ["source", "package"];
  const symbols = entry.exports.slice(0, 4);
  const usage = `import { ${symbols.join(", ")} } from "${entry.importPath}";`;

  return (
    <Stack gap="md">
      {modes.map((mode) => {
        const info = DISTRIBUTION_MODES[mode];
        return (
          <Card key={mode} className="gap-3 p-4">
            <Inline gap="sm" align="center" justify="between" wrap>
              <Heading size="title" as="h3">
                {tcs(info.label)}
              </Heading>
              <Badge tone={info.available ? "positive" : "warning"} size="sm">
                {info.available ? tcs("Works today") : tcs("Not published yet")}
              </Badge>
            </Inline>
            <Text variant="caption" tone="muted" as="p" className="max-w-[68ch]">
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
                    <CopyButton value={command} label={tcs("Copy the command")} />
                  </div>
                );
              })}
            </div>
          </Card>
        );
      })}

      <Card className="gap-3 p-4">
        <Heading size="title" as="h3">
          {tcs("Required setup")}
        </Heading>
        <ul className="flex flex-col gap-1">
          {PEER_REQUIREMENTS.map((requirement) => (
            <li key={requirement} className="text-caption text-fg-muted">
              {requirement}
            </li>
          ))}
        </ul>
        {setupSnippets("source").map((snippet) => (
          <div key={snippet.title} className="flex flex-col gap-1.5">
            <Text variant="caption" tone="muted" as="p">
              {tcs(snippet.title)} — {tcs(snippet.description)}
            </Text>
            <div className="relative rounded-sm border border-line-subtle bg-surface-sunken">
              <div className="absolute top-1.5 right-1.5">
                <CopyButton value={snippet.code} label={tcs("Copy the snippet")} />
              </div>
              <pre
                tabIndex={0}
                className="luc-table-scroll overflow-x-auto px-3 py-2.5 font-mono text-caption leading-[1.7] text-fg-secondary"
              >
                <code>{snippet.code}</code>
              </pre>
            </div>
          </div>
        ))}
        <Text variant="caption" tone="muted" as="p">
          {tcs("{name} is imported from").replace("{name}", entry.title)}{" "}
          <code className="font-mono">{entry.importPath}</code>:
        </Text>
        <div className="relative rounded-sm border border-line-subtle bg-surface-sunken">
          <div className="absolute top-1.5 right-1.5">
            <CopyButton value={usage} label={tcs("Copy import")} />
          </div>
          <pre
            tabIndex={0}
            className="luc-table-scroll overflow-x-auto px-3 py-2.5 font-mono text-caption leading-[1.7] text-fg-secondary"
          >
            <code>{usage}</code>
          </pre>
        </div>
      </Card>
    </Stack>
  );
}

/* --------------------------------------------------------------- AI copy */

/**
 * Copy for an AI agent.
 *
 * Built from the same registry row the page was built from, so a prompt never
 * describes a different import path than the page does. A page with a
 * Playground gets a richer prompt (chosen props included) from the Playground
 * itself; this is the static equivalent for every other page.
 */
export function AiGuidanceSection({ entry, contract }: { entry: DocEntry; contract?: string }) {
  const prompt = buildAiPrompt({ entry, ...(contract ? { contract } : {}) });
  return (
    <div className="flex flex-col gap-2">
      <Text variant="caption" tone="muted" as="p" className="max-w-[68ch]">
        A specification an agent can act on: the import path, the setup around it, and the
        accessibility and styling expectations that are easy to get wrong.
      </Text>
      <div className="relative rounded-lg border border-line-subtle bg-surface-sunken">
        <div className="absolute top-2 right-2">
          <CopyButton value={prompt} label="Copy AI instructions" />
        </div>
        <pre
          tabIndex={0}
          className="luc-table-scroll max-h-80 overflow-auto px-3.5 py-3 font-mono text-caption leading-[1.7] whitespace-pre-wrap text-fg-secondary"
        >
          <code>{prompt}</code>
        </pre>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------- navigation */

/**
 * The footer's "Related" row (UX-005).
 *
 * Two links minimum, four maximum, and never a catalogue. The declared
 * `related` list wins when an entry has one; otherwise the family's own peers
 * fill the row — `familyPeers` exists for exactly this and cannot invent a
 * relationship, because the entries it returns are siblings by declaration.
 *
 * The row is a `nav` with an accessible name rather than a paragraph of links:
 * a screen-reader user should hear "Related pages, 4 links" and be able to skip
 * it, which a bare `<p>Related</p>` does not provide.
 */
/**
 * Both navigation footers take the localizer rather than resolving it.
 *
 * `DocEntryPage` already resolved the locale for the page it is rendering, and
 * threading one function down is cheaper and more honest than each footer
 * re-reading the request — and it makes the unprefixed form impossible to write
 * by accident, which is the bug this signature exists to prevent.
 */
export function RelatedEntries({
  entry,
  href,
  tcs,
}: {
  entry: DocEntry;
  href: (target: string) => string;
  /** The page's own prose localizer, passed down rather than re-resolved. */
  tcs: (source: string) => string;
}) {
  const related = relatedEntries(entry);
  const seen = new Set(related.map((item) => item.id));
  const take = (candidates: readonly DocEntry[]) => {
    const fresh = candidates.filter((candidate) => !seen.has(candidate.id));
    for (const candidate of fresh) seen.add(candidate.id);
    return fresh;
  };
  /*
   * Two sources, in order, because a family is not always a group of peers:
   * `/components/typography` is the only entry in its family, so family peers
   * alone would leave its footer empty. The reading order is the fallback — the
   * pages immediately before and after this one in the catalogue, which is a
   * relationship the registry already declares rather than one we invent.
   */
  const links = [...related];
  if (links.length < 2) links.push(...take(familyPeers(entry, 4)));
  if (links.length < 2) {
    const { previous, next } = neighbours(entry);
    links.push(...take([previous, next].filter((item): item is DocEntry => item !== undefined)));
  }
  links.length = Math.min(links.length, 4);
  if (links.length === 0) return null;
  return (
    <Stack gap="sm">
      <Text variant="micro" tone="muted" as="p">
        {tcs("Related")}
      </Text>
      <nav aria-label="Related pages">
        <Inline gap="sm" wrap>
          {links.map((item) => (
            <Link
              key={item.id}
              href={href(item.route)}
              className={buttonVariants({ variant: "outline", size: "sm" })}
            >
              {item.title}
            </Link>
          ))}
        </Inline>
      </nav>
    </Stack>
  );
}

export function PrevNextNav({
  entry,
  href,
  tcs,
}: {
  entry: DocEntry;
  href: (target: string) => string;
  tcs: (source: string) => string;
}) {
  const { previous, next } = neighbours(entry);
  if (!previous && !next) return null;
  return (
    <>
      <Separator />
      <nav aria-label="Documentation" className="grid gap-3 sm:grid-cols-2">
        {previous ? (
          <Link
            href={href(previous.route)}
            className="flex flex-col gap-0.5 rounded-lg border border-line-subtle p-3 luc-transition hover:border-line-strong"
          >
            <span className="text-micro text-fg-muted uppercase">{tcs("Previous")}</span>
            <span className="text-label text-fg-primary">{previous.title}</span>
          </Link>
        ) : (
          <span />
        )}
        {next ? (
          <Link
            href={href(next.route)}
            className={cn(
              "flex flex-col gap-0.5 rounded-lg border border-line-subtle p-3 text-right luc-transition hover:border-line-strong",
              previous ? "" : "sm:col-start-2",
            )}
          >
            <span className="text-micro text-fg-muted uppercase">{tcs("Next")}</span>
            <span className="text-label text-fg-primary">{next.title}</span>
          </Link>
        ) : null}
      </nav>
    </>
  );
}

/** The locales the Showcase documents, listed so the promise is checkable. */
export const DOC_LOCALES = Object.entries(LOCALE_LABEL).map(([id, label]) => ({ id, label }));
