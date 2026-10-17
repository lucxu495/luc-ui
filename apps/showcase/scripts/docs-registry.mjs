/**
 * Generate the documentation registry.
 *
 * The problem this solves: a component catalogue is the easiest document in a
 * library to get wrong. A rename, a moved file or a new export, and the docs
 * quietly describe an API that no longer exists. So nothing factual about the
 * public API is written by hand anywhere in the Showcase — this script reads it
 * from the two sources that cannot be wrong:
 *
 *   1. `luc-ui/docs/component-catalog.json`, which is itself generated from
 *      `packages/ui/package.json` and the public barrels and guarded by
 *      `pnpm --filter @luc/ui catalog:check`;
 *   2. the TypeScript program over `packages/ui/src`, used to read the *props*
 *      of each documented component as the compiler sees them, including the
 *      `@default` JSDoc tag.
 *
 * Everything human lives in `lib/docs/taxonomy.ts` (which family a module
 * belongs to, which route it deserves) and `lib/docs/curation/summaries.ts`
 * (one sentence per module). Those are judgement; the API is fact.
 *
 *   node apps/showcase/scripts/docs-registry.mjs           # write
 *   node apps/showcase/scripts/docs-registry.mjs --check   # fail if stale
 *   node apps/showcase/scripts/docs-registry.mjs --report  # summary only
 *
 * `--check` is wired into `pnpm verify` through the Showcase, so a documented
 * import path that stops existing fails the build instead of shipping.
 *
 * Output is deterministic: no timestamps, stable ordering, stable formatting.
 * A generated file that changes on every run would make `--check` useless.
 */

import { execFile } from "node:child_process";
import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const ts = require("typescript");
const run = promisify(execFile);

const here = path.dirname(fileURLToPath(import.meta.url));
const appRoot = path.resolve(here, "..");
const uiRoot = path.resolve(appRoot, "../../packages/ui");
const lucUiRoot = path.resolve(appRoot, "../..");
const catalogPath = path.join(lucUiRoot, "docs/component-catalog.json");
const generatedDir = path.join(appRoot, "lib/docs/generated");
const registryPath = path.join(generatedDir, "registry.ts");
const apiPath = path.join(generatedDir, "api.ts");
const navPath = path.join(generatedDir, "nav.ts");
const redirectsPath = path.join(generatedDir, "redirects.json");
const playgroundsPath = path.join(generatedDir, "playgrounds.ts");
const discoveryPath = path.join(generatedDir, "discovery.ts");

const argv = process.argv.slice(2);
const CHECK = argv.includes("--check");
const REPORT = argv.includes("--report") || CHECK;

/** The engine's display name, for the localized lead's `{engine}` slot. */
function chartEngineName(chart) {
  return chart.engine === "lightweight-charts" ? "Lightweight Charts" : "ECharts";
}

/* ------------------------------------------------------------------ helpers */

/** Transpile a dependency-free `.ts` module and import it, as the chart
 * catalogue check does — one source of truth, never a generated copy. */
async function loadTsModule(relPath) {
  const full = path.join(appRoot, relPath);
  const source = await readFile(full, "utf8");
  const js = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
    fileName: path.basename(full),
  }).outputText;
  /*
   * The temp file name must be unique per *path*, not per basename.
   *
   * Two unrelated modules are both called `taxonomy.ts` — the documentation
   * family table in `lib/docs/` and the discovery vocabularies in
   * `lib/discovery/` — and naming the temp file after the basename made them
   * collide: the second write replaced the first file, and because ESM caches by
   * URL, the second `import` returned the *first* module. The symptom was a bare
   * `Cannot read properties of undefined` three hundred lines later in a map
   * over a table that had silently become the other file's exports.
   */
  const slug = relPath.replace(/[^a-zA-Z0-9]+/g, "-").replace(/^-|-$/g, "");
  const target = path.join(os.tmpdir(), `luc-docs-${process.pid}-${slug}.mjs`);
  await writeFile(target, js, "utf8");
  return import(`file://${target}`);
}

function kebab(value) {
  return value
    .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
    .replace(/[_\s]+/g, "-")
    .toLowerCase();
}

/**
 * A signature is a reference, not an essay.
 *
 * The compiler's own text for a Radix-derived props type can run to thousands
 * of characters, and a page that shows it is unreadable as well as heavy. The
 * table shows the shape; the reader opens the declaration for the rest.
 */
function clip(value, limit) {
  if (typeof value !== "string") return value;
  const flat = value.replace(/\s+/g, " ").trim();
  return flat.length <= limit ? flat : `${flat.slice(0, limit - 1)}…`;
}

/**
 * The compiler's type text, in one spelling.
 *
 * `checker.typeToString` reuses the alias it finds in scope, so the same
 * semantic type prints as `React.ReactNode` or `ReactNode` depending on which
 * declaration the checker happened to start from — and the choice moves when a
 * workspace is relinked, a build creates `dist/`, or a tsconfig lib list
 * changes. `docs:registry:check` compares the generated text byte for byte, so
 * that difference used to fail the gate with a 300-line diff that changed
 * nothing.
 *
 * Only the `React.` namespace prefix is folded, and only on the names that the
 * global JSX namespace also declares; the type is identical either way, and the
 * reader copies a name that resolves. Everything else — Radix types, generic
 * parameters, unions — is left exactly as the compiler printed it.
 */
const FOLDED_REACT_NAMES = [
  "ReactNode",
  "ReactElement",
  "ReactPortal",
  "RefAttributes",
  "RefObject",
  "CSSProperties",
  "ComponentProps",
  "ComponentPropsWithoutRef",
  "ComponentPropsWithRef",
  "KeyboardEvent",
  "MouseEvent",
  "FocusEvent",
  "FormEvent",
  "ChangeEvent",
  "PointerEvent",
];

function stableType(value) {
  if (typeof value !== "string") return value;
  let text = value;
  for (const name of FOLDED_REACT_NAMES) {
    text = text.replaceAll(`React.${name}`, name);
  }
  return text;
}

/** Every `page.tsx` under `app/`, as route paths. */
async function collectPages(dir = path.join(appRoot, "app"), base = "") {
  const found = new Map();
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    if (entry.name.startsWith("_") || entry.name === "node_modules" || entry.name.startsWith("(")) {
      if (entry.isDirectory() && entry.name.startsWith("(")) {
        for (const [route, file] of await collectPages(path.join(dir, entry.name), base)) {
          found.set(route, file);
        }
      }
      continue;
    }
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      const segment = `/${entry.name}`;
      for (const [route, file] of await collectPages(full, `${base}${segment}`)) {
        found.set(route, file);
      }
    } else if (entry.name === "page.tsx" || entry.name === "page.ts") {
      found.set(base === "" ? "/" : base, path.relative(appRoot, full));
    }
  }
  return found;
}

/* ------------------------------------------------------------------ prop extraction */

/**
 * Read a component's props as the compiler sees them.
 *
 * This is the part a hand-written table always gets wrong: an optional prop
 * becomes required, a default drifts, a union loses a member. Resolving the
 * real `.tsx` source through the TypeScript checker means the table is a view
 * of the library, not a transcription of it.
 */
async function extractProps(symbolNames) {
  const entryFiles = [
    path.join(uiRoot, "src/index.ts"),
    path.join(uiRoot, "src/integrations/tradingview/index.ts"),
  ];
  const compilerOptions = {
    jsx: ts.JsxEmit.ReactJSX,
    module: ts.ModuleKind.ESNext,
    moduleResolution: ts.ModuleResolutionKind.Bundler,
    target: ts.ScriptTarget.ES2022,
    strict: true,
    noEmit: true,
    skipLibCheck: true,
    allowJs: false,
    esModuleInterop: true,
    baseUrl: uiRoot,
  };
  /*
   * The output must not depend on the directory this script was started from.
   *
   * It did: `docs:registry:check` runs with the Showcase as its working
   * directory, and a contributor following the suggestion printed by a root
   * run generated a *different* `api.ts` — the same semantic types, printed
   * through a different copy of `@types/react` (`React.HTMLAttributes` versus
   * `HTMLAttributes`), for `propsType` rows only. A gate that fails depending
   * on where a command was typed is a gate people learn to ignore, so the
   * compiler host is pinned to the library root instead.
   */
  const host = ts.createCompilerHost(compilerOptions);
  host.getCurrentDirectory = () => uiRoot;
  const program = ts.createProgram(entryFiles, compilerOptions, host);
  const checker = program.getTypeChecker();
  const wanted = new Set(symbolNames);
  const result = {};

  for (const entry of entryFiles) {
    const source = program.getSourceFile(entry);
    const moduleSymbol = source && checker.getSymbolAtLocation(source);
    if (!moduleSymbol) continue;
    for (const symbol of checker.getExportsOfModule(moduleSymbol)) {
      const name = symbol.getName();
      if (!wanted.has(name) || result[name]) continue;
      try {
        const resolved =
          symbol.flags & ts.SymbolFlags.Alias ? checker.getAliasedSymbol(symbol) : symbol;
        const type = checker.getTypeOfSymbolAtLocation(
          resolved,
          resolved.valueDeclaration ?? resolved.declarations?.[0] ?? source,
        );
        const signature = type.getCallSignatures()[0];
        if (!signature) continue;
        const parameter = signature.getParameters()[0];
        if (!parameter) continue;
        const parameterType = checker.getTypeOfSymbolAtLocation(parameter, parameter.valueDeclaration ?? source);
        const members = [];
        for (const property of checker.getPropertiesOfType(parameterType)) {
          const declaration = property.valueDeclaration ?? property.declarations?.[0];
          if (!declaration) continue;
          /*
           * A DOM element's own attributes are inherited, not documented. Every
           * component that spreads `...props` onto an element picks up a hundred
           * of them (`about`, `accessKey`, `autoCapitalize`, …), which buries the
           * props a reader came for. Declarations from `@types/react` are
           * therefore skipped; a prop from Radix or from LUC is kept and marked
           * as coming from somewhere else.
           */
          const declaredIn = declaration.getSourceFile()?.fileName ?? "";
          if (declaredIn.includes("/@types/react/")) continue;
          const propertyType = checker.getTypeOfSymbolAtLocation(property, declaration);
          const tags = ts.getJSDocTags(declaration);
          const defaultTag = tags.find((tag) => tag.tagName.text === "default");
          const docs = ts.displayPartsToString(property.getDocumentationComment(checker));
          members.push({
            name: property.getName(),
            optional: Boolean(property.flags & ts.SymbolFlags.Optional),
            type: clip(stableType(checker.typeToString(propertyType, declaration)), 90),
            default: defaultTag
              ? clip(ts.displayPartsToString(defaultTag.comment ?? []), 40)
              : undefined,
            description: docs.trim() ? clip(docs, 180) : undefined,
            inherited: !declaredIn.includes("/packages/ui/src/"),
          });
        }
        if (members.length === 0) continue;
        result[name] = {
          propsType: clip(stableType(checker.typeToString(parameterType, parameter.valueDeclaration ?? source)), 140),
          props: members.sort((a, b) => a.name.localeCompare(b.name)).slice(0, 60),
        };
      } catch {
        /* A symbol the checker cannot reduce to props is documented by signature
         * instead; a wrong table would be worse than a missing one. */
      }
    }
  }
  return result;
}

/* ------------------------------------------------------------------ assembly */

async function main() {
  const catalog = JSON.parse(await readFile(catalogPath, "utf8"));
  const taxonomy = await loadTsModule("lib/docs/taxonomy.ts");
  const summaries = await loadTsModule("lib/docs/curation/summaries.ts");
  const playgrounds = await loadTsModule("lib/docs/curation/playgrounds.ts");
  /* The per-entry page notes and related links. Read here only to *validate*
   * them against the registry this script produces — the pages import the same
   * module directly, so the prose is not copied into the generated files. A
   * typo in an id would otherwise render an empty section instead of failing. */
  const notes = await loadTsModule("lib/docs/curation/notes.ts");
  const chartRegistry = await loadTsModule("components/charts/chart-catalog-data.ts");
  /* The page lead, so the generated summary and the rendered header are one
   * sentence from one function. */
  const lead = await loadTsModule("lib/docs/lead.ts");
  /*
   * The discovery layer's three dependency-free modules. Loaded the same way the
   * taxonomy is — transpiled and imported — so the generator and the browser
   * share one definition of a use case, an art direction and an area.
   */
  const discoveryTaxonomy = await loadTsModule("lib/discovery/taxonomy.ts");
  const curation = await loadTsModule("lib/discovery/curation.ts");
  const areas = await loadTsModule("lib/discovery/areas.ts");

  const pages = await collectPages();

  /*
   * Does a page exist for this route?
   *
   * A literal `page.tsx` is the easy half. The other half is a *dynamic* route:
   * `/visuals/elements/[element]/page.tsx` generates
   * `/visuals/elements/waterfall`, and the catalog has to accept it without
   * loosening the check for every other route — a site row that points at a page
   * nobody wrote must still fail here. Only the last segment may be dynamic,
   * which is exactly how the Showcase's `[component]`, `[chart]` and `[motion]`
   * routes are shaped.
   */
  const dynamicPrefixes = new Set(
    [...pages.keys()]
      .filter((route) => /\/\[[^\]]+\]$/.test(route))
      .map((route) => route.replace(/\/\[[^\]]+\]$/, "")),
  );
  const pageExists = (route) =>
    pages.has(route) || dynamicPrefixes.has(route.replace(/\/[^/]+$/, ""));

  /* import path per export name: the most specific subpath that exports it. */
  const subpaths = Object.entries(catalog.entries)
    .filter(([key]) => key !== "." && key !== "./package.json" && !key.endsWith(".css"))
    .sort((a, b) => b[0].length - a[0].length);
  const importPathFor = (exportName) => {
    for (const [key, entry] of subpaths) {
      if (entry.exports?.some((item) => item.name === exportName)) return entry.import;
    }
    return "@luc/ui";
  };
  /* The catalogue entry behind an import path, so an entry's claim can be
   * checked against the path it prints rather than against the whole package. */
  const entryByImport = new Map(
    Object.values(catalog.entries).map((entry) => [entry.import, entry]),
  );
  const rootEntry = catalog.entries["."];
  const exportsBySource = new Map();
  for (const entry of Object.values(catalog.entries)) {
    for (const item of entry.exports ?? []) {
      const list = exportsBySource.get(item.source) ?? [];
      list.push(item);
      exportsBySource.set(item.source, list);
    }
  }
  /**
   * The exports a module key declares.
   *
   * A module key is a file (`components/accordion`) or a barrel
   * (`url-state/index`), and a barrel's symbols are declared in the files
   * beside it. Both shapes resolve here, and a key that resolves to nothing is
   * an error rather than an empty page.
   */
  const exportsForModule = (moduleKey) => {
    const exact = exportsBySource.get(`packages/ui/src/${moduleKey}.tsx`) ??
      exportsBySource.get(`packages/ui/src/${moduleKey}.ts`);
    if (exact) return exact;
    if (moduleKey.endsWith("/index")) {
      const prefix = `packages/ui/src/${moduleKey.slice(0, -"/index".length)}/`;
      return [...exportsBySource.entries()]
        .filter(([source]) => source.startsWith(prefix))
        .flatMap(([, items]) => items);
    }
    return undefined;
  };

  const familySummaries = new Map();
  for (const family of [...taxonomy.COMPONENT_FAMILIES, ...taxonomy.MOTION_FAMILIES]) {
    familySummaries.set(family.id, family.summary);
  }

  /** Build the entries for one family. */
  const buildModules = (family) =>
    family.modules
      .map((moduleKey) => {
        const override = taxonomy.ROUTE_OVERRIDES[moduleKey] ?? {};
        const declared = exportsForModule(moduleKey);
        if (!declared || declared.length === 0) {
          throw new Error(`docs-registry: ${moduleKey} declares no public exports`);
        }
        const values = [
          ...new Set(declared.filter((item) => item.kind === "value").map((item) => item.name)),
        ];
        const base = moduleKey.split("/").pop();
        const id = override.id ?? kebab(base);
        const title =
          override.title ??
          (values.find((name) => /^[A-Z]/.test(name)) ?? base.replace(/(^|-)(\w)/g, (_, __, c) => c.toUpperCase()));
        const route =
          override.route ??
          (family.group === "motion" ? `/motion/${id}` : `/components/${id}`);
        const summary =
          summaries.MODULE_SUMMARIES[moduleKey] ?? summaries.PAGE_SUMMARIES[id] ?? null;
        if (!summary) {
          throw new Error(`docs-registry: ${moduleKey} has no summary in curations/summaries.ts`);
        }
        const pageFile = pages.get(route) ?? null;
        const importName = values.find((name) => name === title) ?? values[0];
        /*
         * A page may only claim the exports its own import line publishes.
         *
         * `exportsForModule` indexes symbols by the file that *declares* them,
         * and a re-export aliases the declared symbol: `charts/chart-card.tsx`
         * says `export { CardFooter as ChartFooter }`, so `ChartFooter` is
         * attributed to `components/card.tsx` — and the Card page then claimed an
         * export that `@luc/ui/components/card` does not publish. That was
         * invisible while the page pointed at the root barrel, which publishes
         * everything; the moment the generator started printing the precise
         * subpath, the claim became false and `docs-registry.test.ts` caught it.
         * The filter is the honest fix — the page documents what a reader gets
         * from the import line printed beside it — and `ChartFooter` keeps its
         * own documentation on the charts entry, which does publish it.
         */
        const importPath = importPathFor(importName);
        const published = new Set(
          (entryByImport.get(importPath)?.exports ?? []).map((item) => item.name),
        );
        const claimed = published.size > 0 ? values.filter((name) => published.has(name)) : values;
        if (claimed.length === 0) {
          throw new Error(
            `docs-registry: ${moduleKey} claims exports that ${importPath} does not publish`,
          );
        }
        const status = override.referenceOnly
          ? "reference"
          : pageFile
            ? "curated"
            : "generated";
        if (!override.referenceOnly && override.route && !pageFile) {
          throw new Error(`docs-registry: ${moduleKey} points at ${route}, which has no page.tsx`);
        }
        return {
          id,
          title,
          family: family.id,
          group: family.group,
          importPath,
          exports: claimed,
          summary,
          route,
          status,
          ...(playgrounds.ENTRY_PLAYGROUNDS[id]
            ? { playground: playgrounds.ENTRY_PLAYGROUNDS[id] }
            : {}),
          /*
           * "Related" is a recommendation, not a family list.
           *
           * Left to the footer, the row fell back to the first four siblings in
           * reading order, which is the sidebar with worse ordering. When the
           * curation names the neighbours, the page says what it means; when it
           * does not, the footer still has an honest fallback. Validated below.
           */
          ...(notes.RELATED_ENTRIES?.[id]?.length
            ? { related: [...notes.RELATED_ENTRIES[id]] }
            : {}),
          ...(pageFile ? { pageFile } : {}),
        };
      })
      ;

  /*
   * Two views of one family: the rows, and the rows an index may list.
   *
   * A *reference* module — `app-shell/sidebar`, `app-shell/breadcrumbs`,
   * `app-shell/page-header` — is documented on the page that composes it rather
   * than on a page of its own. It therefore has to stay in `entries`, because
   * that is what `entryById` and `apiFor` resolve against: without it,
   * `SidebarItem`'s props are published by the package and appear in no table
   * anywhere on the site, which is exactly the gap the Navigation review found.
   *
   * What such a row may *not* do is become a row of its own: three extra index
   * entries pointing at `/application/navigation`, and three extra stops in the
   * previous/next walk that lead to the page the reader is already on. So the
   * listed ids are computed separately, and that is the list the sidebar, the
   * family page and the pager read.
   */
  const listedIds = (rows) =>
    rows
      .filter(
        (entry) =>
          entry.status !== "reference" ||
          !rows.some(
            (other) =>
              other.id !== entry.id && other.route === entry.route && other.status !== "reference",
          ),
      )
      .map((entry) => entry.id);

  const componentFamilies = taxonomy.COMPONENT_FAMILIES.map((family) => ({
    id: family.id,
    title: family.title,
    summary: family.summary,
    group: family.group,
    landing: null,
    entries: listedIds(buildModules(family)),
  }));
  const componentEntries = taxonomy.COMPONENT_FAMILIES.flatMap(buildModules);

  const motionFamilies = taxonomy.MOTION_FAMILIES.map((family) => ({
    id: family.id,
    title: family.title,
    summary: family.summary,
    group: family.group,
    landing: family.id === "motion-feedback" ? "/motion" : null,
    entries: listedIds(buildModules(family)),
  }));
  const motionEntries = taxonomy.MOTION_FAMILIES.flatMap(buildModules);

  /* Charts: one page per public chart, nested by the verified chart family. */
  const chartEntries = [];
  /*
   * A symbol may be listed by two families (the chart registry deliberately
   * files `LineChart` under General and under Time series, because both are true
   * from a reader's point of view), and one row is a composition with no symbol
   * of its own. A symbol gets exactly one page; the second family links to it.
   */
  const chartIdBySymbol = new Map();
  const chartFamilies = chartRegistry.chartGroups.map((group) => {
    const landing = taxonomy.CHART_GROUP_LANDING[group.id] ?? "/charts";
    const ids = [];
    for (const chart of group.entries) {
      if (chart.status !== "public") continue;
      const symbol = chart.symbol.split("·")[0].trim();
      if (!/^[A-Za-z][A-Za-z0-9]*$/.test(symbol)) continue;
      const id = kebab(symbol);
      const existing = chartIdBySymbol.get(symbol);
      if (existing) {
        ids.push(existing);
        continue;
      }
      chartIdBySymbol.set(symbol, id);
      /*
       * The route is flat — `/charts/line-chart` — while the *family* stays the
       * chart registry's own grouping. A nested URL would put a dynamic segment
       * beside the twenty-seven existing topic directories (`/charts/financial`
       * and friends), which is exactly the ambiguity that produces a 404 nobody
       * can explain. Flat is unambiguous, and the generator verifies that no
       * chart id collides with an existing page.
       */
      const route = `/charts/${id}`;
      const pageFile = pages.get(route) ?? null;
      const declared = [...exportsBySource.values()]
        .flat()
        .filter((item) => item.name === symbol);
      ids.push(id);
      chartEntries.push({
        id,
        title: symbol,
        family: `chart-${group.id}`,
        group: "charts",
        importPath: importPathFor(symbol),
        exports: declared.length ? [symbol] : [symbol],
        summary:
          summaries.CHART_SUMMARIES?.[chart.id] ??
          /*
           * The lead sentence says what the reader gets, not which class they
           * are looking at.
           *
           * It used to open with the symbol name ("LineChart draws line on the
           * ECharts engine…"), which is a sentence about the implementation, and
           * the engine — the least interesting fact on the page — came before
           * anything the reader could use. `UX-002` asks every summary to start
           * from the job and to keep the engine fact secondary, so the contract
           * ("the values arrive prepared") leads and the renderer follows it.
           * The phrase "computes no statistic" is also what the behaviour suite
           * asserts on chart pages, so it has to survive the rewrite.
           */
          /*
           * The chart lead, from `lib/docs/lead.ts` — transpiled and called, so
           * the registry row, the page header, the search result and the AI
           * prompt are one string from one function, and a copy edit cannot
           * leave the page describing a chart differently from the index that
           * lists it. DOC-003 replaced the implementation-first template
           * ("Draws line with the ECharts engine …") with one sentence per chart
           * family about what the reader does with it; the engine and the
           * "the caller prepares the values" contract moved to the Usage copy.
           */
          lead.chartLeadTemplate(`chart-${group.id}`),
        /*
         * The chart's own display name, so a localized page can build the lead
         * sentence from one translated template instead of one dictionary entry
         * per chart: the sentence is identical apart from this noun, and its
         * translation already exists in the dictionary ("Line" → "折线").
         */
        chartName: chart.name,
        chartEngine: chartEngineName(chart),
        route,
        status: pageFile ? "curated" : "generated",
        ...(playgrounds.ENTRY_PLAYGROUNDS[id]
          ? { playground: playgrounds.ENTRY_PLAYGROUNDS[id] }
          : {}),
        ...(pageFile ? { pageFile } : {}),
      });
    }
    return {
      id: `chart-${group.id}`,
      title: group.title,
      summary: group.description,
      group: "charts",
      landing,
      entries: ids,
    };
  });

  const integrationEntries = taxonomy.INTEGRATION_PAGES.map((page) => {
    const declared = page.modules.flatMap(
      (moduleKey) =>
        exportsBySource.get(`packages/ui/src/${moduleKey}.ts`) ??
        exportsBySource.get(`packages/ui/src/${moduleKey}.tsx`) ??
        [],
    );
    const pageFile = pages.get(page.route) ?? null;
    return {
      id: page.id,
      title: page.title,
      family: "tradingview",
      group: "integrations",
      importPath: "@luc/ui/tradingview",
      exports: declared.filter((item) => item.kind === "value").map((item) => item.name),
      summary: page.summary,
      route: page.route,
      status: pageFile ? "curated" : "generated",
      ...(pageFile ? { pageFile } : {}),
    };
  });

  const entries = [...componentEntries, ...motionEntries, ...chartEntries, ...integrationEntries];

  const seen = new Set();
  for (const entry of entries) {
    if (seen.has(entry.id)) throw new Error(`docs-registry: duplicate id "${entry.id}"`);
    seen.add(entry.id);
  }

  const families = [
    ...componentFamilies,
    ...chartFamilies,
    ...motionFamilies,
    {
      id: "tradingview",
      title: "TradingView",
      summary:
        "The provider widget catalogue, one page per widget family, with the loader boundary documented.",
      group: "integrations",
      landing: "/integrations/tradingview",
      entries: integrationEntries.map((entry) => entry.id),
    },
  ];

  const registry = {
    generatedFrom: [
      "luc-ui/docs/component-catalog.json",
      "packages/ui/src (TypeScript program)",
      "apps/showcase/lib/docs/taxonomy.ts",
      "apps/showcase/lib/docs/curation/summaries.ts",
      "apps/showcase/components/charts/chart-catalog-data.ts",
      "apps/showcase/app/**/page.tsx",
    ],
    groups: taxonomy.DOC_GROUPS.map((id) => ({
      id,
      ...taxonomy.GROUP_META[id],
    })),
    families,
    entries: entries.sort((a, b) => a.id.localeCompare(b.id)),
  };

  /* Props are the slow part; only extract them for entries that are rendered. */
  const componentNames = registry.entries
    .flatMap((entry) => entry.exports)
    .filter((name) => /^[A-Z]/.test(name));
  const props = await extractProps(componentNames);

  const api = {};
  for (const entry of registry.entries) {
    api[entry.id] = entry.exports.map((name) => {
      const item = [...exportsBySource.values()].flat().find((candidate) => candidate.name === name);
      return {
        name,
        kind: item?.kind ?? "value",
        signature: clip(item?.signature ?? "", 200),
        ...(props[name] ? { propsType: props[name].propsType, props: props[name].props } : {}),
      };
    });
  }

  /*
   * Generated as TypeScript, not JSON.
   *
   * A JSON import would need a cast to become typed, and a cast is exactly the
   * thing that lets a generator bug reach production silently. With
   * `as const satisfies` the compiler checks every generated row against the
   * hand-written types: an unknown status, a missing field or a typo in a group
   * id fails `pnpm typecheck` with the generated file as the evidence.
   */
  const header = (what) =>
    `/*\n * GENERATED by \`node apps/showcase/scripts/docs-registry.mjs\` — do not edit.\n` +
    ` * ${what}\n * Run \`pnpm --filter @luc/showcase docs:registry\` after changing the\n` +
    ` * library, the taxonomy or the curation data; \`docs:registry:check\` fails CI\n` +
    ` * when this file is stale.\n */\n\n`;

  const registryTs =
    header("The documentation registry: one row per documented page.") +
    `import type { DocEntry, DocFamily, DocGroupMeta } from "../types";\n\n` +
    `export const generatedGroups = ${JSON.stringify(registry.groups, null, 2)} as const satisfies readonly DocGroupMeta[];\n\n` +
    `export const generatedFamilies = ${JSON.stringify(registry.families, null, 2)} as const satisfies readonly DocFamily[];\n\n` +
    `export const generatedEntries = ${JSON.stringify(registry.entries, null, 2)} as const satisfies readonly DocEntry[];\n\n` +
    `export const generatedFrom = ${JSON.stringify(registry.generatedFrom, null, 2)} as const;\n`;

  const apiTs =
    header("Public API facts: exports, compiler signatures and prop tables.") +
    `import type { ApiSymbol } from "../api-types";\n\n` +
    `export const generatedApi: Record<string, readonly ApiSymbol[]> = ${JSON.stringify(api, null, 1)} as const satisfies Record<string, readonly ApiSymbol[]>;\n`;

  /* The client-safe projection: what a sidebar row needs and nothing else. */
  /*
   * `s` is the entry's coverage status. The sidebar needs it: a `reference`
   * entry is documented *on* another page, so giving it its own navigation row
   * would both duplicate a link and imply a page that does not exist.
   */
  const navRows = registry.entries.map((entry) => ({
    id: entry.id,
    t: entry.title,
    r: entry.route,
    f: entry.family,
    g: entry.group,
    s: entry.status,
  }));
  const navTs =
    header("The navigation projection: ids, titles, routes and families only.") +
    `import type { NavRow } from "../api-types";\n\n` +
    `export const generatedNav: readonly NavRow[] = ${JSON.stringify(navRows, null, 1)} as const satisfies readonly NavRow[];\n`;

  /*
   * The Playground projection.
   *
   * A *handwritten* page that wants a Playground used to be a server component
   * by necessity: `PlaygroundSection` resolved its entry from `registry.ts`,
   * which imports the 700 KB API tables, so a client page that mounted it put
   * `next/headers` in the browser graph and the build failed. Four curated pages
   * — `/components/inputs`, `/components/cards`, `/components/ai`,
   * `/motion/kinetic` — declared a Playground in the registry and could not
   * render one, which is the exact shape of claim this phase is meant to stop
   * making.
   *
   * This module is the projection that fixes it: the entries that declare a
   * Playground, with the fields the panel actually reads. Generated, so it
   * cannot drift from the registry, and small enough to ship to the browser.
   */
  const playgroundRows = registry.entries
    .filter((entry) => typeof entry.playground === "string")
    .map((entry) => ({
      id: entry.id,
      title: entry.title,
      route: entry.route,
      importPath: entry.importPath,
      summary: entry.summary,
      exports: entry.exports,
      playground: entry.playground,
    }));
  const playgroundsTs =
    header("The Playground projection: the entries that declare a control panel.") +
    `import type { PlaygroundRow } from "../api-types";\n\n` +
    `export const generatedPlaygrounds: readonly PlaygroundRow[] = ${JSON.stringify(playgroundRows, null, 1)} as const satisfies readonly PlaygroundRow[];\n`;

  /* --------------------------------------------------------------- discovery */
  /*
   * The discovery projection: one flat, typed index of everything a reader can
   * reach, with the metadata a *search* needs rather than the metadata a
   * *sidebar* needs.
   *
   * It merges three sources that already exist — the registry (id, title, route,
   * family, status), the curated tags (`lib/discovery/curation.ts`) and the site
   * pages that are not components at all (studios, blocks, experiences, guides,
   * visual studies) — and it validates every curated id against the registry and
   * every site route against the file system. A typo in an art-direction id or a
   * site page that does not exist therefore fails *this script*, which is wired
   * into `pnpm verify`, rather than producing a category with nothing in it.
   */
  const useCaseCodeToId = new Map(
    discoveryTaxonomy.USE_CASES.map((useCase) => [useCase.code, useCase.id]),
  );
  const artDirectionCodeToId = new Map(
    discoveryTaxonomy.ART_DIRECTIONS.map((direction) => [direction.code, direction.id]),
  );
  const useCaseIds = new Set(discoveryTaxonomy.USE_CASES.map((useCase) => useCase.id));
  const artDirectionIds = new Set(discoveryTaxonomy.ART_DIRECTIONS.map((direction) => direction.id));
  const kinds = new Set(discoveryTaxonomy.DISCOVERY_KINDS.map((kind) => kind.id));

  const requireUseCases = (ids, where) => {
    for (const id of ids ?? []) {
      if (!useCaseIds.has(id)) throw new Error(`docs-registry: ${where} names unknown use case "${id}"`);
    }
    return ids ?? [];
  };
  const requireArtDirections = (ids, where) => {
    for (const id of ids ?? []) {
      if (!artDirectionIds.has(id)) {
        throw new Error(`docs-registry: ${where} names unknown art direction "${id}"`);
      }
    }
    return ids ?? [];
  };
  const encodeUseCases = (ids) =>
    ids
      .map((id) => discoveryTaxonomy.USE_CASES.find((useCase) => useCase.id === id).code)
      .join(",");
  const encodeArtDirections = (ids) =>
    ids
      .map((id) => discoveryTaxonomy.ART_DIRECTIONS.find((direction) => direction.id === id).code)
      .join(",");

  const familyMetaKeys = new Set(Object.keys(curation.FAMILY_META));
  const knownFamilies = new Set(registry.families.map((family) => family.id));
  for (const family of familyMetaKeys) {
    if (!knownFamilies.has(family)) {
      throw new Error(`docs-registry: curation FAMILY_META has unknown family "${family}"`);
    }
  }
  const entryIds = new Set(registry.entries.map((entry) => entry.id));
  /*
   * The per-entry notes and the related rows are keyed by the registry's own
   * ids, so a typo has to fail here. Both maps are otherwise invisible to this
   * script — the pages import them directly — which is exactly why they are
   * checked against the ids this script just decided on.
   */
  for (const id of Object.keys(notes.ENTRY_NOTES ?? {})) {
    if (!entryIds.has(id)) {
      throw new Error(`docs-registry: curation notes.ts has an unknown entry id "${id}"`);
    }
  }
  const familyById = new Map(registry.entries.map((entry) => [entry.id, entry.family]));
  for (const [id, related] of Object.entries(notes.RELATED_ENTRIES ?? {})) {
    if (!entryIds.has(id)) {
      throw new Error(`docs-registry: RELATED_ENTRIES has an unknown entry id "${id}"`);
    }
    for (const target of related) {
      if (!entryIds.has(target)) {
        throw new Error(`docs-registry: RELATED_ENTRIES["${id}"] names unknown entry "${target}"`);
      }
      if (target === id) {
        throw new Error(`docs-registry: RELATED_ENTRIES["${id}"] lists itself`);
      }
      /* A "related" link that leaves the family is a claim about the library
       * rather than about this page; the sidebar already carries the catalogue. */
      if (familyById.get(target) !== familyById.get(id)) {
        throw new Error(
          `docs-registry: RELATED_ENTRIES["${id}"] names "${target}" from another family`,
        );
      }
    }
  }
  for (const [id, meta] of Object.entries(curation.ENTRY_META)) {
    if (!entryIds.has(id)) {
      throw new Error(`docs-registry: curation ENTRY_META has unknown entry id "${id}"`);
    }
    requireUseCases(meta.useCases, `ENTRY_META["${id}"]`);
    requireArtDirections(meta.artDirections, `ENTRY_META["${id}"]`);
  }

  /*
   * Documentation group → discovery kind. Integrations are components too — the
   * TradingView surfaces are React components with props, a loader boundary and
   * a theme contract — so they are catalogued as components and distinguished by
   * their `provider` tag instead of by a kind of their own.
   */
  const kindForGroup = {
    components: "component",
    charts: "chart",
    motion: "motion",
    integrations: "component",
  };
  const discoveryRows = registry.entries
    .filter((entry) => entry.status !== "reference")
    .map((entry) => {
      const family = curation.FAMILY_META[entry.family];
      const meta = curation.ENTRY_META[entry.id] ?? {};
      const kind = kindForGroup[entry.group];
      if (!kind) throw new Error(`docs-registry: no discovery kind for group "${entry.group}"`);
      const useCases = requireUseCases(
        [...new Set([...(family?.useCases ?? []), ...(meta.useCases ?? [])])],
        `entry "${entry.id}"`,
      );
      const artDirections = requireArtDirections(
        [...new Set([...(family?.artDirections ?? []), ...(meta.artDirections ?? [])])],
        `entry "${entry.id}"`,
      );
      const tags = [...new Set([...(family?.tags ?? []), ...(meta.tags ?? [])])];
      return {
        i: entry.id,
        t: entry.title,
        r: entry.route,
        k: kind,
        a: areas.areaForRoute(entry.route).id,
        f: entry.family,
        s: "public",
        ...(meta.aliases?.length ? { x: meta.aliases.join("|") } : {}),
        ...(useCases.length ? { u: encodeUseCases(useCases) } : {}),
        ...(artDirections.length ? { d: encodeArtDirections(artDirections) } : {}),
        ...(tags.length ? { g: tags.join("|") } : {}),
        ...(meta.featured ? { p: 1 } : {}),
      };
    });

  /*
   * The site pages, minus the ones the registry already owns.
   *
   * A duplicated route would be the same document listed twice in one search
   * result list, so the registry wins and the duplicate is dropped — and the
   * number of drops is printed, because a site section that has become entirely
   * redundant is worth noticing.
   */
  const claimedRoutes = new Set(discoveryRows.map((row) => row.r));
  /*
   * One page, one row.
   *
   * Two documented symbols may share a page on purpose: `/components/menus`
   * documents both `DropdownMenu` and `ContextMenu`, and `/components/file-upload`
   * documents both `FileInput` and `FileUpload`. The navigation projection already
   * collapses those (the second occurrence of a route gets no sidebar row), and the
   * catalog has to do the same — otherwise one search returns the same document
   * twice, and a reader clicking the second copy lands on a page whose title is the
   * other component's name.
   *
   * The rows are *merged* rather than dropped: aliases, tags, use cases and art
   * directions are unioned into the surviving row, so nothing a curator wrote is
   * lost and nothing has to be written twice.
   */
  const rowByRoute = new Map();
  const mergeRows = (target, extra) => {
    const union = (left, right) => {
      if (!left) return right;
      if (!right) return left;
      return [...new Set([...left.split("|"), ...right.split("|")])].join("|");
    };
    const unionCodes = (left, right) => {
      if (!left) return right;
      if (!right) return left;
      return [...new Set([...left.split(","), ...right.split(",")])].join(",");
    };
    if (extra.x) target.x = union(target.x, extra.x);
    if (extra.g) target.g = union(target.g, extra.g);
    if (extra.u) target.u = unionCodes(target.u, extra.u);
    if (extra.d) target.d = unionCodes(target.d, extra.d);
    if (extra.p) target.p = 1;
  };
  const dedupedRows = [];
  let mergedRows = 0;
  for (const row of discoveryRows) {
    const existing = rowByRoute.get(row.r);
    if (existing) {
      mergeRows(existing, row);
      mergedRows += 1;
      continue;
    }
    rowByRoute.set(row.r, row);
    dedupedRows.push(row);
  }
  let skippedSitePages = 0;
  const siteRows = [];
  for (const section of curation.SITE_SECTIONS) {
    if (!kinds.has(section.kind)) {
      throw new Error(`docs-registry: site section uses unknown kind "${section.kind}"`);
    }
    const sectionUseCases = requireUseCases(section.useCases, `site section ${section.kind}`);
    const sectionArtDirections = requireArtDirections(
      section.artDirections,
      `site section ${section.kind}`,
    );
    for (const page of section.pages) {
      const [route, title, aliases] = page;
      if (!pageExists(route)) {
        throw new Error(`docs-registry: site page "${route}" has no page.tsx`);
      }
      if (claimedRoutes.has(route)) {
        skippedSitePages += 1;
        continue;
      }
      claimedRoutes.add(route);
      siteRows.push({
        i: `site-${route.replace(/^\/+/, "").replace(/[^a-z0-9]+/gi, "-")}`,
        t: title,
        r: route,
        k: section.kind,
        a: areas.areaForRoute(route).id,
        /* Every catalogued Visuals row is a real page: the design studies that
         * used to be the one exception were retired with their pages. */
        s: "public",
        ...(aliases?.length ? { x: aliases.join("|") } : {}),
        ...(sectionUseCases.length ? { u: encodeUseCases(sectionUseCases) } : {}),
        ...(sectionArtDirections.length ? { d: encodeArtDirections(sectionArtDirections) } : {}),
        ...(section.tags.length ? { g: section.tags.join("|") } : {}),
      });
    }
  }

  /*
   * The six Phase 10A art-direction study pages were retired: they are not
   * public capabilities, and the current catalogue's pages are the Visuals
   * element catalog and the reference. Their `study-*` rows are gone with them.
   */
  const discovery = [...dedupedRows, ...siteRows].sort((a, b) =>
    a.i.localeCompare(b.i),
  );
  /*
   * Emitted on one line, unlike the other projections.
   *
   * Every page of the Showcase downloads this array for the header search, so the
   * indentation that makes `nav.ts` pleasant to read would cost about a fifth of
   * the payload for a file nobody reads by hand. `--report` prints the shape
   * instead, which is what a reviewer actually needs.
   */
  const discoveryTs =
    header("The discovery projection: one flat index for search, browse and the galleries.") +
    /* `generated/` is two levels under `lib/`, so the row type comes from the
     * discovery module rather than from `../api-types` — the same direction the
     * file itself is generated in. */
    `import type { DiscoveryRow } from "../../discovery/types";\n\n` +
    `export const generatedDiscovery: readonly DiscoveryRow[] = ${JSON.stringify(discovery)} as const satisfies readonly DiscoveryRow[];\n`;

  /*
   * Redirects, as data `next.config.ts` can read.
   *
   * A component whose canonical page already exists at a different path — the
   * Showcase documented `/components/buttons` long before it had a registry —
   * must not 404 at its id URL, and must not be duplicated either. The redirect
   * is derived from the same rows the sidebar uses, so a new exception cannot be
   * forgotten.
   */
  const redirects = registry.entries
    .filter((entry) => entry.status !== "reference")
    .flatMap((entry) => {
      const idUrl =
        entry.group === "components"
          ? `/components/${entry.id}`
          : entry.group === "motion"
            ? `/motion/${entry.id}`
            : null;
      return idUrl && idUrl !== entry.route
        ? [{ source: idUrl, destination: entry.route, permanent: true }]
        : [];
    })
    .sort((a, b) => a.source.localeCompare(b.source));
  const redirectsJson = `${JSON.stringify(redirects, null, 2)}\n`;

  if (REPORT) {
    const byGroup = {};
    for (const entry of registry.entries) byGroup[entry.group] = (byGroup[entry.group] ?? 0) + 1;
    const byStatus = {};
    for (const entry of registry.entries) byStatus[entry.status] = (byStatus[entry.status] ?? 0) + 1;
    const withProps = Object.values(api)
      .flat()
      .filter((item) => item.props).length;
    console.log(`  families            : ${registry.families.length}`);
    console.log(`  documented entries  : ${registry.entries.length}`);
    console.log(`  by group            : ${JSON.stringify(byGroup)}`);
    console.log(`  by status           : ${JSON.stringify(byStatus)}`);
    console.log(`  symbols with props  : ${withProps}`);
    console.log(`  alias redirects     : ${redirects.length}`);
    console.log(
        `  discovery rows      : ${discovery.length} (${dedupedRows.length} registry + ${siteRows.length} site; ` +
        `${skippedSitePages} site page(s) already owned by the registry, ` +
        `${mergedRows} registry row(s) merged into a page that already had one)`,
    );
    const featured = discovery.filter((row) => row.p).length;
    console.log(`  featured entries    : ${featured}`);
  }

  await mkdir(generatedDir, { recursive: true });

  if (CHECK) {
    const [
      currentRegistry,
      currentApi,
      currentNav,
      currentRedirects,
      currentPlaygrounds,
      currentDiscovery,
    ] = await Promise.all([
      readFile(registryPath, "utf8").catch(() => null),
      readFile(apiPath, "utf8").catch(() => null),
      readFile(navPath, "utf8").catch(() => null),
      readFile(redirectsPath, "utf8").catch(() => null),
      readFile(playgroundsPath, "utf8").catch(() => null),
      readFile(discoveryPath, "utf8").catch(() => null),
    ]);
    const problems = [];
    if (currentRegistry !== registryTs) problems.push("lib/docs/generated/registry.ts");
    if (currentApi !== apiTs) problems.push("lib/docs/generated/api.ts");
    if (currentNav !== navTs) problems.push("lib/docs/generated/nav.ts");
    if (currentRedirects !== redirectsJson) problems.push("lib/docs/generated/redirects.json");
    if (currentPlaygrounds !== playgroundsTs) problems.push("lib/docs/generated/playgrounds.ts");
    if (currentDiscovery !== discoveryTs) problems.push("lib/docs/generated/discovery.ts");
    if (problems.length) {
      console.error("docs-registry: generated files are stale:");
      for (const problem of problems) console.error(`  - ${problem}`);
      console.error("Run: node apps/showcase/scripts/docs-registry.mjs");
      process.exit(1);
    }
    console.log("docs-registry: up to date");
    return;
  }

  await writeFile(registryPath, registryTs, "utf8");
  await writeFile(apiPath, apiTs, "utf8");
  await writeFile(navPath, navTs, "utf8");
  await writeFile(redirectsPath, redirectsJson, "utf8");
  await writeFile(playgroundsPath, playgroundsTs, "utf8");
  await writeFile(discoveryPath, discoveryTs, "utf8");
  console.log(`docs-registry: wrote ${registry.entries.length} entries`);
}

main().catch((error) => {
  console.error(error.message ?? error);
  process.exit(1);
});
