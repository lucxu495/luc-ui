import { ReactNode } from "react";
//#region src/components/file-upload.d.ts
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
export declare function FileUpload({ items, onFiles, onReject, onRemove, onRetry, accept, multiple, maxSize, maxFiles, title, inputLabel, hint, disabled, listLabel, footer, className, ...props }: FileUploadProps): import("react").JSX.Element;
//#endregion
//# sourceMappingURL=file-upload.d.ts.map