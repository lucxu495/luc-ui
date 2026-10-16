/**
 * Wrap every translatable sentence in the Showcase with `tcs(...)`.
 *
 * The English sentence stays exactly where it was written; the wrapper asks the
 * dictionary for a Chinese rendering and falls back to the English one. That
 * gives a Chinese reader real copy and an English reader a page that is
 * byte-identical to before — which is the property that makes this transformation
 * safe to apply to a hundred existing pages at once.
 *
 *   node apps/showcase/scripts/i18n-codemod.mjs            # dry run
 *   node apps/showcase/scripts/i18n-codemod.mjs --write    # apply
 *
 * A client page gets `useI18n()`; a server page (one that needs its `metadata`
 * export) gets `await getServerCopy()` and stays on the server. Anything the
 * transform cannot do mechanically — a sentence inside a non-component helper —
 * is reported instead of being guessed at.
 */

import { readFile, writeFile, readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
import { extractProse } from "./i18n-prose.mjs";

const require = createRequire(import.meta.url);
const ts = require("typescript");

const here = path.dirname(fileURLToPath(import.meta.url));
const appRoot = path.resolve(here, "..");
const write = process.argv.includes("--write");
const only = (process.argv.find((arg) => arg.startsWith("--only=")) ?? "").slice("--only=".length);

async function collect(dir, out = []) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    if (entry.name.startsWith(".") || entry.name === "node_modules") continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) await collect(full, out);
    else if (/\.tsx$/.test(entry.name)) out.push(full);
  }
  return out;
}

function quote(text) {
  return `"${text.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
}

/**
 * Where the Showcase's imports end.
 *
 * A regex over import lines looks like it works until a page imports a long
 * symbol list across several lines — then the new import lands inside that
 * statement. The AST already knows where the last import finishes.
 */
function importAnchor(sf) {
  let end = 0;
  for (const statement of sf.statements) {
    if (ts.isImportDeclaration(statement)) end = Math.max(end, statement.getEnd());
    else if (ts.isExpressionStatement(statement) && ts.isStringLiteral(statement.expression)) continue;
    else break;
  }
  return end;
}

/** Edits that put exactly one dictionary import at the end of the import block. */
function importEdits(sf, source, isClient) {
  const edits = [];
  const binding = isClient ? "useI18n" : "getServerCopy";
  const wanted = `import { ${binding} } from "${isClient ? "@/lib/i18n/provider" : "@/lib/i18n/server"}";`;
  const specifier = isClient ? '"@/lib/i18n/provider"' : '"@/lib/i18n/server"';
  const imports = sf.statements.filter((statement) => ts.isImportDeclaration(statement));
  const drop = (statement) => {
    let end = statement.getEnd();
    if (source[end] === "\n") end += 1;
    edits.push({ start: statement.getStart(sf), end, text: "" });
  };
  /*
   * Only a statement whose module specifier matches *exactly* is ever touched —
   * `@/lib/i18n/server` also exports `getLocale`, and a substring match once
   * moved that import and broke the layout.
   */
  const existing = imports.find(
    (statement) =>
      statement.moduleSpecifier.getText(sf) === specifier &&
      ts.isNamedImports(statement.importClause?.namedBindings ?? undefined) &&
      statement.importClause.namedBindings.elements.some((element) => element.name.getText(sf) === binding),
  );
  const anchor = importAnchor(sf);
  if (existing && existing.getEnd() !== anchor) {
    drop(existing);
    edits.push({ start: anchor, end: anchor, text: `\n${wanted}\n` });
  } else if (!existing) {
    edits.push({ start: anchor, end: anchor, text: `\n${wanted}` });
  }
  return edits;
}

const problems = [];
const summary = [];
const moduleProse = [];

for (const file of await collect(path.join(appRoot, "app"))) {
  const relative = path.relative(appRoot, file);
  if (only && !relative.includes(only)) continue;
  const source = await readFile(file, "utf8");
  const items = extractProse(ts, source, file).filter(
    (item) => item.kind === "attr" || item.kind === "text" || item.kind === "data",
  );
  const sf = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const isClient = /^\s*("use client"|'use client')/.test(source);

  if (items.length === 0) {
    // Nothing left to translate, but an import may still be sitting inside a
    // multi-line import statement from an earlier run. Only a file that really
    // uses the helper is touched at all.
    if (!/\btcs\(/.test(source)) continue;
    const repairs = importEdits(sf, source, isClient);
    if (repairs.length > 0 && write) {
      let repaired = source;
      for (const edit of repairs.sort((a, b) => b.start - a.start)) {
        repaired = repaired.slice(0, edit.start) + edit.text + repaired.slice(edit.end);
      }
      await writeFile(file, repaired, "utf8");
      summary.push(`${relative}: import placement repaired`);
    }
    continue;
  }

  const byStart = new Map(items.map((item) => [item.start, item]));
  /** Every item's ancestor chain, outermost first, so an owner can be chosen. */
  const owners = new Map();
  const seen = new Set();

  const visit = (node, fnStack) => {
    const start = node.getStart(sf);
    if (byStart.has(start)) {
      const item = byStart.get(start);
      if (seen.has(start)) {
        problems.push(`${relative}: two nodes start at ${start}`);
      } else {
        seen.add(start);
        owners.set(start, fnStack);
      }
    }
    const isFn =
      ts.isFunctionDeclaration(node) ||
      ts.isFunctionExpression(node) ||
      ts.isArrowFunction(node) ||
      ts.isMethodDeclaration(node);
    const nextStack = isFn ? [...fnStack, node] : fnStack;
    ts.forEachChild(node, (child) => visit(child, nextStack));
  };
  visit(sf, []);

  if (seen.size !== items.length) {
    const missed = items.filter((item) => !seen.has(item.start));
    for (const item of missed) {
      problems.push(`${relative}: extraction the AST walk did not reach — ${JSON.stringify(item.text.slice(0, 60))}`);
    }
  }

  /* ---- validate that every owner can receive the helper ------------------ */

  /**
   * May this function legally call a hook, and can a statement be inserted?
   *
   * React's rules of hooks allow a component or a custom hook — never a callback
   * handed to `.map()`. So a function is only ever chosen as the injection point
   * when it is a named, capitalised declaration or an expression assigned to a
   * capitalised variable, and never when it is an argument of a call.
   */
  const hookSafe = (fn) => {
    if (!fn.body || !ts.isBlock(fn.body)) return false;
    const parent = fn.parent;
    if (ts.isCallExpression(parent) || ts.isNewExpression(parent) || ts.isArrayLiteralExpression(parent)) {
      return false;
    }
    let name = fn.name?.getText(sf) ?? "";
    if (!name && parent && ts.isVariableDeclaration(parent) && ts.isIdentifier(parent.name)) {
      name = parent.name.text;
    }
    if (!name) return false;
    return /^[A-Z]/.test(name);
  };

  const injections = [];
  /** Items whose sentence can be wrapped where it stands (a hook is in scope). */
  const wrapStarts = new Set();
  for (const [start, stack] of owners) {
    const item = byStart.get(start);
    /*
     * Prefer the innermost function, but fall back outwards: a `tcs` defined in
     * the page component is in scope inside a `.map()` arrow, so a concise-body
     * arrow never has to be rewritten — it just borrows the outer helper. That
     * also avoids the trap of `render={async (x) => …}` handing React a promise.
     */
    let owner = null;
    for (let index = stack.length - 1; index >= 0; index -= 1) {
      const fn = stack[index];
      if (hookSafe(fn)) {
        owner = fn;
        break;
      }
    }
    if (!owner) {
      /*
       * A module-level constant has nowhere to call a hook from. Its prose is
       * looked up at the render site (`{tcs(item.body)}`) instead, which the
       * live Chinese check verifies — so this is a note, not a failure.
       */
      if (item.kind === "data") {
        moduleProse.push(`${relative}: ${JSON.stringify(item.text.slice(0, 60))}`);
        continue;
      }
      problems.push(`${relative}: sentence outside any component — ${JSON.stringify(item.text.slice(0, 60))}`);
      continue;
    }
    injections.push(owner);
    wrapStarts.add(start);
  }

  /* ---- build the edits --------------------------------------------------- */

  const edits = [];
  for (const item of items) {
    const raw = source.slice(item.start, item.end);
    if (item.kind === "attr") {
      // `description="…"` → `description={tcs("…")}`
      edits.push({ start: item.start, end: item.end, text: `{tcs(${quote(item.text)})}` });
      continue;
    }
    if (item.kind === "data") {
      // A module-scope constant has no hook in scope; the render site looks the
      // sentence up instead, and the live Chinese check holds that to account.
      if (!wrapStarts.has(item.start)) continue;
      // Inside an object literal the call stands on its own — no braces.
      edits.push({ start: item.start, end: item.end, text: `tcs(${quote(item.text)})` });
      continue;
    }
    // A JSX text node: React trims a node that spans lines, and preserves the
    // spaces of one that does not — so only a single-line node needs them back.
    const singleLine = !raw.includes("\n");
    const leading = singleLine && /^\s/.test(raw) ? '{" "}' : "";
    const trailing = singleLine && /\s$/.test(raw) ? '{" "}' : "";
    edits.push({ start: item.start, end: item.end, text: `${leading}{tcs(${quote(item.text)})}${trailing}` });
  }

  for (const fn of new Set(injections)) {
    const body = fn.body;
    if (!ts.isBlock(body)) {
      const arrow = source.indexOf("=>", fn.parameters.end);
      edits.push({ start: arrow + 2, end: body.getStart(sf), text: " {" });
      edits.push({
        start: body.getStart(sf),
        end: body.getStart(sf),
        text: `\n  const { tcs } = useI18n();\n  return `,
      });
      edits.push({ start: body.getEnd(), end: body.getEnd(), text: ";\n}" });
      continue;
    }
    // Already destructuring the provider? Then just widen the pattern.
    let widened = false;
    for (const statement of body.statements) {
      if (!ts.isVariableStatement(statement)) continue;
      for (const declaration of statement.declarationList.declarations) {
        if (!ts.isObjectBindingPattern(declaration.name)) continue;
        const initText = declaration.initializer?.getText(sf) ?? "";
        if (initText !== "useI18n()") continue;
        const names = declaration.name.elements.map((element) => element.name.getText(sf));
        if (names.includes("tcs")) {
          widened = true;
          break;
        }
        edits.push({
          start: declaration.name.getStart(sf),
          end: declaration.name.getEnd(),
          text: `{ ${[...names, "tcs"].join(", ")} }`,
        });
        widened = true;
        break;
      }
      if (widened) break;
    }
    if (widened) continue;
    const insertAt = body.getStart(sf) + 1;
    const statement = isClient
      ? "const { tcs } = useI18n();"
      : "const { tcs } = await getServerCopy();";
    edits.push({ start: insertAt, end: insertAt, text: `\n  ${statement}` });
    if (!isClient) {
      // The owner must be `async` for `await` to be legal.
      const header = fn.getStart(sf);
      const keyword = source.slice(header, header + 400);
      const match = /^(export\s+default\s+)?(export\s+)?(async\s+)?function/.exec(keyword);
      if (match && !match[3]) {
        const fnWord = keyword.indexOf("function");
        edits.push({ start: header + fnWord, end: header + fnWord, text: "async " });
      } else if (ts.isArrowFunction(fn)) {
        problems.push(`${relative}: server page with an arrow component needs a manual \`async\``);
      }
    }
  }

  /* ---- imports ---------------------------------------------------------- */

  edits.push(...importEdits(sf, source, isClient));

  const ordered = edits.sort((a, b) => b.start - a.start || b.end - a.end);
  let output = source;
  let cursor = Number.POSITIVE_INFINITY;
  for (const edit of ordered) {
    if (edit.end > cursor) {
      problems.push(`${relative}: overlapping edit at ${edit.start}`);
      continue;
    }
    output = output.slice(0, edit.start) + edit.text + output.slice(edit.end);
    cursor = edit.start;
  }

  summary.push(`${relative}: ${items.length} sentence(s), ${new Set(injections).size} provider call(s)`);
  if (write) await writeFile(file, output, "utf8");
}

for (const line of summary) console.log(line);
if (moduleProse.length > 0) {
  console.log(`\n${moduleProse.length} module-scope sentence(s) — resolved at the render site:`);
  for (const line of moduleProse.slice(0, 80)) console.log(`  ${line}`);
}
if (problems.length > 0) {
  console.error(`\n${problems.length} item(s) need a human:`);
  for (const problem of problems.slice(0, 60)) console.error(`  ${problem}`);
  process.exitCode = 1;
}
if (!write) console.log(`\n(dry run — pass --write to apply)`);
