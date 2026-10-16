"use client";

/*
 * The control renderers.
 *
 * One renderer per member of the `Control` union, and the union is exhaustive:
 * adding a control kind without a renderer is a type error, not a silently
 * missing row. Each renderer is a *controlled* input that reports the raw value
 * upward — the engine normalizes it against the control's domain, so a
 * renderer never has to defend itself.
 *
 * Three things every renderer owes the reader, and where they are paid:
 *
 *  - **A visible label and one accessible name.** `FieldFrame` prints the label
 *    and each control passes it as its own accessible name (`label` where the
 *    component has one, `aria-label` otherwise), so the two cannot drift and
 *    there is no dangling `for`.
 *  - **A keyboard path.** Radix and React Aria supply it for Switch, Slider,
 *    NumberInput, Select and Checkbox; `ColorPicker` documents its own three
 *    sliders plus a hex field, because a two-axis colour square is a paint
 *    surface and pretending it is a slider is a lie a screen-reader user pays
 *    for.
 *  - **Translation.** The label, the help text and an option's label are read by
 *    a Chinese-speaking reader, so they go through `tcs`. Their English source
 *    lives in the adapters.
 */

import {
  Checkbox,
  ColorPicker,
  Input,
  NumberInput,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Slider,
  Switch,
  Text,
  cn,
} from "@luc/ui";
import { useI18n } from "@/lib/i18n/provider";
import type { Control, ControlValues } from "../types";

/**
 * Whether one checkbox in a `list` control is the last one standing.
 *
 * `minSelected` protects a value that cannot produce a preview at all, so the
 * checked boxes lock rather than the whole group: the reader must still be able
 * to tick a series back on (`WB-004`).
 */
function checkLocked(
  control: Extract<Control, { kind: "list" }>,
  value: string,
  selected: readonly string[],
  atMinimum: boolean,
): boolean {
  return atMinimum && selected.includes(value);
}

export interface ControlFieldProps {
  control: Control;
  value: ControlValues[string];
  onChange: (value: unknown) => void;
  /**
   * WB-004: the control cannot take effect in the current state, so it is
   * disabled and the reason is printed instead of leaving the reader to guess.
   */
  disabled?: boolean;
  /** The one-line reason, shown when `disabled` is set. */
  reason?: string;
}

function FieldFrame({
  control,
  children,
  inline = false,
  reason,
}: {
  control: Control;
  children: React.ReactNode;
  inline?: boolean;
  reason?: string;
}) {
  const { tcs } = useI18n();
  return (
    /*
     * The dimming belongs to the control, not to the frame.
     *
     * WB-004 dims an inert control so it reads as inert. Applied to the whole
     * field it also dimmed the *label*, and the label is `text-fg-muted` at 11px
     * uppercase: at full strength it clears 4.5:1 on the dark surface, at 60%
     * opacity it does not. The mobile sweep caught it as `color-contrast`
     * (serious) on `/components/cards`, on the control whose label is the value
     * "Selected" — the case where the reader most needs to know which control is
     * inert was the case where the label was hardest to read.
     */
    <div className="flex flex-col gap-1.5">
      {/*
       * The visible label is not the accessible name: each renderer passes the
       * label to the control itself (`aria-label`, or the library's own `label`
       * prop), so the two cannot drift and there is no dangling `for`.
       */}
      <div className={cn("flex items-center justify-between gap-3", inline && "min-h-6")}>
        <Text variant="micro" tone="muted" as="p">
          {tcs(control.label)}
        </Text>
      </div>
      <div className={cn(reason && "opacity-60")}>{children}</div>
      {/*
       * The reason replaces the help, not joins it: while a control is inert the
       * only useful sentence is what has to change first (WB-004).
       */}
      {reason ? (
        <Text variant="caption" tone="muted" as="p" className="text-fg-subtle">
          {tcs(reason)}
        </Text>
      ) : control.help ? (
        <Text variant="caption" tone="muted" as="p" className="text-fg-subtle">
          {tcs(control.help)}
        </Text>
      ) : null}
    </div>
  );
}

export function ControlField({ control, value, onChange, disabled, reason }: ControlFieldProps) {
  const { tcs } = useI18n();
  const inert = disabled === true || reason !== undefined;
  switch (control.kind) {
    case "boolean":
      return (
        <FieldFrame control={control} inline reason={reason}>
          <Switch
            checked={value === true}
            onCheckedChange={(checked) => onChange(checked === true)}
            aria-label={control.label}
            disabled={inert}
          />
        </FieldFrame>
      );

    case "enum":
      return (
        <FieldFrame control={control} reason={reason}>
          <Select value={String(value)} onValueChange={onChange} disabled={inert}>
            <SelectTrigger aria-label={control.label} className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {control.options.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label ?? option.value}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FieldFrame>
      );

    case "number": {
      const hasRange = control.min !== undefined && control.max !== undefined;
      const current = typeof value === "number" ? value : control.default;
      return (
        <FieldFrame control={control} reason={reason}>
          {hasRange ? (
            <div className="flex items-center gap-3">
              <Slider
                value={current}
                min={control.min}
                max={control.max}
                step={control.step ?? 1}
                onValueChange={onChange}
                label={control.label}
                disabled={inert}
                /*
                 * The value bubble is what a pointer user reads while dragging,
                 * so it carries the unit. Without this the bubble said "48"
                 * where the readout beside it said "48px".
                 */
                formatValue={(next) => `${next}${control.unit ?? ""}`}
                className="flex-1"
              />
              <span className="w-14 shrink-0 text-right text-caption tabular-nums text-fg-secondary">
                {current}
                {control.unit ?? ""}
              </span>
            </div>
          ) : (
            <NumberInput
              value={current}
              onValueChange={onChange}
              aria-label={control.label}
                disabled={inert}
              /*
               * A control may declare a half-open domain (`min` without `max`,
               * or the reverse) or a step; the first pass dropped all three on
               * this branch, so such a control silently accepted any value.
               */
              min={control.min}
              max={control.max}
              step={control.step}
              unit={control.unit}
            />
          )}
        </FieldFrame>
      );
    }

    case "text":
      return (
        <FieldFrame control={control} reason={reason}>
          <Input
            value={String(value)}
            placeholder={control.placeholder}
            aria-label={control.label}
            disabled={inert}
            onChange={(event) => onChange(event.target.value)}
          />
        </FieldFrame>
      );

    /*
     * A colour is a value the library already knows how to pick: `ColorPicker`
     * gives a real picker, a hex field, three keyboard sliders and a reset. The
     * first pass used a bare text field with a decorative swatch, which made the
     * reader type a hex code they could not see until they had typed it.
     */
    case "color":
      return (
        <FieldFrame control={control} reason={reason}>
          <ColorPicker
            value={String(value)}
            onValueChange={onChange}
            label={tcs(control.label)}
            disabled={inert}
            className="w-full justify-start"
          />
        </FieldFrame>
      );

    case "list": {
      const selected = Array.isArray(value) ? value : [];
      /*
       * WB-004. An empty list is a specimen with nothing to draw, so the last
       * checked box is disabled. `locked` is computed per option rather than
       * disabling the group, because the reader must still be able to *add* a
       * series back.
       */
      const minimum = control.minSelected ?? 0;
      const atMinimum = selected.length <= minimum;
      return (
        <FieldFrame control={control} reason={reason}>
          {/*
           * The checkboxes are a *group*, and a group needs the control's name:
           * without it a screen reader reads four unrelated checkboxes and the
           * heading above them is decoration.
           */}
          <div role="group" aria-label={tcs(control.label)} className="flex flex-col gap-1.5">
            {control.options.map((option) => {
              const checked = selected.includes(option.value);
              const locked = checkLocked(control, option.value, selected, atMinimum);
              return (
                <Checkbox
                  key={option.value}
                  checked={checked}
                  label={option.label ? tcs(option.label) : option.value}
                  disabled={inert || locked}
                  onCheckedChange={(next) =>
                    onChange(
                      next === true
                        ? [...selected, option.value]
                        : selected.filter((item) => item !== option.value),
                    )
                  }
                />
              );
            })}
          </div>
          {minimum > 0 && atMinimum && !reason ? (
            <Text variant="caption" tone="muted" as="p" className="text-fg-subtle">
              {tcs("Keep at least one selected — the specimen has nothing to draw otherwise.")}
            </Text>
          ) : null}
        </FieldFrame>
      );
    }

    case "fixture":
    case "slot":
      return (
        <FieldFrame control={control} reason={reason}>
          <Select value={String(value)} onValueChange={onChange} disabled={inert}>
            <SelectTrigger aria-label={control.label} className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {control.options.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label ? tcs(option.label) : option.value}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FieldFrame>
      );
  }
}
