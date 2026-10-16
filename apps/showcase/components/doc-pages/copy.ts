/*
 * The prose the generated pages say about families and groups.
 *
 * It lives in this file, as literals inside `tcs(...)`, for one reason: the
 * Showcase's coverage checker reads *sentences from source*. A paragraph passed
 * as a variable — `tcs(FAMILY_ACCESSIBILITY[family])` — renders in English
 * forever, because the extractor cannot see it and the translator is never told
 * it exists. A false negative here is exactly the failure the checker was built
 * to prevent, so the sentences are written where they can be found, and a
 * family with nothing specific to say falls through to the honest general
 * sentence rather than to silence.
 */

type Translate = (source: string) => string;

/** What accessibility means for this family, stated where it is specific. */
export function accessibilityCopy(family: string, tcs: Translate): string {
  switch (family) {
    case "layout":
      return tcs(
        "Layout primitives add no roles and no keyboard behaviour: they are spacing and structure. What a page must still supply is its landmarks and its heading order, which come from the elements it chooses, not from these containers.",
      );
    case "actions":
      return tcs(
        "Controls here render the platform element, so Enter, Space, focus order and the accessible name come from the browser; the variants style an anchor without turning it into a button. Every control needs a name — its text, or a label when the control is an icon.",
      );
    case "forms":
      return tcs(
        "A field is labelled by a real label rather than a placeholder, invalid input is marked and pointed at the message that explains it, and a hint belongs to the field instead of merely sitting near it.",
      );
    case "data-display":
      return tcs(
        "Data surfaces keep the semantics of what they show: tabular data renders a real table with scoped headers and a caption, and a value is selectable text, so a reader can copy it or have it announced.",
      );
    case "feedback":
      return tcs(
        "Waiting and status states are announced, not only animated: a progress or busy state carries an accessible name, and a change of state is reflected in text rather than in colour alone.",
      );
    case "overlays":
      return tcs(
        "Overlays are built on the Radix primitives: focus moves into the surface when it opens, stays there while it is open and returns to the trigger when it closes, Escape dismisses it, and the relationship between the trigger and its content is exposed through ARIA.",
      );
    case "media":
      return tcs(
        "Images require alternative text — descriptive when the image carries meaning, empty when it is decoration — and any control that rearranges or compares them is operable from the keyboard.",
      );
    case "navigation":
      return tcs(
        "Navigation primitives expose real landmarks with one labelled navigation region each, and the current item is marked for assistive technology, so a reader is told where they are rather than being left to infer it.",
      );
    case "typography":
      return tcs(
        "Type components render the element they are told to render: appearance and semantics are separate props, so heading order stays the page's decision and never follows the styling.",
      );
    case "experiences":
      return tcs(
        "A composite section is assembled from ordinary landmarks and the library's own accessible primitives, so it adds composition rather than a second interaction model.",
      );
    default:
      return tcs(
        "The accessibility contract is the one the primitive underneath the component already honours — the platform element for a control, or the ARIA pattern the component implements — and the Showcase's own pages are scanned for violations with axe.",
      );
  }
}

/**
 * How a surface renders, stated as what a caller has to do about it — or `null`.
 *
 * The `null` is the point of this signature. The sentence used to be keyed by
 * `DocEntry.group`, and every component family lives in the `components` group,
 * so it printed the same paragraph on 150-odd pages — "these components render on
 * the server" — including on the overlay pages, where it is *false* (a dialog is
 * absent from the server output until it opens). The two cases with something
 * specific to say are now reachable:
 *
 *  - the family, so `overlays` answers instead of being dead code;
 *  - `null` for everything else, which is the honest answer for a Button and is
 *    what keeps the section off the page entirely rather than leaving a heading
 *    over a generic paragraph (Components V2 §5).
 *
 * Charts and motion keep their sentences: a chart genuinely cannot measure
 * itself before hydration, and a motion primitive genuinely attaches after it.
 */
export function renderingCopy(kind: string, tcs: Translate): string | null {
  switch (kind) {
    case "charts":
      return tcs(
        "Charts measure their container after hydration, so a chart needs a definite height and cannot be drawn into an element that is hidden at first paint. Everything around it — the page, the headings, the numbers — is rendered on the server.",
      );
    case "motion":
      return tcs(
        "Motion is a client-side effect: the animated element renders on the server, and the animation attaches after hydration. Respect the reduced-motion preference — the primitives do, and a custom composition has to.",
      );
    case "overlays":
      return tcs(
        "An overlay is absent from the server output until it is opened, so essential copy must never live only inside a dialog, popover or tooltip: it mounts after hydration, on the client.",
      );
    default:
      /*
       * Nothing specific to say, so nothing is said.
       *
       * The generic sentence that used to live here was true and printed on
       * every component page, which made it the largest block of identical copy
       * on the site. A component whose server/hydration behaviour actually
       * differs states it itself (the Actions entries do, per entry, in
       * `curation/notes.ts`).
       */
      return null;
  }
}

/** The chart data contract, identical on every chart page by design. */
export function chartContractCopy(tcs: Translate): string {
  return tcs(
    "The values are prepared by the caller: this component draws the points it is given and computes no statistic of its own, so units, scaling and any summary have to be settled before the data reaches it.",
  );
}

/** The honest note for an entry with no specimen — never a fake demo. */
export function noExampleCopy(tcs: Translate): string {
  return tcs(
    "This page has no live example yet, and it does not pretend to have one: the API below is read from the published package, and the worked examples live with the component's family.",
  );
}

/** What a chart owes a reader who cannot see it. */
export function chartAccessibilityCopy(tcs: Translate): string {
  return tcs(
    "A chart is a picture of data, so it needs a name that states what it shows, and the numbers must exist as text somewhere on the page — in a table or a written summary — because a drawing is not readable by a screen reader and cannot be copied.",
  );
}
