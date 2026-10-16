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
    next[key] = value;
  }
  return changed ? cloneElement(element, next) : node;
}
