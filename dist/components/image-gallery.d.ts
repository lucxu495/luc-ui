import { ReactNode } from "react";
//#region src/components/image-gallery.d.ts
/**
 * LUC ImageGallery / Lightbox — a grid that opens into a viewer.
 *
 * Two components, one contract, because they are two states of the same thing:
 * the gallery is the index and the lightbox is the item. Both take the same
 * `GalleryImage[]`, so opening an image is "show index 5", never a second props
 * shape to keep in sync.
 *
 * The lightbox is built on the shared `Dialog` rather than a bespoke overlay,
 * which means focus trapping, Escape, scroll locking and focus restoration come
 * from the same place every other LUC overlay gets them. Arrow keys walk the
 * set, `+`/`-` zoom, and the zoom value is announced through the caption.
 *
 * It renders images; it does not decode, resize, serve or cache them.
 */
export interface GalleryImage {
  id: string;
  src: string;
  /** Required: a gallery of unlabelled images is unusable. */
  alt: string;
  caption?: ReactNode;
  /** Intrinsic size, when known — lets the browser reserve the box. */
  width?: number;
  height?: number;
}
export interface ImageGalleryProps extends React.ComponentPropsWithRef<"div"> {
  images: readonly GalleryImage[];
  columns?: 2 | 3 | 4;
  /** Accessible name for the group. */
  label?: string;
  /** Disable the built-in viewer and handle activation yourself. */
  onOpen?: (index: number) => void;
  /** Open the built-in lightbox on click. Default `true` unless `onOpen` is set. */
  lightbox?: boolean;
  aspect?: "square" | "video" | "natural";
}
export declare function ImageGallery({ images, columns, label, onOpen, lightbox, aspect, className, ...props }: ImageGalleryProps): import("react").JSX.Element;
export interface LightboxLabels {
  close?: string;
  next?: string;
  previous?: string;
  zoomIn?: string;
  zoomOut?: string;
  counter?: (index: number, total: number) => string;
}
export interface LightboxProps {
  images: readonly GalleryImage[];
  index: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onIndexChange: (index: number) => void;
  label?: string;
  labels?: LightboxLabels;
}
export declare function Lightbox({ images, index, open, onOpenChange, onIndexChange, label, labels }: LightboxProps): import("react").JSX.Element | null;
//#endregion
//# sourceMappingURL=image-gallery.d.ts.map