import { AspectRatio } from "radix-ui";
//#region src/components/aspect-ratio.d.ts
/**
 * LUC AspectRatio — a box that keeps a ratio while it is being laid out.
 *
 * `radix-ui`'s implementation is the only one worth having: it reserves the
 * space with a padding-based slot before the child loads, so a media card never
 * causes a layout shift and never triggers a Cumulative Layout Shift penalty.
 * `image` and `video` presets exist because nobody remembers that a 16:9 video
 * is `16 / 9` and not `1.78`.
 */
export type AspectPreset = "square" | "video" | "photo" | "wide" | "portrait" | "ultrawide";
export interface AspectRatioProps extends Omit<React.ComponentPropsWithRef<typeof AspectRatio.Root>, "ratio"> {
  /** A numeric ratio, or a named preset. Default `1` (square). */
  ratio?: number | AspectPreset;
}
declare function AspectRatio$1({ className, ratio, ...props }: AspectRatioProps): import("react").JSX.Element;
//#endregion
export { AspectRatio$1 as AspectRatio };
//# sourceMappingURL=aspect-ratio.d.ts.map