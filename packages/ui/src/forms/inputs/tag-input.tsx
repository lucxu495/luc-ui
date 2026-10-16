"use client";

import { RiCloseLine } from "@remixicon/react";
import { useRef, useState, type KeyboardEvent } from "react";
import { useField } from "../../components/field";
import { inputShellClass, type ControlSize } from "../../components/input";
import { useControllableState } from "../../hooks/use-controllable-state";
import { cn } from "../../utils/cn";

/**
 * LUC TagInput — a list of short values typed into one row.
 *
 * Built from `Input` + `Tag` semantics rather than a dependency: the behaviour
 * is a text input with commit keys, which is small enough to own honestly, and
 * LUC already has the chip and the shell. (React Aria's `TokenField` is the
 * upgrade path if a prompt-style field with inline mentions is ever needed.)
 *
 * The component stores strings only. Whether a string is an email, a symbol or
 * a keyword is the caller's meaning; validation is exposed as a callback that
 * returns a message.
 */

export interface TagInputProps {
  value?: string[];
  defaultValue?: string[];
  onValueChange?: (tags: string[]) => void;
  placeholder?: string;
  /** Maximum tags. Further input is refused with an inline message. */
  maxTags?: number;
  /** Keys that commit the current text. Enter always commits. */
  separators?: string[];
  /** Return a message to reject the candidate value. */
  validate?: (tag: string, tags: string[]) => string | undefined;
  /** Trims and lowercases before comparing for duplicates. Default `false`. */
  caseSensitive?: boolean;
  allowDuplicates?: boolean;
  size?: ControlSize;
  invalid?: boolean;
  disabled?: boolean;
  readOnly?: boolean;
  id?: string;
  className?: string;
  "aria-label"?: string;
}

const sizeClass: Record<ControlSize, string> = {
  sm: "min-h-control-sm rounded-sm px-1.5 py-1 text-label",
  md: "min-h-control-md rounded-md px-1.5 py-1 text-label",
  lg: "min-h-control-lg rounded-md px-2 py-1.5 text-body",
};

export function TagInput({
  value,
  defaultValue,
  onValueChange,
  placeholder = "Add a value…",
  maxTags,
  separators = [","],
  validate,
  caseSensitive = false,
  allowDuplicates = false,
  size = "md",
  invalid,
  disabled,
  readOnly,
  id,
  className,
  ...props
}: TagInputProps) {
  const field = useField();
  const isInvalid = invalid ?? field.invalid;
  const isDisabled = disabled ?? field.disabled;
  const isReadOnly = readOnly ?? field.readOnly;
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [draft, setDraft] = useState("");
  const [message, setMessage] = useState<string | undefined>(undefined);
  const [tags, setTags] = useControllableState<string[]>({
    value,
    defaultValue: defaultValue ?? [],
    onChange: onValueChange,
  });

  const sameValue = (a: string, b: string) =>
    caseSensitive ? a === b : a.toLowerCase() === b.toLowerCase();

  const commit = (raw: string) => {
    const candidate = raw.trim();
    if (!candidate) return;
    if (!allowDuplicates && tags.some((tag) => sameValue(tag, candidate))) {
      setMessage(`“${candidate}” is already in the list`);
      setDraft("");
      return;
    }
    const rejection = validate?.(candidate, tags);
    if (rejection) {
      setMessage(rejection);
      return;
    }
    if (maxTags !== undefined && tags.length >= maxTags) {
      setMessage(`Up to ${maxTags} values`);
      return;
    }
    setTags([...tags, candidate]);
    setDraft("");
    setMessage(undefined);
  };

  /** Pasting a list is the common case — split it and take everything valid. */
  const commitPasted = (text: string) => {
    const parts = text
      .split(/[\n,;]+/)
      .map((part) => part.trim())
      .filter(Boolean);
    if (parts.length <= 1) return false;
    let next = [...tags];
    let rejection: string | undefined;
    for (const part of parts) {
      if (!allowDuplicates && next.some((tag) => sameValue(tag, part))) continue;
      const invalidPart = validate?.(part, next);
      if (invalidPart) {
        rejection = invalidPart;
        continue;
      }
      if (maxTags !== undefined && next.length >= maxTags) {
        rejection = `Up to ${maxTags} values`;
        break;
      }
      next = [...next, part];
    }
    setTags(next);
    setMessage(rejection);
    return true;
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      commit(draft);
      return;
    }
    if (separators.includes(event.key)) {
      event.preventDefault();
      commit(draft);
      return;
    }
    if (event.key === "Backspace" && draft === "" && tags.length > 0) {
      event.preventDefault();
      setTags(tags.slice(0, -1));
      setMessage(undefined);
      return;
    }
    if (event.key === "Escape") {
      setDraft("");
      setMessage(undefined);
    }
  };

  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      {/* The chip row is decorative grouping: clicking it focuses the text input,
          which is already reachable by Tab. A pointer-only convenience, not a
          control — hence the targeted rule exemptions. */}
      {/* eslint-disable-next-line jsx-a11y/no-static-element-interactions, jsx-a11y/click-events-have-key-events */}
      <div
        data-slot="tag-input"
        data-size={size}
        className={cn(
          inputShellClass,
          sizeClass[size],
          "flex-wrap items-center gap-1.5",
          isReadOnly && "border-dashed bg-surface-canvas",
          className,
        )}
        onClick={() => inputRef.current?.focus()}
      >
        {tags.map((tag) => (
          <span
            key={tag}
            className="inline-flex h-5 items-center gap-1 rounded-xs bg-accent-soft pr-0.5 pl-2 text-caption text-fg-accent"
          >
            <span className="max-w-[18ch] truncate">{tag}</span>
            {!isDisabled && !isReadOnly ? (
              <button
                type="button"
                aria-label={`Remove ${tag}`}
                onClick={(event) => {
                  event.stopPropagation();
                  setTags(tags.filter((current) => current !== tag));
                }}
                className="luc-transition luc-hit grid size-4 place-items-center rounded-xs text-fg-accent hover:bg-accent-soft-hover luc-focus"
              >
                <RiCloseLine aria-hidden="true" className="size-3" />
              </button>
            ) : null}
          </span>
        ))}
        <input
          ref={inputRef}
          data-slot="tag-input-element"
          id={id ?? field.id}
          value={draft}
          disabled={isDisabled}
          readOnly={isReadOnly}
          aria-invalid={isInvalid || undefined}
          aria-describedby={field.describedBy}
          aria-label={props["aria-label"]}
          onChange={(event) => {
            const next = event.target.value;
            if (separators.some((separator) => next.includes(separator))) {
              if (!commitPasted(next)) commit(next.replace(/[,;]+$/, ""));
              return;
            }
            setDraft(next);
            if (message) setMessage(undefined);
          }}
          onKeyDown={handleKeyDown}
          onBlur={() => {
            if (draft.trim()) commit(draft);
          }}
          onPaste={(event) => {
            const text = event.clipboardData.getData("text");
            if (commitPasted(text)) event.preventDefault();
          }}
          placeholder={tags.length === 0 ? placeholder : undefined}
          className={cn(
            "min-w-[8ch] flex-1 bg-transparent text-fg-primary outline-none",
            "placeholder:text-fg-muted disabled:cursor-not-allowed",
            size === "lg" ? "h-7" : "h-6",
          )}
        />
      </div>
      {message ? (
        <p role="alert" className="text-caption text-fg-negative">
          {message}
        </p>
      ) : null}
    </div>
  );
}
