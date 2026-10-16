/*
 * Live Demos — Forms.
 *
 * `checkbox`, `input-group`, `label`, `native-select`, `radio-group`, `rating`,
 * `search-input`, `sections`, `segmented-control`, `switch`, `textarea`.
 *
 * What the tests that matter for a control are is its *states*, so every
 * specimen here shows them rather than the happy path alone: an indeterminate
 * box, an invalid field, a disabled row, a checked switch. Every one is
 * deterministic — `defaultChecked` and `defaultValue` rather than a value the
 * reader has to produce first — because a page that renders differently on each
 * visit is not documentation.
 *
 * This revision gave each entry a **title** and the configurations a reader has
 * to choose between (`textarea.autoResize`, `input-group`'s three addon shapes,
 * `rating.max`, `sections`'s add and remove) instead of one specimen and a props
 * table. The snippets stay honest in the two directions the coverage test
 * checks: a structured demo prints its own props object, and a composition's
 * snippet names one of the exports the page documents.
 */

import {
  Checkbox,
  Field,
  FieldArray,
  FormSection,
  Input,
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupSeparator,
  Label,
  NativeSelect,
  Radio,
  RadioGroup,
  Rating,
  SearchInput,
  SegmentedControl,
  SegmentedItem,
  Stack,
  Switch,
  Textarea,
  type CheckboxProps,
  type NativeSelectProps,
  type RatingProps,
  type SwitchProps,
  type TextareaProps,
} from "@luc/ui";
import { RiLineChartLine, RiSearchLine, RiTableLine } from "@remixicon/react";
import { FieldArrayDemo } from "@/components/demo/islands/field-array-demo";
import { SearchInputDemo } from "@/components/demo/islands/search-input-demo";
import { composition, demo, type DemoSpec } from "../index";

const universes = [
  { value: "us-large", label: "US large cap" },
  { value: "us-small", label: "US small cap" },
  { value: "global", label: "Global developed" },
];

export const formDemos: readonly DemoSpec[] = [
  /* ---------------------------------------------------------------- checkbox */
  demo<CheckboxProps>({
    id: "checkbox",
    title: "Checked, unchecked, indeterminate",
    component: "Checkbox",
    props: { label: "Auto-apply patches", defaultChecked: true },
    render: (props) => (
      <Stack gap="sm">
        <Checkbox {...props} />
        <Checkbox label="Include delisted instruments" />
        <Checkbox label="Select all instruments" checked="indeterminate" />
      </Stack>
    ),
    note: "Radix supplies the semantics, the indeterminate state and the keyboard path; the hit area is 24 px even though the box is smaller.",
    examples: [
      {
        title: "Disabled and invalid",
        props: { label: "Locked by the workspace owner", disabled: true, defaultChecked: true },
        note: "`disabled` is for a choice the reader cannot make here; `invalid` marks a box whose answer the form rejected, and neither is expressed with opacity alone.",
      },
      {
        title: "With a description",
        props: {
          label: "Adjusted prices",
          description: "Splits and dividends are already applied.",
          defaultChecked: true,
        },
        note: "The description is wired to the control with `aria-describedby` rather than merely sitting under it.",
      },
    ],
  }),

  /* ------------------------------------------------------------------ switch */
  demo<SwitchProps>({
    id: "switch",
    title: "On and off",
    component: "Switch",
    props: { "aria-label": "Auto-apply patches", defaultChecked: true },
    render: (props) => (
      <Stack gap="sm">
        <Switch {...props} />
        <Switch aria-label="Notify on completion" />
      </Stack>
    ),
    note: "A switch applies immediately and saves nothing by itself — that is the difference between it and a checkbox inside a form.",
    examples: [
      {
        title: "Two sizes",
        props: { "aria-label": "Small switch", size: "sm", defaultChecked: true },
        note: "`sm` is for a dense settings row; `md` is the default beside a label.",
      },
      {
        title: "With a label and a description",
        props: {
          label: "Auto-apply patches",
          description: "Runs without asking when a new revision is published.",
          defaultChecked: true,
        },
        note: "The label and description are part of the control: clicking the text toggles it, and a reader hears both.",
      },
      {
        title: "Disabled",
        props: { label: "Managed by your workspace", disabled: true, defaultChecked: true },
        note: "A disabled switch still states its value — the control is unavailable, not the fact.",
      },
    ],
  }),

  /* ---------------------------------------------------------------- textarea */
  demo<TextareaProps>({
    id: "textarea",
    title: "Multi-line text",
    component: "Textarea",
    props: {
      rows: 3,
      placeholder: "Notes for this run",
      defaultValue: "Rebalance moved into the close.",
      "aria-label": "Run notes",
    },
    render: (props) => <Textarea {...props} />,
    note: "The same shell as `Input`, so hover, focus, invalid and disabled look identical across the family.",
    examples: [
      {
        title: "Three sizes",
        props: { rows: 3, size: "sm", placeholder: "Compact", "aria-label": "Small textarea" },
        note: "A size sets the text and padding scale; `rows` decides how much is visible before it scrolls.",
      },
      {
        title: "Auto-resize",
        props: {
          rows: 2,
          autoResize: true,
          defaultValue: "This field grows with its content instead of scrolling.",
          "aria-label": "Auto-resizing notes",
        },
        note: "`autoResize` uses `field-sizing: content` where the browser supports it and falls back to a comfortable fixed minimum, so the caller never has to measure.",
      },
      {
        title: "Read-only, disabled and invalid",
        props: {
          rows: 2,
          readOnly: true,
          defaultValue: "Imported from the archived spec.",
          "aria-label": "Read-only notes",
        },
        note: "Read-only keeps the text selectable and copyable and draws the dashed treatment; `disabled` takes it out of the tab order, and `invalid` marks what the form refused.",
      },
    ],
  }),

  /* ----------------------------------------------------------- native-select */
  demo<NativeSelectProps>({
    id: "native-select",
    title: "Options as data",
    component: "NativeSelect",
    props: { "aria-label": "Universe", defaultValue: "us-large", options: universes },
    render: (props) => <NativeSelect {...props} />,
    note: "The platform's own select: no portal, no listbox, and it works before hydration — which is what a form on a slow connection needs.",
    examples: [
      {
        title: "A placeholder",
        props: { "aria-label": "Universe", placeholder: "Choose a universe", options: universes },
        note: "The placeholder is rendered as an empty, disabled first option, so it cannot be submitted as a choice.",
      },
      {
        title: "A disabled option",
        props: {
          "aria-label": "Universe",
          defaultValue: "us-large",
          options: [...universes, { value: "private", label: "Private mandates", disabled: true }],
        },
        note: "Options carry their own `disabled`, which a native menu greys out and refuses to select.",
      },
      {
        title: "Sizes and states",
        props: {
          "aria-label": "Small universe",
          size: "sm",
          defaultValue: "global",
          options: universes,
        },
        note: "`sm`, `md` and `lg` follow the same density scale as every other control; `invalid` and `disabled` are the same two states as `Input`.",
      },
    ],
  }),

  /* -------------------------------------------------------------------- label */
  /*
   * A composition rather than a structured demo, for two reasons that both come
   * from the specimen needing a *pair*: the snippet has to show the label and the
   * control it names (a structured demo prints one element), and each example
   * needs its own `id` — three examples sharing `label-demo-field` would put
   * three elements with one id on the page, which is an accessibility defect as
   * well as a lie about how the pair is wired.
   */
  composition({
    id: "label",
    title: "A label bound to a control",
    node: (
      <Stack gap="xs">
        <Label htmlFor="label-instrument" required>
          Instrument
        </Label>
        <Input id="label-instrument" defaultValue="BTCUSD" />
      </Stack>
    ),
    code: `<Label htmlFor="instrument" required>Instrument</Label>
<Input id="instrument" defaultValue="BTCUSD" />`,
    note: "`htmlFor` is the whole contract: the label is clickable, the field is named, and `required` marks the control for a reader as well as drawing the asterisk.",
    examples: [
      {
        title: "The dense size",
        node: (
          <Stack gap="xs">
            <Label htmlFor="label-notional" size="sm">
              Notional
            </Label>
            <Input id="label-notional" defaultValue="120000" />
          </Stack>
        ),
        code: `<Label htmlFor="notional" size="sm">Notional</Label>
<Input id="notional" defaultValue="120000" />`,
        note: "`sm` is for a settings row or a toolbar, where the label is a caption rather than a heading.",
      },
      {
        title: "When `Field` already does it",
        node: (
          <Field label="Instrument" description="Ticker in BASE/QUOTE form" required>
            <Input defaultValue="BTC/USD" />
          </Field>
        ),
        code: `<Field label="Instrument" description="Ticker in BASE/QUOTE form" required>
  <Input defaultValue="BTC/USD" />
</Field>`,
        note: "Inside `Field` this component is not needed — `Field` renders the label, owns the id and wires the description and the message. Reach for `Label` for the cases `Field` does not own: a control outside a form, or a name for a group.",
      },
    ],
  }),

  /* -------------------------------------------------------------- radio-group */
  composition({
    id: "radio-group",
    title: "A vertical group",
    node: (
      <RadioGroup defaultValue="monthly" aria-label="Rebalance">
        <Stack gap="sm">
          <Radio value="weekly" label="Weekly" />
          <Radio value="monthly" label="Monthly" description="The default cadence." />
          <Radio value="quarterly" label="Quarterly" />
        </Stack>
      </RadioGroup>
    ),
    code: `<RadioGroup defaultValue="monthly" aria-label="Rebalance">
  <Radio value="weekly" label="Weekly" />
  <Radio value="monthly" label="Monthly" description="The default cadence." />
  <Radio value="quarterly" label="Quarterly" />
</RadioGroup>`,
    note: "One choice from a few options. Arrow keys move the selection and only the selected item is in the tab order — the roving-focus contract a `div` full of radios would have to reimplement.",
    examples: [
      {
        title: "Horizontal",
        node: (
          <RadioGroup defaultValue="1d" aria-label="Aggregation" className="flex flex-wrap gap-5">
            <Radio value="1h" label="1h" />
            <Radio value="1d" label="1d" />
            <Radio value="1w" label="1w" />
          </RadioGroup>
        ),
        code: `<RadioGroup defaultValue="1d" aria-label="Aggregation" className="flex flex-wrap gap-5">
  <Radio value="1h" label="1h" />
  <Radio value="1d" label="1d" />
  <Radio value="1w" label="1w" />
</RadioGroup>`,
        note: "The layout is the caller's: the group stays a real `radiogroup`, and a row is a flex container around it.",
      },
      {
        title: "Invalid and disabled",
        node: (
          <Stack gap="md">
            {/* `invalid` lives on the item, not on the group: `RadioGroup` is the
             * Radix root re-exported as it is, and only `Radio` carries the
             * treatment — which is why the example marks both answers rather
             * than a container. */}
            <RadioGroup defaultValue="monthly" aria-label="Rebalance, invalid" required>
              <Stack gap="sm">
                <Radio value="weekly" label="Weekly" invalid />
                <Radio value="monthly" label="Monthly" invalid />
              </Stack>
            </RadioGroup>
            <RadioGroup defaultValue="monthly" aria-label="Rebalance, disabled" disabled>
              <Stack gap="sm">
                <Radio value="monthly" label="Monthly" />
                <Radio value="quarterly" label="Quarterly" />
              </Stack>
            </RadioGroup>
          </Stack>
        ),
        code: `<RadioGroup aria-label="Rebalance" required>
  <Radio value="weekly" label="Weekly" invalid />
  <Radio value="monthly" label="Monthly" invalid />
</RadioGroup>
<RadioGroup aria-label="Rebalance" disabled>…</RadioGroup>`,
        note: "`invalid` sits on the item, because that is where the treatment is rendered; `disabled` on the group keeps the current choice readable while the question is closed.",
      },
    ],
  }),

  /* ------------------------------------------------------------------- rating */
  demo<RatingProps>({
    id: "rating",
    title: "A fractional, read-only rating",
    component: "Rating",
    props: { value: 4.5, readOnly: true, allowHalf: true, size: "sm", label: "Average rating" },
    render: (props) => <Rating {...props} />,
    note: "`readOnly` turns it into a display: no interaction, and the value is announced as one string rather than as five controls.",
    examples: [
      {
        title: "Star counts",
        props: { value: 7, max: 10, readOnly: true, label: "Score out of ten" },
        note: "`max` is the number of stars, not a scale to convert: ten stars is a score out of ten.",
      },
      {
        title: "Three sizes",
        props: { value: 3, size: "lg", allowHalf: true, label: "Size lg" },
        note: "`sm` sits in a table cell, `md` is the default, and `lg` is a rating the reader is being asked for.",
      },
      {
        title: "Interactive, and clearable",
        props: { defaultValue: 3.5, allowHalf: true, clearable: true, label: "Your rating" },
        note: "Arrow keys step by half a star, and choosing the current value again clears it while `clearable` is true.",
      },
    ],
  }),

  /* ------------------------------------------------------------- search-input */
  /*
   * A composition, because one of the configurations has to *run*:
   * `onValueChange` is a function, and a function can neither be printed as JSX by
   * the structured printer nor serialised across the RSC boundary. The island owns
   * the state so the reader can actually type into it.
   */
  composition({
    id: "search-input",
    title: "A field that behaves like a search box",
    node: <SearchInputDemo />,
    code: `const [query, setQuery] = useState("");

<SearchInput
  placeholder="Search runs"
  value={query}
  onValueChange={setQuery}
  aria-label="Search runs"
/>`,
    note: "`onValueChange` fires on every keystroke for a caller that filters as the reader types; the clear affordance is a real button with a name, and it returns focus to the field it cleared.",
    examples: [
      {
        title: "Sizes",
        node: <SearchInput placeholder="Search" size="sm" aria-label="Small search" />,
        code: `<SearchInput placeholder="Search" size="sm" aria-label="Small search" />`,
        note: "The size scale is `Input`'s, so the search icon and the clear button follow it.",
      },
      {
        title: "Without a clear button, and disabled",
        node: (
          <Stack gap="sm">
            <SearchInput
              placeholder="Filter owned by the page"
              clearable={false}
              aria-label="Filter owned by the page"
            />
            <SearchInput
              placeholder="Locked filter"
              defaultValue="sector:technology"
              disabled
              aria-label="Locked filter"
            />
          </Stack>
        ),
        code: `<SearchInput placeholder="Filter owned by the page" clearable={false} aria-label="Filter owned by the page" />
<SearchInput placeholder="Locked filter" defaultValue="sector:technology" disabled aria-label="Locked filter" />`,
        note: "`clearable={false}` for a filter the surrounding page owns; the clear button's accessible name is a prop, so a product in another language passes its own instead of forking the component.",
      },
    ],
  }),

  /* -------------------------------------------------------------- input-group */
  composition({
    id: "input-group",
    title: "Amount with a currency",
    node: (
      <InputGroup className="w-full max-w-sm">
        <InputGroupAddon>$</InputGroupAddon>
        <InputGroupSeparator />
        <InputGroupInput defaultValue="120000" aria-label="Notional" />
        <InputGroupSeparator />
        <InputGroupAddon>USD</InputGroupAddon>
      </InputGroup>
    ),
    code: `<InputGroup>
  <InputGroupAddon>$</InputGroupAddon>
  <InputGroupSeparator />
  <InputGroupInput defaultValue="120000" aria-label="Notional" />
  <InputGroupSeparator />
  <InputGroupAddon>USD</InputGroupAddon>
</InputGroup>`,
    note: "Addons and the field share one shell, so focus rings the whole group rather than a fragment of it.",
    examples: [
      {
        title: "A leading icon",
        node: (
          <InputGroup className="w-full max-w-sm">
            <InputGroupAddon align="start">
              <RiSearchLine aria-hidden="true" className="size-4" />
            </InputGroupAddon>
            <InputGroupInput placeholder="Search instruments" aria-label="Search instruments" />
          </InputGroup>
        ),
        code: `<InputGroup>
  <InputGroupAddon align="start"><RiSearchLine /></InputGroupAddon>
  <InputGroupInput placeholder="Search instruments" aria-label="Search instruments" />
</InputGroup>`,
        note: "`align` decides which edge the addon sits on and which way the separator points; an icon addon is decoration, so the field keeps the accessible name.",
      },
      {
        title: "A trailing unit",
        node: (
          <InputGroup className="w-full max-w-sm">
            <InputGroupInput placeholder="0.00" aria-label="Rebalance threshold" />
            <InputGroupAddon align="end">%</InputGroupAddon>
          </InputGroup>
        ),
        code: `<InputGroup>
  <InputGroupInput placeholder="0.00" aria-label="Rebalance threshold" />
  <InputGroupAddon align="end">%</InputGroupAddon>
</InputGroup>`,
        note: "A unit is an addon on the `end` edge; make it `interactive` and it becomes a real target instead of a label — the difference between a suffix and an action inside the group.",
      },
      {
        title: "Sizes, disabled and invalid",
        node: (
          <Stack gap="sm" className="w-full max-w-sm">
            <InputGroup size="sm">
              <InputGroupAddon>$</InputGroupAddon>
              <InputGroupInput defaultValue="250" aria-label="Small amount" />
            </InputGroup>
            <InputGroup disabled>
              <InputGroupAddon>$</InputGroupAddon>
              <InputGroupInput defaultValue="0" aria-label="Disabled amount" />
            </InputGroup>
            <InputGroup invalid>
              <InputGroupAddon>$</InputGroupAddon>
              <InputGroupInput defaultValue="abc" aria-label="Invalid amount" />
            </InputGroup>
          </Stack>
        ),
        code: `<InputGroup size="sm">…</InputGroup>
<InputGroup disabled>…</InputGroup>
<InputGroup invalid>…</InputGroup>`,
        note: "The group owns the state so every part of the shell agrees: `disabled` reaches the input, and `invalid` draws one treatment around the whole group.",
      },
    ],
  }),

  /* ------------------------------------------------------- segmented-control */
  composition({
    id: "segmented-control",
    title: "One value, three options",
    node: (
      <SegmentedControl defaultValue="3m" aria-label="Range">
        <SegmentedItem value="1m">1M</SegmentedItem>
        <SegmentedItem value="3m">3M</SegmentedItem>
        <SegmentedItem value="1y">1Y</SegmentedItem>
      </SegmentedControl>
    ),
    code: `<SegmentedControl value={range} onValueChange={setRange} aria-label="Range">
  <SegmentedItem value="1m">1M</SegmentedItem>
  <SegmentedItem value="3m">3M</SegmentedItem>
  <SegmentedItem value="1y">1Y</SegmentedItem>
</SegmentedControl>`,
    note: "A single value with a sliding indicator: this is not a `ToggleGroup`, which is a set of independent options.",
    examples: [
      {
        title: "Sizes and fill",
        node: (
          <Stack gap="md">
            <SegmentedControl defaultValue="1d" size="sm" aria-label="Dense range">
              <SegmentedItem value="1h" size="sm">
                1H
              </SegmentedItem>
              <SegmentedItem value="1d" size="sm">
                1D
              </SegmentedItem>
            </SegmentedControl>
            <SegmentedControl defaultValue="price" fill aria-label="View">
              <SegmentedItem value="price">Price</SegmentedItem>
              <SegmentedItem value="volume">Volume</SegmentedItem>
              <SegmentedItem value="returns">Returns</SegmentedItem>
            </SegmentedControl>
          </Stack>
        ),
        code: `<SegmentedControl defaultValue="1d" size="sm">…</SegmentedControl>
<SegmentedControl defaultValue="price" fill>…</SegmentedControl>`,
        note: "`sm` for a toolbar or a topbar; `fill` makes the track take the width it is given, which is what a panel header wants.",
      },
      {
        title: "Icons beside text",
        node: (
          <SegmentedControl defaultValue="chart" aria-label="View">
            <SegmentedItem value="chart" leadingIcon={<RiLineChartLine />}>
              Chart
            </SegmentedItem>
            <SegmentedItem value="table" leadingIcon={<RiTableLine />}>
              Table
            </SegmentedItem>
          </SegmentedControl>
        ),
        code: `<SegmentedControl defaultValue="chart" aria-label="View">
  <SegmentedItem value="chart" leadingIcon={<RiLineChartLine />}>Chart</SegmentedItem>
  <SegmentedItem value="table" leadingIcon={<RiTableLine />}>Table</SegmentedItem>
</SegmentedControl>`,
        note: "`leadingIcon` is decoration and the item's own text is the name; an item with only an icon needs its own `aria-label`.",
      },
      {
        title: "A disabled item",
        node: (
          <SegmentedControl defaultValue="3m" aria-label="Range">
            <SegmentedItem value="1m">1M</SegmentedItem>
            <SegmentedItem value="3m">3M</SegmentedItem>
            <SegmentedItem value="max" disabled>
              MAX
            </SegmentedItem>
          </SegmentedControl>
        ),
        code: `<SegmentedControl defaultValue="3m" aria-label="Range">
  <SegmentedItem value="1m">1M</SegmentedItem>
  <SegmentedItem value="3m">3M</SegmentedItem>
  <SegmentedItem value="max" disabled>MAX</SegmentedItem>
</SegmentedControl>`,
        note: "One unavailable option does not disable the choice: the item is skipped by the arrow keys and can never take the value.",
      },
    ],
  }),

  /* ----------------------------------------------------------------- sections */
  composition({
    id: "sections",
    title: "A section, and repeating rows",
    node: (
      <div className="w-full max-w-xl">
        <FormSection title="Identity" description="What this run is called.">
          <Input defaultValue="Momentum v3" aria-label="Run name" />
        </FormSection>
      </div>
    ),
    code: `<FormSection title="Identity" description="What this run is called.">
  <Input defaultValue="Momentum v3" aria-label="Run name" />
</FormSection>`,
    note: "`FormSection` groups fields under a heading and a description; the fields inside keep their own `Field` wiring.",
    examples: [
      {
        title: "Add, remove and reorder rows",
        node: <FieldArrayDemo />,
        code: `const [filters, setFilters] = useState(["Sector: Technology"]);

<FieldArray
  legend="Filters"
  count={filters.length}
  addLabel="Add filter"
  minRows={1}
  onAdd={() => setFilters([...filters, ""])}
  onRemove={(index) => setFilters(filters.filter((_, i) => i !== index))}
  onMove={(from, to) => setFilters(move(filters, from, to))}
>
  {filters.map((filter, index) => (
    <Input key={index} defaultValue={filter} aria-label={\`Filter \${index + 1}\`} />
  ))}
</FieldArray>`,
        note: "The array lives in the consumer's form engine; the component owns the controls, the row labels and the keyboard path — and reordering is button-driven on purpose, so no drag gesture is required.",
      },
      {
        title: "A section with an action, in two columns",
        node: (
          <div className="w-full max-w-xl">
            <FormSection
              title="Universe"
              description="Which instruments are in scope."
              actions={<Switch aria-label="Enable universe filters" defaultChecked />}
              columns={2}
            >
              <Input defaultValue="Technology" aria-label="Sector" />
              <Input defaultValue="North America" aria-label="Region" />
            </FormSection>
          </div>
        ),
        code: `<FormSection
  title="Universe"
  description="Which instruments are in scope."
  actions={<Switch aria-label="Enable universe filters" />}
  columns={2}
>
  <Input defaultValue="Technology" aria-label="Sector" />
  <Input defaultValue="North America" aria-label="Region" />
</FormSection>`,
        note: "`actions` puts a control in the heading row — a switch for the whole block — and `columns` lays the fields out in a grid that collapses to one column on a narrow screen.",
      },
      {
        title: "A fixed-length group",
        node: (
          <div className="w-full max-w-xl">
            <FieldArray legend="Split" count={3} addLabel="Add split">
              <Input defaultValue="40%" aria-label="Split 1" />
              <Input defaultValue="35%" aria-label="Split 2" />
              <Input defaultValue="25%" aria-label="Split 3" />
            </FieldArray>
          </div>
        ),
        code: `<FieldArray legend="Split" count={3}>
  <Input defaultValue="40%" aria-label="Split 1" />
  <Input defaultValue="35%" aria-label="Split 2" />
  <Input defaultValue="25%" aria-label="Split 3" />
</FieldArray>`,
        note: "Omitting `onAdd` and `onRemove` makes the group fixed-length: the same layout without controls that would have nothing to do.",
      },
    ],
  }),
];
