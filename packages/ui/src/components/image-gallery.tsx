"use client";

import { useCallback, useId, useState, type ReactNode } from "react";
import {
  RiArrowLeftSLine,
  RiArrowRightSLine,
  RiCloseLine,
  RiFullscreenLine,
  RiZoomInLine,
  RiZoomOutLine,
} from "@remixicon/react";
import { cn } from "../utils/cn";
import { DialogContent, DialogRoot, DialogTitle } from "./dialog";
import { IconButton } from "./icon-button";

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

const columnClass = {
  2: "grid-cols-2",
  3: "grid-cols-2 sm:grid-cols-3",
  4: "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4",
} as const;

const aspectClass = {
  square: "aspect-square",
  video: "aspect-video",
  natural: "",
} as const;

export function ImageGallery({
  images,
  columns = 3,
  label = "Image gallery",
  onOpen,
  lightbox = true,
  aspect = "square",
  className,
  ...props
}: ImageGalleryProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const handlesViewer = lightbox && !onOpen;

  return (
    <div data-slot="image-gallery" className={cn("flex flex-col gap-3", className)} {...props}>
      <ul aria-label={label} className={cn("grid gap-2", columnClass[columns])}>
        {images.map((image, index) => (
          <li key={image.id}>
            <button
              type="button"
              onClick={() => (handlesViewer ? setOpenIndex(index) : onOpen?.(index))}
              className={cn(
                "group/image luc-transition luc-focus relative block h-full w-full overflow-hidden rounded-md",
                "border border-line-subtle bg-surface-sunken luc-rest hover:luc-hover hover:border-line-strong",
              )}
            >
              <img
                src={image.src}
                alt={image.alt}
                width={image.width}
                height={image.height}
                loading="lazy"
                decoding="async"
                className={cn("h-full w-full object-cover luc-transition-slow group-hover/image:scale-[1.03]", aspectClass[aspect])}
              />
              {handlesViewer ? (
                <span
                  aria-hidden="true"
                  className={cn(
                    "absolute right-1.5 bottom-1.5 grid size-6 place-items-center rounded-sm",
                    "bg-surface-overlay/80 text-fg-secondary opacity-0 backdrop-blur-sm luc-transition",
                    "group-hover/image:opacity-100 group-focus-visible/image:opacity-100",
                  )}
                >
                  <RiFullscreenLine className="size-3.5" />
                </span>
              ) : null}
            </button>
          </li>
        ))}
      </ul>

      {handlesViewer ? (
        <Lightbox
          images={images}
          index={openIndex ?? 0}
          open={openIndex !== null}
          onOpenChange={(next) => setOpenIndex(next ? (openIndex ?? 0) : null)}
          onIndexChange={setOpenIndex}
          label={label}
        />
      ) : null}
    </div>
  );
}

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

const MIN_ZOOM = 1;
const MAX_ZOOM = 4;
const ZOOM_STEP = 0.5;

export function Lightbox({
  images,
  index,
  open,
  onOpenChange,
  onIndexChange,
  label = "Image viewer",
  labels,
}: LightboxProps) {
  /*
   * Zoom belongs to the *image*, so it is stored with the index it was set on:
   * a new image reads back as 1×, with no effect needed to reset it.
   */
  const [zoomState, setZoomState] = useState({ index, zoom: MIN_ZOOM });
  const zoom = zoomState.index === index ? zoomState.zoom : MIN_ZOOM;
  const setZoom = useCallback(
    (next: number | ((current: number) => number)) => {
      setZoomState((current) => {
        const base = current.index === index ? current.zoom : MIN_ZOOM;
        return { index, zoom: typeof next === "function" ? next(base) : next };
      });
    },
    [index],
  );
  const titleId = useId();
  const image = images[Math.min(Math.max(index, 0), images.length - 1)];
  const total = images.length;

  const step = useCallback(
    (delta: number) => {
      if (total === 0) return;
      onIndexChange((index + delta + total) % total);
      setZoom(MIN_ZOOM);
    },
    [index, onIndexChange, setZoom, total],
  );

  if (!image || total === 0) return null;

  return (
    <DialogRoot open={open} onOpenChange={onOpenChange}>
      <DialogContent
        data-slot="lightbox"
        width="lg"
        showClose={false}
        aria-label={label}
        onKeyDown={(event) => {
          if (event.key === "ArrowRight") {
            event.preventDefault();
            step(1);
          } else if (event.key === "ArrowLeft") {
            event.preventDefault();
            step(-1);
          } else if (event.key === "+" || event.key === "=") {
            event.preventDefault();
            setZoom((value) => Math.min(value + ZOOM_STEP, MAX_ZOOM));
          } else if (event.key === "-") {
            event.preventDefault();
            setZoom((value) => Math.max(value - ZOOM_STEP, MIN_ZOOM));
          }
        }}
        className="flex h-[calc(100vh-2rem)] w-[calc(100vw-2rem)] max-w-none flex-col gap-0 overflow-hidden rounded-xl bg-surface-overlay p-0"
      >
        <DialogTitle id={titleId} className="sr-only">
          {label}
        </DialogTitle>
        <header className="flex shrink-0 items-center justify-between gap-3 border-b border-line-subtle px-3 py-2">
          <span className="truncate text-label text-fg-secondary">{image.alt}</span>
          <div className="flex shrink-0 items-center gap-1">
            <span aria-hidden="true" className="pr-1 text-caption text-fg-muted luc-numeric">
              {labels?.counter ? labels.counter(index, total) : `${index + 1} / ${total}`}
            </span>
            <IconButton
              variant="ghost"
              size="sm"
              label={labels?.zoomOut ?? "Zoom out"}
              icon={<RiZoomOutLine />}
              disabled={zoom <= MIN_ZOOM}
              onClick={() => setZoom((value) => Math.max(value - ZOOM_STEP, MIN_ZOOM))}
            />
            <IconButton
              variant="ghost"
              size="sm"
              label={labels?.zoomIn ?? "Zoom in"}
              icon={<RiZoomInLine />}
              disabled={zoom >= MAX_ZOOM}
              onClick={() => setZoom((value) => Math.min(value + ZOOM_STEP, MAX_ZOOM))}
            />
            <IconButton
              variant="ghost"
              size="sm"
              label={labels?.close ?? "Close viewer"}
              icon={<RiCloseLine />}
              onClick={() => onOpenChange(false)}
            />
          </div>
        </header>

        <div className="relative flex min-h-0 flex-1 items-center justify-center overflow-auto bg-surface-sunken">
          <img
            src={image.src}
            alt={image.alt}
            width={image.width}
            height={image.height}
            style={{ transform: `scale(${zoom})` }}
            className="max-h-full max-w-full object-contain transition-transform duration-[var(--motion-normal)] ease-[var(--ease-standard)]"
          />
          {total > 1 ? (
            <>
              <IconButton
                variant="solid"
                label={labels?.previous ?? "Previous image"}
                icon={<RiArrowLeftSLine />}
                onClick={() => step(-1)}
                className="absolute top-1/2 left-3 -translate-y-1/2"
              />
              <IconButton
                variant="solid"
                label={labels?.next ?? "Next image"}
                icon={<RiArrowRightSLine />}
                onClick={() => step(1)}
                className="absolute top-1/2 right-3 -translate-y-1/2"
              />
            </>
          ) : null}
        </div>

        {image.caption ? (
          <p className="shrink-0 border-t border-line-subtle px-4 py-2.5 text-caption text-fg-secondary">
            {image.caption}
            <span className="sr-only"> {`Zoom ${Math.round(zoom * 100)} percent.`}</span>
          </p>
        ) : (
          <span className="sr-only" aria-live="polite">{`Zoom ${Math.round(zoom * 100)} percent.`}</span>
        )}
      </DialogContent>
    </DialogRoot>
  );
}
