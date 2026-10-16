"use client";

import { useCallback, useId, useRef, useState, type ReactNode } from "react";
import { RiAlertLine, RiCheckLine, RiCloseLine, RiFileLine, RiRefreshLine, RiUploadCloud2Line } from "@remixicon/react";
import { cn } from "../utils/cn";
import { formatBytes } from "../utils/format";
import { Button } from "./button-base";
import { IconButton } from "./icon-button";
import { Progress } from "./progress";
import { Text } from "./typography";

/**
 * LUC FileUpload — a drop target and the transfer list that goes with it.
 *
 * The split of responsibility is deliberate and is why this is not a wrapper
 * around `<input type="file">` with a nicer border:
 *
 *   · the browser owns *selection* (drag or picker) and hands over `File`s
 *   · the **application** owns *transfer* — it is the only side that knows
 *     about signed URLs, resumable chunks, cancellation and a real error
 *   · LUC owns the surface, the per-file state and the keyboard path
 *
 * So `items` is a controlled list the caller updates as its upload progresses.
 * Nothing in this component opens a request, which is also why it is safe in a
 * server-rendered tree and why it stays free of any storage SDK.
 *
 * Rejections are not silent: a file that fails `accept`, `maxSize` or
 * `maxFiles` is reported through `onReject`, because "I dropped ten files and
 * three vanished" is a support ticket, not a design.
 */

export type FileUploadStatus = "queued" | "uploading" | "done" | "error";

export interface FileUploadItem {
  id: string;
  name: string;
  /** Bytes. Rendered through `formatBytes`; never interpreted as anything else. */
  size?: number;
  type?: string;
  /** 0–100. Omit while the transfer length is unknown. */
  progress?: number;
  status: FileUploadStatus;
  error?: string;
  /** Replaces the default glyph — a thumbnail, a file-type icon. */
  icon?: ReactNode;
}

export interface FileUploadRejection {
  file: File;
  reason: "type" | "size" | "count";
  /** Human-readable explanation, in the caller's language. */
  message: string;
}

export interface FileUploadProps extends Omit<React.ComponentPropsWithRef<"div">, "onDrop" | "onError"> {
  items: readonly FileUploadItem[];
  /** Validated selection or drop. The caller starts the transfer. */
  onFiles: (files: File[]) => void;
  onReject?: (rejections: FileUploadRejection[]) => void;
  onRemove?: (id: string) => void;
  onRetry?: (id: string) => void;
  /** Same syntax as the native input, e.g. `image/*,.csv`. */
  accept?: string;
  multiple?: boolean;
  /** Per-file ceiling in bytes. */
  maxSize?: number;
  /** Ceiling on how many files a single drop may add. */
  maxFiles?: number;
  title?: string;
  /**
   * Accessible name for the hidden `<input type="file">`.
   *
   * The input is `sr-only` and opened by the visible "Browse files" button, so
   * nothing in the accessibility tree named it: an unlabelled file input is a
   * critical `label` violation, and a screen reader announced only "button,
   * browse files" with no statement of what is being browsed for. Defaults to
   * `title`, which is already the visible description of the drop target.
   */
  inputLabel?: string;
  hint?: string;
  disabled?: boolean;
  /** Accessible name for the list of files. */
  listLabel?: string;
  /** Rendered between the drop target and the list. */
  footer?: ReactNode;
}

const STATUS_LABEL: Record<FileUploadStatus, string> = {
  queued: "Waiting",
  uploading: "Uploading",
  done: "Uploaded",
  error: "Failed",
};

function matchesAccept(file: File, accept: string | undefined): boolean {
  if (!accept) return true;
  const patterns = accept.split(",").map((part) => part.trim().toLowerCase()).filter(Boolean);
  if (patterns.length === 0) return true;
  const name = file.name.toLowerCase();
  const type = (file.type || "").toLowerCase();
  return patterns.some((pattern) => {
    if (pattern.startsWith(".")) return name.endsWith(pattern);
    if (pattern.endsWith("/*")) return type.startsWith(pattern.slice(0, -1));
    return type === pattern;
  });
}

export function FileUpload({
  items,
  onFiles,
  onReject,
  onRemove,
  onRetry,
  accept,
  multiple = true,
  maxSize,
  maxFiles,
  title = "Drop files here",
  inputLabel,
  hint,
  disabled = false,
  listLabel = "Selected files",
  footer,
  className,
  ...props
}: FileUploadProps) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(0);

  const accept_ = useCallback(
    (incoming: File[]) => {
      const rejections: FileUploadRejection[] = [];
      const accepted: File[] = [];
      const limit = maxFiles ?? Number.POSITIVE_INFINITY;
      incoming.forEach((file, index) => {
        if (index >= limit) {
          rejections.push({ file, reason: "count", message: `Only ${limit} files can be added at once.` });
          return;
        }
        if (!matchesAccept(file, accept)) {
          rejections.push({ file, reason: "type", message: `${file.name} is not an accepted file type.` });
          return;
        }
        if (maxSize !== undefined && file.size > maxSize) {
          rejections.push({
            file,
            reason: "size",
            message: `${file.name} is ${formatBytes(file.size)}; the limit is ${formatBytes(maxSize)}.`,
          });
          return;
        }
        accepted.push(file);
      });
      if (rejections.length > 0) onReject?.(rejections);
      if (accepted.length > 0) onFiles(accepted);
    },
    [accept, maxFiles, maxSize, onFiles, onReject],
  );

  return (
    <div data-slot="file-upload" className={cn("flex flex-col gap-3", className)} {...props}>
      <div
        data-slot="file-upload-dropzone"
        data-dragging={dragging > 0 ? "true" : undefined}
        onDragEnter={(event) => {
          if (disabled) return;
          event.preventDefault();
          setDragging((count) => count + 1);
        }}
        onDragOver={(event) => {
          if (disabled) return;
          event.preventDefault();
        }}
        onDragLeave={() => setDragging((count) => Math.max(count - 1, 0))}
        onDrop={(event) => {
          if (disabled) return;
          event.preventDefault();
          setDragging(0);
          accept_(Array.from(event.dataTransfer.files));
        }}
        className={cn(
          "luc-transition relative flex flex-col items-center gap-2 rounded-lg border border-dashed px-6 py-7 text-center",
          "border-line-default bg-surface-sunken luc-well",
          "data-[dragging=true]:border-line-accent data-[dragging=true]:bg-surface-selected",
          disabled && "opacity-60",
        )}
      >
        <span
          aria-hidden="true"
          className="grid size-9 place-items-center rounded-full bg-surface-interactive text-fg-accent"
        >
          <RiUploadCloud2Line className="size-4.5" />
        </span>
        <Text variant="label" className="text-fg-primary">
          {title}
        </Text>
        {hint ? (
          <Text variant="caption" tone="muted">
            {hint}
          </Text>
        ) : null}
        <Button
          type="button"
          variant="secondary"
          size="sm"
          disabled={disabled}
          onClick={() => inputRef.current?.click()}
          className="mt-1"
        >
          Browse files
        </Button>
        <input
          ref={inputRef}
          id={inputId}
          type="file"
          aria-label={inputLabel ?? title}
          className="sr-only"
          accept={accept}
          multiple={multiple}
          disabled={disabled}
          onChange={(event) => {
            accept_(Array.from(event.target.files ?? []));
            // Reset so picking the same file twice still fires a change event.
            event.target.value = "";
          }}
        />
      </div>

      {items.length > 0 ? (
        <ul
          data-slot="file-upload-list"
          aria-label={listLabel}
          className="flex flex-col gap-2"
        >
          {items.map((item) => (
            <li
              key={item.id}
              className="luc-transition flex items-start gap-3 rounded-md border border-line-subtle bg-surface-default p-3 luc-rest"
            >
              <span
                aria-hidden="true"
                className={cn(
                  "mt-0.5 grid size-8 shrink-0 place-items-center rounded-sm bg-surface-interactive",
                  item.status === "error" ? "text-negative" : "text-fg-muted",
                )}
              >
                {item.icon ?? <RiFileLine className="size-4" />}
              </span>
              <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                <div className="flex min-w-0 items-center gap-2">
                  <span className="min-w-0 flex-1 truncate text-label text-fg-primary">{item.name}</span>
                  <span className="shrink-0 text-caption text-fg-muted luc-numeric">
                    {item.size !== undefined ? formatBytes(item.size) : ""}
                  </span>
                </div>
                {item.status === "uploading" ? (
                  <Progress
                    value={item.progress ?? null}
                    size="sm"
                    aria-label={`Uploading ${item.name}`}
                  />
                ) : null}
                <div className="flex items-center gap-1.5 text-caption">
                  {item.status === "done" ? (
                    <RiCheckLine aria-hidden="true" className="size-3.5 text-positive" />
                  ) : null}
                  {item.status === "error" ? (
                    <RiAlertLine aria-hidden="true" className="size-3.5 text-negative" />
                  ) : null}
                  <span
                    className={cn(
                      item.status === "error"
                        ? "text-negative"
                        : item.status === "done"
                          ? "text-positive"
                          : "text-fg-muted",
                    )}
                  >
                    {item.error ?? STATUS_LABEL[item.status]}
                  </span>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                {item.status === "error" && onRetry ? (
                  <IconButton
                    variant="ghost"
                    size="sm"
                    label={`Retry ${item.name}`}
                    icon={<RiRefreshLine />}
                    onClick={() => onRetry(item.id)}
                  />
                ) : null}
                {onRemove ? (
                  <IconButton
                    variant="ghost"
                    size="sm"
                    label={`Remove ${item.name}`}
                    icon={<RiCloseLine />}
                    onClick={() => onRemove(item.id)}
                  />
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      ) : null}
      {footer}
    </div>
  );
}
