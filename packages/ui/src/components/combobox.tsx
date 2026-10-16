"use client";

import { useCombobox } from "downshift";
import { RiCloseLine, RiExpandUpDownLine, RiLoader4Line, RiSearchLine } from "@remixicon/react";
import { useEffect, useId, useMemo, useRef, useState, type ReactNode } from "react";
import { cn } from "../utils/cn";
import { mergeRefs } from "../utils/refs";
import { useField } from "./field";
import { controlIconSizeClass, inputAdornmentClass, type ControlSize } from "./input";

/**
 * LUC Combobox — search, then choose.
 *
 * Downshift owns the WAI-ARIA combobox contract: `aria-activedescendant`
 * bookkeeping, roving highlight, Home/End/PageUp/PageDown, typeahead, Escape and
 * Enter semantics. LUC owns the field chrome, the menu surface, the grouped row
 * layout, the loading and no-results states, and the clear affordance.
 *
 * Async is a consumer concern, not this component's: pass `inputValue` +
 * `onInputValueChange` + `loading` and supply `options` when your request
 * resolves. Nothing here fetches anything.
 */

export interface ComboboxOption {
  value: string;
  label: string;
  /** Secondary line, e.g. a ticker or a country code. */
  description?: string;
  /** Section header. Consecutive options sharing a group are rendered together. */
  group?: string;
  disabled?: boolean;
  /** Optional leading visual (flag, icon). Decorative. */
  leading?: ReactNode;
}

export interface ComboboxProps {
  options: readonly ComboboxOption[];
  /** Selected option (controlled). */
  value?: ComboboxOption | null;
  onValueChange?: (option: ComboboxOption | null) => void;
  /** Query text (controlled) — the async path. */
  inputValue?: string;
  onInputValueChange?: (query: string) => void;
  /** Replacement matcher. Default: case-insensitive `label`/`description` contains. */
  filter?: (option: ComboboxOption, query: string) => boolean;
  placeholder?: string;
  /** Announcement + body when nothing matches. */
  emptyMessage?: ReactNode;
  loading?: boolean;
  disabled?: boolean;
  clearable?: boolean;
  /**
   * Accessible names for the three built-in buttons. Defaults are English; a
   * product in another language passes its own strings rather than forking the
   * component. The open/close pair toggles with the list.
   */
  clearLabel?: string;
  openLabel?: string;
  closeLabel?: string;
  size?: ControlSize;
  /** Accessible name for the input. Required unless a `Field` label is present. */
  "aria-label"?: string;
  id?: string;
  name?: string;
  className?: string;
  /** Max height of the scrollable list, e.g. `18rem`. */
  maxHeight?: string;
  /** Render a distinct row (icon, avatar…). Falls back to the default row. */
  renderOption?: (option: ComboboxOption, state: { selected: boolean; highlighted: boolean }) => ReactNode;
}

function defaultFilter(option: ComboboxOption, query: string): boolean {
  const needle = query.trim().toLowerCase();
  if (!needle) return true;
  return (
    option.label.toLowerCase().includes(needle) ||
    (option.description?.toLowerCase().includes(needle) ?? false)
  );
}

const sizeStyles: Record<ControlSize, { shell: string; pad: string }> = {
  sm: { shell: "h-control-sm rounded-sm text-label", pad: "pl-7 pr-8" },
  md: { shell: "h-control-md rounded-md text-label", pad: "pl-8 pr-9" },
  lg: { shell: "h-control-lg rounded-md text-body", pad: "pl-9 pr-10" },
};

export function Combobox({
  options,
  value,
  onValueChange,
  inputValue,
  onInputValueChange,
  filter = defaultFilter,
  placeholder = "Search…",
  emptyMessage = "No matches",
  loading = false,
  disabled = false,
  clearable = true,
  clearLabel = "Clear selection",
  openLabel = "Open options",
  closeLabel = "Close options",
  size = "md",
  id,
  name,
  className,
  maxHeight = "17rem",
  renderOption,
  ...rest
}: ComboboxProps) {
  const field = useField();
  const generatedId = useId();
  const inputId = id ?? field.id ?? `combobox-${generatedId}`;
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const resolvedSize = sizeStyles[size];

  /*
   * The query is owned by this component — by the caller (`inputValue`, the
   * async path) or by local state that Downshift's `onInputValueChange` feeds —
   * so filtering happens *before* the hook call and the list can never disagree
   * with the highlighted index.
   *
   * The DOM input, however, is deliberately uncontrolled. Rendering Downshift's
   * `value` makes React the authority on the field text, and a controlled field
   * drops characters when two keystrokes land in the same batch (the second
   * event reads a stale prop and the browser's insert is overwritten). So the
   * browser owns the text and we only write to it when we change the value
   * programmatically — select, clear, or a new caller-supplied `inputValue`.
   *
   * The trade-off is explicit: if you change `value` programmatically, control
   * `inputValue` too (or key the component). It is not inferred from a
   * mirror-state effect, which is how select components usually drift.
   */
  /*
   * A label is not a query, and this is the bug that distinction fixes.
   *
   * The uncontrolled query used to be initialised to `value?.label`, and every
   * non-typing event Downshift reports — a click into the field, a blur, a new
   * selection — writes the *selected label* into the input value. Storing that as
   * the filter meant a combobox with a predefined `value` opened showing exactly
   * one option: the one already selected. Measured on `/components/combobox`
   * before the fix: opening a 12-country list with "Japan" selected left a
   * one-row menu reading "Japan".
   *
   * So the query starts empty, and it is only ever set by typing. The field's
   * *text* is a different thing and is handled separately: the DOM input is
   * uncontrolled (see the comment below) and is written explicitly when a value
   * is chosen, cleared, or supplied by the caller — so "Japan" stays visible in
   * the field while the menu behind it offers all twelve countries.
   *
   * A caller who passes `inputValue` owns both, as before: the async search path
   * sets the text and the query together on purpose, and the component does not
   * second-guess it.
   */
  const [localQuery, setLocalQuery] = useState("");
  const query = inputValue ?? localQuery;
  const items = useMemo(() => options.filter((option) => filter(option, query)), [filter, options, query]);

  const {
    isOpen,
    highlightedIndex,
    selectedItem,
    getInputProps,
    getItemProps,
    getMenuProps,
    getToggleButtonProps,
    closeMenu,
    openMenu,
    selectItem,
    setInputValue: setComboboxInputValue,
  } = useCombobox<ComboboxOption>({
    items: items as ComboboxOption[],
    itemToString: (item) => item?.label ?? "",
    // Downshift skips disabled entries while walking the list and reports them
    // through `aria-disabled` — both come from here, not from the click handler.
    isItemDisabled: (item) => item.disabled === true,
    selectedItem: value ?? null,
    inputValue: query,
    initialSelectedItem: value ?? null,
    // Typing highlights the top match, so "type a few letters, press Enter" is
    // one gesture. Downshift still reports -1 when that entry is disabled.
    defaultHighlightedIndex: 0,
    onSelectedItemChange: ({ selectedItem: next }) => {
      const label = next?.label ?? "";
      if (inputRef.current) inputRef.current.value = label;
      onValueChange?.(next ?? null);
    },
    onIsOpenChange: ({ isOpen: open }) => {
      /*
       * Closing the menu ends the search, whoever ended it — Enter, a click on a
       * row, Escape, a click outside. The field goes back to showing the
       * selection rather than the query that was typed to find it.
       *
       * This is the other half of the label-is-not-a-query rule, and it is where
       * both of its loose ends are tied:
       *
       *  - choosing the row that was *already* selected. Downshift reports no
       *    `selectedItem` change for it, so `onSelectedItemChange` never runs and
       *    the typed query stayed in the field while the value was unchanged —
       *    "ger" in the field, Germany as the value. Measured on the shipped
       *    build and on this one before the fix.
       *  - Escape. Downshift restores the label into the field but leaves the
       *    internal `inputValue` at the query when something is selected, so the
       *    next open filtered by a search the reader had already abandoned —
       *    thirteen options became one, and a second Enter selected nothing.
       */
      if (open) return;
      if (inputValue !== undefined) return;
      setLocalQuery("");
      if (inputRef.current) inputRef.current.value = (selectedItem ?? value ?? null)?.label ?? "";
    },
    onInputValueChange: ({ inputValue: next, type }) => {
      if (next === undefined) return;
      /* Typing is the only event that means "the reader is searching"; the
       * others — opening the menu, leaving the field, picking an option — carry
       * the selected label, which as a filter would trap the reader inside their
       * own selection. Downshift reports the action type alongside the change, so
       * the question is answered here rather than guessed from the string. */
      const typed = type === useCombobox.stateChangeTypes.InputChange;
      if (inputValue === undefined) setLocalQuery(typed ? next : "");
      if (typed) onInputValueChange?.(next);
    },
    stateReducer: (state, actionAndChanges) => {
      const { type, changes } = actionAndChanges;
      switch (type) {
        // Typing keeps the list open; a fresh keypress re-opens a closed menu.
        case useCombobox.stateChangeTypes.InputChange:
          return { ...changes, isOpen: true };
        case useCombobox.stateChangeTypes.InputBlur:
          // Close only when focus left the whole control (including the menu).
          return { ...changes, isOpen: state.isOpen };
        case useCombobox.stateChangeTypes.InputClick:
          return { ...changes, isOpen: true };
        default:
          return changes;
      }
    },
  });

  // A caller-driven query (async search) must reach the DOM explicitly.
  useEffect(() => {
    if (inputValue === undefined || !inputRef.current) return;
    if (inputRef.current.value !== inputValue) inputRef.current.value = inputValue;
  }, [inputValue]);

  // Downshift's default blur handling closes on tab-out; because we own the
  // wrapper we can be precise about it instead of guessing.
  useEffect(() => {
    if (!isOpen) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!wrapperRef.current?.contains(event.target as Node)) closeMenu();
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [closeMenu, isOpen]);

  const clear = () => {
    selectItem(null);
    setComboboxInputValue("");
    if (inputValue === undefined) setLocalQuery("");
    if (inputRef.current) inputRef.current.value = "";
    onValueChange?.(null);
    onInputValueChange?.("");
    openMenu();
  };

  const showClear = clearable && !disabled && (selectedItem || query.length > 0);

  /*
   * Downshift hands back a `value`; we drop it so the field stays uncontrolled
   * and merge its ref with ours instead of letting one win.
   */
  const { value: _downshiftValue, ref: downshiftInputRef, ...inputProps } = getInputProps({
    id: inputId,
    name,
    disabled,
    placeholder,
    /*
     * Third leg of the label-is-not-a-query fix.
     *
     * With the query emptied on open, the field's text is the *selection*
     * ("Japan") while the list behind it is unfiltered — so the first keystroke
     * has to start a new query rather than extend that label, or "b" would make
     * the text "Japanb" and the menu would report no matches. Selecting the
     * field's text when the query is empty is the standard combobox answer.
     *
     * Only while the query is empty: once the reader is editing their own search
     * ("Apple"), clicking to put the caret next to a typo must still work, and
     * select-all on every click would take that away.
     */
    onFocus: (event: React.FocusEvent<HTMLInputElement>) => {
      if (query.length === 0) event.currentTarget.select();
    },
    onClick: (event: React.MouseEvent<HTMLInputElement>) => {
      if (query.length === 0) event.currentTarget.select();
    },
    "aria-label": rest["aria-label"],
    "aria-describedby": field.describedBy,
    "aria-invalid": field.invalid || undefined,
    className: cn(
      "peer h-full w-full min-w-0 bg-transparent text-inherit outline-none",
      "placeholder:text-fg-disabled disabled:cursor-not-allowed disabled:text-fg-disabled",
      resolvedSize.pad,
    ),
  });

  /** Consecutive options sharing a `group` render under one header. */
  const grouped = useMemo(() => {
    const out: Array<{ label?: string; entries: Array<{ option: ComboboxOption; index: number }> }> = [];
    items.forEach((option, index) => {
      const last = out[out.length - 1];
      if (last && last.label === option.group) last.entries.push({ option, index });
      else out.push({ label: option.group, entries: [{ option, index }] });
    });
    return out;
  }, [items]);

  return (
    <div
      ref={wrapperRef}
      className={cn("relative w-full", className)}
      // Keyboard users leaving the control must not leave a menu behind.
      onBlur={(event) => {
        if (!wrapperRef.current?.contains(event.relatedTarget as Node)) closeMenu();
      }}
    >
      <div
        data-slot="combobox-shell"
        data-size={size}
        className={cn(
          "group/combobox relative flex w-full items-center",
          "border border-line-default bg-surface-sunken text-fg-primary shadow-well",
          "luc-transition",
          "hover:border-line-strong hover:shadow-rest",
          "focus-within:border-line-accent focus-within:shadow-[var(--glow-focus)]",
          "has-[:disabled]:cursor-not-allowed has-[:disabled]:border-line-subtle has-[:disabled]:shadow-none",
          field.invalid && "border-negative shadow-[0_0_0_3px_var(--negative-soft)]",
          resolvedSize.shell,
        )}
      >
        <span
          aria-hidden="true"
          className={cn(
            inputAdornmentClass,
            "absolute top-1/2 -translate-y-1/2",
            "group-focus-within/combobox:text-fg-accent",
            size === "sm" ? "left-2" : size === "md" ? "left-2.5" : "left-3",
            controlIconSizeClass[size],
          )}
        >
          {loading ? (
            <RiLoader4Line className="luc-spinner" data-motion-essential="" />
          ) : (
            <RiSearchLine />
          )}
        </span>
        <input
          ref={mergeRefs<HTMLInputElement>(inputRef, downshiftInputRef as React.Ref<HTMLInputElement>)}
          defaultValue={value?.label ?? ""}
          {...inputProps}
        />
        <span className="absolute top-1/2 right-1.5 flex -translate-y-1/2 items-center gap-0.5">
          {showClear ? (
            <button
              type="button"
              aria-label={clearLabel}
              onMouseDown={(event) => event.preventDefault()}
              onClick={clear}
              className={cn(
                // 24px: the WCAG 2.2 target-size minimum.
                // `fg-muted`, not `fg-disabled`: the button is live whenever it
                // is rendered, and the disabled token is not a quiet style.
                "grid size-6 place-items-center rounded-xs text-fg-muted luc-transition",
                "hover:bg-surface-interactive-hover hover:text-fg-primary luc-focus",
              )}
            >
              <RiCloseLine aria-hidden="true" className="size-3.5" />
            </button>
          ) : null}
          <button
            {...getToggleButtonProps({
              "aria-label": isOpen ? closeLabel : openLabel,
              disabled,
              tabIndex: -1,
              className: cn(
                "grid size-6 place-items-center rounded-xs text-fg-muted luc-transition",
                "hover:text-fg-primary",
              ),
            })}
          >
            <RiExpandUpDownLine aria-hidden="true" className="size-3.5" />
          </button>
        </span>
      </div>

      <ul
        {...getMenuProps({
          "aria-label": rest["aria-label"] ? `${rest["aria-label"]} options` : "Options",
        })}
        style={{ maxHeight }}
        className={cn(
          "absolute top-[calc(100%+0.375rem)] left-0 w-full overflow-y-auto overscroll-contain",
          "z-[var(--z-popover)] rounded-lg border border-line-default bg-surface-overlay p-1 luc-float",
          "origin-top",
          isOpen
            ? "animate-[luc-anchored-in_var(--motion-fast)_var(--ease-enter)]"
            : "pointer-events-none invisible",
        )}
      >
        {isOpen && loading && items.length === 0 ? (
          <li className="flex items-center gap-2 px-2 py-2 text-caption text-fg-muted">
            <RiLoader4Line aria-hidden="true" className="luc-spinner size-3.5" data-motion-essential="" />
            Searching…
          </li>
        ) : null}
        {isOpen && !loading && items.length === 0 ? (
          <li className="px-2 py-2 text-caption text-fg-muted">{emptyMessage}</li>
        ) : null}
        {isOpen
          ? grouped.map((section, sectionIndex) => (
              <li key={section.label ?? `section-${sectionIndex}`} role="presentation">
                {section.label ? (
                  <p className="px-2 pt-2 pb-1 text-micro font-medium text-fg-muted uppercase">{section.label}</p>
                ) : null}
                <ul role="presentation">
                  {section.entries.map(({ option, index }) => {
                    const highlighted = highlightedIndex === index;
                    const selected = selectedItem?.value === option.value;
                    return (
                      <li
                        key={option.value}
                        {...getItemProps({
                          item: option,
                          index,
                          disabled: option.disabled,
                          className: cn(
                            "flex cursor-default items-start gap-2 rounded-sm px-2 py-1.5 text-label",
                            "text-fg-secondary luc-transition",
                            highlighted && "bg-surface-interactive-hover text-fg-primary",
                            selected && "text-fg-primary",
                            option.disabled && "pointer-events-none text-fg-disabled",
                          ),
                        })}
                      >
                        {renderOption ? (
                          renderOption(option, { selected, highlighted })
                        ) : (
                          <>
                            {option.leading ? (
                              <span aria-hidden="true" className="grid size-4 shrink-0 place-items-center text-fg-muted">
                                {option.leading}
                              </span>
                            ) : null}
                            <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                              <span className="truncate">{option.label}</span>
                              {option.description ? (
                                <span className="truncate text-caption text-fg-muted">{option.description}</span>
                              ) : null}
                            </span>
                            {selected ? <span className="mt-1 size-1.5 rounded-full bg-accent-default" aria-hidden="true" /> : null}
                          </>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </li>
            ))
          : null}
      </ul>
    </div>
  );
}
