import { Avatar } from "radix-ui";
//#region src/components/avatar.d.ts
/**
 * LUC Avatar — identity for a person, a team, a workspace or an agent.
 *
 * Two rules make an avatar usable in a dense product rather than merely
 * decorative:
 *
 *  1. **The fallback is designed, not a failure state.** Radix holds the image
 *     back until it loads, so the initials are what most readers see on a cold
 *     cache. They get a deterministic tint derived from the name, so the same
 *     person is the same colour in a table, a comment thread and a header.
 *  2. **The label is the name.** A single screen-reader string is the only shape
 *     that survives every reader; `alt` on an `<img>` inside a link is read
 *     twice.
 *
 * `AvatarGroup` overlaps its children and exposes the overflow count as real
 * text (`+3`), never as a hidden badge.
 */
export declare const AvatarRoot: import("react").ForwardRefExoticComponent<Avatar.AvatarProps & import("react").RefAttributes<HTMLSpanElement>>;
export type AvatarSize = "xs" | "sm" | "md" | "lg" | "xl";
export type AvatarShape = "circle" | "rounded" | "square";
export interface AvatarProps extends React.ComponentPropsWithRef<typeof Avatar.Root> {
  /** Image source. Falls back to `fallback` until it loads. */
  src?: string;
  /** Alt text for the image; also the tint seed when `name` is absent. */
  alt?: string;
  /** Initials, an icon, or any node shown before the image resolves. */
  fallback?: React.ReactNode;
  /** Name used for the accessible label and the deterministic tint. */
  name?: string;
  size?: AvatarSize;
  shape?: AvatarShape;
  /** Status dot in the corner. */
  status?: "online" | "away" | "offline";
}
declare function Avatar$1({ className, src, alt, fallback, name, size, shape, status, ...props }: AvatarProps): import("react").JSX.Element;
/** "Ada Lovelace" → "AL"; "luc-ui" → "LU"; "谢健" → "谢". */
export declare function initialsOf(name: string | undefined, max?: number): string;
export interface AvatarGroupProps extends React.ComponentPropsWithRef<"div"> {
  /** Maximum avatars rendered before the count chip. Default 4. */
  max?: number;
  /** Total number in the set. When greater than `max`, the chip shows the rest. */
  total?: number;
  size?: AvatarSize;
}
export declare function AvatarGroup({ className, children, max, total, size, ...props }: AvatarGroupProps): import("react").JSX.Element;
//#endregion
export { Avatar$1 as Avatar };
//# sourceMappingURL=avatar.d.ts.map