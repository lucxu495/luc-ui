import { ReactNode } from "react";
//#region src/forms/inputs/file-input.d.ts
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
export declare function FileInput({ value, defaultValue, onFilesChange, onReject, accept, multiple, maxSize, maxFiles, disabled, invalid, variant, hint, label, id, className, ...props }: FileInputProps): import("react").JSX.Element;
/**
 * The explicit drag-and-drop surface. Same component, larger vocabulary — the
 * compact `FileInput` is the default because a giant dashed rectangle is a
 * layout decision, not a file-input decision.
 */
export declare function DropZone(props: Omit<FileInputProps, "variant">): import("react").JSX.Element;
//#endregion
//# sourceMappingURL=file-input.d.ts.map