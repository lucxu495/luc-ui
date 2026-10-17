import { cloneElement, isValidElement, type ReactElement, type ReactNode } from "react";

/*
 * Translating a specimen.
 *
 * The gap this closes was measurable for three batches and reported as an
 * "architectural" problem each time: `scripts/i18n-coverage.mjs` reads every
 * sentence a page renders, including the ones inside a demo's `node`, and the
 * dictionary holds a rendering for each — and the Chinese page still showed
 * them in English. The reason is that a specimen is *JSX text*, not a `tcs()`
 * call: the extractor reads it, the runtime never did.
 *
 * So the same judgement is applied at render time, in one place, to the tree
 * the frame is about to show: walk it, and translate the strings a reader can
 * see or hear.
 *
 * What is deliberately **not** translated, and why:
 *
 *   - `code` and the other literal tags. A snippet is what the reader copies,
 *     and an identifier is typed verbatim in either language.
 *   - every prop that is not in `TEXT_PROPS`. A `value`, a `variant`, a `href`,
 *     a `status` and a `d` attribute are behaviour, not copy; translating them
 *     would change what the specimen *does*.
 *   - anything the dictionary does not have. The English stays as the fallback,
 *     which is what makes partial coverage honest rather than broken.
 *
 * It is a pure function of (tree, translator), so it runs on the server for the
 * pages the registry renders and inside the client frame for the pages a person
 * wrote — with the same dictionary on both sides, so the output cannot differ
 * and hydration cannot be a mismatch source. A string that is already
 * translated simply misses the dictionary and is returned unchanged, which is
 * what makes the function safe to apply twice.
 */

/**
 * Props that carry visible or audible text rather than behaviour.
 *
 * The list is the same judgement the page-level extractor makes: a heading, a
 * caption, a control's own name. It is a whitelist on purpose — an allowlist
 * fails safe (a prop that is missing stays English and can be added), while a
 * denylist fails dangerously (a new prop starts being translated as if it were
 * copy).
 */
const TEXT_PROPS: readonly string[] = [
  "title",
  "description",
  "label",
  "caption",
  "aria-label",
  "placeholder",
  "alt",
  "emptyTitle",
  "emptyDescription",
  "dismissLabel",
  /*
   * The initial *content* of an uncontrolled field.
   *
   * It is a specimen's text, and the extractor treats it as prose for exactly
   * that reason — a reader reads it. Deliberately not `value`: a *controlled*
   * value belongs to the demo's own state, so translating it here would show
   * Chinese until the reader's first keystroke put English back.
   */
  "defaultValue",
  "previousLabel",
  "nextLabel",
  "confirmLabel",
  "cancelLabel",
  "mobileNavTitle",
];

/** Elements whose text content is a literal: an identifier, a snippet, a sample. */
const LITERAL_TAGS = new Set(["code", "pre", "kbd", "samp", "var", "script", "style", "option"]);

/**
 * The mark `fixture()` leaves on a data value, so `localizeSpecimen` knows the
 * strings inside it are copy.
 *
 * A `Symbol.for` key rather than a module-local one: several copies of this
 * module can coexist in one process (a test runner's module graph, a bundler's
 * server and client graphs), and two module-local symbols would make a marked
 * fixture unrecognisable to the other copy — a translation that silently stops
 * happening, which is the failure mode this whole file exists to remove.
 */
const FIXTURE_MARK = Symbol.for("luc-ui.showcase.fixture");

/**
 * Declare which fields of a fixture carry copy, so the specimen localizer
 * translates them.
 *
 * The gap this closes: `localizeSpecimen` translates JSX text nodes and the
 * props in `TEXT_PROPS`, and both are the right rules for a *tree*. Neither can
 * reach a fixture — `<PublicationList publications={[…]}/>` carries its visible
 * words inside an array of records, and the walker refuses to guess which props
 * hold text, because guessing is how a `variant` or a `status` starts being
 * translated and the specimen stops behaving the way the page says it does.
 *
 * So the author names the fields, at the value:
 *
 *   <PublicationList publications={fixture(publications, ["title"])}/>
 *   <NowSection items={fixture(items, ["label", "value"])}/>
 *
 * Naming the field, rather than translating every string inside the value, is
 * what keeps the page honest in two directions at once:
 *
 *   - **Behaviour stays untouched.** `status: "Active"`, `doi`, `tags` and
 *     `citations` are data the component acts on; a whole-value walk would
 *     translate `Close` (a dictionary key — the market close) wherever a fixture
 *     happened to use it as a label. A named field cannot do that.
 *   - **The preview keeps agreeing with the snippet beside it.** A demo prints
 *     the code that produced it, and a page whose preview says 运行回测 next to a
 *     snippet saying `Run backtest` has broken the one promise a live specimen
 *     makes. `fixture()` therefore names only the fields the snippet does *not*
 *     print — the `summary` of a timeline entry, the title of a publication —
 *     and leaves the fields the reader can see in the code block (`role`, `org`,
 *     a printed label) exactly as written.
 *
 * What happens then is narrow and predictable: a string *value* under one of the
 * named keys is looked up in the dictionary, and everything else — numbers,
 * booleans, `null`, unnamed keys, the array and object shapes themselves — is
 * passed through untouched. A string the dictionary does not have stays as it
 * was, so identifiers fall back to English and a partly-translated fixture
 * degrades rather than breaks.
 *
 * The mark is non-enumerable, so it is invisible to `Object.keys`, to spread and
 * to React's own prop handling. The returned value is a shallow copy: the
 * caller's literal is never mutated.
 */
export function fixture<T>(value: T, fields: readonly string[]): T {
  if (value === null || typeof value !== "object") return value;
  const marked = (Array.isArray(value) ? [...value] : { ...(value as object) }) as T;
  Object.defineProperty(marked, FIXTURE_MARK, {
    value: fields,
    enumerable: false,
    configurable: true,
  });
  return marked;
}

const fixtureFields = (value: unknown): readonly string[] | undefined => {
  if (typeof value !== "object" || value === null) return undefined;
  const fields = (value as Record<symbol, unknown>)[FIXTURE_MARK];
  return Array.isArray(fields) ? (fields as string[]) : undefined;
};

/**
 * Translate the marked fields of a fixture, preserving its shape.
 *
 * Returns the input when nothing changed, so an all-English fixture keeps its
 * identity and React re-renders nothing.
 */
function localizeFixture(value: unknown, fields: readonly string[], tcs: (source: string) => string): unknown {
  if (value === null || typeof value !== "object") return value;
  if (Array.isArray(value)) {
    let changed = false;
    const mapped = value.map((child) => {
      const next = localizeFixture(child, fields, tcs);
      if (next !== child) changed = true;
      return next;
    });
    return changed ? mapped : value;
  }
  let changed = false;
  const next: Record<string, unknown> = {};
  for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
    if (typeof child === "string" && fields.includes(key)) {
      const translated = tcs(child);
      if (translated !== child) changed = true;
      next[key] = translated;
      continue;
    }
    /*
     * A nested record is walked with the same field names, so
     * `items: [{ entry: { title } }]` behaves like `items: [{ title }]`; a plain
     * string array (`tags`, `highlights`) holds no keys and is left alone.
     */
    const nested = localizeFixture(child, fields, tcs);
    if (nested !== child) changed = true;
    next[key] = nested;
  }
  return changed ? next : value;
}

/**
 * One text node, keeping the whitespace JSX put around it.
 *
 * JSX hands a frame's text over with its indentation attached (`"\n  Runs are
 * immutable.\n"`), and that whitespace is spacing the layout relies on. Only the
 * trimmed core is looked up, and it is put back where it was found.
 */
function translateText(text: string, tcs: (source: string) => string): string {
  const leading = /^\s*/.exec(text)?.[0] ?? "";
  const trailing = /\s*$/.exec(text)?.[0] ?? "";
  const core = text.slice(leading.length, text.length - trailing.length);
  if (core.length < 2) return text;
  const whole = tcs(core);
  if (whole !== core) return `${leading}${whole}${trailing}`;
  /*
   * A text node can hold more than one sentence, and the extractor registers
   * them one at a time — so a paragraph is looked up sentence by sentence. A
   * fragment that is not in the dictionary is returned as it was, which keeps a
   * half-translated paragraph readable instead of dropping the English.
   */
  const parts = core.split(/(?<=[.!?。！？])\s+/);
  if (parts.length < 2) return text;
  const translated = parts.map((part) => tcs(part)).join(" ");
  return translated === core ? text : `${leading}${translated}${trailing}`;
}

/** Translate the strings inside a specimen, leaving its behaviour alone. */
export function localizeSpecimen(
  node: ReactNode,
  tcs: (source: string) => string,
): ReactNode {
  /*
   * The shape of the tree is preserved exactly, and that is load-bearing.
   *
   * The first version of this walked the children with `Children.map`, which
   * always returns an *array* — so `<PopoverTrigger asChild><button/></…>` came
   * out as `[<button/>]`, and Radix's `Slot` refuses anything that is not a
   * single element child: every overlay page in the Showcase answered 500 with
   * "Primitive.button failed to slot onto its children". A documentation helper
   * must not reshape the tree it is reading, so a string stays a string, one
   * element stays one element, and an array is copied only when a member of it
   * actually changed.
   */
  if (typeof node === "string") return translateText(node, tcs);
  if (
    node === null ||
    node === undefined ||
    typeof node === "number" ||
    typeof node === "boolean"
  ) {
    return node;
  }

  if (Array.isArray(node)) {
    let changed = false;
    const mapped = node.map((child) => {
      const next = localizeSpecimen(child, tcs);
      if (next !== child) changed = true;
      return next;
    });
    return changed ? mapped : node;
  }

  if (!isValidElement(node)) return node;

  const element = node as ReactElement<Record<string, unknown>>;
  if (typeof element.type === "string" && LITERAL_TAGS.has(element.type)) return node;

  let changed = false;
  const next: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(element.props as Record<string, unknown>)) {
    if (key === "children") {
      const mapped = localizeSpecimen(value as ReactNode, tcs);
      if (mapped !== value) changed = true;
      next[key] = mapped;
      continue;
    }
    if (typeof value === "string" && TEXT_PROPS.includes(key)) {
      const translated = tcs(value);
      if (translated !== value) changed = true;
      next[key] = translated;
      continue;
    }
    /*
     * A marked fixture is the one place this walker looks inside a non-string
     * prop, and only because the author asked it to (`fixture()` above). The
     * `isFixture` test is on the value, not on the prop name, so the same walker
     * stays safe for every other prop on every other component.
     */
    const fields = fixtureFields(value);
    if (fields) {
      const localized = localizeFixture(value, fields, tcs);
      if (localized !== value) changed = true;
      next[key] = localized;
      continue;
    }
    next[key] = value;
  }
  return changed ? cloneElement(element, next) : node;
}
