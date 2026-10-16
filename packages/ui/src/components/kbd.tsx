import { cn } from "../utils/cn";
import { Kbd } from "./typography";

/**
 * LUC KbdGroup — a keyboard chord.
 *
 * The single keycap is `Kbd` (from the typography family, where it belongs next
 * to `Code`). This module adds the sequence: "⌘ K" is one chord, so the `+`
 * separator between the keys is `aria-hidden` and the reader announces a single
 * combination rather than a list of symbols.
 */

export interface KbdGroupProps extends React.ComponentPropsWithRef<"span"> {
  /** Keys of the chord. Hidden separators keep the announcement clean. */
  keys: string[];
  size?: "sm" | "md";
}

export function KbdGroup({ className, keys, size = "md", ...props }: KbdGroupProps) {
  return (
    <span
      data-slot="kbd-group"
      className={cn("inline-flex items-center gap-1", className)}
      {...props}
    >
      {keys.map((key, index) => (
        <span key={`${key}-${index}`} className="contents">
          {index > 0 ? (
            <span aria-hidden="true" className="text-micro text-fg-muted">
              +
            </span>
          ) : null}
          <Kbd size={size}>{key}</Kbd>
        </span>
      ))}
    </span>
  );
}
