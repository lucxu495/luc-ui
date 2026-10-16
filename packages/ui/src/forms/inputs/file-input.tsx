"use client";

import { DropZone as RacDropZone, FileTrigger } from "react-aria-components";
import { RiCloseLine, RiFileLine, RiUploadCloud2Line } from "@remixicon/react";
import { useId, type ReactNode } from "react";
import { Button } from "../../components/button";
import { useField } from "../../components/field";
import { IconButton } from "../../components/icon-button";
import { formatBytes } from "../../utils/format";
import { useControllableState } from "../../hooks/use-controllable-state";
import { cn } from "../../utils/cn";

/**
 * LUC FileInput and DropZone.
 *
 * Both are *selection* surfaces: they hand the caller `File` objects and never
 * touch the network. Upload, progress, retries and storage are the product's.
 *
 * Behaviour comes from React Aria Components — `FileTrigger` for the picker
 * (a real button driving a hidden `<input type="file" accept multiple>`) and
 * `DropZone` for the drag target, including keyboard reachability of the picker
 * button and correct `accept` filtering. Validation (type, size, count) is ours
 * because it must surface as a readable, per-file message rather than a silent
 * rejection.
 */

export type FileRejectionReason = "type" | "size" | "count";

export interface FileRejection {
  file: File;
  reason: FileRejectionReason;
}

export interface FileInputProps {
  value?: File[];
  defaultValue?: File[];
  onFilesChange?: (files: File[]) => void;
  onReject?: (rejections: FileRejection[]) => void;
  /** e.g. `["image/*", ".csv"]`. Passed to the picker and checked on drop. */
  accept?: string[];
  multiple?: boolean;
  /** Bytes. Larger files are rejected with a message, not silently dropped. */
  maxSize?: number;
  maxFiles?: number;
  disabled?: boolean;
  invalid?: boolean;
  /** `compact` is a single row; `dropzone` is the larger drag area vocabulary. */
  variant?: "compact" | "dropzone";
  /** Constraint line, e.g. "CSV up to 10 MB". */
  hint?: ReactNode;
  label?: string;
  id?: string;
  className?: string;
  "aria-label"?: string;
}

const REJECTION_MESSAGE: Record<FileRejectionReason, string> = {
  type: "Unsupported file type",
  size: "File is too large",
  count: "Too many files",
};

/** Matches `.csv`, `image/*` and `application/json` against a file. */
function matchesAccept(file: File, accept?: string[]): boolean {
  if (!accept || accept.length === 0) return true;
  const name = file.name.toLowerCase();
  const type = file.type.toLowerCase();
  return accept.some((pattern) => {
    const rule = pattern.trim().toLowerCase();
    if (!rule) return false;
    if (rule.startsWith(".")) return name.endsWith(rule);
    if (rule.endsWith("/*")) return type.startsWith(rule.slice(0, -1));
    return type === rule;
  });
}

export function FileInput({
  value,
  defaultValue,
  onFilesChange,
  onReject,
  accept,
  multiple = false,
  maxSize,
  maxFiles,
  disabled,
  invalid,
  variant = "compact",
  hint,
  label,
  id,
  className,
  ...props
}: FileInputProps) {
  const field = useField();
  const isInvalid = invalid ?? field.invalid;
  const isDisabled = disabled ?? field.disabled;
  const listId = useId();
  const [files, setFiles] = useControllableState<File[]>({
    value,
    defaultValue: defaultValue ?? [],
    onChange: onFilesChange,
  });
  const [rejections, setRejections] = useControllableState<FileRejection[]>({
    defaultValue: [],
    onChange: onReject,
  });

  /** Validate, then commit. Every rejection is reported, never swallowed. */
  const acceptFiles = (incoming: File[]) => {
    const rejected: FileRejection[] = [];
    const accepted: File[] = [];
    const limit = maxFiles ?? (multiple ? Number.POSITIVE_INFINITY : 1);

    for (const file of incoming) {
      if (!matchesAccept(file, accept)) {
        rejected.push({ file, reason: "type" });
        continue;
      }
      if (maxSize !== undefined && file.size > maxSize) {
        rejected.push({ file, reason: "size" });
        continue;
      }
      accepted.push(file);
    }

    // A replacement and an addition behave differently on purpose: a single
    // file field swaps, a multi-file field appends.
    const base = multiple ? files : [];
    const merged = [...base, ...accepted].filter(
      (file, index, all) => all.findIndex((other) => other.name === file.name && other.size === file.size) === index,
    );
    const kept = merged.slice(0, limit);
    for (const overflow of merged.slice(limit)) rejected.push({ file: overflow, reason: "count" });

    setFiles(kept);
    setRejections(rejected);
  };

  const removeFile = (target: File) => {
    setFiles(files.filter((file) => file !== target));
  };

  const picker = (
    <FileTrigger
      acceptedFileTypes={accept}
      allowsMultiple={multiple}
      onSelect={(selected) => acceptFiles(selected ? Array.from(selected) : [])}
    >
      {/* A `<button>` is labelable, so the `<Field>` label binds to this element
          — the file picker has no visible input of its own to label. */}
      <Button
        id={id ?? field.id}
        variant={variant === "dropzone" ? "secondary" : "outline"}
        size="sm"
        disabled={isDisabled}
        type="button"
        aria-describedby={field.describedBy}
        aria-invalid={isInvalid || undefined}
      >
        {variant === "dropzone" ? "Choose files" : "Browse…"}
      </Button>
    </FileTrigger>
  );

  const list =
    files.length > 0 ? (
      <ul id={listId} className="flex min-w-0 flex-col gap-1">
        {files.map((file) => (
          <li
            key={`${file.name}-${file.size}-${file.lastModified}`}
            className="flex items-center gap-2 rounded-sm border border-line-subtle bg-surface-sunken px-2 py-1.5"
          >
            <RiFileLine aria-hidden="true" className="size-4 shrink-0 text-fg-muted" />
            <span className="min-w-0 flex-1 truncate text-label text-fg-secondary">{file.name}</span>
            <span className="shrink-0 text-caption text-fg-muted luc-numeric">{formatBytes(file.size)}</span>
            <IconButton
              label={`Remove ${file.name}`}
              variant="ghost"
              size="sm"
              disabled={isDisabled}
              onClick={() => removeFile(file)}
              icon={<RiCloseLine />}
              className="-mr-1"
            />
          </li>
        ))}
      </ul>
    ) : null;

  const rejectionList =
    rejections.length > 0 ? (
      <ul className="flex flex-col gap-1 text-caption text-fg-negative">
        {rejections.map((rejection) => (
          <li key={`${rejection.file.name}-${rejection.reason}`} className="flex items-start gap-1.5">
            <RiCloseLine aria-hidden="true" className="mt-0.5 size-3.5 shrink-0" />
            <span>
              <span className="font-medium">{rejection.file.name}</span> — {REJECTION_MESSAGE[rejection.reason]}
              {rejection.reason === "size" && maxSize ? ` (limit ${formatBytes(maxSize)})` : null}
            </span>
          </li>
        ))}
      </ul>
    ) : null;

  if (variant === "dropzone") {
    return (
      <div data-slot="file-input" className={cn("flex min-w-0 flex-col gap-2", className)} {...props}>
        <RacDropZone
          isDisabled={isDisabled}
          onDrop={async (event) => {
            const dropped: File[] = [];
            for (const item of event.items) {
              if (item.kind === "file") dropped.push(await item.getFile());
            }
            if (dropped.length > 0) acceptFiles(dropped);
          }}
          className={({ isDropTarget }) =>
            cn(
              "flex min-w-0 flex-col items-center gap-2.5 rounded-lg border border-dashed px-5 py-6 text-center luc-transition",
              "border-line-default bg-surface-sunken",
              !isDisabled && "hover:border-line-strong hover:bg-surface-interactive",
              isDropTarget && "border-line-accent bg-accent-soft",
              isInvalid && "border-negative",
            )
          }
        >
          <RiUploadCloud2Line aria-hidden="true" className="size-6 text-fg-muted" />
          <div className="flex flex-col gap-0.5">
            <p className="text-label font-medium text-fg-secondary">Drop files here</p>
            {hint ? <p className="text-caption text-fg-muted">{hint}</p> : null}
          </div>
          {picker}
        </RacDropZone>
        {list}
        {rejectionList}
      </div>
    );
  }

  return (
    <div data-slot="file-input" className={cn("flex min-w-0 flex-col gap-2", className)} {...props}>
      <div
        className={cn(
          "flex min-w-0 flex-wrap items-center gap-2 rounded-md border border-line-default bg-surface-sunken px-2 py-1.5 shadow-xs",
          isInvalid && "border-negative shadow-[0_0_0_3px_var(--negative-soft)]",
        )}
      >
        {picker}
        <span className="min-w-0 flex-1 truncate text-caption text-fg-muted">
          {files.length === 0 ? (label ?? hint ?? "No file selected") : `${files.length} file${files.length === 1 ? "" : "s"} selected`}
        </span>
      </div>
      {list}
      {rejectionList}
    </div>
  );
}

/**
 * The explicit drag-and-drop surface. Same component, larger vocabulary — the
 * compact `FileInput` is the default because a giant dashed rectangle is a
 * layout decision, not a file-input decision.
 */
export function DropZone(props: Omit<FileInputProps, "variant">) {
  return <FileInput {...props} variant="dropzone" />;
}
