/*
 * The per-entry documentation notes.
 *
 * Why this file exists, measured rather than assumed:
 *
 * A page generated from the registry had four sections it could not make honest.
 * The import line was in the header, so its "Usage" heading stood empty; the
 * accessibility paragraph was keyed by *family*, so eight Actions pages printed
 * the same 46 words; the "SSR and rendering" sentence was keyed by *group*, so it
 * said the same thing about a Button and a Dialog; and "Related" fell back to the
 * family list in reading order, which is a sibling list rather than a
 * recommendation. Each of those is the same defect in a different costume: a
 * page-shaped claim stored at a catalogue-shaped granularity.
 *
 * So the honest granularity is one entry, and this is where it lives. Three
 * kinds of judgement, one record per entry, keyed by the canonical `DocEntry.id`
 * that the registry — not this file — defines:
 *
 *   usage        the shortest call that does something, printed under Usage
 *   guidance     what to reach for, and what not to, for *this* component
 *   accessibility a statement that is true of this component and not of its family
 *
 * and, beside it, `RELATED_ENTRIES`: the two to four pages a reader most likely
 * wants next. Everything is optional, and a section with nothing specific to say
 * is not rendered at all — see `docs/COMPONENTS_V2.md` §5 ("Accessibility or
 * usage notes — only when there is something a reader would otherwise get
 * wrong") and the no-empty-headings rule the Showcase outline check enforces.
 *
 * Two things this file deliberately does not do:
 *
 *  - state a fact about the API. Export names, props and defaults come from the
 *    compiler (`generated/api.ts`); a sentence here explains a *decision*.
 *  - hold copy twice. The prose keys below — `note`, `use`, `avoid`, `detail` —
 *    are exactly the keys `scripts/i18n-prose.mjs` watches, so a new sentence in
 *    this file is required by the coverage gate and cannot ship in English on the
 *    Chinese pages. A snippet's `code` is not prose and stays English, as it
 *    should: a developer types it verbatim in either language.
 *
 * Every key is validated against the generated registry by
 * `scripts/docs-registry.mjs`, so a typo fails `pnpm verify:docs` instead of
 * rendering nothing, and `tests/unit/docs-notes.test.ts` checks what a generator
 * cannot: that a snippet only names exports the entry publishes, and that a
 * component claiming a note is actually documented.
 */

/**
 * One entry's page notes.
 *
 * Everything is optional. An entry with no record renders the canonical page
 * without the Usage, Guidelines and Accessibility sections rather than with
 * empty ones.
 */
export interface EntryNote {
  /**
   * The shortest call that does something — the Usage section's snippet.
   *
   * One or two lines, and no state: an example that manages state belongs in the
   * Examples section, where it can run.
   */
  usage?: {
    /**
     * The symbols the import line should name.
     *
     * Defaults to the one export that names the page. A Forms page is where the
     * default is often wrong: a trio that is meant to be used together
     * (`Toggle, ToggleGroup, ToggleGroupItem`), a control plus the item type it
     * renders, or — the case this was added for — `Input` beside the `Textarea`
     * and `SearchInput` that share its shell. The symbols are identifiers, so
     * they are not translated; only the sentence beside them is.
     */
    imports?: readonly string[];
    code: string;
    /** One line about what the snippet needs, when it needs something. */
    note?: string;
  };
  /**
   * Component-specific guidance for the Guidelines section.
   *
   * `use` and `avoid` are the same two columns the Showcase has printed as
   * "Do" and "Don't" since Phase 1; the key names are what the prose extractor
   * watches, so the labels can be translated without the sentences going
   * unmeasured.
   */
  guidance?: {
    use?: readonly string[];
    avoid?: readonly string[];
  };
  /**
   * What accessibility means for *this* component.
   *
   * Written only where it is true of the component rather than of the family: a
   * paragraph that would be identical on five neighbouring pages belongs on the
   * family page instead (see `components/doc-pages/copy.ts`).
   */
  accessibility?: {
    /** `detail` is a watched prose key; see the header. */
    detail: string;
  };
  /**
   * One sentence about the *module's* surface, printed above the API tables.
   *
   * The case it exists for is a module that publishes two component families at
   * once, where a reader opening the tables deserves to be told why.
   */
  api?: {
    note?: string;
  };
}

/**
 * The professional reading note for one chart.
 *
 * Charts already have a demo and a copyable call. What they lacked was the
 * chart-specific judgement a developer cannot infer from a screenshot: the data
 * relation, the smallest honest data shape, the settings that change the
 * reading, and a misuse this component cannot repair.
 */
export interface ChartNote {
  /** What relation the plot is for. */
  purpose: string;
  /** The real input shape, using the props and fields the demo uses. */
  dataContract: string;
  /** One to three settings that change the reading. */
  configuration: string;
  /** A concrete misuse or limitation. */
  avoid: string;
}

export interface IntegrationUsage {
  imports: readonly string[];
  code: string;
  note: string;
}

/** Page-level guidance for a provider integration. */
export interface IntegrationNote {
  usage: readonly IntegrationUsage[];
  configuration: string;
  lifecycle: string;
  limitations: string;
  guidance: {
    use: readonly string[];
    avoid: readonly string[];
  };
}

export const ENTRY_NOTES: Record<string, EntryNote> = {
  /* ---------------------------------------------------------------- actions */
  button: {
    usage: {
      code: `<Button variant="primary" onClick={runBacktest}>Run backtest</Button>`,
    },
    guidance: {
      use: [
        "Reach for `loading` rather than swapping the label to “Loading…”: the label stays readable and the control keeps its width.",
        "Keep one primary action visible per region, and let everything else step down from it.",
        "Use `IconButton` for an icon-only action — its `label` is required, which is the whole difference between the two components.",
      ],
      avoid: [
        "Disable a button instead of explaining why the action is unavailable.",
        "Place two primary buttons side by side: the region loses its single obvious next step.",
        "Put an anchor inside a button — `buttonVariants` on the anchor is the supported way to make a link look like one.",
      ],
    },
    accessibility: {
      detail:
        "The control is a real `<button>` with `type=\"button\"` by default, so Enter and Space, focus order and the accessible name come from the browser. `loading` sets `aria-busy` and blocks activation while leaving the button focusable; only `disabled` removes it from the tab order.",
    },
  },
  "icon-button": {
    usage: {
      code: `<IconButton label="Refresh data" icon={<RiRefreshLine />} />`,
    },
    guidance: {
      use: [
        "Reach for `IconButton` instead of a `Button` holding one glyph: the square geometry, the 18 px glyph and the required `label` come with it.",
        "Write the label as the action (“Refresh data”), because it is what a screen reader announces and what the hover title shows by default.",
        "Use `variant=\"danger\"` for a destructive icon action so it is not the same surface as the neutral control beside it.",
      ],
      avoid: [
        "Ship an icon-only control with no accessible name — `label` is required rather than optional for exactly this reason.",
        "Treat the tooltip as the name: `showTooltip` adds a native `title` on top of `label`, and can be switched off.",
        "Use an `IconButton` where the action has a word: a `Button` with `leadingIcon` carries both.",
      ],
    },
    accessibility: {
      detail:
        "`label` becomes `aria-label` on a real `<button>`, and the hover tooltip is a native `title` rather than a second name. `loading` sets `aria-busy`, blocks activation and keeps focus; `disabled` removes the control from the tab order.",
    },
  },
  icon: {
    usage: {
      code: `<Icon name="search" size="lg" tone="muted" />`,
    },
    guidance: {
      use: [
        "Address a glyph by name (`name=\"play\"`) where a component cannot be imported — a stored value, a config field, a search box — and pass `icon={RiPlayLine}` where it can.",
        "Size and tone the wrapper rather than the glyph: `size` is the library's scale and `tone` resolves to a `--fg-*` token.",
        "Give an icon a `label` only where it carries the meaning by itself, and leave it unlabelled beside a word.",
      ],
      avoid: [
        "Render a bare `@remixicon/react` component next to a LUC icon: the raw glyph knows nothing about the size scale or the tone tokens.",
        "Label a decorative glyph: it would be announced twice, once for the icon and once for the word beside it.",
        "Expect `name` to resolve a glyph outside the set — it throws at render rather than drawing nothing.",
      ],
    },
    accessibility: {
      detail:
        "The wrapper owns the accessibility decision: with a `label` it is an image with that name, and without one it is `aria-hidden`, so a glyph beside a word is never announced twice. `spin` animates under the reduced-motion rule.",
    },
  },
  "float-button": {
    usage: {
      code: `<FloatButton icon={<RiDownloadLine />} label="Export this view" />`,
    },
    guidance: {
      use: [
        "Keep one floating action per surface: a second one in the same corner makes both harder to find.",
        "Use `FloatButtonGroup` for two to four related actions and let it own the disclosure, rather than placing sibling floats by hand.",
        "Pass `fixed={false}` inside a preview, a canvas or a card, so the action is positioned by that surface instead of the viewport.",
      ],
      avoid: [
        "Float an action to a corner with no label: the corner is easy to hit and easy to misread.",
        "Put a count in the badge and nowhere else — it is `aria-hidden`, so a number a reader has to hear belongs in `label`.",
        "Add your own `fixed` or `absolute` positioning: the component already sets the corner, the safe-area inset and the layer.",
      ],
    },
    accessibility: {
      detail:
        "The control is the same `IconButton` as every other icon-only action, with a required `label`; the group's trigger is a real button carrying `aria-expanded` and `aria-controls`, opening moves focus to the first action, and Escape closes it and returns focus to the trigger.",
    },
  },
  "button-group": {
    usage: {
      code: `<ButtonGroup>
  <Button variant="secondary">Day</Button>
  <Button variant="secondary">Week</Button>
</ButtonGroup>`,
    },
    api: {
      note: "ButtonGroup, ButtonGroupSeparator and the Toolbar primitives are exports of one module, so both families are documented here: grouping is geometry, and Toolbar is the keyboard contract on top of it.",
    },
    guidance: {
      use: [
        "Use `ButtonGroup` for two to four actions that belong to one control, and leave every child with its own variant so a danger action still reads as dangerous.",
        "Use `vertical` for a stack: the joint moves to the horizontal edges and the inner corners square the same way.",
        "Use `ButtonGroupSeparator` to mark a change of intent inside a mixed group — a primary action, then its menu.",
        "Use `Toolbar` when the strip needs one tab stop and arrow-key movement rather than a tab stop per control.",
      ],
      avoid: [
        "Group actions that are not related: the joint says the parts are one control with several options.",
        "Restate the group's geometry with your own negative margins or `rounded-*` classes — that is what the joint owns.",
        "Hand-roll `role=\"toolbar\"` or a roving-focus loop instead of the `Toolbar` primitive, which already provides both.",
      ],
    },
    accessibility: {
      detail:
        "`ButtonGroup` is a `role=\"group\"` container that adds no keyboard behaviour: every child keeps its own tab stop, which is right for a row of unrelated actions and wrong for a formatting strip. `Toolbar` is the accessible alternative — one tab stop for the whole strip, arrow keys between the controls, and a required `label` that names the toolbar.",
    },
  },
  toggle: {
    usage: {
      code: `<Toggle label="Bold" defaultPressed>
  <RiBold />
</Toggle>`,
    },
    guidance: {
      use: [
        "Use a `Toggle` for an action that applies immediately to what the reader is looking at, and show the state rather than a label that changes.",
        "Give an icon-only toggle a `label`: it becomes the accessible name, and the pressed state is announced separately.",
        "Use `type=\"multiple\"` when the choices are independent, and `type=\"single\"` when exactly one can hold.",
      ],
      avoid: [
        "Use a `Toggle` to submit a form — that is a `Button`.",
        "Use a `Toggle` for an on/off setting that persists — that is a `Switch`.",
        "Put a `ToggleGroup` beside a `SegmentedControl` in one toolbar: they look similar and mean different things, one a set of independent options and the other a single value.",
      ],
    },
    accessibility: {
      detail:
        "A `Toggle` is a two-state button that reports `aria-pressed`, so assistive technology hears the state rather than a changed label. A `ToggleGroup` is a roving-focus composite where each item keeps its own pressed state; `type=\"single\"` behaves as a radio group and always has one choice.",
    },
  },
  link: {
    usage: {
      code: `<Link href="/charts">Open the chart catalogue</Link>`,
    },
    guidance: {
      use: [
        "Use `variant=\"accent\"` for a link inside prose and `muted` for a secondary one, so the emphasis matches the sentence it sits in.",
        "Use `underline=\"always\"` where colour alone is not a reliable cue — a dense table, a printed page, a link in body copy.",
        "Keep the destination in `href` so the browser's own affordances keep working: middle click, copy link address, the status bar.",
      ],
      avoid: [
        "Style a `span` as a link: the keyboard behaviour, the context menu and the status preview all come from the element.",
        "Use a link for an action that changes state — that is a `Button`.",
        "Rely on hover for the underline and on colour for the meaning at the same time; the default is fine in a navigation list and weak in a paragraph.",
      ],
    },
    accessibility: {
      detail:
        "The element is a real anchor, so its role, focus and activation come from the browser, and `luc-focus` supplies the visible focus ring. Underline style is a variant rather than an afterthought: on a surface where colour is the only other cue, `underline=\"always\"` is the accessible choice.",
    },
  },
  kbd: {
    usage: {
      code: `<KbdGroup keys={["⌘", "K"]} />`,
    },
    guidance: {
      use: [
        "Write the chord the platform actually uses: `⌘` on macOS, `Ctrl` on Windows and Linux, since the component prints exactly the keys it is given.",
        "Use it where a reader is learning a shortcut — help text, an empty state, a menu hint — not as the only way to find the action.",
        "Set `size=\"sm\"` inside a caption, a table cell or a menu row.",
      ],
      avoid: [
        "Put the separator in `keys`: the group inserts the `+` itself and hides it from a screen reader.",
        "Expect the keys to do something: `KbdGroup` is a display, and the application owns the shortcut.",
        "Translate a key name such as `Esc` or `↵`: it is the label on the reader's own keyboard.",
      ],
    },
    accessibility: {
      detail:
        "Each key is a `<kbd>` element and the `+` between them is `aria-hidden`, so the chord is announced as one combination instead of a list of symbols. Nothing here is focusable or interactive: a shortcut is only announced by the control that implements it.",
    },
  },

  /* ----------------------------------------------------------------- forms */
  input: {
    usage: {
      imports: ["Input"],
      code: `<Input placeholder="BTC/USD" aria-label="Instrument" />`,
      note: "Inside a `Field` the label, description and error message wire themselves to the input; the `aria-label` above is only for a field standing alone.",
    },
    guidance: {
      use: [
        "Wrap the control in `Field`, which owns the id, the described-by relationship and the invalid state.",
        "Use `size` for the density of the row — a dense toolbar, a default form, an onboarding step — not to make one field louder than its neighbour.",
        "Keep `leadingIcon` decorative and let the label carry the meaning: the icon slot is `aria-hidden`.",
      ],
      avoid: [
        "Use a placeholder as the label: it disappears the moment the reader types.",
        "Put two icons in one field with no hierarchy — one leading glyph and one trailing action is the shape the shell is built for.",
        "Reach for `className` to restyle the shell; `inputClassName` exists for the inner element and the shell classes are the contract.",
      ],
    },
    accessibility: {
      detail:
        "`Field` supplies the id and the `aria-describedby` relationship, so a message is connected to the control rather than merely near it. `readOnly` keeps the value focusable and copyable and draws the dashed treatment; `disabled` removes the field from the tab order and is the wrong answer for a value a reader may still need to copy.",
    },
  },
  "tag-input": {
    usage: {
      imports: ["TagInput"],
      code: `<TagInput value={symbols} onValueChange={setSymbols} placeholder="Add a symbol…" />`,
    },
    guidance: {
      use: [
        "Give `validate` both the rule and the sentence a reader sees when it fails: a rejected tag never enters the list.",
        "Set `maxTags` when the list has a real ceiling — recipients, venues, sectors — instead of letting it grow without limit.",
        "Use `readOnly` for a list a reader may copy but not edit; the chips keep their shape either way.",
      ],
      avoid: [
        "Report a rejected value in a toast: the message belongs beside the field that refused it.",
        "Use a tag input for long text — the chips are for short identifiers a reader recognises at a glance.",
        "Expect a pasted list to arrive as one tag: a pasted delimiter-separated list is split into separate values.",
      ],
    },
    accessibility: {
      detail:
        "The chips are the same `Tag` component used elsewhere in the library, and the input keeps its own label, description and message through `Field`. Enter or comma commits a value, Backspace removes the last chip, and a value the `validate` function refuses is announced through the field's message rather than silently dropped.",
    },
  },
  "color-picker": {
    usage: {
      imports: ["ColorPicker"],
      code: `<ColorPicker value={color} onValueChange={setColor} swatches={swatches} label="Series colour" />`,
    },
    guidance: {
      use: [
        "Pass the product's own `swatches`: the component ships no default palette, because a colour that means something is the caller's decision.",
        "Keep the value a hex string; the component parses what it is given and hands back a normalised `#rrggbb`.",
        "Give it a `label` when it stands alone, and let `Field` name it when it sits in a form.",
      ],
      avoid: [
        "Expect a colour space conversion: hex in, hex out, and nothing is written to the clipboard for you.",
        "Use a swatch as the only encoding of a meaning — a colour a reader cannot distinguish carries no state.",
        "Reach for it when the colour is fixed by the design system; a swatch row is for a choice, not a setting.",
      ],
    },
    accessibility: {
      detail:
        "The trigger is a real button whose accessible name is the label plus the current value, and the popover exposes the value as text — a hex field a reader can select and copy — so the control does not depend on seeing a colour. Preset swatches are buttons with their own names, and Escape closes the popover and returns focus to the trigger.",
    },
  },
  "transfer-list": {
    usage: {
      imports: ["TransferList"],
      code: `<TransferList items={columns} value={chosen} onValueChange={setChosen} />`,
    },
    guidance: {
      use: [
        "Use it when the order or the membership of a set is the value — column sets, watchlists, permissions.",
        "Name both panes with `sourceLabel` and `targetLabel`: they are the landmark names a screen-reader user navigates by.",
        "Set `height` to the dense end when the list sits inside a panel; 240 px is the default that keeps both panes scannable.",
      ],
      avoid: [
        "Use a transfer list where a multi-select would do: two panes cost vertical space that a dropdown does not.",
        "Rely on drag and drop — this component moves items with buttons and the keyboard.",
        "Change the `items` prop identity on every render; the panes derive from it and the selection is keyed by id.",
      ],
    },
    accessibility: {
      detail:
        "Both panes are labelled lists and every move is a real button, so the whole interaction is reachable by keyboard and announced — the buttons carry the item's name, not just an arrow glyph.",
    },
  },
  checkbox: {
    usage: {
      imports: ["Checkbox"],
      code: `<Checkbox label="Auto-apply patches" defaultChecked />`,
    },
    guidance: {
      use: [
        "Use a checkbox for an answer a form submits; a setting that applies the moment it is flipped is a `Switch`.",
        "Read `indeterminate` as “some of the children are selected”, which is what it means to a screen reader too.",
        "Give a set of boxes a `Fieldset` legend, so the question they answer has a name.",
      ],
      avoid: [
        "Use a checkbox as a toggle that saves on its own; the reader expects to submit it.",
        "Express `invalid` with opacity: the treatment is a border and a message, and the message belongs to `Field`.",
        "Put two boxes in one row for different questions — one box, one answer.",
      ],
    },
    accessibility: {
      detail:
        "Radix supplies `role=\"checkbox\"` with `aria-checked` including the mixed state, and a 24 px hit area behind an 18 px box. The label is part of the control, so clicking the text toggles it, and a `Field` adds the description and the message through `aria-describedby`.",
    },
  },
  switch: {
    usage: {
      imports: ["Switch"],
      code: `<Switch label="Auto-apply patches" defaultChecked />`,
    },
    guidance: {
      use: [
        "Use a switch for a setting that takes effect immediately and needs no save button.",
        "Put the setting's name in `label` and the consequence in `description`: both are part of the control.",
        "Use `sm` only in a dense settings row; `md` is the size a form expects.",
      ],
      avoid: [
        "Use a switch inside a form that has a submit button — that is a checkbox, and the reader expects to commit it.",
        "Relabel the switch instead of flipping it; the state is `aria-checked`, not the words beside it.",
        "Leave a switch unlabelled and hope the surrounding row explains it.",
      ],
    },
    accessibility: {
      detail:
        "`role=\"switch\"` reports `aria-checked`, and Space or Enter toggles it. The `md` track is 22 px tall and the `sm` one 16 px, so both keep a 24 px target through the shared hit-area utility rather than by growing the control.",
    },
  },
  textarea: {
    usage: {
      imports: ["Textarea"],
      code: `<Textarea rows={3} placeholder="Notes for this run" aria-label="Run notes" />`,
    },
    guidance: {
      use: [
        "Set `rows` for how much is visible at rest and let the field scroll beyond it; `autoResize` when the text is the content.",
        "Use `size` for the density of the row, exactly as `Input` does — they share one shell.",
        "Reach for `readOnly` when the text must stay selectable and copyable.",
      ],
      avoid: [
        "Fight the browser's own resize handle with CSS: a reader who resizes a textarea is telling you the field was too small.",
        "Use a textarea for a single line of structured input — the field's own `Input` is the one that validates it.",
        "Set `autoResize` on a field that must not grow inside a fixed-height panel.",
      ],
    },
    accessibility: {
      detail:
        "The element is a real `<textarea>`, so its label, description and message come from `Field`. `readOnly` keeps the text selectable and copyable and draws the dashed treatment; `disabled` removes it from the tab order, which is why a value a reader may still need is read-only rather than disabled.",
    },
  },
  "native-select": {
    usage: {
      imports: ["NativeSelect"],
      code: `<NativeSelect aria-label="Universe" defaultValue="us-large" options={universes} />`,
    },
    guidance: {
      use: [
        "Reach for the platform select when the list is short, the answer is obvious and the OS menu is the right instrument — it works before hydration.",
        "Pass `options` as data, or write `<option>` children; both are supported and both are read by the compiler's prop table.",
        "Use `placeholder` for an empty first option that cannot be submitted as a choice.",
      ],
      avoid: [
        "Use a native select for a searchable or grouped list — that is `Select` or `Combobox`.",
        "Style the popup: the open menu belongs to the operating system, and the closed control is the part you own.",
        "Rely on the placeholder as a label; it disappears as soon as an option is chosen.",
      ],
    },
    accessibility: {
      detail:
        "This is the operating system's own control: keyboard behaviour, type-ahead and screen-reader announcement are the platform's, and `placeholder` is rendered as a disabled option rather than as a visual hint. `invalid` and `disabled` draw the same treatments as `Input`.",
    },
  },
  label: {
    usage: {
      imports: ["Label"],
      code: `<Label htmlFor="notional">Notional</Label>`,
      note: "Reach for `Field` first: it renders its own label and owns the id, the description and the message. This component is for the cases `Field` does not own.",
    },
    guidance: {
      use: [
        "Reach for `Field` when a control sits in a form; reach for `Label` when it does not — a toolbar control, a group's name, a field a page wires itself.",
        "Keep `htmlFor` pointing at a real `id`: the binding is the whole contract, and it is also what makes the text clickable.",
        "Use `required` rather than drawing an asterisk yourself: it marks the control for a reader as well.",
      ],
      avoid: [
        "Use a `Label` beside a `Field` — the field already renders one, and two labels for one control name it twice.",
        "Put a label in a placeholder instead; a placeholder is an example, not a name.",
        "Bind two labels to one control: `aria-labelledby` picks one and the other becomes noise.",
      ],
    },
    accessibility: {
      detail:
        "`htmlFor` is bound to the control's `id`, so the text is clickable and the accessible name comes from the label rather than from the placeholder. `required` sets the required state for a reader as well as rendering the asterisk.",
    },
  },
  "radio-group": {
    usage: {
      imports: ["Radio", "RadioGroup"],
      code: `<RadioGroup defaultValue="monthly" aria-label="Rebalance">
  <Radio value="weekly" label="Weekly" />
  <Radio value="monthly" label="Monthly" />
</RadioGroup>`,
    },
    guidance: {
      use: [
        "Use a radio group for one answer out of a few when the options should all stay visible; a `Select` hides them behind a click.",
        "Let the group own the value and the layout be yours: the component is the Radix root, so a row is a flex container around it.",
        "Give the item its `description` when the options need a sentence each, and `invalid` when the form rejected the answer.",
      ],
      avoid: [
        "Use a radio group for an on/off setting — that is a `Switch`, and for a submitted yes/no it is a `Checkbox`.",
        "Build the group out of a `div` and separate radios: the roving focus, the arrow keys and the single tab stop are the contract you would have to reimplement.",
        "Set `invalid` on the group: the treatment lives on the item, which is what the compiler's prop table says.",
      ],
    },
    accessibility: {
      detail:
        "The group is a real `radiogroup` with roving focus: one tab stop for the whole set, and the arrow keys move the selection. `disabled` on the group keeps the current answer visible while closing the question, and an item's `description` is wired to that item rather than to the group.",
    },
  },
  rating: {
    usage: {
      imports: ["Rating"],
      code: `<Rating value={4.5} allowHalf readOnly label="Average rating" />`,
    },
    guidance: {
      use: [
        "Use `readOnly` for a rating you are showing; the component announces one value instead of five controls.",
        "Set `max` for anything other than five stars: it is the number of stars, not a scale to convert.",
        "Pass `label` unless the rating sits in a labelled `Field`, which names it for you.",
      ],
      avoid: [
        "Use stars for a precise score with no visible number: pair it with the value as text.",
        "Let a reader clear a rating that the form requires — leave `clearable` off when an answer is mandatory.",
        "Use a rating where a slider would do: it is a five- or ten-point judgement, not a continuous quantity.",
      ],
    },
    accessibility: {
      detail:
        "The group is a radio group in effect: it keeps one tab stop, the arrow keys step by a star — or half a star with `allowHalf` — and `readOnly` turns the whole thing into a single announced value rather than a set of controls.",
    },
  },
  "search-input": {
    usage: {
      imports: ["SearchInput"],
      code: `<SearchInput placeholder="Search runs" aria-label="Search runs" />`,
    },
    guidance: {
      use: [
        "Use `onValueChange` when the page filters as the reader types; the field stays uncontrolled, which is what keeps fast typing from dropping characters.",
        "Pass `clearLabel` in a product that is not English: the clear button needs a name, and the default is English.",
        "Keep `clearable` on when the field holds a filter the reader will want to remove; turn it off when the surrounding page owns the value.",
      ],
      avoid: [
        "Submit a search on every keystroke — the callback is for filtering, not for a request per letter.",
        "Use a search field as a general text input: the icon, the clear button and Escape all promise searching.",
        "Rely on the placeholder as the field's name.",
      ],
    },
    accessibility: {
      detail:
        "The clear affordance is a real button with an accessible name (a prop, so it can be translated), and it returns focus to the field it cleared rather than dropping focus to the document.",
    },
  },
  "input-group": {
    usage: {
      imports: ["InputGroup", "InputGroupAddon", "InputGroupInput"],
      code: `<InputGroup>
  <InputGroupAddon>$</InputGroupAddon>
  <InputGroupInput defaultValue="120000" aria-label="Notional" />
</InputGroup>`,
    },
    guidance: {
      use: [
        "Use it when the affixes belong to the value — a currency, a unit, a search icon, a trailing action.",
        "Put the state on the group (`size`, `disabled`, `invalid`) so every part of the shell agrees.",
        "Use `InputGroupSeparator` when the pieces are different kinds of thing; skip it when a prefix simply sits against the value.",
      ],
      avoid: [
        "Reach for addons when a `Field` description would carry the unit more cheaply.",
        "Make an addon interactive without saying so: only `interactive` addons are real targets, and the rest are labels.",
        "Split one value across two inputs with a separator in the middle.",
      ],
    },
    accessibility: {
      detail:
        "The group draws one focus ring around field and affixes, and the state on the group reaches the input. A decorative icon addon is `aria-hidden`, so it never becomes part of the field's name.",
    },
  },
  "segmented-control": {
    usage: {
      imports: ["SegmentedControl", "SegmentedItem"],
      code: `<SegmentedControl defaultValue="3m" aria-label="Range">
  <SegmentedItem value="1m">1M</SegmentedItem>
  <SegmentedItem value="3m">3M</SegmentedItem>
</SegmentedControl>`,
    },
    guidance: {
      use: [
        "Use it for one value with two to five short options that should all stay visible.",
        "Reach for `fill` inside a panel header, and `sm` in a toolbar or a topbar.",
        "Put the item's meaning in its text; `leadingIcon` is decoration beside it.",
      ],
      avoid: [
        "Use a segmented control for independent options — that is `ToggleGroup`, and the sliding indicator would lie about the state.",
        "Use it as navigation: it selects a value, it does not go somewhere.",
        "Disable the whole control for one unavailable option; disable the item.",
      ],
    },
    accessibility: {
      detail:
        "The control is a single-value composite: one tab stop, arrow keys between the items, and the selected item is the only one reported as selected. A disabled item is skipped by the arrow keys and can never take the value.",
    },
  },
  sections: {
    usage: {
      imports: ["FormSection", "FieldArray"],
      code: `<FormSection title="Identity" description="What this run is called.">
  <Input defaultValue="Momentum v3" aria-label="Run name" />
</FormSection>`,
    },
    guidance: {
      use: [
        "Group a long form with `FormSection`: a heading, a description and, from `sm` up, a column count.",
        "Reach for `FieldArray` when rows repeat, and keep the array in your form engine — the component owns the controls, not the data.",
        "Omit `onAdd` and `onRemove` for a fixed-length group: the same layout without buttons that would have nothing to do.",
      ],
      avoid: [
        "Number the sections by hand (`1.`, `2.`) — the order is the structure, and a heading keeps it readable when rows move.",
        "Store the array inside `FieldArray`; a re-render would lose it, and a form engine already owns it.",
        "Add reordering where the order has no meaning.",
      ],
    },
    accessibility: {
      detail:
        "A section is a real `<section>` with a heading, so a screen-reader user can jump between blocks. Every row control is a real button with a name that says what it does to which row, the row count is announced, and `minRows` stops the group from being emptied when the last row must stay.",
    },
  },
  select: {
    usage: {
      imports: ["Select", "SelectTrigger", "SelectValue", "SelectContent", "SelectItem"],
      code: `<Select value={range} onValueChange={setRange}>
  <SelectTrigger aria-label="Range">
    <SelectValue placeholder="Choose a range" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="1y">1 year</SelectItem>
  </SelectContent>
</Select>`,
      note: "The trigger is the tab stop and the menu owns the active option. `size` on the root drives the trigger, the type scale and the menu rhythm together.",
    },
    guidance: {
      use: [
        "Use it for one value out of a known set that a reader recognises on sight; the options stay behind one click.",
        "Put the short name in `SelectItem` and the code or unit in its `description`, rather than making the label long.",
        "Set `size` on the root so the trigger and the menu keep one rhythm, and `invalid` on the trigger when the form rejected the value.",
      ],
      avoid: [
        "Use a select for a list that has to be searched — that is `Combobox`; for an action that runs, that is `Command`.",
        "Use `SelectItem` for navigation: it sets a value, it does not go anywhere.",
        "Style the trigger's height or padding by hand: the size token exists so a dropdown matches the input beside it.",
      ],
    },
    accessibility: {
      detail:
        "Radix supplies the listbox model: Enter or Space opens, the arrow keys move the active option, Home and End jump to the ends, typeahead selects by letter and Escape closes and returns focus to the trigger. The trigger carries the accessible name, and a `placeholder` is announced only until a value is chosen.",
    },
  },
  "number-input": {
    usage: {
      imports: ["NumberInput"],
      code: `<NumberInput value={lookback} onValueChange={setLookback} min={5} max={400} step={5} aria-label="Lookback (days)" />`,
    },
    guidance: {
      use: [
        "Use `NumberInput` for a measured quantity, `CurrencyInput` for money and `PercentageInput` for a ratio — the unit is part of the component, not a suffix someone typed.",
        "Give `step` the granularity the value really has: it snaps typed input onto the grid and it is what the steppers move by.",
        "Set `min` and `max` when the quantity has a floor or a ceiling the form has to enforce; the steppers stop at the ends.",
      ],
      avoid: [
        "Use a text input with `parseFloat` in the handler: the component owns parsing, the decimal separator and the commit-on-blur rule.",
        "Leave `scale` off `PercentageInput`: a percentage without a declared scale is the ambiguous 0.12 the component exists to prevent.",
        "Format money with a currency symbol you typed — `currency` is the prop, and it drives the prefix and the grouping.",
      ],
    },
    accessibility: {
      detail:
        "The control is a real `<input>` with `inputMode` set for the numeric keypad, and the steppers are buttons with names rather than decorative glyphs. A number commits on blur or Enter, so a partially typed value is never read as a different one, and `Field` supplies the label, the description and the message.",
    },
  },
  combobox: {
    usage: {
      imports: ["Combobox"],
      code: `<Combobox options={instruments} value={instrument} onValueChange={setInstrument} aria-label="Instrument" />`,
      note: "`options` is the list and `value` is the whole selected option rather than its id. Nothing here fetches: pass `loading` and hand back options from a request you own.",
    },
    guidance: {
      use: [
        "Use it when the reader has to search to find the value; a handful of options they recognise on sight is `Select`.",
        "Pass `inputValue` and `onInputValueChange` when the list comes from a request, and keep that request in your own code.",
        "Write `emptyMessage` as a sentence about the query — an empty result is a state the reader has to be told about.",
      ],
      avoid: [
        "Wait for the empty state to explain a failed request: `emptyMessage` says nothing matched, `loading` says work is in flight.",
        "Filter a large remote list in the browser because the control feels instant; `filter` is a matcher for the options you already hold.",
        "Assume the clear button can be removed for tidiness — set `clearable={false}` only when the value may never be unset.",
      ],
    },
    accessibility: {
      detail:
        "The input keeps `role=\"combobox\"` with `aria-expanded` and `aria-activedescendant`, and the list is a `role=\"listbox\"` whose rows are `role=\"option\"`. Arrow Down and Arrow Up move the highlight without moving focus, Enter selects what is highlighted, Escape closes without changing the value, and Tab away closes the list instead of leaving it floating. The three built-in buttons take `clearLabel`, `openLabel` and `closeLabel` so a page in another language can name them.",
    },
  },
  "password-input": {
    usage: {
      imports: ["PasswordInput"],
      code: `<PasswordInput autoComplete="new-password" aria-label="New API secret" />`,
    },
    guidance: {
      use: [
        "Reach for it instead of `type=\"password\"` on a plain input: the reveal control and its accessible name come with it.",
        "Set `autoComplete` to `current-password` or `new-password` so a password manager offers the right thing at the right time.",
        "State the rule in the `Field` description, where it can be read before typing rather than after a failed submit.",
      ],
      avoid: [
        "Enforce a policy in the component: length rules, breach checks and lockouts belong to the product's security review.",
        "Block paste or drop: a field that refuses paste breaks password managers and long passphrases alike.",
        "Let the strength readout be the only feedback, since it says something is wrong without saying what to change.",
      ],
    },
    accessibility: {
      detail:
        "The reveal control is a real button whose name switches between show and hide and whose pressed state is reported, and the field keeps `type=\"password\"` until the reader asks otherwise — so a password manager sees an ordinary password field. Spell-check is off, and nothing in the component touches paste or copy.",
    },
  },
  "otp-input": {
    usage: {
      imports: ["OtpInput"],
      code: `<OtpInput length={6} groups={[3, 3]} value={code} onValueChange={setCode} aria-label="Verification code" />`,
      note: "`length` fixes the number of slots; `onComplete` fires once the last one is filled, which is where the check belongs.",
    },
    guidance: {
      use: [
        "Give it `length` and, when the provider breaks the code up, `groups` — six digits read better as three and three.",
        "Run the check from `onComplete` rather than watching the value, so it fires once instead of on every keystroke.",
        "Set `mode` only when the code really is alphanumeric; the default keeps a numeric keypad on a phone.",
      ],
      avoid: [
        "Ask for more characters than the provider issues: extra empty slots invite a typo and a failed code.",
        "Build the slots out of separate inputs — the group is announced as one field, and separate boxes lose that.",
        "Put the resend control inside the code field; resending belongs to the page that owns the request.",
      ],
    },
    accessibility: {
      detail:
        "The slots are one labelled field: assistive technology hears a single input of `length` characters carrying `autocomplete=\"one-time-code\"`, not a row of unlabelled boxes. Typing advances, Backspace retreats, a pasted code fills every slot at once, and `invalid` reaches the input from a `Field` that owns the message.",
    },
  },
  "file-input": {
    usage: {
      imports: ["FileInput"],
      code: `<FileInput accept={[".csv", "text/csv"]} multiple onFilesChange={setFiles} aria-label="Upload runs" />`,
      note: "The same component with `variant=\"dropzone\"` — exported as `DropZone` — is the larger target for when dragging is the primary gesture.",
    },
    guidance: {
      use: [
        "Pass `accept` and `maxSize` together: the picker filters what it can and the drop path validates what it cannot.",
        "Read `onReject` and show the reason, because a file that disappears without a sentence reads as a bug.",
        "Keep the compact variant in a form row, and reach for `DropZone` when importing is the whole task.",
      ],
      avoid: [
        "Imply a transfer that happened: this component selects and validates files, and the upload is the caller's.",
        "Leave `maxSize` off a surface that can receive a multi-gigabyte file; the ceiling is documentation the reader needs.",
        "Use a drop zone as a decorative panel — a dashed target is a promise that dropping does something.",
      ],
    },
    accessibility: {
      detail:
        "The picker is a real file input behind a labelled row, so it is reachable by keyboard and announced by name; the drop area is an extra path rather than the only one. A rejected file is reported as text with its reason and sets the field invalid, and `hint` is wired to the input instead of merely printed beside it.",
    },
  },
  "file-upload": {
    usage: {
      imports: ["FileUpload"],
      code: `<FileUpload items={items} onFiles={startUpload} onRemove={removeItem} accept=".csv" multiple />`,
      note: "`items` is your own state, including each row's `status` and `progress`: the component renders the transfer and never performs one.",
    },
    guidance: {
      use: [
        "Drive `items` from your own upload code, so a failure keeps its message, its retry and its place in the list.",
        "Set `status` honestly — queued, uploading, done, error — because the row's treatment and announcement follow it.",
        "Give the list a `listLabel` when it sits away from the target, so it is a named region a reader can navigate to.",
      ],
      avoid: [
        "Render a progress bar you cannot fill: omit `progress` while the transfer length is unknown instead of parking it at zero.",
        "Retry in the background on failure — expose `onRetry` and let the reader decide when to try again.",
        "Reject a file without saying why: the rejection carries a `reason` and a sentence, and both belong on screen.",
      ],
    },
    accessibility: {
      detail:
        "The drop target carries a real Browse files button and the file list is a labelled list, so the whole surface works without a pointer. Every row states its file's name, size and status as text — including the failure reason — and the retry and remove controls are named buttons rather than bare glyphs.",
    },
  },
  field: {
    usage: {
      imports: ["Field"],
      code: `<Field label="Lookback" description="Bars used to warm up indicators.">
  <Input defaultValue="200" />
</Field>`,
      note: "`Field` is the one place the library decides `<label>` semantics: the control inside it inherits the id, the description and the message, so nothing is written by hand.",
    },
    guidance: {
      use: [
        "Wrap every control in a `Field` and let it own the id, the description and the message rather than writing `htmlFor` by hand.",
        "Reach for `Fieldset` with a legend when several controls answer one question, and `FieldGroup` only for the columns.",
        "Use `validating` and `success` where they mean something — a check in flight, a value that was actually confirmed.",
      ],
      avoid: [
        "Stack two messages on one field: description, pending check, success and error share one slot, and the error wins.",
        "Read `success` as “the reader filled this in” — it is for a checked value, such as an availability probe.",
        "Put a `Label` inside a `Field`: the field already renders one, and two labels for one control make the name ambiguous.",
      ],
    },
    accessibility: {
      detail:
        "The field generates the control's id and hands down the `aria-describedby` list and the invalid, disabled and read-only states through context, so the message the reader sees is the one the control is described by — an error never stacks on top of stale helper text. The error row is a live `role=\"alert\"`, and `required` reaches assistive technology through the control's own attribute while the asterisk stays hidden from it.",
    },
  },
  slider: {
    usage: {
      imports: ["RangeSlider", "Slider"],
      code: `<RangeSlider value={band} onValueChange={setBand} min={0} max={100} aria-label="Percentile band" />`,
      note: "`value` is a number on `Slider` and a two-item pair on `RangeSlider`, which hands the pair back sorted so a caller never re-orders it.",
    },
    guidance: {
      use: [
        "Use a slider when the range matters more than the exact number; a value that has to be typed exactly is `NumberInput`.",
        "Show the formatted value and keep the label outside the control: a bare thumb is a guess, and a bubble is not a name.",
        "Name each end of a range with `thumbLabels`, so the pair is not announced as two identical controls.",
      ],
      avoid: [
        "Re-purpose the value bubble as the permanent label — it appears on hover, focus and drag by design, and is absent at rest.",
        "Let the two ends cross: `minStepsBetweenThumbs` is the gap the thumbs keep, and a band that can invert is not a band.",
        "Rescale a percentage and format it as a fraction: `formatValue` is display only and the submitted number is unchanged.",
      ],
    },
    accessibility: {
      detail:
        "Every thumb is a focusable slider with its own value bounds, so the arrow keys step it, Home and End jump to the ends, and the value is announced from the thumb rather than from the decorative bubble. A range therefore needs one name per thumb — `thumbLabels` for a pair, `label` for a single value — and a disabled slider keeps its colour treatment so the label and the value stay readable.",
    },
  },
  form: {
    usage: {
      imports: ["Form", "FormActions", "SubmitButton"],
      code: `<Form onSubmit={save}>
  <Field label="Run name">
    <Input defaultValue="Momentum v3" />
  </Field>
  <FormActions>
    <SubmitButton loadingText="Saving">Save</SubmitButton>
  </FormActions>
</Form>`,
      note: "Return a promise from `onSubmit` and the shell owns `submitting` and the error; return a status instead when the outcome is yours to decide.",
    },
    guidance: {
      use: [
        "Return a promise from `onSubmit` and let the shell own the pending state — `SubmitButton` already reads it.",
        "Keep your form engine, whatever it is, and let `errors` carry its result into the summary.",
        "Group a long form with `FormSection`, so the summary can name the part an error came from.",
      ],
      avoid: [
        "Track `isSubmitting` beside the form: `useLucForm` publishes the same status the submit button is reading.",
        "Report a failed save in a toast alone — after pressing the button, the reader looks back at the form.",
        "Rely on native validation: the shell turns it off by default so the messages come from `Field`.",
      ],
    },
    accessibility: {
      detail:
        "The summary appears after a failed submit rather than while the reader is typing, it is announced as an alert, and each row is a button that moves focus to the field that caused it. It deliberately does not take focus on mount, so it never competes with a form engine that focuses the first invalid control.",
    },
  },
  /* ------------------------------------------------------------- date & time */
  /*
   * The three date and time entries are where the *value type* is the
   * contract, so the guidance is written the way the library is: a
   * `CalendarDate` is not a `Date`, a wall clock is not an instant, and the
   * difference between `Calendar`, `DatePicker` and `DateRangePicker` is which
   * question the control is asking rather than how it looks.
   *
   * They carry no `usage` row on purpose. All three routes are hand-written
   * pages (`status: "curated"`, with a `pageFile`), so the registry never
   * renders them and a `usage` snippet here would be a second copy of the
   * import line the page already prints — the exact drift this file exists to
   * prevent. The generated entries are the ones whose Usage comes from here.
   */
  calendar: {
    guidance: {
      use: [
        "Reach for `Calendar` when the grid is the content of the page — a review screen, a scheduler — and for `DatePicker` when the grid belongs behind a field in a form.",
        "Pass `locale` (or wrap the subtree in `LocaleProvider`) instead of letting the browser decide: that is what keeps week start, month names and numerals identical on the server and in the browser.",
        "Block a day with `isDateUnavailable` rather than removing it, so the day stays focusable, announced and visible as a struck-through cell.",
      ],
      avoid: [
        "Turn a date-only value into a JavaScript `Date`. `new Date(\"2026-09-18\")` is UTC midnight, so west of Greenwich it reads back as the 17th; `dateOnlyFromInstant(instant, timeZone)` is the one way across, and it demands the zone.",
        "Force `months={2}` into a narrow column: two months are 472 px wide, which is wider than a phone and clips the second grid.",
        "Use a date grid to collect a time as well — that is `DateTimePicker`, and a calendar that quietly picked 00:00 would be inventing an answer.",
      ],
    },
    accessibility: {
      detail:
        "React Aria owns the grid contract: one tab stop for the whole grid, arrow keys to move by day, Page Up and Page Down by month, Home and End to the ends of a week, and each cell announced with its full date and whether it is unavailable. A `Calendar` needs its own accessible name (`aria-label`), and a `RangeCalendar` announces the two ends as start and end rather than as two unrelated grids.",
    },
  },
  "date-picker": {
    api: {
      note: "Four components share this module because they are one control with four value types — `DateField` and `DatePicker` edit a `CalendarDate`, `DateTimePicker` a `CalendarDateTime`, `ZonedDateTimePicker` a `ZonedDateTime`. The tables below are that module's whole public surface.",
    },
    guidance: {
      use: [
        "Choose the component by the value it stores, not by the layout: a date is `DatePicker`, a wall clock is `DateTimePicker`, an instant in a named zone is `ZonedDateTimePicker`.",
        "Separate the two constraints — `minValue`/`maxValue` bound the range a value may fall in, `isDateUnavailable` names the exceptions inside it.",
        "Pass `todayValue` wherever the result has to be reproducible (a demo, a test, a server render), so the Today action cannot mean a different day tomorrow.",
        "Use `DateField` in a dense filter bar where a month grid would be too much surface; it is the same segmented control without the popover.",
      ],
      avoid: [
        "Substitute a plain text input for the segmented field: the segments are the keyboard contract, and their order is the locale's rather than the one you guessed.",
        "Convert a zoned value to a date inside the component's value — `ZonedDateTimePicker` keeps the identifier it was given, and dropping it is a product decision.",
        "Rely on `required` for the message: it marks the control, `Field` with an `error` explains it.",
      ],
    },
    accessibility: {
      detail:
        "The field is one tab stop whose segments take arrow keys (Up and Down step a segment, Tab leaves the field), and a partially typed date is announced as incomplete rather than as an error. The calendar button is a second tab stop with its own name, the popover returns focus to the field when it closes, and `isDateUnavailable` reports through `aria-disabled` so a blocked day is announced as unavailable rather than as absent.",
    },
  },
  "time-picker": {
    guidance: {
      use: [
        "Leave `hourCycle` unset and let the locale decide, unless the product has one house convention; a 12-hour and a 24-hour clock are two different readers, not two qualities.",
        "Match the popover to the value with `minuteStep` (and `secondStep` when `granularity=\"second\"`), so the coarse grid offers the times the field can actually represent.",
        "Bound a session with `minValue`/`maxValue` when the domain has opening hours, and let the field report the violation instead of correcting it silently.",
      ],
      avoid: [
        "Store a time of day as a full timestamp. A wall clock with a date attached invites a zone question the value cannot answer.",
        "Attach a zone to a `Time`: “14:30 in Berlin” is a `ZonedDateTime`, and `ZonedDateTimePicker` is the control for it.",
        "Treat the step as validation — typing 14:07 is allowed on a five-minute grid, because the step constrains the popover rather than the value.",
      ],
    },
    accessibility: {
      detail:
        "The field is one group with labelled hour, minute and (when asked for) second segments: a single tab stop, arrow keys between segments, Up and Down to step a segment, and digits typed straight in. The popover's columns are listboxes with roving focus, and the Now action is a real button rather than a click target on the value.",
    },
  },
  /* ----------------------------------------------------------------- layout */
  /*
   * The layout primitives are the components a reader copies before they style
   * anything, and the thing they get wrong is not the API — it is *which* of
   * the three spacing primitives answers their question. So the guidance here
   * is mostly a boundary: `Container` for the measure, `Grid` for a known count
   * in two dimensions, `Inline` and `Stack` for one axis each, and `Panel`
   * rather than `Card` for a region inside a surface.
   *
   * All ten entries are generated pages, so `usage` is read and rendered by the
   * canonical template.
   */
  container: {
    usage: {
      imports: ["Container", "Stack"],
      code: `<Container width="content">
  <Stack gap="xl">…</Stack>
</Container>`,
      note: "`width` picks the measure and `gutter` the horizontal padding; a page uses one Container, at its top.",
    },
    guidance: {
      use: [
        "Use one `Container` per page, near the top, and nothing else that sets a max width — a nested maximum is how a page ends up with three different measures.",
        "Reach for `width=\"prose\"` on a page that is only text, and `content` for anything holding panels, grids or tables.",
        "Switch `gutter` off only inside a surface that already carries its own padding, such as a full-bleed `Panel`.",
      ],
      avoid: [
        "Do not use a `Container` to centre one card or one control: that is a `Stack` with an alignment, or a width on the single element.",
        "Do not compensate for the gutter with a negative margin on a child — `gutter={false}` says the same thing without hiding it.",
        "Do not nest two containers to make a narrower column: the narrower measure is what `width=\"prose\"` is for.",
      ],
    },
    accessibility: {
      detail:
        "A `Container` is a `<div>`: no role, no keyboard behaviour, no landmark. It is measure and padding only, so the page's landmarks and heading order come from the elements the page chooses — and a container cannot supply them on its behalf.",
    },
  },
  grid: {
    usage: {
      imports: ["Grid"],
      code: `<Grid columns={3} gap="md">
  {items.map((item) => <Card key={item.id} … />)}
</Grid>`,
      note: "`columns` fixes the count, `minItemWidth` fits as many as will go; `gap` is the same scale `Stack` and `Inline` use.",
    },
    guidance: {
      use: [
        "Reach for `columns` when the number is known and stable — a four-metric summary — and `minItemWidth` when it is not, such as a filter result or a card catalogue.",
        "Keep the grid's gap on the same scale as the `Stack` around it: the two scales are one scale, and mixing them looks hand-built.",
        "Give a cell its own span with a class on the child (`sm:col-span-2`); the grid deliberately has no span prop.",
      ],
      avoid: [
        "Do not lay a two-column form out with a grid: `FieldGroup` already does that, with the labels and the error messages in the right order.",
        "Do not set a fixed height on a cell to make a row line up — let the tallest cell define the row.",
        "Do not use `columns={6}` near a phone: every count collapses on the way down, and six columns at 390px is unreadable.",
      ],
    },
    accessibility: {
      detail:
        "CSS Grid on a `div`: no semantics and no keyboard behaviour, so the reading order is the source order — which is why a wall of cards has to be written in the order a screen reader should read it. Nothing here is tabular; data that is a table belongs in `DataTable`, which renders real table markup with scoped headers.",
    },
  },
  inline: {
    usage: {
      imports: ["Inline"],
      code: `<Inline gap="sm" align="baseline">
  <Text variant="caption" tone="muted">Lookback</Text>
  <Text variant="body">200 weeks</Text>
</Inline>`,
      note: "One row, one gap, one alignment — and `justify` when the row has two ends to hold apart.",
    },
    guidance: {
      use: [
        "Use `Inline` for a row of things that belong together: a label and its value, a group of actions, a set of filters.",
        "Let a row whose contents can grow wrap (`wrap`, the default), and keep `wrap={false}` for a toolbar that must not reflow.",
        "Prefer `align=\"baseline\"` when the row is text: it puts a caption, a value and a unit on one line of type.",
      ],
      avoid: [
        "Do not use an `Inline` where the order is meaningful and should be announced — an ordered sequence is `Stack as=\"ol\"`.",
        "Do not fix the height of a wrapping row: the wrap is the point, and the second line gets clipped.",
        "Do not spread three or more peers with `justify=\"between\"`: it turns a cluster into a bar with holes in it.",
      ],
    },
    accessibility: {
      detail:
        "A row is a `div` (or whatever `as` names) with flex on it: the items are announced in source order, and nothing becomes a landmark. A row of interactive controls that is one group needs a name — `role=\"group\"` with an `aria-label`, or the Actions family's `Toolbar`, which brings the roving-focus contract with it.",
    },
  },
  stack: {
    usage: {
      imports: ["Stack"],
      code: `<Stack gap="md">
  <Text variant="label">Lookback</Text>
  <Text variant="body">200 weeks</Text>
</Stack>`,
      note: "`gap` is the only spacing decision; `as` changes the element when the group has a meaning of its own.",
    },
    guidance: {
      use: [
        "Use `Stack` for every vertical rhythm, including the one-child case: the alternative is a margin on the child, and facing margins do not collapse predictably inside flex.",
        "Nest a `gap=\"xs\"` stack inside a `gap=\"lg\"` one to keep a label with its value while the topics stay apart.",
        "Reach for `as` when the group is a list, a nav or a form rather than wrapping the stack in another element to get the semantics.",
      ],
      avoid: [
        "Do not use a `Stack` for two elements that are really the columns of one row; that is `Grid` or `Inline`.",
        "Do not set a gap and margins on the same group: two spacing systems in one place is what this component exists to remove.",
        "Do not push a footer down with a gap — a minimum height and `mt-auto` on the footer says it once, and says it in the right place.",
      ],
    },
    accessibility: {
      detail:
        "`Stack` renders a `div` by default and adds no roles, but `as` *is* its accessibility feature: a stack of rows can be a real `ul` with `li` children, a `nav` or a `form`, and the element is what a screen reader announces and counts.",
    },
  },
  section: {
    usage: {
      imports: ["Section"],
      code: `<Section title="Overview" description="Four measurements, one lookback.">
  …
</Section>`,
      note: "The title, the description and the `actions` slot are one header row; the section owns the space between that row and its content.",
    },
    guidance: {
      use: [
        "Use `Section` where a band of a page needs a title and a description: owning that rhythm is what makes a long page scannable.",
        "Let the page space the sections (`Stack gap=\"xl\"`) and let each section space its own contents.",
        "Put the one thing a reader can do to this band in `actions`, so the header reads as a single row rather than a heading with a button beside it.",
      ],
      avoid: [
        "Do not use `Section` as a surface: it draws no background and no border — a `Card` or a `Panel` is the surface.",
        "Do not give a section the page's `h1`; the section's own title is already the right level in the outline.",
        "Do not repeat the page title in a section title: a band called Overview inside a page called Overview costs a line and says nothing.",
      ],
    },
    accessibility: {
      detail:
        "The component renders a real `<section>` containing an `<h2>`, and that heading is what names the region in a screen reader's outline — a `<section>` with no heading is announced as an unnamed region, which is worse than a plain `div`. The description is a paragraph associated by position rather than by ARIA, so it stays readable copy instead of becoming a second label.",
    },
  },
  panel: {
    usage: {
      imports: ["Panel", "PanelBody", "PanelHeader"],
      code: `<Panel>
  <PanelHeader>
    <Text variant="label">Constituents</Text>
  </PanelHeader>
  <PanelBody>…</PanelBody>
</Panel>`,
      note: "`tone` says where the panel sits in the stack, not how important it is; `bordered` drops the frame when the surface outside it already has one.",
    },
    guidance: {
      use: [
        "Use `Panel` for the regions *inside* a page or a card: a toolbar, a sidebar, a code block, a section of an inspector.",
        "Pick `tone=\"sunken\"` when the panel sits on a raised surface and `tone=\"raised\"` when it has to read as a layer inside a dense tool screen.",
        "Use the `PanelHeader` action slot rather than a row of buttons above the panel — a toolbar belongs on the region it acts on.",
      ],
      avoid: [
        "Do not stack two surfaces with the same tone: two identical panels side by side read as one broken surface.",
        "Do not add elevation to a Panel by class; elevation belongs to `Card`, and a page with both has two shadows competing.",
        "Do not nest a panel inside a panel without changing the tone — the hairline between them is what makes the nesting legible.",
      ],
    },
    accessibility: {
      detail:
        "A panel is a `div`: a surface, not a landmark. When it is a page's toolbar it needs a name (`aria-label`) or an enclosing `Toolbar`, and when it groups controls it should be a `fieldset` or carry `role=\"group\"` — the component adds neither, because only the caller knows which region it is.",
    },
  },
  separator: {
    usage: {
      imports: ["Separator"],
      code: `<Separator />

<Separator orientation="vertical" className="h-4" />`,
      note: "A vertical rule has no intrinsic height inside a flex row, so it is given one.",
    },
    guidance: {
      use: [
        "Use a separator where the structure changes: between page bands, between groups inside a row, between list rows that share one frame.",
        "Give a vertical rule a height (`className=\"h-4\"`); inside a row it has nothing to stretch against.",
        "Reach for `variant=\"ornament\"` when the break is a pause in reading rather than a boundary between regions.",
      ],
      avoid: [
        "Do not use a rule to fix spacing: if the gap is wrong, the gap is wrong — a line in its place is decoration with a job it cannot do.",
        "Do not put one above and below every card in a grid; the grid's gap already separates them, and six rules make a table out of a grid.",
        "Do not rely on it to communicate grouping to assistive technology — a decorative separator is hidden on purpose.",
      ],
    },
    accessibility: {
      detail:
        "The separator is decorative by default, which is right for a rule that states what the layout already says. `decorative={false}` makes it a real `role=\"separator\"` carrying its orientation — worth doing when the line marks a genuine boundary between two groups rather than just separating space.",
    },
  },
  "scroll-area": {
    usage: {
      imports: ["ScrollArea"],
      code: `<ScrollArea className="h-64" viewportClassName="p-3">
  …
</ScrollArea>`,
      note: "Give the region a definite height, and put the content's own padding on `viewportClassName` so it scrolls with the content.",
    },
    guidance: {
      use: [
        "Give the region a definite size or a definite parent: a scroll area with no height constraint simply grows, and the reader gets the page's scrollbar instead of the component's.",
        "Pass the content's padding and layout through `viewportClassName`, so the padding scrolls with the content and the scrollbar does not land on top of it.",
        "Use it for a long list, a wide table or a code block inside a fixed-height panel — the cases where a platform scrollbar's width would shift the layout.",
      ],
      avoid: [
        "Do not nest two scroll areas on the same axis: nested vertical scrolling traps a trackpad and a keyboard alike.",
        "Do not hide the scrollbar to make a region prettier — `type=\"hover\"` keeps the cue, and `type=\"always\"` is for a reader who has to know there is more.",
        "Do not use it as a page container: the page already scrolls, and a second scrollbar costs the reader their position in it.",
      ],
    },
    accessibility: {
      detail:
        "The viewport is a tab stop with a visible focus ring, because a keyboard user cannot drag a scrollbar and the content has to be reachable without a pointer. The scrollbars themselves are decorative in the accessibility tree, so nothing is announced twice — and content below the fold is still in the DOM, so it is still read and still searchable.",
    },
  },
  "aspect-ratio": {
    usage: {
      imports: ["AspectRatio"],
      code: `<AspectRatio ratio="video">
  <img src="…" alt="…" className="size-full object-cover" />
</AspectRatio>`,
      note: "A preset name (`square`, `photo`, `video`, `wide`, `portrait`, `ultrawide`) or any number.",
    },
    guidance: {
      use: [
        "Use it wherever the media arrives late — an image, a chart canvas, an embed — because the reserved box is what removes the shift when it loads.",
        "Name the shape with a preset (`video`, `photo`, `wide`) and pass a number only for a ratio the presets do not have.",
        "Put the frame on the container and let the media fill it (`size-full object-cover`), so the child never decides the height.",
      ],
      avoid: [
        "Do not set a height on the child as well: two sources for one box is how a ratio drifts.",
        "Do not use it to make a box a fixed pixel size — it holds a ratio, and the width still comes from the layout.",
        "Do not wrap a paragraph in a ratio box: prose has no ratio, and the text gets clipped rather than scaled.",
      ],
    },
    accessibility: {
      detail:
        "The box is a `div` carrying a `ratio` style and no role, so what it wraps still needs its own name — `alt` on the image, a title on the frame. Because the space is reserved before the media loads, a reader with images disabled gets an empty box of the right size rather than a collapsed layout, and a screen reader is unaffected either way.",
    },
  },
  card: {
    guidance: {
      use: [
        "Keep one clickable surface per card, and let the controls inside it stay visible rather than nesting one card in another.",
        "Use a `Panel` for structure inside a surface and a `Card` for the content unit a reader acts on.",
        "Set `interaction=\"selectable\"` before you pass `selected`: a card that cannot be selected has no state to show, which is the one combination a reader gets wrong here.",
        "Let the spatial effects (`SpotlightSurface`, `BorderGlow`, `TiltSurface`) wrap a card, so the base component stays calm by default.",
      ],
      avoid: [
        "Do not put a glow on a passive card: an effect that only decorative cards have is an effect that means nothing.",
        "Do not nest an interactive card inside another one — two click targets in the same rectangle is an ambiguous control.",
        "Do not make every card in a grid interactive on the chance that one is; the hover treatment then signals nothing at all.",
      ],
    },
    accessibility: {
      detail:
        "Interaction is opt-in and the whole surface becomes the control: `interaction=\"interactive\"` or `interaction=\"selectable\"` renders the element `as` names — a real `<button>` or `<a href>` — so Enter, Space and focus order come from the browser. That is also why an interactive card must not contain another interactive card, and why a selected card carries `data-selected` as well as its accent border: the state is in the DOM, not only in the pixels.",
    },
  },

  /* -------------------------------------------------------------- navigation */
  /*
   * The Navigation family. Its five entries are one theme: *where am I, and how
   * do I get somewhere else* — a shell that owns the landmarks, a strip that
   * switches a region, a hierarchy you can walk, a sequence you are partway
   * through, and a result set you are paging. Each page therefore has one thing
   * to say about position and one about movement, and the advice is about which
   * of the five answers the reader's actual question.
   */
  "app-shell": {
    api: {
      note: "One import publishes four modules: the shell, the sidebar parts, the breadcrumbs and the page header. All four tables are below — the shell's two components and `SidebarItem` are open, and the rest of the sub-surface folds away behind a disclosure, because a page that documents five modules at once has to keep a reader from scrolling through props they did not come for.",
    },
    usage: {
      imports: [
        "AppShell",
        "AppShellContent",
        "AppShellStatusBar",
        "AppShellTopbar",
        "SidebarContent",
        "SidebarGroup",
        "SidebarGroupLabel",
        "SidebarItem",
        "SidebarMenu",
      ],
      code: `<AppShell
  pathname={pathname}
  renderLink={(props) => <Link {...props} />}
  sidebar={
    <SidebarContent ariaLabel="Sections">
      <SidebarGroup>
        <SidebarGroupLabel>Research</SidebarGroupLabel>
        <SidebarMenu>
          <SidebarItem label="Datasets" href="/datasets" />
        </SidebarMenu>
      </SidebarGroup>
    </SidebarContent>
  }
  topbar={<AppShellTopbar>…</AppShellTopbar>}
>
  <AppShellContent>…</AppShellContent>
</AppShell>`,
      note: "The shell owns the landmarks, the skip link and the responsive switch; the sidebar's contents are yours. `renderLink`, `pathname` and `onNavigate` are the only router-shaped props — the library never imports a router.",
    },
    guidance: {
      use: [
        "Reach for `AppShell` when a product has a sidebar, a topbar and a scrolling main region: the landmark structure, the skip link and the off-canvas drawer come with it.",
        "Pass `height=\"fill\"` when the shell lives inside a pane, a preview or a test rather than filling the document.",
        "Keep navigation *data* in a `NavigationGroup[]` and render it into the sidebar, the drawer and the palette from that one model, so a page cannot exist in one surface and be missing from another.",
      ],
      avoid: [
        "Do not write page-local shell CSS: the sidebar width, the topbar height and the status strip are tokens, and a page that overrides them is a second shell.",
        "Do not import a router into a component to make a link work — supply `renderLink` from the product, which is what keeps the library renderer-agnostic.",
        "Do not give the topbar a translucent background: text over a scrolled surface is the pattern the design system forbids, and the hairline underneath is what separates it.",
      ],
    },
    accessibility: {
      detail:
        "The shell renders the `aside`, `header` and `main` landmarks, a skip link to the content region, and one named `nav` (`SidebarContent ariaLabel`) per sidebar — so a screen-reader user can jump straight to the navigation and to the content. Collapsing to the rail keeps every label in the DOM as the accessible name and reveals it with the existing tooltip, the rail is a real button outside the collapsed content, and any in-shell navigation closes the mobile drawer through one handler. `Ctrl/⌘ + B` is opt-out with `sidebarShortcut`.",
    },
  },
  tabs: {
    api: {
      note: "`Tabs` is one symbol carrying its own parts: `.List` (adds `fill`), `.Trigger` (adds `leadingIcon`) and `.Content`. The table below is the root's props, which is where `variant`, `size` and the controlled pair live; the parts take the Radix props their names imply.",
    },
    usage: {
      code: `<Tabs defaultValue="overview">
  <Tabs.List>
    <Tabs.Trigger value="overview">Overview</Tabs.Trigger>
    <Tabs.Trigger value="metrics">Metrics</Tabs.Trigger>
  </Tabs.List>
  <Tabs.Content value="overview">…</Tabs.Content>
  <Tabs.Content value="metrics">…</Tabs.Content>
</Tabs>`,
      note: "`Tabs.List`, `Tabs.Trigger` and `Tabs.Content` are the same import as `Tabs`; a trigger and its panel are paired by `value`.",
    },
    guidance: {
      use: [
        "Use `Tabs` for alternative views of one subject, where the label is the navigation and the reader can leave and come back.",
        "Give every enabled trigger a `Tabs.Content`, even an empty one, so the `aria-controls` relationship always resolves to a panel.",
        "Reach for `variant=\"surface\"` when the strip sits inside a panel and `fill` when the triggers should divide the available width.",
        "Let the shared indicator carry the selection: it measures the two adjacent triggers and slides on the emphasized curve, which is why the labels can stay quiet.",
      ],
      avoid: [
        "Do not use tabs for a value that is submitted with a form: that is a `SegmentedControl`, which is a toggle group and reports its value, while a tab reports which panel is showing.",
        "Do not grow the active label's weight — the row reflows and the shared indicator's own geometry moves with it.",
        "Do not put two tab strips in one region with different meanings; the reader has no way to tell which one the arrows belong to.",
      ],
    },
    accessibility: {
      detail:
        "Radix owns the tab contract: one Tab stop for the strip, arrow keys move between triggers, Home and End jump to the ends, and each trigger carries `aria-selected` and `aria-controls`. The shared indicator is `aria-hidden` decoration, so the active state never depends on the animation — and under `prefers-reduced-motion` the indicator does not animate at all, it arrives.",
    },
  },
  pagination: {
    api: {
      note: "`paginationWindow` is exported and pure because the window *is* the component: a caller that needs to know which pages are on screen — to map a keyboard shortcut, or to prefetch — should call it rather than write a second version of the rule.",
    },
    usage: {
      code: `<Pagination page={page} pageCount={24} onPageChange={setPage} />`,
      note: "1-based `page` and a `pageCount`; everything else — the window, the gaps, the disabled arrows — is derived.",
    },
    guidance: {
      use: [
        "Let the component derive the window: `siblings` is the only knob a breakpoint needs, and a hand-built page array cannot re-derive itself for a narrower container.",
        "Name the landmark for the collection it pages (`label=\"Trades\"`), and put the row summary next to the controls with `PaginationSummary`.",
        "Reach for `compact` in a card footer or a mobile toolbar, where the arrows and the `12 / 24` status are the whole control.",
      ],
      avoid: [
        "Do not re-derive the window yourself to predict which pages are on screen — `paginationWindow` is exported and pure, and two implementations of one rule will disagree.",
        "Do not hide the pager when there is only one page: a stable footer is worth more than four saved pixels, and the layout moving on the first search result is worse.",
        "Do not use it to scroll a region: paging a result set and scrolling a container are different jobs, and the second one is `ScrollArea`.",
      ],
    },
    accessibility: {
      detail:
        "The control is a named `nav` and the current page is the only element carrying `aria-current=\"page\"`; every numbered control has an accessible name (`Page 24`), the first/last arrows are disabled at the ends they cannot move from, and the Previous/Next words are hidden below `sm` while their icons keep the names. `PaginationSummary` groups digits with a fixed locale, so the server and the browser cannot render `1,284` two different ways.",
    },
  },
  stepper: {
    api: {
      note: "One symbol. The table below is `Stepper`'s own props, including the `StepperStep` shape it takes and the `complete` override on a step.",
    },
    usage: {
      code: `<Stepper
  steps={[
    { id: "account", label: "Account" },
    { id: "dataset", label: "Dataset" },
  ]}
  current={1}
  onStepSelect={setCurrent}
/>`,
      note: "`current` is zero-based, and the steps after it are static text — that is the whole reachability rule.",
    },
    guidance: {
      use: [
        "Keep `current` as the single source of position and let completion derive from it; a step that can genuinely finish early says so with `complete`.",
        "Pass `onStepSelect` only where a step is revisitable — it is what turns the steps at or before the current one into buttons.",
        "Turn the strip on its side with `orientation=\"vertical\"` when it belongs beside the work rather than above it.",
      ],
      avoid: [
        "Do not use a stepper for a process with no fixed order — a checklist or a progress bar says that better.",
        "Do not let a step link forwards: everything after `current` is unreachable on purpose, because a form that can be submitted out of order is a validation problem.",
        "Do not put a step's whole meaning in its number: `aria-current` marks the position, and the label is what a screen reader reads.",
        "Do not let the strip push the page sideways: put it in a frame that scrolls instead — and give that frame a tab stop, because a keyboard user cannot drag a scrollbar.",
      ],
    },
    accessibility: {
      detail:
        "The steps are an ordered list and `aria-current=\"step\"` marks exactly one element: the step's button where it has one, otherwise its list item — so a reader tabbing through hears which step they are on rather than a run of buttons. The connectors between steps are decorative and hidden from assistive technology, a step past `current` is not focusable at all, and the marker shows a check or the step number while the label stays the accessible name.",
    },
  },
  "tree-view": {
    api: {
      note: "Three symbols: the component and the two helpers a caller needs to drive it from outside — `findTreeNode`, to turn a selected id back into its node, and `treeBranchIds`, for an expand-all control of your own.",
    },
    usage: {
      imports: ["TreeView"],
      code: `<TreeView
  nodes={tree}
  label="Workspace"
  defaultExpandedIds={["markets"]}
  defaultSelectedId="rates"
/>`,
      note: "`nodes` is the hierarchy, `expandedIds`/`selectedId` make either side controlled; `label` is the tree's accessible name and the pattern requires one.",
    },
    guidance: {
      use: [
        "Name the tree with `label`: it is the only thing that tells one tree from another, and an unnamed `role=\"tree\"` is a puzzle to a screen reader.",
        "Keep `selectionFollowsFocus` on unless selecting *is* an edit — it is what makes the arrow keys feel like a list rather than a corridor.",
        "Use `disabled` for a branch that exists but is unavailable: the row stays visible and announced, and the keyboard steps over it.",
      ],
      avoid: [
        "Do not build a menu out of a tree: two levels of navigation is a sidebar, and a chooser over 200 flat options is a `Combobox`.",
        "Do not expand the whole hierarchy by default — `treeBranchIds` is there for an explicit expand-all control, and a tree that opens itself loses the reader's place on every visit.",
        "Do not nest more than a few levels: depth without search is a filing cabinet, and a reader cannot see where they are in one.",
      ],
    },
    accessibility: {
      detail:
        "The tree follows the ARIA `tree`/`treeitem` pattern rather than approximating it, and the consequence a reader has to know is that the whole control is **one Tab stop**: `tabindex` roves with the focused row, so Tab leaves the tree rather than walking out of it row by row. `aria-level`, `aria-setsize` and `aria-posinset` state the shape, so a screen reader announces \"3 of 8, level 2\" instead of an indentation nobody can see; a collapsed branch leaves the keyboard order entirely; and a `disabled` node is still rendered and announced, but the arrow keys step over it.",
    },
  },

  /* ---------------------------------------------------------------- feedback */
  /*
   * The Feedback family. One question organises all ten entries: *what does the
   * product say, and how loudly* — a status that stays (Alert), a wait with a
   * known end (Progress), a wait without one (Spinner), a wait whose shape is
   * known (Skeleton), nothing here (EmptyState), an outcome (Result), a state as
   * a word (StatusBadge), a transient confirmation (Toaster), an inbox
   * (NotificationCenter) and a guided walk (GuidedTour). The advice below is
   * mostly about *choosing between them*, because that is the mistake this family
   * sees most.
   */
  alert: {
    api: {
      note: "`Alert` and `Callout` are one implementation with two intents, and `AlertTitle`, `AlertDescription` and `AlertActions` are the parts that `title`, `description` and `actions` are shorthand for. The two public components are open above; the parts are folded underneath.",
    },
    usage: {
      imports: ["Alert", "Callout"],
      code: `<Alert\n  tone="warning"\n  title="Delayed data"\n  description="Yahoo returned end-of-day prices for the last two sessions."\n/>`,
      note: "`Callout` takes the same props with the persistent intent; reach for it when the message is context rather than a status.",
    },
    guidance: {
      use: [
        "Use an Alert for a status the reader may need to act on, and a Callout for context that stays true while the page is open.",
        "Say what happened and what the reader can do; a tone without a next step is decoration.",
        "Keep one page-level Alert per region — two competing messages is a hierarchy that has stopped working.",
      ],
      avoid: [
        "Do not force `live` on content that is present when the page loads: it is already part of the page, and announcing it interrupts the reader.",
        "Do not report a field's own validation error in an Alert — that error belongs to the field.",
        "Do not use an Alert for a transient confirmation; that is a toast, and it should not occupy layout.",
      ],
    },
    accessibility: {
      detail:
        "`live` is the only thing that decides whether a screen reader is interrupted: `off` (the default) renders no role, `polite` renders `role=\"status\"`, and `assertive` renders `role=\"alert\"`. The dismiss control is a real button with a name the caller can localise (`dismissLabel`), and the tone is carried by an edge and an icon as well as by colour, so the state survives a monochrome rendering.",
    },
  },
  progress: {
    api: {
      note: "Three props: the value (or its absence), the tone and the size. `value={null}` and no `value` at all mean the same thing — the indeterminate sweep.",
    },
    usage: {
      imports: ["Progress"],
      code: `<Progress value={62} aria-label="Tasks complete" />`,
      note: "Omit `value` for the indeterminate sweep; the bar then exposes the role without a value, which is what the pattern asks for.",
    },
    guidance: {
      use: [
        "Use a determinate bar when the work has a known size, and the indeterminate sweep when it genuinely does not.",
        "Put the number beside the bar in the caller's own type — the component draws the track, not the label.",
        "Let the width transition express the change; the reader is watching the value, not the surface.",
      ],
      avoid: [
        "Do not show a percentage you cannot compute — an invented number is worse than an honest sweep.",
        "Do not use a progress bar for a wait with no measurable end; that is a spinner.",
        "Do not add a second animation to the indeterminate sweep: it is already the one motion in the component.",
      ],
    },
    accessibility: {
      detail:
        "Radix owns the value semantics: a determinate bar exposes `role=\"progressbar\"` with `aria-valuenow`, `aria-valuemin` and `aria-valuemax`, and an indeterminate one exposes the role without a value. The bar has no name of its own, so give it one — `aria-label`, or `aria-labelledby` pointing at the heading it belongs to — and the indeterminate sweep is marked `data-motion-essential`, so it keeps meaning under `prefers-reduced-motion` as a slow pulse rather than freezing.",
    },
  },
  spinner: {
    api: {
      note: "One symbol with two props: a size from the library's own scale (14 to 24) and an optional accessible label.",
    },
    usage: {
      imports: ["Spinner"],
      code: `<Spinner size={18} label="Loading runs" />`,
      note: "Pass `label={null}` when an ancestor already announces the wait, and the spinner stops being a second live region.",
    },
    guidance: {
      use: [
        "Use a spinner for a wait with no measurable end, sized to the thing it replaces: 16px inside a button, 24px in a panel.",
        "Announce the wait once — a button that already says it is working passes `label={null}` to the spinner inside it.",
        "Reach for a skeleton instead when the shape of the result is known, because the reader sees what is coming.",
      ],
      avoid: [
        "Do not put a spinner on every card of a page; six spinners announce six waits at the same time.",
        "Do not use one for a job with a known size — a progress bar tells the reader more.",
        "Do not re-implement the rotation with a custom keyframe; the component already respects reduced motion.",
      ],
    },
    accessibility: {
      detail:
        "With a `label` the spinner is `role=\"status\"` and carries that name; with `label={null}` it renders no role and no name, which is how a caller avoids a second announcement inside a control that is already busy. Under `prefers-reduced-motion` the rotation becomes a slow pulse rather than stopping, because a frozen indicator reads as a bug.",
    },
  },
  skeleton: {
    api: {
      note: "Two components: the placeholder itself (`variant` and `shimmer`) and `SkeletonText`, the multi-line helper that varies its line widths so a block reads as prose.",
    },
    usage: {
      imports: ["Skeleton", "SkeletonText"],
      code: `<SkeletonText lines={3} />
<Skeleton variant="circle" className="size-9" />`,
      note: "A `block` reserves a surface, a `circle` an avatar, and text lines come from `SkeletonText`.",
    },
    guidance: {
      use: [
        "Reserve the shape of what is coming: the same number of lines, the same row height, the same avatar size.",
        "Use `SkeletonText` for prose and hand-written widths for anything with a rhythm of its own.",
        "Keep the placeholder in the loaded content's own layout, so nothing moves when the data lands.",
      ],
      avoid: [
        "Do not let a skeleton be taller or shorter than the content it replaces — that is a layout shift with extra steps.",
        "Do not shimmer a dozen placeholders: the page's one main wait is worth the movement, the rest is noise.",
        "Do not use a skeleton for an action's wait inside a button; that is a spinner.",
      ],
    },
    accessibility: {
      detail:
        "A skeleton is `aria-hidden` on purpose: it is a picture of content, not content. That makes the live relationship the caller's job — `aria-busy` on the loading region is what tells a screen reader that what it can read there is not final — and the shimmer is `motion-safe`, so a reader who asked for reduced motion gets a static placeholder with the same geometry.",
    },
  },
  "empty-state": {
    api: {
      note: "One component, two sizes, and a `titleAs` that decides whether its title is a heading or a paragraph.",
    },
    usage: {
      imports: ["EmptyState"],
      code: `<EmptyState\n  title="No runs yet"\n  description="Start one from the toolbar and it will appear here."\n  action={<Button>New run</Button>}\n/>`,
      note: "Static by design: pass `role=\"status\"` yourself when the emptiness happens after the page has loaded.",
    },
    guidance: {
      use: [
        "Answer two questions: why is this empty, and what fills it. An empty state with no action is a dead end.",
        "Size it to its container — `sm` in a table region or a pane, `md` for a page or a card.",
        "Choose the mark from the reason: an empty folder, a search that found nothing, a lock for a permission the reader lacks.",
      ],
      avoid: [
        "Do not use it for a failure or a wait; an error is a `Result`, and a wait is a spinner or a skeleton.",
        "Do not write \"No data\" and stop: the reader cannot tell whether to wait, retry or change a filter.",
        "Do not put the page's own heading inside it — the component renders a paragraph unless `titleAs` says otherwise.",
      ],
    },
    accessibility: {
      detail:
        "The component is static content with no implicit role, and its title is a paragraph by default so it cannot invent a heading level inside a layout it does not control — pass `titleAs` when the state really is the region's heading. Nothing is announced when it renders on the server, which is right for a page that was empty when the reader arrived; when emptiness follows an action, `role=\"status\"` is what makes the change audible.",
    },
  },
  result: {
    api: {
      note: "Five statuses, two sizes and a `titleAs`; `icon` overrides the mark and `icon={null}` removes it, which is what a not-found outcome usually wants.",
    },
    usage: {
      imports: ["Result"],
      code: `<Result\n  status="success"\n  title="Import finished"\n  description="1,284 bars were written for BTCUSDT 1h."\n  extra={<Button>Open the dataset</Button>}\n/>`,
      note: "`titleAs` defaults to `h1` because a Result usually *is* the page; inside a card or a dialog, say `h2`, `h3` or `p`.",
    },
    guidance: {
      use: [
        "Use a Result for the page a flow ends on: a submitted form, a finished import, a failed payment.",
        "Say what happened in the title and what to do next underneath; the mark only carries the tone.",
        "Declare the heading level — `titleAs=\"h2\"` inside a panel keeps the page's outline honest.",
      ],
      avoid: [
        "Do not use a Result where an `EmptyState` belongs: nothing here yet is a state, not an outcome.",
        "Do not decorate a not-found page with a red mark; `status=\"empty\"` or `icon={null}` says it better.",
        "Do not stack two Results on one page — two outcomes means two pages.",
      ],
    },
    accessibility: {
      detail:
        "The mark is `aria-hidden` and the title carries the meaning, which is why the title is required and has no default copy: the component cannot translate a sentence it invented itself. `titleAs` is the caller's decision because the usual job is to *be* the page heading, while a Result inside a dialog or a card has to be a lower level. No live region is implied; when an outcome arrives after mount, `role=\"status\"` is the caller's call.",
    },
  },
  "status-badge": {
    api: {
      note: "The table above is `StatusBadge`'s props; `statusPresets` is the vocabulary it resolves against, and a product extends it through `status` plus `label` rather than by adding colours.",
    },
    usage: {
      imports: ["StatusBadge"],
      code: `<StatusBadge status="degraded" />`,
      note: "The preset owns the label, the tone and whether the dot pulses; `label` overrides the word and never the colour.",
    },
    guidance: {
      use: [
        "Use a preset wherever the vocabulary already covers the state — the colour is then decided once, in the library.",
        "Reserve `live` for a state that really is being measured right now; a pulsing dot on a stale value is a lie.",
        "Pair a freshness label with an absolute timestamp somewhere in reach, because \"4m\" becomes wrong as the page sits open.",
      ],
      avoid: [
        "Do not let colour carry the status alone — the word is both the accessible and the colour-blind-safe carrier.",
        "Do not invent a tone for a status the presets do not have; extend the vocabulary rather than the palette.",
        "Do not attach a freshness badge to data that is refreshed on every render.",
      ],
    },
    accessibility: {
      detail:
        "The badge reads as its label, so the status is announced as a word rather than as a colour. The dot is decorative and `aria-hidden`, and `Live`'s pulse is a slow opacity change that stops under `prefers-reduced-motion` — it never travels. Nothing here is a live region: a status that changes on its own should be announced by the region that owns it, not by every badge on the page.",
    },
  },
  toast: {
    api: {
      note: "Two exports: the `Toaster` you mount once, and `toast` — Sonner's imperative API, re-exported so a product does not end up with two copies of it.",
    },
    usage: {
      imports: ["Toaster", "toast"],
      code: `<Toaster />\ntoast.success("Saved", { description: "3 rows updated" });`,
      note: "`Toaster` is mounted once at the app root; the theme comes from `LucProvider`, so a toast follows an explicit theme choice rather than the operating system.",
    },
    guidance: {
      use: [
        "Use a toast for something the reader just caused and does not need to answer twice.",
        "Use `toast.promise` for a long task: one surface that changes state beats three stacked toasts.",
        "Give an undoable action an action button in the toast rather than a confirmation dialog in front of it.",
      ],
      avoid: [
        "Do not use a toast for an error the reader has to fix in a form; that message belongs beside the field.",
        "Do not stack more than a few at once — the viewport shows four and the rest queue behind them.",
        "Do not put a destructive confirmation in a toast: it disappears before a careful reader answers it.",
      ],
    },
    accessibility: {
      detail:
        "Sonner owns the mechanics and the live region: a toast is announced politely, `closeButton` gives every one a named dismiss, and hover or focus pauses the timer so a slow reader is not cut off. The viewport never takes focus, so a toast cannot interrupt typing, and the LUC skin keeps the semantics it inherited — tone is carried by a rail and an icon as well as by colour, and the loading icon is `data-motion-essential`, so it becomes a slow pulse under reduced motion instead of freezing.",
    },
  },
  "notification-center": {
    api: {
      note: "One component, plus the item shape it renders (`title`, `description`, `timestamp`, `tone`, `read`, `href`). Timestamps are pre-formatted by the caller because a relative time is a product decision, not a library one.",
    },
    usage: {
      imports: ["NotificationCenter"],
      code: `<NotificationCenter\n  items={items}\n  onRead={(id) => markRead(id)}\n  onReadAll={markAllRead}\n  onDismiss={(id) => remove(id)}\n/>`,
      note: "The list is fully controlled: the product owns persistence, the unread count and what \"read\" means. Only the panel's open state is local, because a popover is not a route.",
    },
    guidance: {
      use: [
        "Use it for everything that accumulated while the reader was elsewhere; a toast is for what they just caused.",
        "Keep the panel's own open state local, and let the product own which rows are read.",
        "Give the long list a `footer` — a \"View all\" link is what keeps the panel from becoming the archive.",
      ],
      avoid: [
        "Do not expire rows on a timer; an inbox that deletes itself is not an inbox.",
        "Do not treat the unread count as an announcement — the badge is a count, not a live region.",
        "Do not put the row's own actions inside its title; the row is one target with one meaning.",
      ],
    },
    accessibility: {
      detail:
        "The trigger is a button whose name states the count (`Notifications, 3 unread`), the panel is a popover whose content is the list, and every row is a real button — or an anchor when it has an `href` — so Enter and Space work without a key handler of our own. Unread state is carried by weight and a dot rather than by colour alone, and the dismiss control is revealed on hover *and* on focus, so it is reachable without a pointer.",
    },
  },
  "guided-tour": {
    api: {
      note: "One component and one step shape. `stepIndex` makes the current step controlled, `labels` localises the controls and the counter, and a step's `target` is a CSS selector — the contract is that the element must exist while the tour is open.",
    },
    usage: {
      imports: ["GuidedTour"],
      code: `const [open, setOpen] = useState(false);\n\n<Button onClick={() => setOpen(true)}>Start tour</Button>\n<GuidedTour open={open} onOpenChange={setOpen} steps={steps} />`,
      note: "A step's `target` is measured on every scroll and resize; omit it for a centred, targetless step.",
    },
    guidance: {
      use: [
        "Anchor a step to a stable selector — an id or a data attribute — never to a class that styling can change.",
        "Keep a tour to three or five steps with one idea each, and let the last one be targetless if it is a summary.",
        "Give a step a `placement` when the default would cover the thing it points at.",
      ],
      avoid: [
        "Do not tour a feature the reader has not opened yet — the spotlight needs something to point at.",
        "Do not use it as a first-run modal: this one can be dismissed from the keyboard, and a modal that cannot is a trap.",
        "Do not target an element inside a closed overlay; the selector resolves to nothing and the step loses its anchor.",
      ],
    },
    accessibility: {
      detail:
        "The card is a modal dialog: focus moves into it when the tour opens and returns to the trigger when it closes, Escape leaves from any step, and Tab is kept inside the card while it is up. The spotlight is decorative and `aria-hidden`, so a reader hears the step's own title and description rather than the shape of the highlight — and a step whose target has disappeared falls back to a centred card instead of failing.",
    },
  },

  /* ---------------------------------------------------------- data display */
  badge: {
    usage: {
      code: `<Badge tone="positive" size="sm" dot>\n  Verified\n</Badge>`,
    },
    guidance: {
      use: [
        "Use `Badge` for a state the surrounding row already explains, and `Tag` for an author-assigned label the reader may remove.",
        "Pass `removeLabel` whenever `onRemove` is set: the remove affordance is an icon control, and that prop is its accessible name.",
        "Keep a badge to one or two words including the unit, and use `dot` for a state that is live right now.",
      ],
      avoid: [
        "Let `tone` carry the meaning alone — pair it with a word (`Verified`, `Draft`), because colour does not survive a screen reader or greyscale.",
        "Put a sentence in a badge; it is a micro-label, and the row's own text is where a sentence belongs.",
      ],
    },
    accessibility: {
      detail:
        "Both pieces are inline text, so they are read in the row's own order. A removable `Tag` renders a real button named by `removeLabel`, and the `dot` is decorative rather than a second name.",
    },
  },
  "column-visibility-menu": {
    usage: {
      code: `<DataTable\n  columns={columns}\n  data={runs}\n  ariaLabel="Research runs"\n  enableColumnVisibility\n  toolbar={<DataTableToolbar actions={<ColumnVisibilityMenu />} />}\n/>`,
    },
    guidance: {
      use: [
        "Reach for it when a table has more columns than the viewport shows and the reader decides which ones matter.",
        "Keep the identifying column pinned through `columnPinning`, so hiding a column never removes the row's name.",
      ],
      avoid: [
        "Use it to hide the column the table is sorted or filtered by; hide optional metadata, not the key.",
      ],
    },
    accessibility: {
      detail:
        "It is a menu button inside the table toolbar. The table keeps the name it was given (`ariaLabel` or `caption`), and the header row it changes stays a real header row.",
    },
  },
  "data-details": {
    usage: {
      code: `<DataDetails\n  title="Close, eight sessions"\n  description="The exact rows behind the chart."\n>\n  <table>{/* rows */}</table>\n</DataDetails>`,
    },
    guidance: {
      use: [
        "Put the rows behind a figure here rather than under it, so the page does not double in height.",
        "Write `title` as the question the rows answer, and keep `description` to one line.",
      ],
      avoid: [
        "Use it for content a reader needs before the summary; everything inside a disclosure starts closed.",
      ],
    },
    accessibility: {
      detail:
        "The trigger is a real button with `aria-expanded` and `aria-controls`. The panel keeps its heading, and a table inside keeps its own caption and column headers.",
    },
  },
  "data-table": {
    usage: {
      code: `<DataTable\n  columns={columns}\n  data={runs}\n  ariaLabel="Research runs"\n  enableSorting\n  enableFiltering\n/>`,
    },
    guidance: {
      use: [
        "Always pass `ariaLabel` or `caption`; that is what names the table for assistive technology.",
        "Use the built-in `enableSorting`, `enableFiltering` and `enableRowSelection` instead of rebuilding them beside the table, so the header, toolbar and pager read one state.",
      ],
      avoid: [
        "Render a table for key/value pairs: two columns and six rows are a definition list, and `DataDetails` already gives it a surface.",
        "Format numbers inside a cell by hand: return the formatted string from the column definition so the table does not own a locale decision.",
      ],
    },
    accessibility: {
      detail:
        "It renders a real table with a caption, `th scope=\"col\"` headers and `aria-sort` on the sorted column. Selection and expansion controls carry names such as `Select row 3` and `Collapse row`.",
    },
  },
  "data-table-pagination": {
    usage: {
      code: `<DataTable\n  columns={columns}\n  data={runs}\n  ariaLabel="Research runs"\n  footer={<DataTablePagination rowLabel="runs" />}\n/>`,
    },
    guidance: {
      use: [
        "Pass `rowLabel` so the summary reads “48 runs” rather than “48 rows”.",
        "Set `pageSizeOptions` only where the product has a real density choice; the default is one decision fewer.",
      ],
      avoid: [
        "Render it outside the table's `footer`; it binds to the table's own state through that context.",
      ],
    },
    accessibility: {
      detail:
        "The pager reads the row count and page from the table it belongs to and reports the visible range as text beside its controls, so the number is not moved by a page change without being announced.",
    },
  },
  "data-table-toolbar": {
    usage: {
      code: `<DataTable\n  columns={columns}\n  data={runs}\n  ariaLabel="Research runs"\n  toolbar={\n    <DataTableToolbar\n      search={{ label: "Search runs", placeholder: "Search runs…" }}\n      actions={<DataTableSelectionCount label="selected" />}\n    />\n  }\n/>`,
    },
    guidance: {
      use: [
        "Use `search` rather than a separate input, so the table's global filter and the field share one value.",
        "Put the selection count in `actions`: it is feedback about the table, not a command.",
      ],
      avoid: [
        "Add a second search field for the same table; two boxes filtering one dataset disagree the moment either is typed in.",
      ],
    },
    accessibility: {
      detail:
        "The search field is a labelled input (`search.label` is the accessible name), and the selection count is live text inside the toolbar rather than a second control.",
    },
  },
  delta: {
    usage: {
      code: `<Delta value={-1.8} suffix="%" />`,
    },
    guidance: {
      use: [
        "Set `invert` where a fall is good — drawdown, error rate, latency — so the colour follows the meaning rather than the sign.",
        "Use `kind`, `currency` and `suffix` rather than pre-formatting the number, so the locale and the sign treatment stay consistent with `Metric`.",
      ],
      avoid: [
        "Place a `Delta` before the number it describes; a reader meets the change before the value.",
      ],
    },
    accessibility: {
      detail:
        "The sign is part of the text rather than the colour, and the arrow is decorative, so the change is still readable when colour is not.",
    },
  },
  "facet-filter": {
    usage: {
      code: `<DataTable\n  columns={columns}\n  data={runs}\n  ariaLabel="Research runs"\n  enableFiltering\n  toolbar={\n    <DataTableToolbar>\n      <FacetFilter columnId="status" label="Status" searchable />\n    </DataTableToolbar>\n  }\n/>`,
    },
    guidance: {
      use: [
        "Name the column it filters through `columnId`, and give the facet the column's own label.",
        "Turn on `searchable` for a facet with more than a dozen values, and `hideEmpty` where a value that matches nothing is noise.",
      ],
      avoid: [
        "Keep a facet for a column no other control can sort or read; the filter stays and the reader cannot tell what changed.",
      ],
    },
    accessibility: {
      detail:
        "The facet is a menu of options bound to the table's column filter; the table's own header and row count report the result, so the filter does not need to announce a second copy of it.",
    },
  },
  "kanban-board": {
    usage: {
      code: `<KanbanBoard\n  columns={columns}\n  onMove={({ cardId, from, to, index }) => move(cardId, from, to, index)}\n  label="Sprint"\n/>`,
    },
    guidance: {
      use: [
        "Keep the move in the caller: `onMove` reports the card, the source column, the target column and the index, and the board re-renders from the new columns.",
        "Use `disabled` for a read-only plan rather than rendering a second static layout.",
      ],
      avoid: [
        "Use a board for an ordered list with two states; a `SortableList` or a `DataTable` is the smaller instrument.",
      ],
    },
    accessibility: {
      detail:
        "Each column keeps its title as a heading inside a named group, and every card is a focusable control, so a reader can reach a card and its column without a pointer.",
    },
  },
  list: {
    usage: {
      code: `<List bordered divided aria-label="Recent backtests">\n  <ListItem title="Momentum, 90 days" description="12 symbols" meta="2m ago" />\n</List>`,
    },
    guidance: {
      use: [
        "Use `ListItem`'s `leading`, `trailing` and `meta` slots rather than hand-building a row; the alignment and the truncation come with them.",
        "Keep `title` to the row's identity and move the detail into `description`, which is allowed to wrap.",
      ],
      avoid: [
        "Put actions inside the title: a control inside a row that is itself a link gives the reader two nested targets.",
      ],
    },
    accessibility: {
      detail:
        "The shell is a `ul` and each row a `li`, so the list is announced with its length. A row that acts is a real link or button rather than a div with a click handler.",
    },
  },
  metric: {
    usage: {
      code: `<Metric label="Net exposure" value={0.62} kind="percent" delta={0.04} />`,
    },
    guidance: {
      use: [
        "Use `Metric` for a figure that stands alone, and `StatCard` when the figure needs an icon, a footer or its own selectable surface.",
        "Pass `kind`, `currency` and the fraction digits instead of a pre-formatted string, so the figure and its delta are formatted by one rule.",
      ],
      avoid: [
        "Animate a figure that changes every frame; `animate` is for a value that arrives once.",
      ],
    },
    accessibility: {
      detail:
        "The label and the value are text in reading order, and the numeric part uses tabular figures so a changing value does not move its neighbours. The delta keeps its sign in text.",
    },
  },
  "sortable-list": {
    usage: {
      code: `const [order, setOrder] = useState(items.map((item) => item.id));\n\n<SortableList\n  label="Talk outline"\n  items={order.map((id) => items.find((item) => item.id === id)!)}\n  onReorder={setOrder}\n/>`,
    },
    guidance: {
      use: [
        "Keep the order in the caller: `onReorder` reports the complete new order, which is what a server needs to persist.",
        "Write a `message` that says what moving the row did; it is announced, and “Moved” alone does not.",
      ],
      avoid: [
        "Use drag-and-drop as the only way to reorder; the keyboard path is part of the component and hiding it makes the list inaccessible.",
      ],
    },
    accessibility: {
      detail:
        "Each row is a focusable item with a keyboard move, and `SortableAnnouncer` reports the new position. `disabled` keeps the list readable while removing the reorder controls.",
    },
  },
  "stat-card": {
    usage: {
      code: `<StatCard\n  label="Sharpe, 12 months"\n  value={1.24}\n  delta={0.06}\n  kind="decimal"\n/>`,
    },
    guidance: {
      use: [
        "Use the card when the figure is a destination the reader can open (`interactive`) or the anchor of a small group.",
        "Set `invertDelta` where a rise is bad, so the delta's colour follows the meaning of the metric.",
      ],
      avoid: [
        "Repeat the unit inside `label` and `suffix`; one of the two is the unit, the other is the name.",
      ],
    },
    accessibility: {
      detail:
        "An interactive card is a single named control, not a card containing a link, and its label is the metric rather than the number. `selected` is exposed as state rather than as colour alone.",
    },
  },
  timeline: {
    usage: {
      code: `<Timeline items={runs} />`,
    },
    guidance: {
      use: [
        "Reach for `Timeline` when the order carries meaning — runs, releases, incidents — and use `List` when it does not.",
        "Keep `title` short and put the evidence in `description`; `meta` is the right place for a date or a duration.",
      ],
      avoid: [
        "Use it as a changelog of prose: a long description in every row turns the rail into a wall and hides the sequence.",
      ],
    },
    accessibility: {
      detail:
        "The rail is an ordered list: each entry is announced with its position, and `meta` is read with the entry rather than as a separate column.",
    },
  },
  timestamp: {
    usage: {
      code: `<Timestamp value="2026-10-06T14:05:00Z" style="datetime" timeZone="UTC" />`,
    },
    guidance: {
      use: [
        "Pass `timeZone` explicitly for a value that is not the reader's local time — a market close, a release window.",
        "Use `FreshnessBadge` for “updated 4 minutes ago” and `Timestamp` for the exact value; the two answer different questions.",
      ],
      avoid: [
        "Format a date with `toLocaleString()` in the page and pass the result as `value`; the component cannot recover the time zone from it.",
      ],
    },
    accessibility: {
      detail:
        "The rendered text is the full date and time, and the relative form keeps the absolute value in its `title`, so a reader gets both without hovering.",
    },
  },
  "virtual-data-table": {
    usage: {
      code: `<VirtualDataTable\n  columns={columns}\n  data={rows}\n  ariaLabel="All 12,480 trades"\n  height={520}\n/>`,
    },
    guidance: {
      use: [
        "Reach for it above a few hundred rows, or when the table sits inside a fixed-height panel and the page must not grow.",
        "Keep `ariaLabel` descriptive of the whole dataset, because only the visible rows are in the DOM.",
      ],
      avoid: [
        "Virtualise a table whose rows must all be reachable by browser find-in-page or by a print stylesheet; the DOM only holds the window.",
      ],
    },
    accessibility: {
      detail:
        "The header stays a real header row while the body is windowed, and the caption names the full dataset so the row count does not read as the DOM count.",
    },
  },

  /* -------------------------------------------------------------- overlays */
  accordion: {
    usage: {
      imports: ["Accordion", "AccordionItem", "AccordionTrigger", "AccordionContent"],
      code: `<Accordion type="single" collapsible defaultValue="ingestion">\n  <AccordionItem value="ingestion">\n    <AccordionTrigger>Ingestion</AccordionTrigger>\n    <AccordionContent>…</AccordionContent>\n  </AccordionItem>\n</Accordion>`,
    },
    guidance: {
      use: [
        "Use the accordion when several sections are worth reading but only one or two are usually open, and the reader needs to compare their headings.",
        "Use `Collapsible` when there is one region; it has no item wrapper and no roving focus, which is the smaller instrument for one disclosure.",
      ],
      avoid: [
        "Hide content a reader always needs behind a disclosure — an accordion is a choice about attention, not a place to save space.",
      ],
    },
    accessibility: {
      detail:
        "Each trigger is a real button inside a heading, with `aria-expanded` and `aria-controls` pointing at its panel. Arrow keys move between headers in the group, and collapsing unmounts the panel unless `forceMount` is set.",
    },
  },
  "alert-dialog": {
    usage: {
      imports: ["AlertDialog", "AlertDialogTrigger", "AlertDialogContent", "AlertDialogTitle", "AlertDialogDescription", "AlertDialogAction", "AlertDialogCancel"],
      code: `<AlertDialog>\n  <AlertDialogTrigger asChild>\n    <Button variant="danger">Delete dataset</Button>\n  </AlertDialogTrigger>\n  <AlertDialogContent>\n    <AlertDialogTitle>Delete this dataset?</AlertDialogTitle>\n    <AlertDialogDescription>The rows and their exports go with it.</AlertDialogDescription>\n    <AlertDialogCancel>Keep it</AlertDialogCancel>\n    <AlertDialogAction>Delete</AlertDialogAction>\n  </AlertDialogContent>\n</AlertDialog>`,
    },
    guidance: {
      use: [
        "Reserve it for a decision the reader cannot undo from the same screen, and name the object in the title rather than asking a generic “Are you sure?”.",
        "Put the safe choice first: `AlertDialogCancel` is the default focus target, so Enter dismisses instead of confirming.",
      ],
      avoid: [
        "Use it for information or for a form; an alert dialog has no cancel-on-outside-click and no free-form content contract.",
      ],
    },
    accessibility: {
      detail:
        "It is a modal dialog with `role=\"alertdialog\"`, so the title and description are announced when it opens. Focus moves to the cancel action, Escape dismisses, and focus returns to the trigger.",
    },
  },
  command: {
    usage: {
      imports: ["Command", "CommandInput", "CommandList", "CommandGroup", "CommandItem", "CommandEmpty"],
      code: `<Command>\n  <CommandInput placeholder="Search actions…" />\n  <CommandList>\n    <CommandGroup heading="Actions">\n      <CommandItem>Export the run</CommandItem>\n    </CommandGroup>\n    <CommandEmpty>No matching action.</CommandEmpty>\n  </CommandList>\n</Command>`,
    },
    guidance: {
      use: [
        "Use it for a searchable set of actions the reader already knows by name; the query filters the list as they type.",
        "Group results and keep `CommandEmpty` written for the empty case — a blank list reads as a broken search.",
      ],
      avoid: [
        "Use it as a navigation menu that is always open; a palette is summoned, and `CommandMenu` plus `useCommandHotkey` is the composed form.",
      ],
    },
    accessibility: {
      detail:
        "The list is a `listbox` with the input as its combobox: Arrow keys move the active option, Enter chooses it, and the active option is announced as it changes. `CommandEmpty` is a live region, so an empty result is spoken.",
    },
  },
  "context-menu": {
    usage: {
      imports: ["ContextMenu", "ContextMenuTrigger", "ContextMenuContent", "ContextMenuItem", "ContextMenuSeparator"],
      code: `<ContextMenu>\n  <ContextMenuTrigger>Right-click this row</ContextMenuTrigger>\n  <ContextMenuContent>\n    <ContextMenuItem shortcut="⌘C">Copy id</ContextMenuItem>\n    <ContextMenuSeparator />\n    <ContextMenuItem variant="danger">Archive</ContextMenuItem>\n  </ContextMenuContent>\n</ContextMenu>`,
    },
    guidance: {
      use: [
        "Use it for actions on the object the pointer is over, and keep the same actions reachable from a visible control for touch and keyboard readers.",
        "Write the `shortcut` as the key chord the app actually binds; it is a hint beside the label, not a binding the menu installs.",
      ],
      avoid: [
        "Put the only path to an action in a context menu; there is no right-click on a phone and no discoverable affordance on a page.",
      ],
    },
    accessibility: {
      detail:
        "The trigger opens on the keyboard's context-menu key as well as on right-click, and the content is a menu: Arrow keys move, Escape closes, and focus returns to the trigger. Items are announced with their shortcut as a description.",
    },
  },
  dialog: {
    usage: {
      imports: ["DialogRoot", "DialogTrigger", "DialogContent", "DialogHeader", "DialogTitle", "DialogBody", "DialogFooter", "DialogClose"],
      code: `<DialogRoot>\n  <DialogTrigger asChild>\n    <Button>Open run detail</Button>\n  </DialogTrigger>\n  <DialogContent width="md">\n    <DialogHeader>\n      <DialogTitle>Run detail</DialogTitle>\n    </DialogHeader>\n    <DialogBody>…</DialogBody>\n    <DialogFooter>\n      <DialogClose asChild>\n        <Button variant="ghost">Close</Button>\n      </DialogClose>\n    </DialogFooter>\n  </DialogContent>\n</DialogRoot>`,
    },
    guidance: {
      use: [
        "Use a modal dialog for a task that needs the page's context but not its controls, and put the dialog's own next step in the footer.",
        "Set `width` rather than a `className` on the content; the width lands on the panel, while a class lands on the centring frame.",
      ],
      avoid: [
        "Open a dialog from a dialog when a second step would do; nested modals double the focus trap and the escape path.",
      ],
    },
    accessibility: {
      detail:
        "`DialogContent` is a modal: it traps Tab, closes on Escape, restores focus to the trigger, and locks the page behind it. `DialogTitle` is required for the accessible name; without it the dialog announces as “dialog”.",
    },
  },
  "dropdown-menu": {
    usage: {
      imports: ["DropdownMenu", "DropdownMenuTrigger", "DropdownMenuContent", "DropdownMenuItem", "DropdownMenuSeparator"],
      code: `<DropdownMenu>\n  <DropdownMenuTrigger asChild>\n    <Button variant="secondary">Actions</Button>\n  </DropdownMenuTrigger>\n  <DropdownMenuContent align="end">\n    <DropdownMenuItem>Duplicate</DropdownMenuItem>\n    <DropdownMenuSeparator />\n    <DropdownMenuItem variant="danger">Delete</DropdownMenuItem>\n  </DropdownMenuContent>\n</DropdownMenu>`,
    },
    guidance: {
      use: [
        "Use it for a short list of commands that all act on the page's current object, and set `align` so the panel opens toward the available space.",
        "Use `variant=\"danger\"` for a destructive item; it is the colour and weight the reader has learned to read as destructive.",
      ],
      avoid: [
        "Put more than a handful of items in a dropdown; a menu the reader has to scroll is a list that wants its own surface.",
      ],
    },
    accessibility: {
      detail:
        "The trigger is a menu button with `aria-haspopup`; the content is a `menu` with roving focus. Arrow keys move, Escape closes, typeahead jumps to an item, and focus returns to the trigger on close.",
    },
  },
  "hover-card": {
    usage: {
      imports: ["HoverCard", "HoverCardTrigger", "HoverCardContent"],
      code: `<HoverCard>\n  <HoverCardTrigger asChild>\n    <Link href="/people/ada">Ada Rensselaer</Link>\n  </HoverCardTrigger>\n  <HoverCardContent>\n    Quantitative researcher, Rotterdam.\n  </HoverCardContent>\n</HoverCard>`,
    },
    guidance: {
      use: [
        "Use it for a preview of what a link leads to — a person, a document, a definition — where the reader may continue without following it.",
        "Keep the trigger focusable: the card opens on focus as well as hover, which is what makes it usable from the keyboard.",
      ],
      avoid: [
        "Use it for essential information or for anything interactive the reader must reach; the card has no dismissal lifecycle of its own.",
      ],
    },
    accessibility: {
      detail:
        "The trigger is a link or button, so it is reachable in reading order; opening the card does not move focus, and the card's content is read in place rather than being a modal.",
    },
  },
  popover: {
    usage: {
      imports: ["PopoverRoot", "PopoverTrigger", "PopoverContent"],
      code: `<PopoverRoot>\n  <PopoverTrigger asChild>\n    <Button variant="secondary">Columns</Button>\n  </PopoverTrigger>\n  <PopoverContent side="bottom" align="start">\n    {/* real controls: checkboxes, a form, a filter */}\n  </PopoverContent>\n</PopoverRoot>`,
    },
    guidance: {
      use: [
        "Use it for interactive content anchored to a control: a filter panel, a small form, a set of toggles.",
        "Set `side` and `align` on the content, and keep the panel narrow enough that it does not become a second page.",
      ],
      avoid: [
        "Use a popover for a sentence of help; `Tooltip` is the non-interactive label and does not compete for focus.",
        "Replace a dialog with a popover when the task must block the page; the popover closes on outside interaction by design.",
      ],
    },
    accessibility: {
      detail:
        "The trigger is a button with `aria-expanded`; the content is a labelled dialog-like surface, so focus moves into it and Escape closes it. Outside interaction dismisses it and focus returns to the trigger.",
    },
  },
  sheet: {
    usage: {
      imports: ["SheetRoot", "SheetTrigger", "SheetContent", "SheetHeader", "SheetTitle", "SheetBody"],
      code: `<SheetRoot>\n  <SheetTrigger asChild>\n    <Button>Filters</Button>\n  </SheetTrigger>\n  <SheetContent side="right" size="md">\n    <SheetHeader>\n      <SheetTitle>Filters</SheetTitle>\n    </SheetHeader>\n    <SheetBody>…</SheetBody>\n  </SheetContent>\n</SheetRoot>`,
    },
    guidance: {
      use: [
        "Use `side=\"right\"` for a settings or filter panel, `side=\"bottom\"` for a mobile action sheet, and keep the body scrollable while the header stays put.",
        "Keep `SheetTitle` in every sheet; it is the panel's accessible name as well as its heading.",
      ],
      avoid: [
        "Use a sheet for a short confirmation; `AlertDialog` says “this is a decision” in a way a panel does not.",
      ],
    },
    accessibility: {
      detail:
        "The sheet is a modal dialog that enters from the side it will leave by. Focus moves into the panel, Tab stays inside it, Escape and the close control dismiss it, and focus returns to the trigger.",
    },
  },
  tooltip: {
    usage: {
      code: `<Tooltip content="Copy to clipboard" side="top">\n  <IconButton label="Copy" icon={<RiFileCopyLine />} />\n</Tooltip>`,
    },
    guidance: {
      use: [
        "Use it to name or explain a control the reader is already pointing at — an icon button, a truncated value, a dense chart mark.",
        "Keep `content` to a phrase; a tooltip that needs a sentence is a popover or a line of text on the page.",
      ],
      avoid: [
        "Put links or buttons inside a tooltip: it is not focusable, and anything interactive inside it is unreachable.",
        "Rely on it as the only label of an icon control — pass `label` to the control itself.",
      ],
    },
    accessibility: {
      detail:
        "The tooltip opens on hover and on keyboard focus, is connected to the trigger with `aria-describedby`, and Escape dismisses it. It never receives focus, so it cannot hold interactive content.",
    },
  },

  /* ----------------------------------------------------------------- media */
  avatar: {
    usage: {
      code: `<Avatar name="Ada Rensselaer" src="/people/ada.jpg" status="online" />`,
    },
    guidance: {
      use: [
        "Pass `name` even when `src` is set: the initials are the fallback for a slow image, a broken URL and an export without the file.",
        "Use `AvatarGroup` with `max` and `total` for a row of participants; the count it adds says how many are behind it.",
        "Give `label` when the avatar is the only place a person's name appears — otherwise it announces as “Avatar”.",
      ],
      avoid: [
        "Use an avatar as a button: wrap it in the control you want, so the control has its own name and hit area.",
      ],
    },
    accessibility: {
      detail:
        "The whole avatar is one `role=\"img\"` named by `label`; the image and the initials inside are hidden from the accessibility tree, so the name is announced once. A group is a labelled `role=\"group\"`.",
    },
  },
  carousel: {
    usage: {
      imports: ["Carousel", "CarouselTrack", "CarouselControls", "CarouselItem"],
      code: `<Carousel label="Release notes">\n  <CarouselTrack>\n    <CarouselItem>…</CarouselItem>\n  </CarouselTrack>\n  <CarouselControls />\n</Carousel>`,
    },
    guidance: {
      use: [
        "Use `CarouselControls` rather than custom buttons: they carry the names, the `aria-controls` tie and the position announcement.",
        "Keep `label` describing the set (“Release notes”), and write `itemLabel` as the position of each slide.",
        "Leave `autoplay` off when a slide holds text a reader needs; the interval only stops for a reader who pauses it.",
      ],
      avoid: [
        "Put a long document in a carousel: a reader who navigates by heading should not have to page through it.",
      ],
    },
    accessibility: {
      detail:
        "The rail is a region with `aria-roledescription=\"carousel\"` and the carousel's own name. Controls are real buttons tied to the rail with `aria-controls`, and a polite live region announces the position as it changes.",
    },
  },
  "image-compare": {
    usage: {
      code: `<ImageCompare\n  before={{ src: "/raw.jpg", alt: "Raw capture" }}\n  after={{ src: "/graded.jpg", alt: "Graded capture" }}\n  label="Before and after grading"\n/>`,
    },
    guidance: {
      use: [
        "Write `beforeLabel` and `afterLabel` as what the two images show, not as “before” and “after” alone.",
        "Use it when the comparison is the point — a retouch, a filter, a registration — and show one image where it is not.",
      ],
      avoid: [
        "Rely on the slider alone for a reader who cannot use a pointer; the keyboard path is there, and the labels say which side is which.",
      ],
    },
    accessibility: {
      detail:
        "The divider is a slider with a value, a name and a keyboard path, and both images carry their own `alt`. The two labels are text, so the comparison is readable without dragging anything.",
    },
  },
  "image-gallery": {
    usage: {
      code: `<ImageGallery\n  images={images}\n  columns={3}\n  label="Field notes"\n  lightbox\n/>`,
    },
    guidance: {
      use: [
        "Give every image an `alt` that says what it shows; a gallery of empty alt text is a gallery of nothing.",
        "Turn on `lightbox` for photographs the reader will want full size, and keep `columns` at two when the images carry detail.",
      ],
      avoid: [
        "Use the gallery as a layout for unrelated cards; it is a set of images, and the list semantics say so.",
      ],
    },
    accessibility: {
      detail:
        "The gallery is a named list of images, and the lightbox is a modal with its own labels, a live zoom announcement and a close control. Focus returns to the thumbnail that opened it.",
    },
  },

  /* -------------------------------------------------------------------- ai */
  ai: {
    usage: {
      imports: ["MessageList", "ChatMessage", "PromptComposer"],
      code: `<MessageList>\n  <ChatMessage from="user">Summarise the drawdown.</ChatMessage>\n  <ChatMessage from="assistant" status="done">\n    The -8.4% peak-to-trough came from two sessions.\n  </ChatMessage>\n</MessageList>`,
    },
    guidance: {
      use: [
        "Use `from` to say who is speaking and `status` for what the message is doing (`streaming`, `done`, `error`); the surface reads both.",
        "Put a tool call in `ToolCallTimeline` or `AgentActivity` rather than in the prose: a reader needs to see what ran and for how long.",
        "Keep `PromptComposer`'s `busy` state tied to the request, so send becomes stop while a response is in flight.",
      ],
      avoid: [
        "Fake a response with a timer in the documentation; the components present content, and a demo that pretends to think teaches the wrong contract.",
        "Put an agent's plan in the message body when it can change — a plan the reader cannot interrupt is a promise the UI cannot keep.",
      ],
    },
    accessibility: {
      detail:
        "New messages are announced politely rather than stealing focus, a streaming answer keeps its caret and its place, and the composer is a labelled form whose submit control becomes stop while busy. A code block inside a message stays a code block.",
    },
  },
};

/**
 * Chart-specific documentation.
 *
 * Kept in the same curation module as component notes so one review reads the
 * editorial contract in one place. The data shapes below are the props used by
 * the live demo, not a second schema: the demo remains the executable source.
 */
export const CHART_NOTES: Record<string, ChartNote> = {
  "line-chart": {
    purpose: "Track ordered observations and compare one or more numeric series through time or another continuous x value.",
    dataContract: "`data` is an array of rows; `xKey` names the ordered x field and every `series.key` names a numeric row field. A null value is drawn as a gap.",
    configuration: "Set `series[].type: \"line\"`, format the axis with `axes[].format`, and use `interaction.zoom` only when the reader is expected to inspect a dense range.",
    avoid: "Do not join unordered categories with a line; use `BarChart` when the x field is a set of labels rather than a sequence.",
  },
  "area-chart": {
    purpose: "Show a filled magnitude or accumulated trend, where the area between the line and the baseline is part of the reading.",
    dataContract: "`data` rows require an ordered `xKey` and numeric series fields. Each series is a separate magnitude; use `stack` only when the series genuinely add to a total.",
    configuration: "Choose `areaGradient` for visual weight, `stack`/`stackMode` for composition, and declare the y format because a filled area often represents a percentage or currency.",
    avoid: "Do not overlay several unrelated units as filled areas; the occlusion makes the smaller series unreadable and implies a shared baseline.",
  },
  "bar-chart": {
    purpose: "Compare a measured value across named categories, or show a ranked category list without inventing a time sequence.",
    dataContract: "`data` rows need a categorical `xKey` and one or more numeric `series.key` fields. The caller supplies the ordering; the chart does not sort or aggregate rows.",
    configuration: "Use `orientation` for long labels, `series[].stack`/`stackMode` for composition, and `valueLabels` only on sparse bars where the exact number matters.",
    avoid: "Do not use a bar chart for a dense continuous series; a line chart preserves the order and avoids a wall of bars.",
  },
  "scatter-chart": {
    purpose: "Expose the relationship between two numeric variables, including clusters, outliers and the absence of a relationship.",
    dataContract: "`data` rows contain a numeric `xKey` and one numeric value per `series.key`; declare `x.type: \"value\"`. The chart draws observations and does not fit a model.",
    configuration: "Use `annotations.referenceLines` for meaningful zero or threshold lines, `axes[].format` for units, and `tooltip.mode: \"item\"` when individual points matter.",
    avoid: "Do not describe the cloud as a fitted relationship or causality; add an explicitly supplied regression series if a line is part of the claim.",
  },
  "bubble-chart": {
    purpose: "Compare two numeric dimensions while carrying a third positive magnitude in the bubble radius.",
    dataContract: "Rows require a numeric x field, a numeric y series field and a positive numeric field named by `series[].sizeKey`. The chart does not derive or normalise the size measure.",
    configuration: "Name the `sizeKey` in the series, format both axes, and explain the radius scale in the caption or tooltip because area is less precise than position.",
    avoid: "Do not encode a signed or unbounded quantity as radius without transforming it yourself; a negative size has no honest bubble.",
  },
  "composed-chart": {
    purpose: "Read two differently scaled quantities on one shared x axis, such as a price line with a drawdown bar layer.",
    dataContract: "`data` rows share `xKey`; every `series.key` names a numeric field and every `series.axis` must match an entry in `axes`. Different units need different axis ids.",
    configuration: "Declare each `axes[].id`, `position` and `format`, and choose the mark with `series[].type`; stacking is a property of the bar series, not the composed chart as a whole.",
    avoid: "Do not place two units on one y axis merely to make the lines fit; the visual comparison becomes arithmetically false.",
  },
  "pie-chart": {
    purpose: "Show the parts of one whole when the categories are few and the shares are meaningfully different.",
    dataContract: "`data` is an ordered array of `{ name, value }` rows for one series. Values must be comparable parts of the same whole; the component caps the display at six slices.",
    configuration: "Set `format` to the share's actual unit, and use `centerValue`/`centerLabel` only for a real total or summary rather than decoration.",
    avoid: "Do not use a pie or donut to compare many close categories; a sorted bar chart gives lengths that are easier to compare.",
  },
  "funnel-chart": {
    purpose: "Show an ordered conversion process in which each stage is expected to retain no more than the stage before it.",
    dataContract: "`data` rows are ordered `{ name, value }` stage counts. The component draws the supplied stages and does not aggregate or infer conversions.",
    configuration: "Keep the stage order explicit in the array, format counts with `format`, and provide the conversion context in the surrounding caption.",
    avoid: "Do not use a funnel for unordered categories or for stages that can legitimately increase; the narrowing shape would assert a process the data does not have.",
  },
  "histogram-chart": {
    purpose: "Read the frequency distribution of a sample across explicitly supplied bins.",
    dataContract: "`bins` contains `{ from, to, count }` rows. Bins are the caller's; the chart neither bins raw observations nor rescales counts.",
    configuration: "Use `xFormat` for the measured unit, `format` for counts, and `annotations.referenceLines` for a meaningful zero, target or threshold.",
    avoid: "Do not pass raw observations and expect the chart to choose bins, and do not compare histograms with undisclosed bin widths.",
  },
  "waterfall-chart": {
    purpose: "Explain how signed contributions move an opening value to a closing value.",
    dataContract: "`data` rows contain `label` and signed `value`; rows marked `total: true` are placed as running totals. The chart does not reconcile the arithmetic.",
    configuration: "Mark opening and closing rows with `total`, use `format` for the currency or count, and keep contribution order identical to the business explanation.",
    avoid: "Do not use a waterfall when the contributions are not additive or when the stated closing total cannot be obtained from the supplied rows.",
  },
  "range-band-chart": {
    purpose: "Read a centre estimate together with an interval around it over an ordered x axis.",
    dataContract: "`points` require `t`, `center`, `lower` and `upper`; every point must satisfy `lower <= center <= upper`. The interval is supplied by the caller.",
    configuration: "Label the interval with `bandLabel`, format values on the same unit, and keep the lower and upper arrays aligned with the centre line.",
    avoid: "Do not use a band to imply a confidence guarantee when the interval comes from a different estimator or sample.",
  },
  "fan-chart": {
    purpose: "Show a supplied forecast distribution as nested uncertainty bands around a median path.",
    dataContract: "`x` contains ordered periods; `bands` contain aligned `lower` and `upper` arrays ordered widest to narrowest, and `median` has one value per x.",
    configuration: "Order the bands from the widest to the narrowest, format the forecast unit, and name the quantiles in the copy rather than relying on colour alone.",
    avoid: "Do not present a forecast cone as a guarantee or let band arrays drift out of alignment; a mismatched fan is a different claim.",
  },
  sparkline: {
    purpose: "Give a compact visual cue for the shape or direction of a short numeric series inside a card or table cell.",
    dataContract: "`values` is an ordered array of numbers. A sparkline has no x labels, y ticks or chart table; the surrounding text must name the measure and time window.",
    configuration: "Choose `tone` for semantic direction, `marker` for the latest point, and an explicit `width`/`height` that fits the host line box.",
    avoid: "Do not use a sparkline when the reader needs exact values, axis units or a defensible comparison; use a full chart or a number with its unit.",
  },
  "small-multiples": {
    purpose: "Compare the same measure across several panels on one shared scale, making shape differences easier to scan.",
    dataContract: "Compose `SmallMultiples` from `SmallMultiple` children, each with a `title` and a chart or `Sparkline`. The panels must represent the same measure and comparable domain.",
    configuration: "Set `columns` for the reading grid, keep one shared caption, and keep the y scale identical across panels; `aside` is for a short panel annotation.",
    avoid: "Do not use small multiples for unrelated measures or silently vary each panel's scale; that turns a comparison into a visual collage.",
  },
  "ecdf-chart": {
    purpose: "Compare full sample distributions through their cumulative probability, including tails rather than only a mean.",
    dataContract: "Each `series` has a `key`, `label`, `tone` and ordered `points` of `{ x, y }`, where y is the cumulative probability. The caller supplies the order statistics.",
    configuration: "Use `xFormat` for the measured variable, keep y on a 0–1 probability scale, and distinguish samples with `tone` and direct labels.",
    avoid: "Do not smooth an ECDF into a continuous density; the step is the definition, and interpolating it invents observations.",
  },
  "qq-plot-chart": {
    purpose: "Check whether a sample follows a reference distribution by comparing ordered sample quantiles with theoretical quantiles.",
    dataContract: "`points` is an ordered array of `{ x, y }` pairs: theoretical quantile on x and sample quantile on y. The caller chooses and computes the reference distribution.",
    configuration: "Keep both axes on the same numeric scale, add the relevant reference line in the surrounding analysis, and preserve point order.",
    avoid: "Do not use a Q–Q plot as proof of normality; a short or heavy tail is a visual diagnosis that needs the sample and method.",
  },
  "violin-chart": {
    purpose: "Compare distribution shapes across groups when a supplied density outline is more informative than a box summary.",
    dataContract: "`groups` contain `label`, density `bins` of `{ value, density }`, and an optional supplied `marker`. The chart draws density; it does not fit a kernel.",
    configuration: "Use `valueFormat` for the measured unit, show the median marker only when it was computed upstream, and keep group order meaningful.",
    avoid: "Do not pass raw observations as density bins or compare violins built with different bandwidths without saying so.",
  },
  "box-plot-chart": {
    purpose: "Compare five-number summaries and explicitly supplied outliers across categories.",
    dataContract: "`categories` name the groups; each `data` row is `[min, q1, median, q3, max]`; `outliers` are `{ category, value }` rows. The values must be supplied already.",
    configuration: "Use `format` for the unit, keep quartiles ordered, and show outliers only when they are real caller-classified points rather than a second summary.",
    avoid: "Do not use a box plot to hide a multimodal distribution or to imply that no outlier exists when the summary was not inspected.",
  },
  "distribution-chart": {
    purpose: "Combine a supplied histogram with an optional density curve and reference markers for a richer distribution reading.",
    dataContract: "`bins` are `{ from, to, count }`; `density` is aligned `{ x, y }` points; `references` are supplied `{ value, label, kind }` markers. Nothing is fitted by the chart.",
    configuration: "Use `xFormat` and `format` for the two units, label the density's source, and keep reference markers outside the curve's claim unless that relationship is intentional.",
    avoid: "Do not treat the overlay as a statistical fit or let a density curve imply observations that the binned sample did not contain.",
  },
  "error-bar-chart": {
    purpose: "Show point estimates with their uncertainty intervals across labelled categories.",
    dataContract: "`points` require `label`, `value`, `lower` and `upper`; lower must not exceed upper. `intervalLabel` names the interval the caller actually computed.",
    configuration: "Keep all points on one unit and scale, use `format` for signed estimates, and state the confidence level in `intervalLabel` or the adjacent copy.",
    avoid: "Do not use the mark to imply that the library computed a standard error; the interval is an input, not an inference.",
  },
  "roc-curve-chart": {
    purpose: "Compare binary classifiers across thresholds using true-positive rate against false-positive rate.",
    dataContract: "Each `curve` has an ordered `points` array of `{ x, y }`; x is false-positive rate and y is true-positive rate. `auc` is a supplied summary, not a value the chart integrates.",
    configuration: "Use percent formats on both axes, keep the diagonal baseline visible in the explanation, and label curves by model rather than colour alone.",
    avoid: "Do not compare ROC curves from datasets with materially different class prevalence without stating that limitation.",
  },
  "calibration-chart": {
    purpose: "Compare predicted probabilities with observed frequencies to expose overconfidence or underconfidence.",
    dataContract: "`bins` require `predicted`, `observed` and `count`; both probabilities use the same scale. The bin counts are supplied and drawn as area or weight.",
    configuration: "Format both axes as probabilities, preserve bin order, and explain whether the observed frequency is weighted by `count`.",
    avoid: "Do not draw a smooth calibration claim from sparse bins without showing the bin counts; a line through six points can overstate certainty.",
  },
  "confusion-matrix-chart": {
    purpose: "Read which classes a classifier confuses, using actual-versus-predicted counts or row-normalised rates.",
    dataContract: "`labels` names rows and columns in one order; `matrix` is a square integer grid with rows as actual classes. `normalized` changes display, not the supplied interpretation.",
    configuration: "Choose `normalized` when class support differs and absolute counts when the operational cost of errors matters; keep labels in a shared order.",
    avoid: "Do not compare row-normalised matrices without the class support; two cells that look equal can represent very different counts.",
  },
  "correlation-matrix": {
    purpose: "Reveal clusters and signs of pairwise linear relationships across several variables.",
    dataContract: "`labels` names the variables; `values` is a square symmetric matrix with a unit diagonal. Coefficients must already be computed and lie in the supported −1…1 domain.",
    configuration: "Use `labelMode` to control coefficient labels on dense grids, and `formatValue` when the caller needs a different coefficient precision.",
    avoid: "Do not present correlation as causation, and do not feed a non-symmetric matrix into a chart whose cells imply an unordered pair.",
  },
  "quadrant-scatter-chart": {
    purpose: "Place observations on two numeric axes and name the four regions defined by explicit reference lines.",
    dataContract: "`points` contain a label plus x/y values; `xReference`, `yReference`, `quadrantLabels`, `xLabel` and `yLabel` define the reading frame. Reference values are the caller's thresholds.",
    configuration: "State the reference values and their source, label the quadrants with the decision vocabulary, and use `pointLabel` only where the text is readable.",
    avoid: "Do not draw arbitrary thresholds and call the quadrants objective; the reference lines are the analytical claim.",
  },
  "scatter-regression-chart": {
    purpose: "Show observations together with a regression line and uncertainty band supplied by the analysis.",
    dataContract: "`points` contain x/y observations; `regression` supplies line endpoints and `band` supplies interval widths or bounds. The chart does not fit or bootstrap anything.",
    configuration: "Label both axes, keep the band method in the caption, and use `pointLabel` only when individual observations need names.",
    avoid: "Do not say the chart fitted a model or computed significance; the fit and the band are caller-provided.",
  },
  "candlestick-chart": {
    purpose: "Read open, high, low and close movement across ordered trading sessions, with optional supplied overlays.",
    dataContract: "`candles` contain `time`, `open`, `high`, `low` and `close`; every row must satisfy `low <= min(open, close) <= max(open, close) <= high`. `overlays[].values` must align to the same sessions.",
    configuration: "Use `priceFormat` for the quoted unit, keep overlays explicitly labelled and supplied, and choose a bounded height that lets the wick and body geometry remain legible.",
    avoid: "Do not treat the chart as volume data or as a live market feed; those are separate inputs, and the fixture is not a price prediction.",
  },
  "drawdown-chart": {
    purpose: "Show the decline from a running peak through time, where zero is the high-water mark.",
    dataContract: "`points` are ordered `{ time, value }` ratios at or below zero. The chart does not derive drawdown from a price series.",
    configuration: "Use a percent format, keep the y-axis baseline at zero, and supply the peak convention in the caption so the sign and denominator are explicit.",
    avoid: "Do not pass positive percentage losses into a drawdown axis or compare drawdowns measured from different peaks without stating it.",
  },
  "term-structure-chart": {
    purpose: "Compare rate or price curves across an ordered set of tenors.",
    dataContract: "`tenors` is the ordered shared x axis; every `curves[]` entry has a name and a `values` array of the same length. Values are already expressed in the chosen unit.",
    configuration: "Use `yLabel` and `format` to state percent versus basis points, and distinguish curves with `emphasis` and line style rather than arbitrary colour.",
    avoid: "Do not reorder tenors for visual convenience or put curves with different quotation conventions on the same axis.",
  },
  "curve-comparison-chart": {
    purpose: "Compare several curves over one ordered numeric x domain, such as implied volatility across strikes or expiries.",
    dataContract: "`xLabels` defines the shared ordered x values; each `curves[]` entry supplies a name and a `values` array of equal length. The chart draws the supplied points without interpolation.",
    configuration: "Set `xLabel`, `yLabel` and `format`, and use `emphasis` for the curve the reader should inspect first.",
    avoid: "Do not read values between supplied strikes as if the line were an interpolated model; the connecting geometry is not new data.",
  },
  "volatility-smile-chart": {
    purpose: "Show implied volatility by strike for one or more expiries, making the smile or skew visible.",
    dataContract: "`slices` each contain an `expiry` and `points` of `{ strike, impliedVol }`. Volatility is a supplied value already in the displayed unit, not a price or a computed model parameter.",
    configuration: "Use `strikeFormat` for the strike axis, `volFormat` for the percent or decimal convention, and keep expiries ordered and labelled.",
    avoid: "Do not feed option prices in place of implied volatility or interpolate a smooth surface without showing the observed strikes.",
  },
  "volatility-surface-chart": {
    purpose: "Show a supplied two-dimensional grid of implied volatility across strike and maturity as an orthographic surface.",
    dataContract: "`strikes` and `maturities` define the grid; `vols[maturity][strike]` is the full numeric matrix of ratios. The caller must provide a complete grid; the chart does not interpolate holes.",
    configuration: "Label all three axes with `strikeLabel`, `maturityLabel` and the value format, and keep the grid orientation consistent between runs.",
    avoid: "Do not claim a fitted surface or fill a sparse quote matrix by interpolation in the chart; a missing cell is an absent observation.",
  },
  "efficient-frontier-chart": {
    purpose: "Place assets and a supplied efficient frontier in risk-return space to compare portfolio choices.",
    dataContract: "`assets` contain label/risk/expectedReturn; `frontier` is an ordered risk-return path; `current` is one labelled point. Risk and return must already be computed in compatible units.",
    configuration: "Format both axes with the caller's percent or decimal convention, keep the frontier order, and explain whether returns are arithmetic or compounded.",
    avoid: "Do not imply that LUC solves the optimisation or validates the frontier; the efficient set is an input from the research process.",
  },
  "factor-exposure-chart": {
    purpose: "Compare signed factor exposures and their uncertainty around a meaningful zero baseline.",
    dataContract: "`factors` contain `label`, signed `value` and, when available, `lower`/`upper` interval bounds. The exposures come from the caller's risk model.",
    configuration: "Use a signed `format`, keep the zero baseline, and label the estimation window and interval method in the surrounding copy.",
    avoid: "Do not treat a positive exposure as inherently good or a negative one as bad; the sign names direction, not quality.",
  },
  "pnl-attribution-chart": {
    purpose: "Decompose profit and loss into supplied contribution streams across periods, including costs.",
    dataContract: "`periods` is the shared x axis; each `series[]` has a label and a numeric value per period. Contributions are supplied in basis points or the chosen unit; the chart does not reconcile a missing residual.",
    configuration: "Use `format` for basis points or currency, keep the cost stream signed and visible, and state whether the displayed total includes every contribution.",
    avoid: "Do not let the visual stack imply a total that the supplied rows do not sum to, and do not omit a residual without naming it.",
  },
  "depth-chart": {
    purpose: "Show cumulative bid and ask size at each price level around a supplied mid price.",
    dataContract: "`bids` and `asks` are ordered price/size arrays, and `mid` is the reference price. The sizes must already be cumulative on each side; the chart does not accumulate snapshots.",
    configuration: "Use `priceFormat` and `sizeFormat` for the market's units, and keep the side ordering explicit so the mid is the visual meeting point.",
    avoid: "Do not pass raw per-level sizes and label the result cumulative; the depth shape would be wrong even though it renders.",
  },
  "historical-position-chart": {
    purpose: "Place one current reading on a supplied historical quantile band.",
    dataContract: "`percentile` and `value` describe the reading; the component draws the band and the marker, not a historical time series. The percentile is the caller's classification.",
    configuration: "Use `percentileLabel` to name the band, format the value in its measurement unit, and state the lookback window in the caption.",
    avoid: "Do not call the reading expensive or cheap from position alone; the percentile is descriptive and the threshold belongs to the analysis.",
  },
  "contour-chart": {
    purpose: "Read a sampled scalar field through explicitly supplied contour rings and levels.",
    dataContract: "`surface` supplies the sampled grid and `levels` supplies the iso-values; `xFormat`, `yFormat` and `zFormat` describe the three units. The chart does not extrapolate a surface.",
    configuration: "Choose levels that cover the observed range, keep the x/y domain explicit, and format the z value with its real unit rather than a bare number.",
    avoid: "Do not use contours to hide sparse sampling or present interpolated rings as measured values.",
  },
  "hexbin-chart": {
    purpose: "Show density over a two-dimensional plane without drawing every observation on top of every other.",
    dataContract: "`cells` contain the hex centre (`x`, `y`) and aggregated `value`; `radius` sets the hex geometry in axis units. Hexbinning happens upstream, so the chart only draws supplied cells.",
    configuration: "Set `radius` to the aggregation resolution, name the aggregate with `valueLabel`, and format x, y and value independently.",
    avoid: "Do not treat the cell colour as an observation count unless the upstream aggregation actually counted observations.",
  },
  "parallel-coordinates-chart": {
    purpose: "Compare several normalized or individually scaled dimensions across rows, revealing trade-offs that a 2D scatter cannot show.",
    dataContract: "`axes` defines each dimension's key and range; each `rows[]` entry supplies one value per axis. The caller owns normalisation and must not compare mismatched scales without saying so.",
    configuration: "Set axis ranges explicitly, use `opacity` to manage overplotting, and highlight one row with a semantic tone when one comparison is the subject.",
    avoid: "Do not make raw variables with incomparable units look interchangeable by leaving every axis on the same visual height without a documented scale.",
  },
  "polar-rose-chart": {
    purpose: "Compare magnitudes by angle in a polar layout, where radius carries the measured value.",
    dataContract: "`data` is an ordered array of named numeric values; `variant` selects the rose geometry and `format` describes the measure. The angle is a category position, not a second value.",
    configuration: "Keep a consistent category order, choose `variant` deliberately, and format the radial values because radial length is harder to compare than a linear bar.",
    avoid: "Do not use angle as a quantitative encoding or compare many similar radial lengths without exact labels.",
  },
  "wind-rose-chart": {
    purpose: "Show directional frequency or magnitude as a stacked polar histogram, with speed bins supplied by the caller.",
    dataContract: "`directions` defines the ordered compass sectors; `series` supplies one numeric value per direction for each speed bin. The binning is the caller's.",
    configuration: "Keep direction order clockwise or anticlockwise consistently, label the radial unit, and use a stable speed-bin order for comparison.",
    avoid: "Do not pass raw wind observations and expect the chart to bin them, or compare roses with different bin definitions without disclosure.",
  },
  "ternary-chart": {
    purpose: "Show three-part compositions in which each observation's shares are intended to sum to one.",
    dataContract: "Each `point` supplies `a`, `b` and `c` shares plus an optional label; `corners` names the three vertices. Non-unit totals are normalised for placement and shown as supplied in the tooltip.",
    configuration: "Name all three corners, keep `grid` on when values need interpolation cues, and use `format` for the share convention.",
    avoid: "Do not use a ternary plot for components that are not parts of one whole or for negative shares.",
  },
  "vector-field-chart": {
    purpose: "Read direction and magnitude across a sampled plane through one arrow per observation.",
    dataContract: "`vectors` contain a tail (`x`, `y`) and vector components (`u`, `v`); `scale` is a caller-controlled length multiplier. The chart does not normalise arrows by default.",
    configuration: "Set `scale` explicitly, keep a zero vector visible when it is meaningful, and format both spatial axes with `xFormat`/`yFormat`.",
    avoid: "Do not apply an undocumented scale or compare fields with different arrow multipliers as if magnitudes were on one scale.",
  },
  "ridgeline-chart": {
    purpose: "Compare several distribution shapes by stacking supplied density curves with a vertical offset.",
    dataContract: "`groups` supply a label and density points/values; `overlap` controls the vertical offset and `xFormat` names the measured axis. The densities are caller-supplied.",
    configuration: "Choose `overlap` so peaks remain distinguishable, keep group order stable, and make the x scale shared across all ridges.",
    avoid: "Do not use ridgelines for exact per-group values or silently vary bandwidths between groups.",
  },
  "scatter-matrix-chart": {
    purpose: "Scan pairwise relationships among several numeric variables in a matrix of small scatters.",
    dataContract: "`variables` defines the ordered axes; `rows` contains one numeric value per variable; `cellSize` controls the panel geometry. Missing values stay missing and are not imputed.",
    configuration: "Use a panel size that keeps points distinguishable, order variables by the analytical question, and read only off-diagonal pairs as relationships.",
    avoid: "Do not treat the matrix as causal evidence or compare variables whose units make the pairwise shapes misleading.",
  },
  "spectrogram-chart": {
    purpose: "Read magnitude across time and frequency as a two-dimensional intensity field.",
    dataContract: "`xValues` and `yValues` define the ordered axes; `values[y][x]` supplies the magnitude grid; `unit` and `range` describe the measured unit and the colour domain. No transform is computed by the chart.",
    configuration: "State the `unit` (for example dB), set the `range` deliberately so saturation is not hidden, and keep low-to-high frequency ordering explicit.",
    avoid: "Do not leave the magnitude unit implicit or change the colour range between comparisons without saying so.",
  },
  "surface3-dchart": {
    purpose: "Show a supplied gridded scalar field as a projected three-dimensional surface without a WebGL dependency.",
    dataContract: "`z` is a complete two-dimensional numeric grid; `xLabels` and `yLabels` name its axes; `mode` controls the projection/rendering mode. The grid is not interpolated.",
    configuration: "Label all three axes, choose the projection `mode` for the reading angle, and keep the grid orientation stable across comparisons.",
    avoid: "Do not call the surface a fitted model or use it to hide holes in a sparse grid; absent cells are not zeroes.",
  },
  "theme-river-chart": {
    purpose: "Show how several categorical quantities change and cross through ordered periods as a flowing stacked field.",
    dataContract: "`events` is an ordered list of `{ date, name, value }` facts, one stream per category; `format` describes the quantity. The engine lays out the bands but does not derive the facts.",
    configuration: "Keep a consistent category order across periods, format the quantity, and state whether the stream width is additive across categories.",
    avoid: "Do not use a theme river for independent series that do not share a meaningful total or for a precise ranking of close values.",
  },
  "sankey-chart": {
    purpose: "Follow quantities through a network of directed stages, where link width carries flow.",
    dataContract: "`nodes` supplies unique ids and labels; `links` supplies `source`, `target` and numeric `value`; `format` names the flow unit. The caller must reconcile flows at each node.",
    configuration: "Keep node ids stable, order stages deliberately, and label the flow unit; the chart does not aggregate or balance missing links.",
    avoid: "Do not use Sankey for unordered correlations or for flows whose node totals do not reconcile; width would imply a conservation the data lacks.",
  },
  "graph-chart": {
    purpose: "Explore relationships and clusters in a network, where node placement is a visual aid rather than a coordinate measurement.",
    dataContract: "`nodes` contain unique ids plus optional name/group/value; `links` contain source/target/value; `groups` names the groups and `layout` selects the placement strategy.",
    configuration: "Choose `layout`, declare `groups` so colour has meaning, and use `format` for link or node weights; keep ids stable across renders.",
    avoid: "Do not read precise distances or angles from a force layout, and do not infer a causal direction from an undirected edge.",
  },
  "chord-chart": {
    purpose: "Show bidirectional cross-flows between labelled groups as ribbons around a shared ring.",
    dataContract: "`labels` names the groups; `values` is a square matrix whose row/column order matches `labels`; `format` names the flow unit. Diagonal entries are the within-group flow.",
    configuration: "Keep the label order fixed, explain whether each ribbon is directed by row-to-column, and format the shared flow unit.",
    avoid: "Do not use a chord diagram for a non-square or asymmetric matrix whose direction you cannot explain.",
  },
  "dendrogram-chart": {
    purpose: "Show the merge order and distance structure of a hierarchical clustering computed upstream.",
    dataContract: "`leaves` names the terminal items; each `merge` has an id, left/right child ids and a numeric `height`. Merge heights must come from the clustering and listen in increasing order.",
    configuration: "Keep the leaf order and merge ids stable, format the height with `format`, and state the distance metric and linkage in the caption.",
    avoid: "Do not use the branch lengths to imply a clustering method the upstream process did not use, or reorder leaves without preserving the merge tree.",
  },
  "hierarchy-tree-chart": {
    purpose: "Read parent-child structure and optional values in a hierarchy, including collapsed branches.",
    dataContract: "`root` is a nested object with `name`, optional `value` and `children`; values are supplied at the nodes and not summed by the chart. `orientation` chooses the reading direction.",
    configuration: "Set `orientation`, keep node names unique enough for the interaction, and format values only where they are part of the hierarchy.",
    avoid: "Do not use a tree for cross-links or for a flat list; those are network and list problems, not parent-child structure.",
  },
  "treemap-chart": {
    purpose: "Show hierarchical composition by area, making large shares findable before reading exact values.",
    dataContract: "`data` is a nested hierarchy of `name`, optional `children` and numeric `value` leaves. The values determine area and must be non-negative at each branch.",
    configuration: "Use `format` for the share unit, keep stable sibling order where the ranking matters, and state whether the displayed hierarchy is complete.",
    avoid: "Do not compare tiny areas precisely or use negative values; a treemap is a composition view, not a precise linear scale.",
  },
  "sunburst-chart": {
    purpose: "Show a hierarchy as concentric levels, making depth and branch composition readable in one radial view.",
    dataContract: "`data` is the same nested `name`/`children`/`value` hierarchy as a treemap. Each leaf's value contributes to its parent; values are supplied, not inferred from names.",
    configuration: "Use `format` for the leaf measure, keep the hierarchy order stable, and plan for drill-down when a level has many leaves.",
    avoid: "Do not use a sunburst when readers need an exact leaf ranking; the angular areas at depth are harder to compare than a sorted bar or treemap.",
  },
  "radar-chart": {
    purpose: "Compare profiles across several explicitly bounded dimensions, where the overall shape matters more than any one spoke.",
    dataContract: "`indicators` define each spoke's name and maximum; every `series` supplies one value per indicator in the same order. The maxima are part of the visual scale and must be supplied.",
    configuration: "Set meaningful indicator maxima, keep axis order consistent, and use at most a few series so overlaps remain readable.",
    avoid: "Do not use radar to rank observations or to compare profiles with different maxima as if the areas were commensurable.",
  },
  "gantt-chart": {
    purpose: "Show tasks on a real time axis, including duration and progress where the caller supplies it.",
    dataContract: "`tasks` contain id/name, numeric `start` and `end` timestamps, and optional `progress` from 0 to 1. The chart does not schedule or infer dependencies.",
    configuration: "Use `axisLabel` and `timeFormat` for the calendar context, keep task order stable, and show progress only when it is a real measured state.",
    avoid: "Do not use a Gantt chart for milestones with no duration or for dependencies the data does not contain.",
  },
  "dumbbell-chart": {
    purpose: "Compare one measured quantity at two named moments, making the direction and size of change the subject.",
    dataContract: "`rows` contain `label`, `from` and `to` numeric values; `labels` names the two endpoints; `format` describes the measure. The two endpoints should share a unit.",
    configuration: "Name both endpoints, sort rows by the analytical question, and format the metric consistently on both sides.",
    avoid: "Do not use a dumbbell for a many-period time series or compare endpoints measured with different methodologies.",
  },
  "slope-chart": {
    purpose: "Show rank or level movement between two periods, where crossing lines communicate a change in order.",
    dataContract: "`rows` contain `label`, `left` and `right` numeric values; `periods` names the two endpoints; `format` names the value or rank scale. Values must be comparable.",
    configuration: "Use rank formats when the values are ranks, keep period names explicit, and use tone to identify the series that changed most.",
    avoid: "Do not use a slope chart for more than two periods or for many crossings that become unreadable.",
  },
  "bullet-chart": {
    purpose: "Compare an actual value with a target and qualitative ranges in a compact row.",
    dataContract: "`rows` contain `label`, `value`, `target` and ordered `ranges`; `valueLabel` and `targetLabel` name the marks; `format` describes the unit. Ranges are context, not automatic thresholds.",
    configuration: "Keep range order ascending, name the target, and format the actual and target with one unit.",
    avoid: "Do not use qualitative ranges as if they were statistically derived thresholds; their meaning must be defined by the caller.",
  },
  "bump-chart": {
    purpose: "Show how ranks change across ordered periods, where a crossing is more important than the absolute level.",
    dataContract: "`periods` is the ordered x axis; each `series` supplies one rank per period, with `null` for an unranked period. Ranks are supplied and are not derived from values.",
    configuration: "Keep `rankLabel` visible, preserve period order, and use a distinct tone for the series in focus.",
    avoid: "Do not use a bump chart for raw values or encode an unranked period as rank zero; it would invent a position.",
  },
  "lollipop-chart": {
    purpose: "Compare a magnitude across ranked categories with less visual ink than a full bar chart.",
    dataContract: "`data` rows contain `label` and a numeric `value`; `format` describes the measure. The caller supplies the ranking and units.",
    configuration: "Keep rows in the intended order, format the value, and use one semantic tone when a category is the subject.",
    avoid: "Do not use lollipops for parts of a whole without a common baseline, or for so many categories that the stems become texture.",
  },
  "mekko-chart": {
    purpose: "Show composition and group size together: column width carries the group's weight and segments carry the mix.",
    dataContract: "`columns` contain a `label`, numeric `weight` and `segments` of `{ name, value }`; segment values must be comparable within a column. The chart does not compute shares.",
    configuration: "State the weight unit, keep segment order consistent, and use `format` for the measure rather than relying on the visual height alone.",
    avoid: "Do not use a Mekko chart when column weights are not meaningful or when segments cannot be compared on one scale.",
  },
  "calendar-heatmap": {
    purpose: "Place daily observations on a calendar so inactivity, clustering and period effects are visible.",
    dataContract: "`year` sets the calendar domain; `data` is an array of `[date, value]` pairs with valid calendar dates. Missing dates remain absent rather than becoming zero.",
    configuration: "Use `format` for the value unit, keep one year per chart, and explain whether the colour midpoint is zero or a target.",
    avoid: "Do not treat an absent date as a zero observation or compare calendars drawn with different value domains.",
  },
  "event-timeline": {
    purpose: "Place dated events on a shared time axis, optionally with guide lines that connect them to a surrounding reading.",
    dataContract: "`events` contain `at`, `label` and optionally `category`/`tone`; `guides` toggles the vertical guides. Dates and categories are supplied metadata, not inferred from the label.",
    configuration: "Choose `guides` only when the event relation to the axis matters, use category/tone consistently, and keep labels short enough to avoid collisions.",
    avoid: "Do not use an event timeline for undated sequence steps; use a process or milestone chart when the order, not the date, is the fact.",
  },
  "regime-strip": {
    purpose: "Show a classification that persists across time as contiguous state intervals.",
    dataContract: "`intervals` require ordered `start`/`end` spans and a `state`; `states` maps each state id to a label and tone. The state classification comes from the caller.",
    configuration: "Provide the `states` vocabulary, keep intervals non-overlapping, and set `showLegend` when more than one state is visible.",
    avoid: "Do not use a regime strip for point events or let intervals overlap; a state is a period, not a marker.",
  },
  "heatmap-chart": {
    purpose: "Read intensity across two categorical axes and find cells that differ from their neighbours.",
    dataContract: "`xLabels` and `yLabels` define the ordered axes; `values[y][x]` is a rectangular numeric matrix. A `null` cell is drawn as absent, not as zero.",
    configuration: "Set the value format, choose whether cell labels are readable with `showCellValues`, and disclose the colour domain when comparing two heatmaps.",
    avoid: "Do not use a heatmap for precise comparisons of many close values; a table or ranked bars preserves the exact ordering.",
  },
  "gauge-chart": {
    purpose: "Show one current reading inside labelled ranges or against a target.",
    dataContract: "`value`, `min` and `max` define the reading and domain; `thresholds` provides labelled zone boundaries and tones; `format` names the unit. The chart does not evaluate the reading.",
    configuration: "Label the measure and its unit, define thresholds in the copy, and keep the domain fixed when comparing gauges.",
    avoid: "Do not use a gauge for trend over time or for thresholds whose business meaning is unknown; a gauge is a single-state reading.",
  },
  "autocorrelation-chart": {
    purpose: "Inspect autocorrelation and partial autocorrelation across lags to judge dependence and model adequacy.",
    dataContract: "`series` contain lag points `{ x, y }` with a `kind` of ACF or PACF; `band` supplies the significance threshold and `bandLabel` names its derivation. The chart computes neither statistic.",
    configuration: "Keep the lag axis ordered, show the significance band, and format coefficients with a signed precision that exposes small values.",
    avoid: "Do not infer a causal model from ACF/PACF patterns or use a band computed for a different sample size.",
  },
  "survival-curve-chart": {
    purpose: "Compare survival probabilities over time, including censoring marks and step changes.",
    dataContract: "Each `series` supplies ordered step `points` of `{ x, y }` and optional `censored` points. Survival must be non-increasing and the curves are already estimated by the caller.",
    configuration: "Format time and probability axes, label the cohort, and show censoring marks only where the observation was actually censored.",
    avoid: "Do not smooth the step function or treat censored observations as events; that changes the survival estimate.",
  },
  "precision-recall-chart": {
    purpose: "Compare precision-recall trade-offs for binary classification, especially when positive cases are rare.",
    dataContract: "`curves` contain ordered recall/precision `points`; `baseline` supplies the prevalence no-skill level; x and y formats declare the probability convention.",
    configuration: "Label the prevalence baseline, format both axes as percentages, and keep the curve order in the supplied threshold direction.",
    avoid: "Do not compare PR curves from datasets with different prevalence without saying so; the baseline and meaning of precision change.",
  },
  "feature-importance-chart": {
    purpose: "Rank features by a supplied importance or coefficient together with its uncertainty.",
    dataContract: "`features` contain `key`, `label`, `value` and optional `low`/`high` bounds; `signed` determines whether zero is a meaningful centre. The importances come from the model.",
    configuration: "Set `signed` when coefficients can be negative, name the interval with `intervalLabel`, and format the value consistently across features.",
    avoid: "Do not present a model-specific importance as a universal causal ranking or drop the uncertainty interval when it is available.",
  },
  "choropleth-chart": {
    purpose: "Show one value per region on a registered geographic map, using colour to compare regions.",
    dataContract: "Register a map before render, then pass `mapName` and `regions` whose region ids match that map. Values are supplied per region; missing regions are not filled with zero.",
    configuration: "Use `valueLabel` and `format` for the measure, state the colour domain, and register the map once before mounting the chart.",
    avoid: "Do not compare raw counts across regions of very different size without normalising, and do not imply that LUC supplies political boundaries.",
  },
  "geo-scatter-chart": {
    purpose: "Place point observations on a registered map and size them by a supplied value.",
    dataContract: "`mapName` must reference a registered map; each `point` supplies `name`, map `coordinates` and a numeric `value`. Coordinates use the map's declared coordinate system.",
    configuration: "Use `valueFormat` for the point measure, state the map registration and coordinate convention, and keep point size tied to a meaningful domain.",
    avoid: "Do not treat screen distances as geographic distances without accounting for the map's projection and bounds.",
  },
  "geo-trajectory-chart": {
    purpose: "Show one or more routes on a map, including a path that crosses the antimeridian.",
    dataContract: "`trajectories` supply ordered route points in the map's coordinate system; `xLabel` and `yLabel` name the plane. The chart unwraps crossing paths for drawing only.",
    configuration: "State the coordinate system and map registration, format both axes, and keep route point order as the travelled sequence.",
    avoid: "Do not read the drawn crossing as a straight-line distance or use an unregistered coordinate system without declaring its bounds.",
  },
};

/**
 * Page-level provider documentation for the nine TradingView entries.
 *
 * The snippets use only exports of `@luc/ui/tradingview`. They are deliberately
 * short enough to copy into a client component, while the page keeps the richer
 * gallery above them.
 */
export const INTEGRATION_NOTES: Record<string, IntegrationNote> = {
  "tradingview-charts": {
    usage: [
      {
        imports: ["TradingViewAdvancedChart"],
        code: `<TradingViewAdvancedChart
  symbol="BINANCE:BTCUSDT"
  preset="standard"
  interval="D"
  height={560}
/>`,
        note: "The full provider chart; `preset` selects the amount of provider chrome.",
      },
      {
        imports: ["TradingViewMiniChart"],
        code: `<TradingViewMiniChart symbol="NASDAQ:AAPL" height={180} />`,
        note: "The compact Web Component chart for a market card or summary row.",
      },
      {
        imports: ["TradingViewSymbolOverview"],
        code: `<TradingViewSymbolOverview
  symbols={[
    { title: "Apple", symbol: "AAPL|1D" },
    { title: "Microsoft", symbol: "MSFT|1D" },
  ]}
  showVolume
  height={420}
/>`,
        note: "One provider chart carries several symbols and their attribution links.",
      },
      {
        imports: ["TradingViewSeasonalChart"],
        code: `<TradingViewSeasonalChart symbol="NASDAQ:AAPL" showAverage height={400} />`,
        note: "The provider-computed seasonal view for one instrument.",
      },
    ],
    configuration:
      "`symbol`, `height` and `theme` are shared. The advanced chart adds `interval`, `style`, `preset` and caller-supplied `studies` or `compareSymbols`; the mini and seasonal widgets expose only the provider settings their own modules publish.",
    lifecycle:
      "Render these in a Client Component. The Web Components load their provider module only when the widget enters its lazy trigger; the iframe wrappers create the embed after hydration and remove it on unmount.",
    limitations:
      "The chart data, provider controls and attribution are TradingView's. A network failure is reported by the wrapper's bounded error surface; LUC does not cache, parse or recompute the market series.",
    guidance: {
      use: [
        "Use the provider chart when its standard market views are the product and the data is not yours to compute.",
        "Give every widget an explicit height; these surfaces measure and scroll differently from ordinary React content.",
      ],
      avoid: [
        "Do not use a provider chart when overlays or calculations must come from your own data; use `@luc/ui/charts` for that.",
        "Do not assume TradingView's site settings are wrapper props; only the settings exposed by the typed widget cross the boundary.",
      ],
    },
  },
  "tradingview-watchlists": {
    usage: [
      {
        imports: ["TradingViewMarketSummary"],
        code: `<TradingViewMarketSummary
  mode="market-movers"
  assetsType="stocks"
  layoutMode="grid"
  height={220}
/>`,
        note: "The provider's mover row; switch to `mode=\"custom\"` for your own sectors.",
      },
      {
        imports: ["TradingViewMarketOverview"],
        code: `<TradingViewMarketOverview symbolSectors={sectors} height={550} />`,
        note: "A market sidebar with the provider chart for the selected instrument.",
      },
      {
        imports: ["TradingViewMarketData"],
        code: `<TradingViewMarketData symbolSectors={sectors} view="performance" heatmap height={340} />`,
        note: "The same sections as a performance view with provider colour semantics.",
      },
      {
        imports: ["TradingViewWorldMarketSummary"],
        code: `<TradingViewWorldMarketSummary view="map" sort="performance" height={520} />`,
        note: "Country-level equity performance, shown as a map or a list.",
      },
    ],
    configuration:
      "`symbolSectors` is an array of `{ sectionName, symbols }` records and is serialised as provider JSON. `timeFrame`, `itemSize`, `layoutMode` and `view` select the provider's reading, not a LUC data query.",
    lifecycle:
      "These are Web Components. Provide a bounded height, keep the page in a Client Component, and let the wrapper's lazy registration decide when the provider module is requested.",
    limitations:
      "The sections, quotes, market status and performance values come from TradingView. `symbolUrl` changes only symbol links; provider attribution remains outside that redirect.",
    guidance: {
      use: [
        "Use a watchlist widget for a market board whose provider session status and change calculations are acceptable as-is.",
        "Keep your symbol groups small enough for the chosen layout and give the grid a stable minimum height.",
      ],
      avoid: [
        "Do not label provider movers as your own screened universe; the provider chooses the list.",
        "Do not nest an unbounded widget inside an auto-height row and expect the page to size it.",
      ],
    },
  },
  "tradingview-tickers": {
    usage: [
      {
        imports: ["TradingViewTickerTape"],
        code: `<TradingViewTickerTape
  symbols={["NASDAQ:AAPL", "BINANCE:BTCUSDT", "FX:EURUSD"]}
  direction="horizontal"
  height={104}
/>`,
        note: "The scrolling strip; the provider owns the scroll motion.",
      },
      {
        imports: ["TradingViewTickers"],
        code: `<TradingViewTickers symbols={symbols} direction="vertical" height={400} />`,
        note: "A quote list with optional inline charts.",
      },
      {
        imports: ["TradingViewSingleTicker"],
        code: `<TradingViewSingleTicker symbol="NASDAQ:AAPL" height={114} />`,
        note: "One quote card for a detail page or summary rail.",
      },
      {
        imports: ["TradingViewTickerTag"],
        code: `<TradingViewTickerTag symbol="NASDAQ:AAPL" preserveText>
  Apple
</TradingViewTickerTag>`,
        note: "An inline chip that can sit inside a sentence or table cell.",
      },
    ],
    configuration:
      "`symbols` is an ordered list of provider symbols. `direction`, `itemSize`, `hideChart`, `hoverType`, `hideBackground` and `preserveText` are supported by the specific widgets that publish them.",
    lifecycle:
      "All four are Web Components. The tape's horizontal size is provider-defined; mount it with a width and the height recommended by the widget, and keep repeated identifiers stable.",
    limitations:
      "Quotes, change calculations, links and scrolling belong to TradingView. The tape exposes no reduced-motion switch, and the wrapper does not freeze a live widget to imitate one.",
    guidance: {
      use: [
        "Use a tape for ambient market context and a single ticker when one instrument is the subject.",
        "Use `TickerTag` for prose or table cells, where a block widget would break the line box.",
      ],
      avoid: [
        "Do not use a moving tape as the only way to communicate a price or a critical change.",
        "Do not put several ticker tapes on one page; the motion competes and the provider cost multiplies.",
      ],
    },
  },
  "tradingview-heatmaps": {
    usage: [
      {
        imports: ["TradingViewStockHeatmap"],
        code: `<TradingViewStockHeatmap
  dataSource="SPX500"
  blockSize="market_cap_basic"
  blockColor="change"
  height={590}
/>`,
        note: "S&P constituents sized by market cap and coloured by the provider's change field.",
      },
      {
        imports: ["TradingViewCryptoHeatmap"],
        code: `<TradingViewCryptoHeatmap height={590} />`,
        note: "The crypto universe with provider size and performance semantics.",
      },
      {
        imports: ["TradingViewEtfHeatmap"],
        code: `<TradingViewEtfHeatmap grouping="asset_class" height={540} />`,
        note: "US ETFs grouped by asset class.",
      },
      {
        imports: ["TradingViewForexTable"],
        code: `<TradingViewForexTable displayedValue="dailyChange" heatmap height={400} />`,
        note: "The Web Component forex table, optionally using heat colours.",
      },
    ],
    configuration:
      "`blockSize` selects what area means and `blockColor` selects the performance field. Those are provider semantics: do not relabel volume size as market cap, or daily change as a one-month return.",
    lifecycle:
      "The three market heatmaps are provider iframes; the forex table is a Web Component. Both need a bounded box, and the iframe variants create their provider document after hydration.",
    limitations:
      "Red and green carry market meaning and are intentionally not remapped to LUC accents. The TradingView provider owns the exchanges, universe, colour scale and performance calculations.",
    guidance: {
      use: [
        "Use these when the provider's market-wide colour map is the information the reader needs.",
        "State the universe, size field and performance window beside the widget.",
      ],
      avoid: [
        "Do not use a heatmap for precise ranking of close values; area and colour are not a table.",
        "Do not restyle positive and negative colours to the product's brand palette.",
      ],
    },
  },
  "tradingview-screeners": {
    usage: [
      {
        imports: ["TradingViewScreener"],
        code: `<TradingViewScreener
  market="america"
  defaultColumn="overview"
  showToolbar
  height={560}
/>`,
        note: "The provider's market table for one accepted market key.",
      },
      {
        imports: ["TradingViewCryptocurrencyMarket"],
        code: `<TradingViewCryptocurrencyMarket displayCurrency="USD" height={520} />`,
        note: "The crypto-specific table with the provider's own columns and filters.",
      },
    ],
    configuration:
      "`market` selects the provider universe; `defaultColumn` and `defaultScreen` choose provider presets. `showToolbar` exposes the provider's filtering controls and `displayCurrency` changes display values only.",
    lifecycle:
      "Both are iframe widgets. Use a fixed or bounded height so the table scrolls inside its provider document rather than growing the page.",
    limitations:
      "Universe membership, rows, filters and column calculations are TradingView's. LUC does not receive the selected rows and cannot turn this table into a local data source.",
    guidance: {
      use: [
        "Use a screener when a provider-filtered market table is enough and no application action depends on its rows.",
        "Keep the provider market key and the visible heading aligned so readers know which universe is being filtered.",
      ],
      avoid: [
        "Do not promise your own watchlist or sorting semantics; those controls are the provider's.",
        "Do not assume every market key has its own attribution label; the wrapper falls back to the provider's general markets link.",
      ],
    },
  },
  "tradingview-symbol-details": {
    usage: [
      {
        imports: ["TradingViewSymbolInfo"],
        code: `<TradingViewSymbolInfo symbol="NASDAQ:AAPL" height={282} />`,
        note: "The provider's key facts for one symbol.",
      },
      {
        imports: ["TradingViewTechnicalAnalysis"],
        code: `<TradingViewTechnicalAnalysis
  symbol="NASDAQ:AAPL"
  interval="1D"
  ratingsDisplayMode="gauge-and-breakdown"
  height={425}
/>`,
        note: "The provider's technical rating, not a LUC signal calculation.",
      },
      {
        imports: ["TradingViewFundamentalData"],
        code: `<TradingViewFundamentalData symbol="NASDAQ:AAPL" height={620} />`,
        note: "Statements and ratios in the provider's own iframe.",
      },
      {
        imports: ["TradingViewCompanyProfile"],
        code: `<TradingViewCompanyProfile symbol="NASDAQ:AAPL" height={530} />`,
        note: "Company description and classification for a listed instrument.",
      },
      {
        imports: ["TradingViewBrokerRating"],
        code: `<TradingViewBrokerRating broker="sample" height={220} />`,
        note: "A partner rating module; the broker slug is part of its provider URL.",
      },
      {
        imports: ["TradingViewBrokerReviews"],
        code: `<TradingViewBrokerReviews broker="sample" showReviews height={420} />`,
        note: "The same partner module with its provider reviews surfaced.",
      },
    ],
    configuration:
      "Most widgets require `symbol`. Technical analysis adds `interval`, `ratingsMode` and `ratingsDisplayMode`; the broker widgets require the provider's `broker` slug rather than a display name.",
    lifecycle:
      "The symbol-info and fundamental widgets are iframes; technical analysis, company profile and broker modules are Web Components. Mount them after hydration and keep a stable symbol while the provider is loading.",
    limitations:
      "Ratings, fundamentals, profiles and broker reviews are TradingView provider content. LUC neither computes nor stores them, and a broker widget is not an entitlement or an endorsement.",
    guidance: {
      use: [
        "Use one symbol throughout a detail page and give each provider surface its own bounded section.",
        "Name the provider in the surrounding copy when a rating or fundamental statement is part of a research narrative.",
      ],
      avoid: [
        "Do not present a provider technical rating as LUC's own recommendation.",
        "Do not hard-code a broker slug into a generic template; it is a provider identity, not a label.",
      ],
    },
  },
  "tradingview-news-calendars": {
    usage: [
      {
        imports: ["TradingViewTopStories"],
        code: `<TradingViewTopStories feedMode="symbol" symbol="NASDAQ:AAPL" height={620} />`,
        note: "A symbol-specific provider news feed; use `all_symbols` for the global feed.",
      },
      {
        imports: ["TradingViewEconomicCalendar"],
        code: `<TradingViewEconomicCalendar importanceFilter="1" countryFilter="us,eu,gb" height={520} />`,
        note: "High-importance provider events for three regions.",
      },
      {
        imports: ["TradingViewEconomicMap"],
        code: `<TradingViewEconomicMap region="global" metric="iryy" hideLegend height={420} />`,
        note: "One macro indicator on the provider's world map.",
      },
    ],
    configuration:
      "Top stories uses `feedMode` plus `symbol` or `market`; a symbol feed with an invalid symbol refuses rather than falling back. The calendar uses comma-separated `importanceFilter` and `countryFilter` strings; the map uses the closed `region` and `metric` unions.",
    lifecycle:
      "Top stories and the economic calendar are iframe widgets; the economic map is a Web Component. Each loads its provider content after hydration and needs an explicit height.",
    limitations:
      "The stories, event records, country coverage and macro values come from TradingView. LUC does not parse, store or re-render them, and the provider can change the available regions or feed behaviour.",
    guidance: {
      use: [
        "Use these as context around a price chart, never as the only recording of an event that matters to the product.",
        "State the provider and the selected country or importance filter next to the calendar.",
      ],
      avoid: [
        "Do not confuse this economic calendar with LUC's own `Calendar` date component.",
        "Do not translate provider event copy or claim that LUC filtered the underlying feed.",
      ],
    },
  },
  "tradingview-themes": {
    usage: [
      {
        imports: ["TradingViewMiniChart"],
        code: `<TradingViewMiniChart symbol="NASDAQ:AAPL" theme="auto" height={180} />`,
        note: "A Web Component follows the LUC theme through the supported token bridge.",
      },
      {
        imports: ["TradingViewAdvancedChart"],
        code: `<TradingViewAdvancedChart
  symbol="BINANCE:BTCUSDT"
  preset="minimal"
  theme="auto"
  height={420}
/>`,
        note: "An iframe receives the provider's own theme configuration; it cannot inherit the whole LUC stylesheet.",
      },
      {
        imports: ["TradingViewTickerTape"],
        code: `<TradingViewTickerTape
  symbols={["NASDAQ:AAPL", "BINANCE:BTCUSDT"]}
  transparent
  height={104}
/>`,
        note: "Use provider transparency only where the surrounding LUC surface is itself a deliberate background.",
      },
    ],
    configuration:
      "`theme=\"auto\"` follows LUC's resolved theme. `inheritTheme` controls the Web Component CSS-variable bridge, while iframe widgets accept only the provider's theme and surface colours; `transparent` is honoured only where the provider publishes it.",
    lifecycle:
      "A LUC theme change updates Web Component attributes immediately. Iframe widgets are re-created with the new provider configuration, and the wrapper removes the previous embed before creating the replacement.",
    limitations:
      "The iframe document is a provider boundary: axis labels, crosshairs, toolbars and dialogs stay TradingView's. LUC does not reach into a closed shadow root or invent selectors to restyle provider internals.",
    guidance: {
      use: [
        "Use `theme=\"auto\"` unless the product intentionally pins a provider surface to one theme.",
        "Check both light and dark states around the widget because the surrounding card and the provider document are separate surfaces.",
      ],
      avoid: [
        "Do not promise full LUC theming for an iframe or attempt to style provider internals through arbitrary CSS.",
        "Do not default to transparency for dense market data; an opaque provider surface is usually more readable.",
      ],
    },
  },
  "tradingview-patterns": {
    usage: [
      {
        imports: [
          "TradingViewAdvancedChart",
          "TradingViewSingleTicker",
          "TradingViewSymbolInfo",
          "TradingViewTopStories",
        ],
        code: `"use client";

import {
  TradingViewAdvancedChart,
  TradingViewSingleTicker,
  TradingViewSymbolInfo,
  TradingViewTopStories,
} from "@luc/ui/tradingview";

export function InstrumentPage({ symbol }: { symbol: string }) {
  return (
    <div className="grid gap-4">
      <TradingViewSingleTicker symbol={symbol} height={114} />
      <TradingViewAdvancedChart symbol={symbol} preset="standard" height={520} />
      <TradingViewSymbolInfo symbol={symbol} height={282} />
      <TradingViewTopStories
        feedMode="symbol"
        symbol={symbol}
        displayMode="compact"
        height={282}
      />
    </div>
  );
}`,
        note: "A complete instrument page: React owns the selected symbol, while each provider widget owns its own content.",
      },
    ],
    configuration:
      "Use one application-level symbol value, cap the number of provider embeds per page, and put layout in LUC's grid or cards. The widgets do not share a provider store or selected-symbol event.",
    lifecycle:
      "The page must be a Client Component. Keep the symbol stable during hydration, give every provider surface a bounded height, and expect each widget to load its own provider module independently.",
    limitations:
      "Every widget on a composed page depends on TradingView's network and data. The pattern is a layout composition, not a data integration: LUC receives no quotes, news or chart series from these wrappers.",
    guidance: {
      use: [
        "Use a composition when the provider's standard market views are the intended product experience.",
        "Keep four to six embeds as a practical page budget and state which provider supplies each region.",
      ],
      avoid: [
        "Do not add a global provider symbol store; the selected instrument remains React state owned by the application.",
        "Do not put every available widget on one page; network cost, loading states and competing chrome quickly dominate the reading.",
      ],
    },
  },
};

/**
 * The two to four pages a reader most likely wants next.
 *
 * Deliberately not the family list: the family is already in the sidebar and in
 * the card above, so repeating it in reading order answers a question nobody
 * asked. An id that does not resolve, or that is not in the same family, fails
 * `docs-registry.test.ts` rather than rendering a dead link.
 */
export const RELATED_ENTRIES: Record<string, readonly string[]> = {
  button: ["icon-button", "link", "toggle"],
  "icon-button": ["button", "icon", "float-button"],
  icon: ["icon-button", "button", "kbd"],
  "float-button": ["icon-button", "button-group", "icon"],
  "button-group": ["toggle", "button", "float-button"],
  toggle: ["button-group", "button", "kbd"],
  link: ["button", "icon-button", "kbd"],
  kbd: ["link", "toggle", "icon"],
  input: ["textarea", "search-input", "field"],
  "tag-input": ["input", "field", "file-input"],
  "color-picker": ["input-group", "input", "label"],
  "transfer-list": ["sortable-list", "kanban-board", "list"],
  checkbox: ["switch", "radio-group", "field"],
  switch: ["checkbox", "radio-group", "field"],
  textarea: ["input", "field", "sections"],
  "native-select": ["select", "combobox", "field"],
  label: ["field", "input", "segmented-control"],
  "radio-group": ["checkbox", "switch", "segmented-control"],
  rating: ["slider", "input-group", "field"],
  "search-input": ["input", "combobox", "input-group"],
  "input-group": ["input", "field", "rating"],
  "segmented-control": ["native-select", "select", "radio-group"],
  sections: ["form", "field", "input"],
  select: ["combobox", "native-select", "field"],
  "number-input": ["input", "field", "slider"],
  slider: ["number-input", "input", "rating"],
  combobox: ["select", "search-input", "field"],
  "password-input": ["input", "otp-input", "field"],
  "otp-input": ["password-input", "input", "field"],
  "file-input": ["file-upload", "field", "input"],
  "file-upload": ["file-input", "field", "sections"],
  field: ["label", "input", "form"],
  form: ["sections", "field", "input"],
  calendar: ["date-picker", "time-picker"],
  "date-picker": ["calendar", "time-picker"],
  "time-picker": ["date-picker", "calendar"],
  container: ["grid", "stack", "section"],
  grid: ["container", "inline", "stack"],
  inline: ["stack", "grid", "container"],
  stack: ["inline", "grid", "container"],
  section: ["container", "stack", "panel"],
  panel: ["card", "section", "separator"],
  separator: ["panel", "stack", "container"],
  "scroll-area": ["panel", "stack", "grid"],
  "aspect-ratio": ["card", "grid", "panel"],
  card: ["panel", "grid", "section"],
  /* data display: the table's parts point at each other, and the figure
   * components point at the neighbours a reader compares them with. */
  badge: ["timestamp", "delta", "list"],
  "column-visibility-menu": ["data-table-toolbar", "data-table", "facet-filter"],
  "data-details": ["data-table", "list", "metric"],
  "data-table": ["virtual-data-table", "data-table-toolbar", "data-table-pagination"],
  "data-table-pagination": ["data-table", "data-table-toolbar", "virtual-data-table"],
  "data-table-toolbar": ["data-table", "facet-filter", "column-visibility-menu"],
  delta: ["metric", "stat-card", "timestamp"],
  "facet-filter": ["data-table-toolbar", "column-visibility-menu", "data-table"],
  "kanban-board": ["sortable-list", "list", "data-table"],
  list: ["timeline", "data-details", "sortable-list"],
  metric: ["stat-card", "delta", "timestamp"],
  "sortable-list": ["kanban-board", "list", "transfer-list"],
  "stat-card": ["metric", "delta", "data-details"],
  timeline: ["list", "timestamp", "data-details"],
  timestamp: ["metric", "delta", "list"],
  "virtual-data-table": ["data-table", "data-table-pagination", "data-table-toolbar"],
};
