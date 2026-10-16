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
};
